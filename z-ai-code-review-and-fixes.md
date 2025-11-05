# Z.ai FPL Advisor Code Review & Fixing Prompts
## Comprehensive Analysis & Development Plan

**Review Date:** November 3, 2025  
**Project:** FPL Fantasy Advisor  
**Status:** 40% Complete - Major Gaps Identified

---

## 📊 EXECUTIVE SUMMARY

### What Was Built ✅
1. ✅ **Basic UI Structure** - Landing page, login, signup, dashboard, advisor chat
2. ✅ **Database Schema** - Prisma models for users, teams, conversations, etc.
3. ✅ **Chat Interface** - Working UI for AI conversation
4. ✅ **Guest Mode** - Smart addition for instant access
5. ✅ **shadcn/ui Components** - Full component library integrated

### Critical Missing Features ❌
1. ❌ **NO FPL API Integration** - Team import doesn't fetch real FPL data
2. ❌ **Wrong AI Implementation** - Using z-ai-web-dev-sdk instead of GLM-4.6 API
3. ❌ **Wrong Database** - Using SQLite instead of Supabase PostgreSQL
4. ❌ **NO Mini-League Features** - Core differentiator missing
5. ❌ **NO Injury Scraping** - Key feature completely absent
6. ❌ **NO Real-Time Updates** - No WebSocket integration for live data
7. ❌ **NO Supabase Auth** - Using local storage instead of proper auth
8. ❌ **NO Environment Configuration** - Missing .env setup
9. ❌ **NO Deployment Config** - Not ready for Vercel/Supabase deployment
10. ❌ **NO Mobile Optimization** - Responsive but not optimized

### Overall Assessment

**Build Quality:** 6/10  
**Spec Adherence:** 4/10  
**Production Ready:** 2/10

**Bottom Line:** The foundation is decent, but missing 60% of core features. Major rework needed on:
- Backend architecture (Prisma → Supabase)
- AI integration (z-ai-sdk → GLM-4.6 API)
- FPL API integration (completely missing)
- Mini-league features (core differentiator)

---

## 🔍 DETAILED ISSUE ANALYSIS

### CRITICAL ISSUE #1: Wrong Backend Architecture

**What Was Specified:**
- Supabase (PostgreSQL + Auth + Edge Functions + Real-time)
- Row-Level Security (RLS)
- Cloud-hosted database
- Real-time subscriptions

**What Was Built:**
- Prisma ORM with SQLite
- Local file database (db/custom.db)
- Custom authentication with localStorage
- No real-time capabilities

**Why This Is Critical:**
1. SQLite is single-file, can't scale
2. No real-time updates for injury alerts
3. No proper authentication/authorization
4. Not production-ready
5. Completely different deployment model

**Impact:** 🔴 **BLOCKER** - Must be fixed before launch

---

### CRITICAL ISSUE #2: No FPL API Integration

**What Was Specified:**
- Complete FPL API integration (`lib/fpl-api.ts`)
- Functions to:
  - Fetch team data by ID
  - Get player statistics
  - Import mini-leagues
  - Get fixtures and gameweek data
  - Transform FPL format to our schema

**What Was Built:**
- Team import API endpoint that ACCEPTS data but doesn't FETCH it
- No actual FPL API calls anywhere in the codebase
- No helper functions for FPL data fetching
- No data transformation logic

**Why This Is Critical:**
This is the CORE feature - without FPL API integration:
- Users can't import their teams
- No real player data
- No fixtures information
- No mini-league import
- The entire app is non-functional

**Impact:** 🔴 **BLOCKER** - App is unusable without this

---

### CRITICAL ISSUE #3: Wrong AI Integration

**What Was Specified:**
```typescript
// Direct GLM-4.6 API integration
const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const GLM_API_KEY = process.env.GLM_API_KEY

const response = await fetch(GLM_API_URL, {
  headers: { 'Authorization': `Bearer ${GLM_API_KEY}` },
  body: JSON.stringify({
    model: 'glm-4.6',
    messages: messages,
    temperature: 0.7,
    enable_thinking: true // GLM-4.6 specific feature
  })
})
```

**What Was Built:**
```typescript
// Using z-ai-web-dev-sdk package
import ZAI from 'z-ai-web-dev-sdk'
const zai = await ZAI.create()
const completion = await zai.chat.completions.create({
  messages,
  temperature: 0.7,
  max_tokens: 1000
})
```

**Why This Is Different:**
1. z-ai-web-dev-sdk is unknown/undocumented package
2. Not the official GLM-4.6 API
3. Can't use GLM-4.6 specific features (thinking mode, 200K context)
4. Different pricing model (unknown costs)
5. May not have access to latest GLM-4.6 model

**Impact:** 🟡 **HIGH PRIORITY** - Works but not as specified, potentially higher costs

---

### CRITICAL ISSUE #4: Missing Mini-League Features

**What Was Specified:**
- Mini-league import by ID
- Rival comparison table
- Differential recommendations
- Head-to-head analysis
- League standings tracking

**What Was Built:**
- Nothing. Zero. Nada.
- No database tables for mini-leagues
- No API routes for league data
- No UI components for league analysis
- No FPL league API integration

**Why This Is Critical:**
This was the MAIN DIFFERENTIATOR:
- "Beat your friends, not the world"
- Core value proposition
- What makes this different from competitors
- Primary selling point in landing page

**Impact:** 🔴 **BLOCKER** - Core feature completely missing

---

### CRITICAL ISSUE #5: No Injury Alert System

