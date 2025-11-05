import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'
import { validateData, aiChatSchema, formatValidationErrors } from '@/lib/validation'
import { checkRateLimit, rateLimits } from '@/lib/rate-limit'
import { z } from 'zod'
import { getFPLContextForAI, buildAIPromptWithFPLData } from '@/lib/fpl-api'

// Schema for conversation history (optional field)
const conversationHistorySchema = z.array(z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.any()
})).optional()

export async function POST(request: NextRequest) {
  try {
    // Check rate limit FIRST (very strict for AI - expensive!)
    const rateLimit = checkRateLimit(rateLimits.expensive, request)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'You have reached your hourly limit for AI queries. Please wait before trying again.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    const body = await request.json()

    // Validate core fields (userId and message)
    const validation = validateData(aiChatSchema, {
      userId: body.userId,
      message: body.message
    })

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatValidationErrors(validation.errors!)
        },
        { status: 400 }
      )
    }

    const { userId, message } = validation.data!

    // Validate optional conversation history
    const historyValidation = conversationHistorySchema.safeParse(body.conversationHistory)
    const conversationHistory = historyValidation.success ? historyValidation.data || [] : []

        // Get user and team data
    const supabase = getServerClient()

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    // Check if this is a guest user
    const isGuestUser = userError || !user || user.email?.includes('guest@') || user.is_guest === true

        let teamData = null

    if (!isGuestUser) {
      // Get user's latest team data (only for non-guest users)
      const { data: teams } = await supabase
        .from('user_teams')
        .select('*')
        .eq('user_id', userId)
        .eq('sync_status', 'success')
        .order('last_sync_at', { ascending: false })
        .limit(1)

      teamData = teams && teams.length > 0 ? teams[0] : null

      // Update user query count and last active
      await supabase
        .from('users')
        .update({
          queries_this_month: (user?.queries_this_month || 0) + 1,
          total_queries: (user?.total_queries || 0) + 1,
          last_active_at: new Date().toISOString()
        })
        .eq('id', userId)
        .then(() => console.log('User stats updated'))
        .catch(err => console.error('Failed to update user stats:', err))

      // Create user event
      await supabase
        .from('user_events')
        .insert({
          user_id: userId,
          event_type: 'ai_query_made',
          event_data: JSON.stringify({
            queryLength: message.length,
            timestamp: new Date().toISOString()
          })
        })
        .then(() => console.log('User event created'))
        .catch(err => console.error('Failed to create user event:', err))
    } else {
          }

    // Fetch real-time FPL data for AI context
        let systemPrompt: string

    try {
      const fplContext = await getFPLContextForAI()
            systemPrompt = buildAIPromptWithFPLData(fplContext, teamData)
    } catch (error) {
      console.error('Failed to fetch FPL data, falling back to basic prompt:', error)
      // Fallback to basic prompt if FPL API fails
      systemPrompt = buildSystemPrompt(user || { email: 'guest@fpl-advisor.com' }, teamData)
    }

    // Prepare messages for GLM API
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ]

        // Call GLM API with retry logic
    const apiResponse = await callGLMAPIWithRetry(messages)

    if (!apiResponse.success) {
      console.error('GLM API Error:', apiResponse.error)
      return NextResponse.json(
        { error: apiResponse.error || 'AI service temporarily unavailable' },
        { status: 503 }
      )
    }

    const aiResponse = apiResponse.content
    const tokensUsed = apiResponse.tokensUsed

        // Save conversation (only for non-guest users)
    let conversationId = null

    if (!isGuestUser) {
      try {
        const { data: conversation, error: conversationError } = await supabase
          .from('conversations')
          .insert({
            user_id: userId,
            title: message.length > 50 ? message.substring(0, 50) + '...' : message,
            messages: JSON.stringify([
              ...conversationHistory,
              { role: 'user', content: message, timestamp: new Date().toISOString() },
              { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
            ]),
            context_snapshot: JSON.stringify({
              teamName: teamData?.team_name,
              totalPoints: teamData?.total_points,
              bankValue: teamData?.bank_value,
              freeTransfers: teamData?.free_transfers
            }),
            message_count: (conversationHistory.length + 2),
            tokens_used: tokensUsed
          })
          .select()
          .single()

        if (conversationError) {
          console.error('Failed to save conversation:', conversationError)
        } else {
          conversationId = conversation?.id
                  }
      } catch (err) {
        console.error('Exception saving conversation:', err)
      }
    } else {
      conversationId = 'guest-' + Date.now() // Generate a temporary ID for guests
    }

    // Add rate limit headers to successful responses
    return NextResponse.json(
      {
        response: aiResponse,
        conversationId,
        tokensUsed
      },
      {
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
        }
      }
    )
  } catch (error) {
    console.error('AI chat error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function callGLMAPIWithRetry(
  messages: Array<{role: string, content: string}>,
  maxRetries = 3
): Promise<{
  success: boolean
  content?: string
  tokensUsed?: number
  error?: string
}> {
  let lastError: string = 'Unknown error'

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const result = await callGLMAPI(messages)

    if (result.success) {
      return result
    }

    lastError = result.error || 'Unknown error'
    console.warn(`Attempt ${attempt} failed:`, lastError)

    // Don't retry on certain errors
    if (lastError.includes('API key not configured') ||
        lastError.includes('Invalid input') ||
        lastError.includes('401') ||
        lastError.includes('403')) {
      console.error('Non-retryable error, stopping retry attempts')
      return result
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
            await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`
  }
}

async function callGLMAPI(messages: Array<{role: string, content: string}>): Promise<{
  success: boolean
  content?: string
  tokensUsed?: number
  error?: string
}> {
  try {
    const apiKey = process.env.API_KEY
    const apiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

    if (!apiKey) {
      console.error('GLM API key not configured')
      return {
        success: false,
        error: 'API key not configured'
      }
    }

    const requestBody = {
      model: 'glm-4-plus', // Verified working model (requires API balance)
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false
    }

        console.log('Request body:', JSON.stringify(requestBody, null, 2))

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })

        if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = `GLM API Error: ${response.status} - ${errorData.error?.message || response.statusText}`
      console.error('', errorMessage, errorData)
      return {
        success: false,
        error: errorMessage
      }
    }

    const data = await response.json()
    console.log('Response data:', JSON.stringify(data, null, 2))

    if (data.error) {
      const errorMsg = `GLM API Error: ${data.error.message || 'Unknown error'}`
      console.error('', errorMsg)
      return {
        success: false,
        error: errorMsg
      }
    }

    const content = data.choices?.[0]?.message?.content
    const tokensUsed = data.usage?.total_tokens || 0

    if (!content) {
      console.error('No content received. Response structure:', data)
      return {
        success: false,
        error: 'No content received from GLM API'
      }
    }

        return {
      success: true,
      content,
      tokensUsed
    }
  } catch (error) {
    console.error('Call failed with exception:', error)
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'

    // Check for specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout - GLM API took too long to respond'
        }
      }
      if (error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Network error - Unable to connect to GLM API'
        }
      }
    }

    return {
      success: false,
      error: errorMsg
    }
  }
}

function buildSystemPrompt(user: any, teamData: any): string {
  const teamInfo = teamData ? `
CURRENT TEAM: ${teamData.team_name}
Team Value: £${teamData.team_value}m
Bank: £${teamData.bank_value}m
Free Transfers: ${teamData.free_transfers}
Total Points: ${teamData.total_points}
Overall Rank: ${teamData.overall_rank || 'N/A'}
` : 'No team data available'

  return `You are an expert Fantasy Premier League (FPL) advisor with deep knowledge of player statistics, team fixtures, form, and strategy.

${teamInfo}

YOUR ROLE:
1. Analyze the user's team comprehensively
2. Consider upcoming fixtures (easy = good, hard = bad)
3. Look at player form and ownership
4. Suggest specific actionable advice
5. Explain your reasoning clearly
6. Be conversational and friendly

RESPONSE FORMAT:
- Start with a direct answer to their question
- Provide 1-2 specific recommendations
- Explain WHY in 2-3 sentences
- End with a clear next action

IMPORTANT RULES:
- Always suggest specific player names (not just "get a midfielder")
- Consider the user's budget constraints
- Don't recommend transfers that exceed their free transfers without mentioning the -4 point hit
- Focus on the next 1-2 gameweeks, not long-term unless asked
- Be honest if you don't have enough info to give confident advice

Remember: Users want specific, actionable advice they can use RIGHT NOW.`
}