'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/header'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/components/auth/auth-provider-client'
import {
  Send,
  MessageSquare,
  TrendingUp,
  Users,
  Target,
  Loader2,
  Bot,
  User
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface QuickQuestion {
  id: string
  text: string
  icon: React.ReactNode
  category: string
}

const quickQuestions: QuickQuestion[] = [
  {
    id: '1',
    text: 'Who should I captain this week?',
    icon: <Target className="h-4 w-4" />,
    category: 'captain'
  },
  {
    id: '2',
    text: 'Should I transfer out Salah?',
    icon: <TrendingUp className="h-4 w-4" />,
    category: 'transfer'
  },
  {
    id: '3',
    text: 'Which defenders have good fixtures?',
    icon: <Users className="h-4 w-4" />,
    category: 'fixture'
  },
  {
    id: '4',
    text: 'Am I using my wild card at the right time?',
    icon: <MessageSquare className="h-4 w-4" />,
    category: 'chip'
  },
  {
    id: '5',
    text: 'Who are the differentials for my mini-league?',
    icon: <Users className="h-4 w-4" />,
    category: 'league'
  },
  {
    id: '6',
    text: 'Budget enablers under 4.5m?',
    icon: <TrendingUp className="h-4 w-4" />,
    category: 'budget'
  }
]

export default function AdvisorPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) {
      return
    }
    
    // Check if user has connected their FPL team (only for non-guest users)
    if (!user.isGuest && !user.fplTeamId) {
      router.push('/dashboard')
      return
    }
    
    setInitialLoading(false)
  }, [router, user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Call AI API
      const response = await fetch('/api/advisor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          userId: user?.id,
          conversationHistory: messages.slice(-5) // Send last 5 messages for context
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response')
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error: any) {
      console.error('AI chat error:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickQuestion = (question: QuickQuestion) => {
    handleSendMessage(question.text)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage(input)
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-pitch relative overflow-hidden flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-pitch relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <Header currentPage="AI Advisor" />

      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
          {/* Quick Questions Sidebar */}
          <div className="lg:col-span-1">
            <Card className="h-full bg-glass-strong border-primary/30 shadow-glow-blue">
              <CardHeader>
                <CardTitle className="text-xl font-black">
                  <span className="text-gradient-primary">Quick Questions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {quickQuestions.map((question) => (
                      <Button
                        key={question.id}
                        variant="outline"
                        className="w-full justify-start text-left h-auto p-3 bg-glass border-accent/30 hover:bg-gradient-primary hover:shadow-glow-blue transition-all duration-300 font-medium"
                        onClick={() => handleQuickQuestion(question)}
                        disabled={loading}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-accent">{question.icon}</span>
                          <span className="text-sm">{question.text}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col bg-glass-strong border-secondary/30 shadow-glow-green">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-black">
                  <Bot className="h-6 w-6 text-accent" />
                  <span className="text-gradient-glow">Chat with FPL AI Advisor</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Messages Area */}
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4 pb-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <Bot className="h-16 w-16 text-accent mx-auto mb-6" />
                        <h3 className="text-2xl font-black mb-3">
                          <span className="text-gradient-glow">Welcome to your FPL AI Advisor!</span>
                        </h3>
                        <p className="text-foreground/80 mb-6 text-lg">
                          Ask me anything about your team, transfers, captains, or strategy.
                        </p>
                        <p className="text-base text-foreground/60">
                          Try one of the quick questions on the left, or type your own question below.
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {message.role === 'assistant' && (
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-accent rounded-full flex items-center justify-center shadow-glow-green">
                              <Bot className="h-5 w-5 text-foreground" />
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-lg p-4 ${
                              message.role === 'user'
                                ? 'bg-gradient-primary shadow-glow-blue text-primary-foreground'
                                : 'bg-glass border border-secondary/30 text-foreground'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap font-medium">{message.content}</p>
                            <p
                              className={`text-xs mt-2 ${
                                message.role === 'user' ? 'text-primary-foreground/70' : 'text-foreground/60'
                              }`}
                            >
                              {message.timestamp.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {message.role === 'user' && (
                            <div className="flex-shrink-0 w-10 h-10 bg-glass border-2 border-accent rounded-full flex items-center justify-center shadow-glow-green">
                              <User className="h-5 w-5 text-accent" />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    {loading && (
                      <div className="flex gap-3 justify-start">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-accent rounded-full flex items-center justify-center shadow-glow-green">
                          <Bot className="h-5 w-5 text-foreground" />
                        </div>
                        <div className="bg-glass border border-secondary/30 rounded-lg p-4">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-accent" />
                            <span className="text-sm text-foreground font-medium">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <Separator className="my-4" />

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about transfers, captains, strategy..."
                    disabled={loading}
                    className="flex-1 bg-input/50 border-primary/30 text-foreground placeholder:text-foreground/50"
                  />
                  <Button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-gradient-primary hover:shadow-glow-blue transition-all duration-300 font-bold px-6"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </AuthGuard>
  )
}