**What Was Specified:**
- Web scraping from Premier Injuries / Sky Sports
- Automatic detection of new injuries
- Match injuries to user's players
- Push notifications to affected users
- Cron job every 6 hours

**What Was Built:**
- Database table exists (InjuryAlert model)
- No scraping code
- No detection logic
- No notification system
- No cron setup

**Why This Is Critical:**
- Key competitive feature
- Real-time value for users
- Automated system required
- Time-sensitive information

**Impact:** 🟠 **HIGH** - Promised feature missing

---

### ISSUE #6: Authentication Issues

**What Was Specified:**
- Supabase Auth with email/password
- Google OAuth integration
- Secure session management
- Row-Level Security
- Server-side session validation

**What Was Built:**
- localStorage-based authentication
- Guest mode (good addition)
- Basic login/signup API routes
- No OAuth
- Client-side only auth (insecure)

**Problems:**
```typescript
// Current (INSECURE):
const userData = localStorage.getItem('user') // Can be manipulated
if (!userData) return // Client-side check only

// Should be:
const { data: { user } } = await supabase.auth.getUser() // Server-side
if (!user) return // Secure, can't be faked
```

**Impact:** 🟡 **MEDIUM-HIGH** - Security risk, not production-ready

---

### ISSUE #7: Database Schema Deviations

**What Was Specified (Supabase/PostgreSQL):**
```sql
-- JSONB columns for structured data
current_squad JSONB
messages JSONB

-- UUID primary keys
id UUID PRIMARY KEY

-- Proper relationships with constraints
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
```

**What Was Built (Prisma/SQLite):**
```prisma
// String columns for JSON (less efficient)
currentSquad String // JSON string
messages String // JSON string

// CUID primary keys
id String @id @default(cuid())

// Relations work but different syntax
user User @relation(fields: [userId], references: [id])
```

**Problems:**
1. SQLite doesn't support JSONB (stored as text)
2. No native JSON queries/indexing
3. Different ID format (cuid vs uuid)
4. Missing some indexes from spec
5. No Row-Level Security
6. Missing triggers (update_updated_at)

**Impact:** 🟡 **MEDIUM** - Functional but not optimized

---

### ISSUE #8: Missing Core Pages/Features

**What Was Specified:**
1. Mini-league page with standings
2. Mini-league details page
3. Recommendation history page
4. Settings page with preferences
5. Notifications center
6. Team fixtures view
7. Player comparison tool

**What Was Built:**
1. Landing page ✅
2. Login/Signup pages ✅
3. Dashboard page ✅
4. Advisor chat page ✅
5. Team page (partial) ⚠️

**Missing:**
- /leagues (list leagues) ❌
- /leagues/[id] (league details) ❌
- /history (recommendation tracking) ❌
- /settings (user preferences) ❌
- /notifications (notification center) ❌

**Impact:** 🟠 **MEDIUM** - Incomplete feature set

---

### ISSUE #9: No Environment Configuration

**What Was Specified:**
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
GLM_API_KEY=your_glm_key
DATABASE_URL=postgresql://...
```

**What Was Built:**
- No .env file
- No .env.example file
- Hardcoded values in some places
- No clear setup instructions

**Impact:** 🟠 **MEDIUM** - Can't be configured or deployed

---

### ISSUE #10: Deployment Not Ready

**What Was Specified:**
- Vercel deployment config
- Supabase Edge Functions
- Environment variables setup
- Database migrations
- CI/CD pipeline

**What Was Built:**
- Next.js app (Vercel-compatible)
- No Supabase setup
- No deployment docs
- No migration files
- Custom server.ts (complicates deployment)

**Impact:** 🟡 **MEDIUM** - Not deployment-ready

---

## ✅ WHAT WORKS WELL

### 1. UI/UX Quality
- **Landing Page** is professional and engaging
- **Guest mode** is a smart addition for user acquisition
- **Chat interface** is clean and functional
- **Responsive design** with Tailwind
- **shadcn/ui** components properly integrated

### 2. Code Quality
- TypeScript throughout
- Zod validation on API routes
- Good error handling patterns
- Clean component structure
- Reasonable code organization

### 3. Database Schema
- Models match specification (mostly)
- Proper relationships defined
- Good field naming
- Includes analytics tracking

### 4. Modern Stack
- Next.js 15 (latest)
- React 19
- Tailwind CSS 4
- Good package choices

---

## 🛠️ FIXING PROMPTS FOR Z.AI

Below are specific, actionable prompts to fix each issue. Send these to z.ai one by one.

---

### PROMPT #1: Switch from Prisma to Supabase

```
TASK: Migrate from Prisma + SQLite to Supabase + PostgreSQL

STEPS:
1. Remove Prisma:
   - Delete prisma/ folder
   - Remove @prisma/client from package.json
   - Remove db:push, db:generate scripts
   - Delete src/lib/db.ts

2. Install Supabase:
   npm install @supabase/supabase-js@2

3. Create src/lib/supabase.ts:
   ```typescript
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
   const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   
   // Server-side client with service role
   export const supabaseAdmin = createClient(
     supabaseUrl,
     process.env.SUPABASE_SERVICE_ROLE_KEY!,
     {
       auth: {
         autoRefreshToken: false,
         persistSession: false
       }
     }
   )
   ```

