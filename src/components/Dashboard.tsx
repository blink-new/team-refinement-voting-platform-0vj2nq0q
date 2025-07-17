import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { 
  CheckSquare, 
  BarChart3, 
  MessageSquare, 
  Users,
  TrendingUp,
  Clock,
  Plus,
  Activity
} from 'lucide-react'
import { User, DashboardStats, ActivityItem } from '../types'
import { blink } from '../blink/client'
import { toast } from 'sonner'

interface DashboardProps {
  user: User
  onModuleChange?: (module: string) => void
}

export function Dashboard({ user, onModuleChange }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    activeVotingSessions: 0,
    teamMembers: 0,
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load activity from realtime channel
      const channel = blink.realtime.channel('team-activity')
      const recentMessages = await channel.getMessages({ limit: 10 })
      
      const activities: ActivityItem[] = recentMessages.map(msg => ({
        id: msg.id,
        type: msg.data.type || 'task_created',
        title: msg.data.title || 'Activity',
        description: msg.data.description || 'Team activity',
        userId: msg.userId,
        userName: msg.metadata?.displayName || 'Team Member',
        timestamp: new Date(msg.timestamp)
      }))

      // Calculate stats from localStorage for now
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]')
      const votingRooms = JSON.parse(localStorage.getItem('votingRooms') || '[]')
      const teamMembers = JSON.parse(localStorage.getItem('teamMembers') || '[]')

      const userTasks = tasks.filter((task: any) => task.userId === user.id)
      const completedTasks = userTasks.filter((task: any) => task.status === 'done')
      const activeVoting = votingRooms.filter((room: any) => room.votingActive && room.userId === user.id)

      setStats({
        totalTasks: userTasks.length,
        completedTasks: completedTasks.length,
        activeVotingSessions: activeVoting.length,
        teamMembers: teamMembers.length || 1,
        recentActivity: activities
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleQuickAction = (action: string) => {
    if (onModuleChange) {
      switch (action) {
        case 'task':
          onModuleChange('tasks')
          break
        case 'voting':
          onModuleChange('refinement')
          break
        case 'retro':
          onModuleChange('retrospective')
          break
        default:
          break
      }
    }
  }

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'task_created':
      case 'task_completed':
        return <CheckSquare className="w-4 h-4" />
      case 'voting_started':
        return <BarChart3 className="w-4 h-4" />
      case 'retro_created':
        return <MessageSquare className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'task_completed':
        return 'text-green-600 bg-green-50'
      case 'task_created':
        return 'text-blue-600 bg-blue-50'
      case 'voting_started':
        return 'text-purple-600 bg-purple-50'
      case 'retro_created':
        return 'text-orange-600 bg-orange-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user.displayName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your team today
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Quick Actions
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              +12% from last sprint
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Voting</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeVotingSessions}</div>
            <p className="text-xs text-muted-foreground">
              Sessions in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamMembers}</div>
            <p className="text-xs text-muted-foreground">
              Active collaborators
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates from your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {activity.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start creating tasks or voting sessions to see activity here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleQuickAction('task')}
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Create New Task
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleQuickAction('voting')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Start Voting Session
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleQuickAction('retro')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              New Retrospective
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => toast.info('Team invitation feature coming soon!')}
            >
              <Users className="w-4 h-4 mr-2" />
              Invite Team Member
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Team Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Overview
          </CardTitle>
          <CardDescription>
            Current team members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'John Doe', role: 'Frontend Developer', status: 'online' },
              { name: 'Sarah Smith', role: 'Product Manager', status: 'online' },
              { name: 'Mike Johnson', role: 'Backend Developer', status: 'away' },
              { name: 'Emma Wilson', role: 'UI/UX Designer', status: 'offline' }
            ].map((member, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className={`w-2 h-2 rounded-full ${
                      member.status === 'online' ? 'bg-green-500' :
                      member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-xs text-muted-foreground capitalize">
                      {member.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}