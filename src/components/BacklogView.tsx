import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { 
  Search, 
  Filter,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Settings,
  Calendar,
  Users,
  Target,
  Play,
  Square,
  CheckCircle2
} from 'lucide-react'
import { User as UserType, Task, Project, Sprint } from '../types'
import { toast } from 'sonner'

interface BacklogViewProps {
  user: UserType
  project: Project
  tasks: Task[]
  sprints: Sprint[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onTaskClick: (task: Task) => void
  onCreateSprint: () => void
}

interface BacklogSprint {
  id: string
  name: string
  dateRange: string
  status: 'active' | 'completed' | 'planned'
  tasks: Task[]
  totalStoryPoints: number
  completedStoryPoints: number
  isExpanded: boolean
}

interface BacklogSection {
  id: string
  title: string
  subtitle?: string
  tasks: Task[]
  isExpanded: boolean
  type: 'sprint' | 'backlog'
  sprint?: Sprint
}

// Mock team members with Turkish names and avatars
const TEAM_MEMBERS = [
  { id: 'user-1', name: 'Ahmet Yılmaz', email: 'ahmet@company.com', avatar: 'AY', color: 'bg-orange-500' },
  { id: 'user-2', name: 'Mehmet Demir', email: 'mehmet@company.com', avatar: 'MD', color: 'bg-blue-500' },
  { id: 'user-3', name: 'Ayşe Kaya', email: 'ayse@company.com', avatar: 'AK', color: 'bg-green-500' },
  { id: 'user-4', name: 'Fatma Özkan', email: 'fatma@company.com', avatar: 'FÖ', color: 'bg-purple-500' },
  { id: 'user-5', name: 'Ali Şahin', email: 'ali@company.com', avatar: 'AŞ', color: 'bg-red-500' },
  { id: 'user-6', name: 'Zeynep Arslan', email: 'zeynep@company.com', avatar: 'ZA', color: 'bg-pink-500' }
]

const STATUS_COLORS = {
  'ON HOLD': 'bg-blue-100 text-blue-800',
  'TEST': 'bg-yellow-100 text-yellow-800',
  'IN PROGRESS': 'bg-purple-100 text-purple-800',
  'TO DO': 'bg-gray-100 text-gray-800',
  'DONE': 'bg-green-100 text-green-800',
  'SETTINGS': 'bg-teal-100 text-teal-800'
}

const PRIORITY_ICONS = {
  low: '=',
  medium: '=',
  high: '↑',
  urgent: '↑↑'
}

const PRIORITY_COLORS = {
  low: 'text-green-600',
  medium: 'text-yellow-600', 
  high: 'text-orange-600',
  urgent: 'text-red-600'
}

export function BacklogView({ user, project, tasks, sprints, onTaskUpdate, onTaskClick, onCreateSprint }: BacklogViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVersion, setSelectedVersion] = useState('all')
  const [selectedEpic, setSelectedEpic] = useState('all')
  const [quickFilters, setQuickFilters] = useState<string[]>([])
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['sprint-current', 'backlog']))

  // Create backlog sections
  const createBacklogSections = (): BacklogSection[] => {
    const sections: BacklogSection[] = []
    
    // Current Sprint
    const currentSprint = sprints.find(s => s.status === 'active')
    if (currentSprint) {
      const sprintTasks = tasks.filter(t => t.sprintId === currentSprint.id)
      sections.push({
        id: 'sprint-current',
        title: currentSprint.name,
        subtitle: `8 Jul - 22 Jul (14 work items)`,
        tasks: sprintTasks,
        isExpanded: expandedSections.has('sprint-current'),
        type: 'sprint',
        sprint: currentSprint
      })
    }

    // Backlog
    const backlogTasks = tasks.filter(t => t.type === 'backlog')
    sections.push({
      id: 'backlog',
      title: 'Backlog',
      subtitle: `(14 work items)`,
      tasks: backlogTasks,
      isExpanded: expandedSections.has('backlog'),
      type: 'backlog'
    })

    return sections
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const getTaskStatusBadge = (task: Task) => {
    let statusText = ''
    let statusClass = ''
    
    switch (task.status) {
      case 'todo':
        statusText = 'TO DO'
        statusClass = STATUS_COLORS['TO DO']
        break
      case 'in_progress':
        statusText = 'IN PROGRESS'
        statusClass = STATUS_COLORS['IN PROGRESS']
        break
      case 'review':
        statusText = 'TEST'
        statusClass = STATUS_COLORS['TEST']
        break
      case 'done':
        statusText = 'DONE'
        statusClass = STATUS_COLORS['DONE']
        break
      default:
        statusText = 'TO DO'
        statusClass = STATUS_COLORS['TO DO']
    }

    return (
      <Badge className={`text-xs px-2 py-1 ${statusClass}`}>
        {statusText}
      </Badge>
    )
  }

  const getAssigneeAvatar = (assigneeId?: string) => {
    if (!assigneeId) return null
    const member = TEAM_MEMBERS.find(m => m.id === assigneeId)
    return member ? (
      <Avatar className="w-6 h-6">
        <AvatarFallback className={`text-xs text-white ${member.color}`}>
          {member.avatar}
        </AvatarFallback>
      </Avatar>
    ) : null
  }

  const getPriorityIcon = (priority: Task['priority']) => {
    return (
      <span className={`text-sm font-bold ${PRIORITY_COLORS[priority]}`}>
        {PRIORITY_ICONS[priority]}
      </span>
    )
  }

  const sections = createBacklogSections()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Backlog</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Target className="w-4 h-4 mr-2" />
            Plan on whiteboard
            <Badge variant="secondary" className="ml-2 text-xs">TRY</Badge>
          </Button>
          <Button size="sm" onClick={onCreateSprint}>
            Create sprint
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 py-4 border-b">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search backlog"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Team avatars */}
        <div className="flex items-center -space-x-2">
          {TEAM_MEMBERS.slice(0, 6).map((member) => (
            <Avatar key={member.id} className="w-8 h-8 border-2 border-white">
              <AvatarFallback className={`text-xs text-white ${member.color}`}>
                {member.avatar}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>

        <Select value={selectedVersion} onValueChange={setSelectedVersion}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Version" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Version</SelectItem>
            <SelectItem value="v1.0">v1.0</SelectItem>
            <SelectItem value="v2.0">v2.0</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedEpic} onValueChange={setSelectedEpic}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Epic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Epic</SelectItem>
            <SelectItem value="auth">Authentication</SelectItem>
            <SelectItem value="ui">UI/UX</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Quick filters
        </Button>

        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Backlog Sections */}
      <div className="space-y-1">
        {sections.map((section) => (
          <Card key={section.id} className="border-l-4 border-l-blue-500">
            {/* Section Header */}
            <CardHeader 
              className="py-3 px-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox />
                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                    {section.isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                  <div>
                    <h3 className="font-medium text-sm">{section.title}</h3>
                    <p className="text-xs text-muted-foreground">{section.subtitle}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Story points summary */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">21</span>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">34</span>
                    <span>0</span>
                  </div>
                  
                  {section.type === 'sprint' && (
                    <Button size="sm" variant="outline">
                      Complete sprint
                    </Button>
                  )}
                  
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Section Content */}
            {section.isExpanded && (
              <CardContent className="px-4 pb-4 pt-0">
                <div className="space-y-1">
                  {section.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 py-2 px-2 hover:bg-gray-50 rounded cursor-pointer group"
                      onClick={() => onTaskClick(task)}
                    >
                      <Checkbox />
                      
                      {/* Task ID */}
                      <div className="w-20 text-xs text-blue-600 font-mono">
                        {project.key}-{task.taskNumber}
                      </div>
                      
                      {/* Task Title */}
                      <div className="flex-1 text-sm">
                        {task.title}
                      </div>
                      
                      {/* Status Badge */}
                      <div className="w-32">
                        {getTaskStatusBadge(task)}
                      </div>
                      
                      {/* Story Points */}
                      <div className="w-12 text-center text-xs text-muted-foreground">
                        {task.storyPoints || '0'}
                      </div>
                      
                      {/* Priority */}
                      <div className="w-8 text-center">
                        {getPriorityIcon(task.priority)}
                      </div>
                      
                      {/* Assignee */}
                      <div className="w-8">
                        {getAssigneeAvatar(task.assigneeId)}
                      </div>
                    </div>
                  ))}
                  
                  {section.tasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="text-4xl mb-2">📋</div>
                      <p className="text-sm">No items in {section.title.toLowerCase()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}