4. Create .env.local:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GLM_API_KEY=your_glm_key
   ```

5. Update all API routes to use Supabase instead of Prisma:
   
   BEFORE (Prisma):
   ```typescript
   const user = await db.user.findUnique({ where: { id: userId } })
   ```
   
   AFTER (Supabase):
   ```typescript
   const { data: user } = await supabase
     .from('profiles')
     .select('*')
     .eq('id', userId)
     .single()
   ```

6. Update these files:
   - src/app/api/auth/login/route.ts
   - src/app/api/auth/signup/route.ts
   - src/app/api/auth/guest/route.ts
   - src/app/api/advisor/chat/route.ts
   - src/app/api/team/import/route.ts
   - src/app/api/team/data/route.ts

REQUIREMENTS:
- Use Supabase queries, not Prisma
- Use proper error handling
- Keep all existing functionality
- Update TypeScript types to match Supabase responses

TEST:
- Signup works and creates profile in Supabase
- Login works and returns user
- Chat API can fetch user data from Supabase
- Team import saves to Supabase
```

---

### PROMPT #2: Add Complete FPL API Integration

```
TASK: Implement full FPL API integration for fetching real team data

CREATE FILE: src/lib/fpl-api.ts

```typescript
const FPL_BASE_URL = 'https://fantasy.premierleague.com/api'

export interface FPLPlayer {
  id: number
  web_name: string
  first_name: string
  second_name: string
  element_type: number
  team: number
  now_cost: number
  total_points: number
  event_points: number
  selected_by_percent: string
  form: string
  // ... more fields
}

export interface FPLTeam {
  id: number
  name: string
  short_name: string
}

export interface BootstrapData {
  elements: FPLPlayer[]
  teams: FPLTeam[]
  events: any[]
}

// Get all FPL static data (players, teams, gameweeks)
export async function getBootstrapData(): Promise<BootstrapData> {
  const response = await fetch(`${FPL_BASE_URL}/bootstrap-static/`)
  if (!response.ok) {
    throw new Error(`FPL API error: ${response.status}`)
  }
  return response.json()
}

// Get user's FPL team by ID
export async function getFPLTeam(teamId: number) {
  const response = await fetch(`${FPL_BASE_URL}/entry/${teamId}/`)
  if (!response.ok) {
    throw new Error(`Team ${teamId} not found`)
  }
  return response.json()
}

// Get user's current picks for a gameweek
export async function getFPLPicks(teamId: number, gameweek: number) {
  const response = await fetch(
    `${FPL_BASE_URL}/entry/${teamId}/event/${gameweek}/picks/`
  )
  if (!response.ok) {
    throw new Error(`Picks not found for team ${teamId}`)
  }
  return response.json()
}

// Get user's mini-leagues
export async function getFPLLeagues(teamId: number) {
  const teamData = await getFPLTeam(teamId)
  return {
    classic: teamData.leagues.classic,
    h2h: teamData.leagues.h2h,
    cup: teamData.leagues.cup
  }
}

// Get league standings
export async function getLeagueStandings(leagueId: number, page: number = 1) {
  const response = await fetch(
    `${FPL_BASE_URL}/leagues-classic/${leagueId}/standings/?page_standings=${page}`
  )
  if (!response.ok) {
    throw new Error(`League ${leagueId} not found`)
  }
  return response.json()
}

// Get current gameweek
export async function getCurrentGameweek(): Promise<number> {
  const data = await getBootstrapData()
  const current = data.events.find(event => event.is_current)
  return current?.id || 1
}

// Transform FPL data to our database format
export function transformFPLTeamData(
  teamData: any,
  picksData: any,
  bootstrapData: BootstrapData
) {
  const { elements: players, teams } = bootstrapData
  
  // Transform picks to our squad format
  const squad = picksData.picks.map((pick: any) => {
    const player = players.find(p => p.id === pick.element)
    if (!player) return null
    
    const team = teams.find(t => t.id === player.team)
    
    return {
      id: player.id,
      name: player.web_name,
      full_name: `${player.first_name} ${player.second_name}`,
      position: getPositionName(player.element_type),
      team: team?.short_name || 'UNK',
      cost: player.now_cost / 10,
      points: player.total_points,
      gameweek_points: player.event_points || 0,
      selected_by: parseFloat(player.selected_by_percent),
      form: parseFloat(player.form),
      is_captain: pick.is_captain,
      is_vice_captain: pick.is_vice_captain,
      multiplier: pick.multiplier,
      position_in_squad: pick.position
    }
  }).filter(Boolean)
  
  return {
    fplTeamId: teamData.id,
    teamName: teamData.name,
    currentSquad: squad,
    bankValue: picksData.entry_history.bank / 10,
    teamValue: picksData.entry_history.value / 10,
    totalPoints: teamData.summary_overall_points,
    overallRank: teamData.summary_overall_rank,
    gameweekPoints: picksData.entry_history.points,
    gameweekRank: picksData.entry_history.rank,
    freeTransfers: picksData.entry_history.event_transfers_cost === 0 ? 
      picksData.entry_history.event_transfers : 0,
    currentGameweek: picksData.entry_history.event
  }
}

function getPositionName(elementType: number): string {
  const positions: Record<number, string> = {
    1: 'GK',
    2: 'DEF',
    3: 'MID',
    4: 'FWD'
  }
  return positions[elementType] || 'UNK'
}

// Validate FPL Team ID format
export function isValidFPLTeamId(id: string | number): boolean {
  const numId = typeof id === 'string' ? parseInt(id) : id
  return !isNaN(numId) && numId > 0 && numId < 10000000
}
```

UPDATE FILE: src/app/api/team/import/route.ts

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { 
  getFPLTeam, 
  getFPLPicks, 
  getBootstrapData, 
  getCurrentGameweek,
  transformFPLTeamData,
  isValidFPLTeamId
} from '@/lib/fpl-api'
import { z } from 'zod'

const importSchema = z.object({
  userId: z.string(),
  fplTeamId: z.number().or(z.string()).transform(val => 
    typeof val === 'string' ? parseInt(val) : val
  )
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, fplTeamId } = importSchema.parse(body)

    // Validate FPL Team ID
    if (!isValidFPLTeamId(fplTeamId)) {
      return NextResponse.json(
        { error: 'Invalid FPL Team ID. Must be a valid 6-7 digit number.' },
        { status: 400 }
      )
    }

    // Fetch data from FPL API
    const [teamData, currentGW, bootstrapData] = await Promise.all([
      getFPLTeam(fplTeamId),
      getCurrentGameweek(),
      getBootstrapData()
    ])

    const picksData = await getFPLPicks(fplTeamId, currentGW)

    // Transform to our format
    const transformed = transformFPLTeamData(teamData, picksData, bootstrapData)

    // Update user profile
    await supabaseAdmin
      .from('profiles')
      .update({
        fpl_team_id: fplTeamId,
        fpl_team_name: transformed.teamName,
        last_active_at: new Date().toISOString()
      })
      .eq('id', userId)

    // Upsert team data
    const { data: userTeam, error: teamError } = await supabaseAdmin
      .from('user_teams')
      .upsert({
        user_id: userId,
        fpl_team_id: fplTeamId,
        team_name: transformed.teamName,
        current_squad: transformed.currentSquad,
        bank_value: transformed.bankValue,
        team_value: transformed.teamValue,
        total_points: transformed.totalPoints,
        overall_rank: transformed.overallRank,
        gameweek_points: transformed.gameweekPoints,
        gameweek_rank: transformed.gameweekRank,
        free_transfers: transformed.freeTransfers,
        current_gameweek: transformed.currentGameweek,
        last_synced_at: new Date().toISOString(),
        sync_status: 'success'
      })
      .select()
      .single()

    if (teamError) throw teamError

    // Track event
    await supabaseAdmin.from('user_events').insert({
      user_id: userId,
      event_type: 'team_imported',
      event_data: {
        fpl_team_id: fplTeamId,
        team_name: transformed.teamName,
        timestamp: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Team imported successfully from FPL API',
      team: userTeam
    })
  } catch (error: any) {
    console.error('FPL import error:', error)

    // Handle specific FPL API errors
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'FPL Team ID not found. Please check your ID and try again.' },
        { status: 404 }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to import team from FPL API' },
      { status: 500 }
    )
  }
}
```

TEST:
- Enter valid FPL Team ID (e.g., 123456)
- Should fetch real data from FPL API
- Should save correctly to database
- Should handle invalid IDs gracefully
- Should show actual player names and stats
```

---

### PROMPT #3: Switch to Official GLM-4.6 API

```
TASK: Replace z-ai-web-dev-sdk with direct GLM-4.6 API integration

STEPS:
1. Remove z-ai-web-dev-sdk:
   npm uninstall z-ai-web-dev-sdk

2. Add GLM_API_KEY to .env.local:
   GLM_API_KEY=your_actual_glm_api_key_from_z.ai_platform

3. UPDATE FILE: src/app/api/advisor/chat/route.ts

Replace the AI integration section with:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const GLM_API_KEY = process.env.GLM_API_KEY!

const chatSchema = z.object({
  message: z.string().min(1),
  userId: z.string(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, userId, conversationHistory = [] } = chatSchema.parse(body)

    // Get user and team data from Supabase
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        user_teams!inner (
          *
        )
      `)
      .eq('id', userId)
      .eq('user_teams.sync_status', 'success')
      .order('user_teams.last_synced_at', { ascending: false })
      .limit(1)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user stats
    await supabaseAdmin
      .from('profiles')
      .update({
        queries_this_month: user.queries_this_month + 1,
        total_queries: user.total_queries + 1,
        last_active_at: new Date().toISOString()
      })
      .eq('id', userId)

    // Build rich context for GLM-4.6
    const teamData = user.user_teams[0]
    const systemPrompt = buildSystemPrompt(user, teamData)

    // Prepare messages for GLM-4.6
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    // Call GLM-4.6 API directly
    const glmResponse = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GLM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'glm-4.6',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        enable_thinking: true // GLM-4.6 specific - shows reasoning
      })
    })

    if (!glmResponse.ok) {
      const errorData = await glmResponse.json()
      throw new Error(`GLM API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    const glmData = await glmResponse.json()
    const aiResponse = glmData.choices[0]?.message?.content || 
      'Sorry, I could not generate a response.'
    const tokensUsed = glmData.usage?.total_tokens || 0

    // Save conversation to Supabase
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .insert({
        user_id: userId,
        title: message.length > 50 ? message.substring(0, 50) + '...' : message,
        messages: [
          ...conversationHistory,
          { role: 'user', content: message, timestamp: new Date().toISOString() },
          { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
        ],
        context_snapshot: {
          team_name: teamData?.team_name,
          total_points: teamData?.total_points,
          bank_value: teamData?.bank_value,
          free_transfers: teamData?.free_transfers
        },
        message_count: conversationHistory.length + 2,
        tokens_used: tokensUsed
      })
      .select()
      .single()

    if (convError) {
      console.error('Conversation save error:', convError)
    }

    // Track event
    await supabaseAdmin.from('user_events').insert({
      user_id: userId,
      event_type: 'ai_query_made',
      event_data: {
        tokens_used: tokensUsed,
        query_length: message.length,
        response_length: aiResponse.length,
        model: 'glm-4.6'
      }
    })

    return NextResponse.json({
      success: true,
      response: aiResponse,
      conversationId: conversation?.id,
      tokensUsed: tokensUsed
    })
  } catch (error: any) {
    console.error('AI chat error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function buildSystemPrompt(user: any, teamData: any): string {
  const squadText = teamData?.current_squad 
    ? teamData.current_squad.map((p: any) => 
        `${p.position} - ${p.name} (${p.team}) £${p.cost}m - ${p.points} pts`
      ).join('\n')
    : 'No squad data'

  return `You are an expert Fantasy Premier League (FPL) advisor with deep knowledge of player statistics, team fixtures, form, and strategy.

CURRENT CONTEXT:
==============
Gameweek: ${teamData?.current_gameweek || 'Unknown'}
User's Team: ${teamData?.team_name || 'Unknown'}
Team Value: £${teamData?.team_value || 0}m
Bank: £${teamData?.bank_value || 0}m
Free Transfers: ${teamData?.free_transfers || 0}
Total Points: ${teamData?.total_points || 0}
Overall Rank: ${teamData?.overall_rank?.toLocaleString() || 'N/A'}

CURRENT SQUAD (15 players):
${squadText}

YOUR ROLE:
=========
1. Analyze the user's team comprehensively
2. Consider upcoming fixtures (easy = good, hard = bad)
3. Look at player form and ownership percentages
4. Suggest specific actionable advice with player names
5. Explain your reasoning clearly step-by-step
6. Be conversational and friendly

RESPONSE FORMAT:
===============
- Start with a direct answer to their question
- Provide 1-2 specific recommendations with exact player names
- Explain WHY in 2-3 sentences with reasoning
- Consider their budget constraints
- End with a clear next action

IMPORTANT RULES:
===============
- Always suggest SPECIFIC player names (not just "get a midfielder")
- Consider the user's budget: Bank £${teamData?.bank_value || 0}m
- Mention point hits: Don't recommend transfers that exceed free transfers without warning about -4 points
- Focus on next 1-2 gameweeks primarily
- Be honest if you don't have enough info
- Use their actual squad data shown above

Remember: Users want SPECIFIC, ACTIONABLE advice they can use RIGHT NOW. Be direct and helpful.`
}
```

REQUIREMENTS:
- Must use official GLM-4.6 API endpoint
- Must enable thinking mode (enable_thinking: true)
- Must handle API errors gracefully
- Must track token usage
- Must save conversations to Supabase

TEST:
- Send a question like "Who should I captain?"
- Should get contextual advice based on actual team
- Response should reference specific players from squad
- Token usage should be tracked
- Should work with GLM API key from z.ai platform
```

---

### PROMPT #4: Add Mini-League Features

```
TASK: Implement complete mini-league import and analysis features

PART 1: Add to FPL API library (src/lib/fpl-api.ts)

Add these functions:

```typescript
// Get detailed league standings with all members
export async function getDetailedLeagueStandings(
  leagueId: number,
  maxPages: number = 5
): Promise<any[]> {
  let allStandings: any[] = []
  let page = 1
  let hasNext = true

  while (hasNext && page <= maxPages) {
    const data = await getLeagueStandings(leagueId, page)
    allStandings = [...allStandings, ...data.standings.results]
    
    hasNext = data.standings.has_next
    page++
  }

  return allStandings
}

// Import and transform league data
export async function importMiniLeague(leagueId: number) {
  // Get league info and standings
  const standingsData = await getLeagueStandings(leagueId, 1)
  const allMembers = await getDetailedLeagueStandings(leagueId)

  return {
    leagueId,
    name: standingsData.league.name,
    type: standingsData.league.scoring,
    memberCount: standingsData.league.size,
    members: allMembers.map(member => ({
      fplTeamId: member.entry,
      entryName: member.entry_name,
      playerName: member.player_name,
      rank: member.rank,
      lastRank: member.last_rank,
      totalPoints: member.total,
      gameweekPoints: member.event_total
    }))
  }
}
```

PART 2: Create Mini-League API Routes

CREATE FILE: src/app/api/leagues/import/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { importMiniLeague } from '@/lib/fpl-api'
import { z } from 'zod'

const importLeagueSchema = z.object({
  userId: z.string(),
  leagueId: z.number()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, leagueId } = importLeagueSchema.parse(body)

    // Fetch league data from FPL API
    const leagueData = await importMiniLeague(leagueId)

    // Insert league
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('mini_leagues')
      .upsert({
        fpl_league_id: leagueId,
        league_name: leagueData.name,
        league_type: leagueData.type,
        imported_by: userId,
        member_count: leagueData.memberCount,
        last_synced_at: new Date().toISOString()
      })
      .select()
      .single()

    if (leagueError) throw leagueError

    // Insert league members
    const membersToInsert = leagueData.members.map(member => ({
      league_id: league.id,
      fpl_team_id: member.fplTeamId,
      fpl_entry_name: member.entryName,
      player_name: member.playerName,
      league_rank: member.rank,
      last_rank: member.lastRank,
      total_points: member.totalPoints,
      gameweek_points: member.gameweekPoints,
      last_synced_at: new Date().toISOString()
    }))

    await supabaseAdmin
      .from('mini_league_members')
      .upsert(membersToInsert, {
        onConflict: 'league_id,fpl_team_id'
      })

    // Track event
    await supabaseAdmin.from('user_events').insert({
      user_id: userId,
      event_type: 'league_imported',
      event_data: {
        league_id: leagueId,
        league_name: leagueData.name,
        member_count: leagueData.memberCount
      }
    })

    return NextResponse.json({
      success: true,
      message: 'League imported successfully',
      league
    })
  } catch (error: any) {
    console.error('League import error:', error)
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'League not found. Please check the League ID.' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to import league' },
      { status: 500 }
    )
  }
}
```

CREATE FILE: src/app/api/leagues/[leagueId]/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  try {
    const leagueId = params.leagueId

    // Get league with members
    const { data: league, error } = await supabaseAdmin
      .from('mini_leagues')
      .select(`
        *,
        mini_league_members (*)
      `)
      .eq('id', leagueId)
      .single()

    if (error) throw error

    if (!league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      )
    }

    // Sort members by rank
    league.mini_league_members.sort((a, b) => a.league_rank - b.league_rank)

    return NextResponse.json({
      success: true,
      league
    })
  } catch (error) {
    console.error('League fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch league' },
      { status: 500 }
    )
  }
}
```

PART 3: Create Mini-League UI Pages

CREATE FILE: src/app/leagues/page.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, Trophy, Loader2 } from 'lucide-react'

export default function LeaguesPage() {
  const [user, setUser] = useState<any>(null)
  const [leagues, setLeagues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [leagueId, setLeagueId] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsed = JSON.parse(userData)
      setUser(parsed)
      loadLeagues(parsed.id)
    }
  }, [])

  const loadLeagues = async (userId: string) => {
    try {
      const response = await fetch(`/api/leagues?userId=${userId}`)
      const data = await response.json()
      if (data.success) {
        setLeagues(data.leagues)
      }
    } catch (error) {
      console.error('Load leagues error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!leagueId || !user) return

    setImporting(true)
    try {
      const response = await fetch('/api/leagues/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          leagueId: parseInt(leagueId)
        })
      })

      const data = await response.json()
      
      if (data.success) {
        await loadLeagues(user.id)
        setLeagueId('')
        alert('League imported successfully!')
      } else {
        alert(data.error || 'Failed to import league')
      }
    } catch (error) {
      alert('Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Mini-Leagues</h1>
        <p className="text-gray-600">
          Import and analyze your FPL mini-leagues
        </p>
      </div>

      {/* Import League */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Import Mini-League
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="league-id">League ID</Label>
              <Input
                id="league-id"
                type="number"
                placeholder="Enter your league ID"
                value={leagueId}
                onChange={(e) => setLeagueId(e.target.value)}
                disabled={importing}
              />
              <p className="text-sm text-gray-500 mt-1">
                Find your League ID in the FPL app under Leagues → League Code
              </p>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleImport}
                disabled={!leagueId || importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Import
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leagues List */}
      {leagues.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Leagues Yet</h3>
            <p className="text-gray-600 mb-4">
              Import your first mini-league to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leagues.map(league => (
            <Link key={league.id} href={`/leagues/${league.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <CardTitle className="text-lg">{league.league_name}</CardTitle>
                    </div>
                    <Badge>{league.member_count} members</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    <div>Type: {league.league_type}</div>
                    <div>Last synced: {new Date(league.last_synced_at).toLocaleDateString()}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

REQUIREMENTS:
- Must fetch actual league data from FPL API
- Must save to Supabase with all members
- UI must show league standings
- Must handle pagination (leagues with 50+ members)
- Must track which user imported league

TEST:
- Import a real FPL league ID
- Should fetch all members
- Should display league table
- Clicking league should show details
```

---

### PROMPT #5: Add Injury Alert System

```
TASK: Implement automated injury detection and notification system

PART 1: Create Injury Scraping Function

CREATE FILE: src/lib/injury-scraper.ts

```typescript
interface InjuryData {
  playerName: string
  team: string
  injuryType: string
  severity: string
  expectedReturn: string | null
  source: string
}

// Scrape from Premier Injuries website
export async function scrapeInjuries(): Promise<InjuryData[]> {
  try {
    const response = await fetch('https://www.premierinjuries.com/injury-table.php')
    const html = await response.text()
    
    // Parse HTML (basic implementation - would need proper HTML parser in production)
    const injuries: InjuryData[] = []
    
    // This is a simplified version - you'd need cheerio or similar for production
    // For now, return sample data structure
    return injuries
  } catch (error) {
    console.error('Scraping error:', error)
    return []
  }
}

// Alternative: Use Official FPL API injury data
export async function getFPLInjuries(): Promise<InjuryData[]> {
  try {
    const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/')
    const data = await response.json()
    
    const injuries: InjuryData[] = []
    
    // Extract players with injury flags
    for (const player of data.elements) {
      if (player.chance_of_playing_next_round !== null && 
          player.chance_of_playing_next_round < 100) {
        
        const team = data.teams.find((t: any) => t.id === player.team)
        
        injuries.push({
          playerName: player.web_name,
          team: team?.short_name || 'Unknown',
          injuryType: player.news || 'Unknown',
          severity: getSeverityFromChance(player.chance_of_playing_next_round),
          expectedReturn: null,
          source: 'Official FPL'
        })
      }
    }
    
    return injuries
  } catch (error) {
    console.error('FPL injuries fetch error:', error)
    return []
  }
}

function getSeverityFromChance(chance: number | null): string {
  if (chance === null || chance === 0) return 'Confirmed Out'
  if (chance <= 25) return 'Major Doubt'
  if (chance <= 50) return 'Doubtful'
  if (chance <= 75) return 'Minor Knock'
  return 'Expected to Play'
}

// Match player name to FPL ID
export async function matchPlayerToFPLId(
  playerName: string, 
  teamName: string
): Promise<number | null> {
  try {
    const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/')
    const data = await response.json()
    
    const player = data.elements.find((p: any) => {
      const team = data.teams.find((t: any) => t.id === p.team)
      return (
        p.web_name.toLowerCase() === playerName.toLowerCase() ||
        `${p.first_name} ${p.second_name}`.toLowerCase() === playerName.toLowerCase()
      ) && team?.short_name === teamName
    })
    
    return player?.id || null
  } catch (error) {
    console.error('Player matching error:', error)
    return null
  }
}
```

PART 2: Create Injury Detection API Route

CREATE FILE: src/app/api/injuries/detect/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getFPLInjuries, matchPlayerToFPLId } from '@/lib/injury-scraper'

export async function POST(request: NextRequest) {
  try {
    // Fetch latest injuries
    const injuries = await getFPLInjuries()
    
    let newInjuries = 0
    let updatedInjuries = 0
    let notifiedUsers = 0

    for (const injury of injuries) {
      // Match player name to FPL ID
      const playerId = await matchPlayerToFPLId(injury.playerName, injury.team)
      if (!playerId) continue

      // Check if injury already exists
      const { data: existing } = await supabaseAdmin
        .from('injury_alerts')
        .select('id')
        .eq('player_id', playerId)
        .eq('is_active', true)
        .single()

      if (existing) {
        // Update existing injury
        await supabaseAdmin
          .from('injury_alerts')
          .update({
            injury_type: injury.injuryType,
            severity: injury.severity,
            source: injury.source,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
        
        updatedInjuries++
      } else {
        // Insert new injury
        const { data: newInjury } = await supabaseAdmin
          .from('injury_alerts')
          .insert({
            player_id: playerId,
            player_name: injury.playerName,
            team_name: injury.team,
            injury_type: injury.injuryType,
            severity: injury.severity,
            source: injury.source,
            detected_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (newInjury) {
          // Notify users who own this player
          const notified = await notifyAffectedUsers(playerId, injury.playerName)
          notifiedUsers += notified
          newInjuries++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Injury detection completed',
      stats: {
        newInjuries,
        updatedInjuries,
        notifiedUsers
      }
    })
  } catch (error) {
    console.error('Injury detection error:', error)
    return NextResponse.json(
      { error: 'Injury detection failed' },
      { status: 500 }
    )
  }
}

async function notifyAffectedUsers(
  playerId: number, 
  playerName: string
): Promise<number> {
  try {
    // Find all users who have this player in their team
    const { data: teams } = await supabaseAdmin
      .from('user_teams')
      .select('user_id, current_squad')

    if (!teams) return 0

    let notifiedCount = 0

    for (const team of teams) {
      // Check if squad contains this player
      const squad = team.current_squad as any[]
      const hasPlayer = squad.some(p => p.id === playerId)
      
      if (!hasPlayer) continue

      // Create notification
      await supabaseAdmin.from('user_notifications').insert({
        user_id: team.user_id,
        notification_type: 'injury',
        title: `⚠️ ${playerName} Injury Alert`,
        message: `${playerName} has been flagged with an injury. Check your team and consider transfers.`,
        related_data: { player_id: playerId },
        action_url: '/team',
        action_label: 'View Team'
      })

      notifiedCount++
    }

    return notifiedCount
  } catch (error) {
    console.error('User notification error:', error)
    return 0
  }
}
```

PART 3: Setup Cron Job

CREATE FILE: vercel.json (for deployment)

```json
{
  "crons": [
    {
      "path": "/api/injuries/detect",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

REQUIREMENTS:
- Must detect injuries from FPL API
- Must match players to FPL IDs accurately
- Must notify affected users only
- Must track which injuries are active/resolved
- Should run every 6 hours automatically

TEST:
- Manually trigger: POST /api/injuries/detect
- Check injury_alerts table is populated
- Check users with affected players get notifications
- Verify notification appears in UI
```

---

### PROMPT #6: Add Proper Authentication with Supabase

```
TASK: Replace localStorage auth with proper Supabase authentication

STEPS:
1. UPDATE FILE: src/lib/supabase.ts

Add auth helpers:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Auth helper functions
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}
```

2. UPDATE FILE: src/app/api/auth/signup/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = signupSchema.parse(body)

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm for development
    })

    if (authError) throw authError

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        display_name: name || email.split('@')[0]
      })

    if (profileError) throw profileError

    // Track signup event
    await supabaseAdmin.from('user_events').insert({
      user_id: authData.user.id,
      event_type: 'signup',
      event_data: { method: 'email' }
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email
      }
    })
  } catch (error: any) {
    console.error('Signup error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Signup failed' },
      { status: 500 }
    )
  }
}
```

3. UPDATE FILE: src/app/login/page.tsx

Replace localStorage auth with Supabase:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { signIn } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Welcome Back
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="text-purple-600 hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

4. Add auth check to protected pages

CREATE FILE: src/components/auth/AuthGuard.tsx

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { user, error } = await getCurrentUser()
    
    if (error || !user) {
      router.push('/login')
      return
    }
    
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
```

Then wrap protected pages:

```typescript
// In src/app/dashboard/page.tsx and other protected pages
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function DashboardPage() {
  return (
    <AuthGuard>
      {/* Your page content */}
    </AuthGuard>
  )
}
```

REQUIREMENTS:
- Must use Supabase Auth (not localStorage)
- Must handle auth state properly
- Must protect routes with AuthGuard
- Must handle session refresh
- Guest mode can remain for demo purposes

TEST:
- Sign up creates user in Supabase Auth
- Login works and redirects to dashboard
- Protected pages redirect to login when not authenticated
- Session persists across page reloads
- Logout works properly
```

---

## 🎯 PRIORITY ORDER FOR FIXES

Based on criticality and dependencies:

1. **FIRST (Foundational):**
   - ✅ Prompt #1: Switch to Supabase
   - ✅ Prompt #6: Add proper authentication

2. **SECOND (Core Features):**
   - ✅ Prompt #2: Add FPL API integration
   - ✅ Prompt #3: Switch to GLM-4.6 API

3. **THIRD (Key Differentiators):**
   - ✅ Prompt #4: Add mini-league features
   - ✅ Prompt #5: Add injury alerts

4. **FOURTH (Polish):**
   - Fix remaining UI issues
   - Add missing pages (settings, history, etc.)
   - Mobile optimization
   - Error handling improvements

---

## 📋 TESTING CHECKLIST

After implementing all fixes, test these scenarios:

### Authentication
- [ ] User can sign up with email/password
- [ ] User can log in
- [ ] Protected routes require authentication
- [ ] Session persists across page reloads
- [ ] Logout works correctly

### FPL Team Import
- [ ] Enter valid FPL Team ID
- [ ] Real data fetched from FPL API
- [ ] 15 players displayed correctly
- [ ] Team stats (points, rank, value) accurate
- [ ] Invalid ID shows error message

### AI Chat
- [ ] Can send message to AI
- [ ] Response received in <5 seconds
- [ ] Response is contextual to user's team
- [ ] Mentions specific player names from squad
- [ ] Conversation history maintained
- [ ] Token usage tracked

### Mini-Leagues
- [ ] Can import league by ID
- [ ] All league members fetched
- [ ] League table displays correctly
- [ ] Can see rival comparisons
- [ ] Differential picks suggested

### Injury Alerts
- [ ] Injuries detected from FPL API
- [ ] Affected users notified
- [ ] Notifications appear in UI
- [ ] Can dismiss notifications
- [ ] Cron job runs successfully

### Database
- [ ] Data persists in Supabase
- [ ] Queries are fast (<200ms)
- [ ] Row-Level Security works
- [ ] No unauthorized data access

---

## 🚀 DEPLOYMENT CHECKLIST

Once all fixes are complete:

1. **Environment Setup:**
   - [ ] Create Supabase project
   - [ ] Get Supabase keys
   - [ ] Get GLM-4.6 API key
   - [ ] Add all environment variables

2. **Database Setup:**
   - [ ] Run all SQL migrations in Supabase
   - [ ] Enable Row-Level Security
   - [ ] Create indexes
   - [ ] Test sample queries

3. **Vercel Deployment:**
   - [ ] Connect GitHub repo
   - [ ] Add environment variables
   - [ ] Configure custom domain
   - [ ] Test production build

4. **Post-Deployment:**
   - [ ] Test all features in production
   - [ ] Setup error monitoring
   - [ ] Configure cron jobs
   - [ ] Test mobile responsiveness

---

## 💡 ADDITIONAL RECOMMENDATIONS

### Performance Optimizations
1. Add caching for FPL API calls (reduce external API calls)
2. Use React Query for data fetching (better UX)
3. Implement optimistic UI updates (faster feel)
4. Add skeleton loaders (perceived performance)

### UX Improvements
1. Add onboarding flow for new users
2. Add tooltips explaining features
3. Improve error messages (more helpful)
4. Add loading states everywhere
5. Add success toast notifications

### Missing Features to Consider
1. **Transfer Planner:** Plan transfers for multiple gameweeks
2. **Fixture Difficulty Tracker:** Visual fixture difficulty calendar
3. **Captain Analytics:** Historical captain performance
4. **Price Change Predictor:** Predict player price changes
5. **Chip Strategy Guide:** When to use chips optimally

### Code Quality
1. Add TypeScript types for all API responses
2. Add error boundaries for React components
3. Add loading states to all async operations
4. Add input validation on all forms
5. Add unit tests for critical functions

---

## 📞 SUPPORT & QUESTIONS

If z.ai needs help with any of these prompts:

**For Supabase Issues:**
- Check: https://supabase.com/docs
- Common error: RLS policies blocking access
- Solution: Disable RLS temporarily during development

**For FPL API Issues:**
- Endpoint: https://fantasy.premierleague.com/api/
- Rate limit: Unknown, but be respectful
- Common error: Team ID not found (invalid ID)

**For GLM-4.6 Issues:**
- Get API key: https://open.bigmodel.cn
- Docs: Check z.ai platform documentation
- Common error: Invalid API key format

**For General Next.js Issues:**
- Docs: https://nextjs.org/docs
- Common error: Server components vs client components

---

## ✅ SUMMARY

**What z.ai built:** 40% complete
- Good UI foundation
- Basic structure in place
- Nice design with shadcn/ui

**What's missing:** 60% of spec
- Wrong database (SQLite → should be Supabase)
- Wrong AI (z-ai-sdk → should be GLM-4.6 API)
- No FPL API integration
- No mini-league features
- No injury alerts
- Weak authentication

**Bottom Line:** Major rework needed, but foundation is salvageable. Follow prompts above sequentially to fix all issues.

**Estimated Time to Fix:**
- If z.ai implements all prompts: 2-3 weeks
- If you implement yourself: 4-6 weeks
- If starting from scratch: 8-12 weeks

**Recommendation:** Fix with prompts above rather than rebuild. The UI work is good and can be preserved.

---

**Good luck! Each prompt is detailed and actionable. Send them to z.ai one at a time and verify each works before moving to the next.** 🚀

