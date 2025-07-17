import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { BacklogView } from './BacklogView'
import { JiraIntegration } from './JiraIntegration'
import { 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Calendar,
  User,
  Flag,
  GripVertical,
  Settings,
  Play,
  Square,
  BarChart3,
  FolderPlus,
  Timer,
  CheckCircle2,
  Clock,
  Target,
  Users,
  Link as LinkIcon
} from 'lucide-react'
import { User as UserType, Task, Project, Sprint } from '../types'
import { toast } from 'sonner'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TaskManagementProps {
  user: UserType
}

const TASK_STATUSES = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'review', label: 'Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'done', label: 'Done', color: 'bg-green-100 text-green-800' }
]

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
]

// Mock team members for assignee selection
const TEAM_MEMBERS = [
  { id: 'user-1', name: 'Alice Johnson', email: 'alice@company.com', avatar: 'AJ' },
  { id: 'user-2', name: 'Bob Smith', email: 'bob@company.com', avatar: 'BS' },
  { id: 'user-3', name: 'Carol Davis', email: 'carol@company.com', avatar: 'CD' },
  { id: 'user-4', name: 'David Wilson', email: 'david@company.com', avatar: 'DW' },
  { id: 'user-5', name: 'Eva Brown', email: 'eva@company.com', avatar: 'EB' }
]

interface TaskDetailDialogProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (taskId: string, updates: Partial<Task>) => void
  project: Project | null
}

function TaskDetailDialog({ task, isOpen, onClose, onUpdate, project }: TaskDetailDialogProps) {
  const [editedTask, setEditedTask] = useState<Partial<Task>>({})
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState<Array<{
    id: string
    author: string
    content: string
    timestamp: Date
  }>>([])
  const [linkedTasks, setLinkedTasks] = useState<Array<{
    id: string
    title: string
    key: string
    type: 'blocks' | 'blocked_by' | 'relates_to'
  }>>([])
  const [linkTaskQuery, setLinkTaskQuery] = useState('')

  useEffect(() => {
    if (task) {
      setEditedTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        assigneeId: task.assigneeId,
        storyPoints: task.storyPoints,
        status: task.status
      })
      
      // Mock comments for demonstration
      setComments([
        {
          id: 'comment-1',
          author: 'Ahmet Yılmaz',
          content: 'Bu task için UI mockup hazırladım. Tasarım dosyalarını Figma\'da bulabilirsiniz.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
        },
        {
          id: 'comment-2', 
          author: 'Ayşe Kaya',
          content: 'Backend API entegrasyonu tamamlandı. Test edilmeye hazır.',
          timestamp: new Date(Date.now() - 1000 * 60 * 30)
        }
      ])
      
      // Mock linked tasks
      setLinkedTasks([
        {
          id: 'task-123',
          title: 'API endpoint oluşturulması',
          key: 'STA-123',
          type: 'blocks'
        }
      ])
    }
  }, [task])

  if (!task || !project) return null

  const handleSave = () => {
    onUpdate(task.id, editedTask)
    onClose()
    toast.success('Task updated successfully')
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    
    const comment = {
      id: `comment-${Date.now()}`,
      author: 'Current User', // This should come from auth context
      content: newComment,
      timestamp: new Date()
    }
    
    setComments(prev => [...prev, comment])
    setNewComment('')
    toast.success('Comment added')
  }

  const handleLinkTask = (taskId: string, linkType: 'blocks' | 'blocked_by' | 'relates_to') => {
    // This would normally search and link actual tasks
    const newLink = {
      id: taskId,
      title: 'Sample linked task',
      key: `STA-${Math.floor(Math.random() * 1000)}`,
      type: linkType
    }
    
    setLinkedTasks(prev => [...prev, newLink])
    setLinkTaskQuery('')
    toast.success('Task linked successfully')
  }

  const getAssigneeName = (assigneeId?: string) => {
    if (!assigneeId) return 'Unassigned'
    const member = TEAM_MEMBERS.find(m => m.id === assigneeId)
    return member?.name || 'Unknown'
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-muted-foreground">{project.key}-{task.taskNumber}</span>
            <span>{task.title}</span>
          </DialogTitle>
          <DialogDescription>
            Task details and management
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Task Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select 
                value={editedTask.status} 
                onValueChange={(value: Task['status']) => 
                  setEditedTask(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Priority</Label>
              <Select 
                value={editedTask.priority} 
                onValueChange={(value: Task['priority']) => 
                  setEditedTask(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <Flag className={`w-4 h-4 mr-2 ${priority.color}`} />
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Assignee</Label>
              <Select 
                value={editedTask.assigneeId || 'unassigned'} 
                onValueChange={(value) => 
                  setEditedTask(prev => ({ ...prev, assigneeId: value === 'unassigned' ? undefined : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {TEAM_MEMBERS.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-xs">{member.avatar}</AvatarFallback>
                        </Avatar>
                        {member.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Story Points</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={editedTask.storyPoints || ''}
                onChange={(e) => setEditedTask(prev => ({ 
                  ...prev, 
                  storyPoints: parseInt(e.target.value) || undefined 
                }))}
                placeholder="Enter story points"
              />
            </div>
          </div>

          <div>
            <Label>Title</Label>
            <Input
              value={editedTask.title || ''}
              onChange={(e) => setEditedTask(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={editedTask.description || ''}
              onChange={(e) => setEditedTask(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter task description"
              rows={4}
            />
          </div>

          {/* Linked Tasks */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Linked Tasks</h4>
            <div className="space-y-2 mb-3">
              {linkedTasks.map((linkedTask) => (
                <div key={linkedTask.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {linkedTask.type === 'blocks' ? 'Blocks' : 
                       linkedTask.type === 'blocked_by' ? 'Blocked by' : 'Relates to'}
                    </Badge>
                    <span className="text-sm font-mono text-blue-600">{linkedTask.key}</span>
                    <span className="text-sm">{linkedTask.title}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setLinkedTasks(prev => prev.filter(t => t.id !== linkedTask.id))
                  }}>
                    ×
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search tasks to link..."
                value={linkTaskQuery}
                onChange={(e) => setLinkTaskQuery(e.target.value)}
                className="flex-1"
              />
              <Select onValueChange={(value) => {
                if (linkTaskQuery.trim()) {
                  handleLinkTask(`task-${Date.now()}`, value as any)
                }
              }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Link type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blocks">Blocks</SelectItem>
                  <SelectItem value="blocked_by">Blocked by</SelectItem>
                  <SelectItem value="relates_to">Relates to</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comments */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Comments</h4>
            <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-gray-50 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{comment.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                Add
              </Button>
            </div>
          </div>

          {/* Task Metadata */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Task Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p>{formatDate(task.createdAt)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Updated:</span>
                <p>{formatDate(task.updatedAt)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Reporter:</span>
                <p>{getAssigneeName(task.reporterId)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <Badge variant={task.type === 'sprint' ? 'default' : 'secondary'}>
                  {task.type}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface DraggableTaskCardProps {
  task: Task
  project: Project | null
  onStatusChange: (taskId: string, newStatus: Task['status']) => void
  onTaskClick: (task: Task) => void
}

function DraggableTaskCard({ task, project, onStatusChange, onTaskClick }: DraggableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const getPriorityIcon = (priority: Task['priority']) => {
    return <Flag className={`w-4 h-4 ${PRIORITIES.find(p => p.value === priority)?.color}`} />
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const getAssigneeAvatar = (assigneeId?: string) => {
    if (!assigneeId) return null
    const member = TEAM_MEMBERS.find(m => m.id === assigneeId)
    return member ? (
      <Avatar className="w-6 h-6">
        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
          {member.avatar}
        </AvatarFallback>
      </Avatar>
    ) : null
  }

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className={`p-3 hover:shadow-md transition-shadow cursor-pointer ${isDragging ? 'shadow-lg' : ''}`}
      onClick={() => onTaskClick(task)}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground font-mono">
                {project?.key}-{task.taskNumber}
              </span>
              <Badge variant={task.type === 'sprint' ? 'default' : 'secondary'} className="text-xs">
                {task.type}
              </Badge>
            </div>
            <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getPriorityIcon(task.priority)}
            {task.storyPoints && (
              <Badge variant="outline" className="text-xs">
                {task.storyPoints} pts
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {formatDate(task.updatedAt)}
            </div>
            {getAssigneeAvatar(task.assigneeId)}
          </div>
        </div>
      </div>
    </Card>
  )
}

interface DroppableColumnProps {
  status: typeof TASK_STATUSES[0]
  tasks: Task[]
  project: Project | null
  onStatusChange: (taskId: string, newStatus: Task['status']) => void
  onTaskClick: (task: Task) => void
}

function DroppableColumn({ status, tasks, project, onStatusChange, onTaskClick }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status.value}`,
  })

  const totalStoryPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0)

  return (
    <Card className={`h-fit transition-colors ${isOver ? 'ring-2 ring-primary ring-opacity-50 bg-primary/5' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>{status.label}</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {tasks.length}
            </Badge>
            {totalStoryPoints > 0 && (
              <Badge variant="outline" className="text-xs">
                {totalStoryPoints} pts
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent ref={setNodeRef} className="space-y-3 min-h-[200px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <DraggableTaskCard 
              key={task.id} 
              task={task} 
              project={project}
              onStatusChange={onStatusChange}
              onTaskClick={onTaskClick}
            />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-sm">No tasks</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface TaskBoardProps {
  tasks: Task[]
  project: Project | null
  searchQuery: string
  setSearchQuery: (query: string) => void
  filterStatus: string
  setFilterStatus: (status: string) => void
  onStatusChange: (taskId: string, newStatus: Task['status']) => void
  onTaskClick: (task: Task) => void
  onDragStart: (event: DragStartEvent) => void
  onDragEnd: (event: DragEndEvent) => void
  activeTask: Task | null
}

function TaskBoard({ 
  tasks, 
  project,
  searchQuery, 
  setSearchQuery, 
  filterStatus, 
  setFilterStatus,
  onStatusChange,
  onTaskClick,
  onDragStart,
  onDragEnd,
  activeTask
}: TaskBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status)
  }

  return (
    <>
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {TASK_STATUSES.map(status => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board with Drag and Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TASK_STATUSES.map(status => (
            <div key={status.value} id={`column-${status.value}`}>
              <DroppableColumn
                status={status}
                tasks={getTasksByStatus(status.value as Task['status'])}
                project={project}
                onStatusChange={onStatusChange}
                onTaskClick={onTaskClick}
              />
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <Card className="p-3 shadow-lg opacity-90 rotate-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground font-mono">
                    {project?.key}-{activeTask.taskNumber}
                  </span>
                </div>
                <h4 className="font-medium text-sm leading-tight">{activeTask.title}</h4>
                {activeTask.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {activeTask.description}
                  </p>
                )}
              </div>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  )
}

export function TaskManagement({ user }: TaskManagementProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [currentSprint, setCurrentSprint] = useState<Sprint | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [isSprintDialogOpen, setIsSprintDialogOpen] = useState(false)
  const [isSprintDetailsOpen, setIsSprintDetailsOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [activeTab, setActiveTab] = useState('backlog')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isJiraIntegrationOpen, setIsJiraIntegrationOpen] = useState(false)
  
  const [newProject, setNewProject] = useState({
    name: '',
    key: '',
    description: ''
  })
  
  const [newSprint, setNewSprint] = useState({
    name: '',
    goal: '',
    startDate: '',
    endDate: ''
  })
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    assigneeId: '',
    storyPoints: 0,
    type: 'backlog' as 'backlog' | 'sprint'
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    // Mock data initialization
    const mockProjects: Project[] = [
      {
        id: 'proj-1',
        name: 'Station App Project',
        key: 'STA',
        description: 'Electric vehicle charging station mobile application',
        ownerId: user.id,
        teamId: 'team-1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)
      }
    ]
    
    const mockSprints: Sprint[] = [
      {
        id: 'sprint-1',
        projectId: 'proj-1',
        name: 'Sprint 17',
        goal: 'Mobile app improvements and navigation features',
        startDate: new Date(2024, 6, 8), // 8 Jul
        endDate: new Date(2024, 6, 22), // 22 Jul
        status: 'active',
        totalStoryPoints: 34,
        completedStoryPoints: 16,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
      }
    ]

    const mockTasks: Task[] = [
      // Sprint 17 tasks
      {
        id: 'task-654',
        projectId: 'proj-1',
        taskNumber: 654,
        title: 'Araç görsetleri yüklenme sorununun giderilmesi',
        description: 'Araç görsellerinin yüklenmesi sırasında yaşanan performans sorunlarının çözülmesi',
        status: 'todo',
        priority: 'medium',
        assigneeId: 'user-5',
        reporterId: user.id,
        storyPoints: 0,
        type: 'sprint',
        sprintId: 'sprint-1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
      },
      {
        id: 'task-660',
        projectId: 'proj-1',
        taskNumber: 660,
        title: 'Alternatif rota sunulması ve seçime göre rota planlaması yapılması',
        description: 'Kullanıcıya alternatif rotalar sunulması ve seçimine göre navigasyon planlaması',
        status: 'review',
        priority: 'medium',
        assigneeId: 'user-5',
        reporterId: user.id,
        storyPoints: 0,
        type: 'sprint',
        sprintId: 'sprint-1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1)
      },
      {
        id: 'task-661',
        projectId: 'proj-1',
        taskNumber: 661,
        title: 'Navigasyon sdk bağlanması',
        description: 'Navigasyon SDK entegrasyonu ve konfigürasyonu',
        status: 'todo',
        priority: 'high',
        assigneeId: 'user-3',
        reporterId: user.id,
        storyPoints: 0,
        type: 'sprint',
        sprintId: 'sprint-1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
      },
      {
        id: 'task-665',
        projectId: 'proj-1',
        taskNumber: 665,
        title: 'Onboarding ekranları tasarım güncellemesi yapılması',
        description: 'Onboarding sürecinin kullanıcı deneyimi açısından iyileştirilmesi',
        status: 'in_progress',
        priority: 'medium',
        assigneeId: 'user-1',
        reporterId: user.id,
        storyPoints: 0,
        type: 'sprint',
        sprintId: 'sprint-1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12)
      },
      {
        id: 'task-666',
        projectId: 'proj-1',
        taskNumber: 666,
        title: 'Harita marker tasarlanması',
        description: 'Harita üzerinde kullanılacak marker tasarımlarının oluşturulması',
        status: 'review',
        priority: 'low',
        assigneeId: 'user-1',
        reporterId: user.id,
        storyPoints: 0,
        type: 'sprint',
        sprintId: 'sprint-1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1)
      },
      {
        id: 'task-670',
        projectId: 'proj-1',
        taskNumber: 670,
        title: 'Hakkımızda ekranı kenar boşlukları düzenlenmesi',
        description: 'Hakkımızda sayfasının responsive tasarım iyileştirmeleri',
        status: 'review',
        priority: 'low',
        assigneeId: 'user-5',
        reporterId: user.id,
        storyPoints: 0,
        type: 'sprint',
        sprintId: 'sprint-1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1)
      },
      {
        id: 'task-671',
        projectId: 'proj-1',
        taskNumber: 671,
        title: 'Hesabım ekranı bildirim switch\'i ayarlanması',
        description: 'Kullanıcı hesap ayarlarında bildirim tercihlerinin yönetimi',
        status: 'review',
        priority: 'medium',
        assigneeId: 'user-3',
        reporterId: user.id,
        storyPoints: 0,
        type: 'sprint',
        sprintId: 'sprint-1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1)
      },
      {
        id: 'task-672',
        projectId: 'proj-1',
        taskNumber: 672,
        title: 'Navbarın metinli hale getirilmesi',
        description: 'Navigation bar\'ın metin tabanlı tasarıma dönüştürülmesi',
        status: 'review',
        priority: 'low',
        assigneeId: 'user-3',
        reporterId: user.id,
        storyPoints: 0,
        type: 'sprint',
        sprintId: 'sprint-1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1)
      },
      {
        id: 'task-679',
        projectId: 'proj-1',
        taskNumber: 679,
        title: 'Dark mod geliştirilmesinin yapılması',
        description: 'Uygulamaya dark mode desteğinin eklenmesi',
        status: 'review',
        priority: 'medium',
        assigneeId: 'user-3',
        reporterId: user.id,
        storyPoints: 0,
        type: 'sprint',
        sprintId: 'sprint-1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1)
      },
      {
        id: 'task-674',
        projectId: 'proj-1',
        taskNumber: 674,
        title: 'Çevrimdışı istasyon listesi indirme geliştirilmesinin yapılması',
        description: 'Offline kullanım için istasyon verilerinin yerel depolanması',
        status: 'in_progress',
        priority: 'high',
        assigneeId: 'user-3',
        reporterId: user.id,
        storyPoints: 0,
        type: 'sprint',
        sprintId: 'sprint-1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1)
      },
      {
        id: 'task-675',
        projectId: 'proj-1',
        taskNumber: 675,
        title: 'FE - Hoşgeldin ekranı tasarımının yenilenmesi',
        description: 'Frontend hoşgeldin ekranının yeni tasarıma uyarlanması',
        status: 'review',
        priority: 'medium',
        assigneeId: 'user-5',
        reporterId: user.id,
        storyPoints: 0,
        type: 'sprint',
        sprintId: 'sprint-1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1)
      },
      {
        id: 'task-676',
        projectId: 'proj-1',
        taskNumber: 676,
        title: 'Akıllı rota planlama ekranının geliştirilmesi',
        description: 'AI destekli rota optimizasyonu özelliğinin geliştirilmesi',
        status: 'todo',
        priority: 'high',
        assigneeId: 'user-3',
        reporterId: user.id,
        storyPoints: 0,
        type: 'sprint',
        sprintId: 'sprint-1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1)
      },
      {
        id: 'task-677',
        projectId: 'proj-1',
        taskNumber: 677,
        title: 'Apple carplay\'de istasyon uygulaması olması için araştırma yapılması',
        description: 'CarPlay entegrasyonu için teknik araştırma ve fizibilite çalışması',
        status: 'todo',
        priority: 'low',
        assigneeId: 'user-3',
        reporterId: user.id,
        storyPoints: 0,
        type: 'sprint',
        sprintId: 'sprint-1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1)
      },
      {
        id: 'task-678',
        projectId: 'proj-1',
        taskNumber: 678,
        title: 'Android Auto\'da istasyon uygulaması olması için araştırma yapılması',
        description: 'Android Auto entegrasyonu için teknik araştırma ve geliştirme planı',
        status: 'done',
        priority: 'low',
        assigneeId: 'user-5',
        reporterId: user.id,
        storyPoints: 0,
        type: 'sprint',
        sprintId: 'sprint-1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1)
      },
      // Backlog tasks
      {
        id: 'task-489',
        projectId: 'proj-1',
        taskNumber: 489,
        title: 'BE- Düzenlenen araç görsellerinin database\'de güncellenmesi',
        description: 'Backend araç görseli güncelleme işlemlerinin database entegrasyonu',
        status: 'todo',
        priority: 'medium',
        reporterId: user.id,
        storyPoints: 0,
        type: 'backlog',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
      },
      {
        id: 'task-225',
        projectId: 'proj-1',
        taskNumber: 225,
        title: 'BE- BiometricAuthentication Servisinin Geliştirilmesi',
        description: 'Biyometrik kimlik doğrulama servisinin backend implementasyonu',
        status: 'todo',
        priority: 'high',
        assigneeId: 'user-6',
        reporterId: user.id,
        storyPoints: 0,
        type: 'backlog',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1)
      }
    ]
    
    setProjects(mockProjects)
    setCurrentProject(mockProjects[0])
    setSprints(mockSprints)
    setCurrentSprint(mockSprints[0])
    setTasks(mockTasks)
  }, [user.id])

  const getFilteredTasks = () => {
    if (!currentProject) return []
    
    let filtered = tasks.filter(task => {
      const matchesProject = task.projectId === currentProject.id
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus
      return matchesProject && matchesSearch && matchesStatus
    })

    if (activeTab === 'backlog') {
      filtered = filtered.filter(task => task.type === 'backlog')
    } else if (activeTab === 'sprint') {
      filtered = filtered.filter(task => task.type === 'sprint' && task.sprintId === currentSprint?.id)
    }

    return filtered
  }

  const handleCreateProject = () => {
    if (!newProject.name.trim() || !newProject.key.trim()) {
      toast.error('Project name and key are required')
      return
    }

    const project: Project = {
      id: `proj-${Date.now()}`,
      name: newProject.name,
      key: newProject.key.toUpperCase(),
      description: newProject.description || undefined,
      ownerId: user.id,
      teamId: 'team-1',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setProjects(prev => [project, ...prev])
    setCurrentProject(project)
    setNewProject({ name: '', key: '', description: '' })
    setIsProjectDialogOpen(false)
    toast.success('Project created successfully')
  }

  const handleCreateSprint = () => {
    if (!currentProject || !newSprint.name.trim() || !newSprint.startDate || !newSprint.endDate) {
      toast.error('Sprint name, start date, and end date are required')
      return
    }

    const sprint: Sprint = {
      id: `sprint-${Date.now()}`,
      projectId: currentProject.id,
      name: newSprint.name,
      goal: newSprint.goal || undefined,
      startDate: new Date(newSprint.startDate),
      endDate: new Date(newSprint.endDate),
      status: 'planned',
      totalStoryPoints: 0,
      completedStoryPoints: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setSprints(prev => [sprint, ...prev])
    setNewSprint({ name: '', goal: '', startDate: '', endDate: '' })
    setIsSprintDialogOpen(false)
    toast.success('Sprint created successfully')
  }

  const handleCreateTask = () => {
    if (!currentProject || !newTask.title.trim()) {
      toast.error('Task title is required')
      return
    }

    const nextTaskNumber = Math.max(...tasks.filter(t => t.projectId === currentProject.id).map(t => t.taskNumber), 0) + 1

    const task: Task = {
      id: `task-${Date.now()}`,
      projectId: currentProject.id,
      taskNumber: nextTaskNumber,
      title: newTask.title,
      description: newTask.description || undefined,
      status: 'todo',
      priority: newTask.priority,
      assigneeId: newTask.assigneeId || undefined,
      reporterId: user.id,
      storyPoints: newTask.storyPoints || undefined,
      type: newTask.type,
      sprintId: newTask.type === 'sprint' ? currentSprint?.id : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setTasks(prev => [task, ...prev])
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      assigneeId: '',
      storyPoints: 0,
      type: 'backlog'
    })
    setIsCreateDialogOpen(false)
    toast.success('Task created successfully')
  }

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus, updatedAt: new Date() }
        : task
    ))
    toast.success('Task status updated')
  }

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, ...updates, updatedAt: new Date() }
        : task
    ))
  }

  const handleTasksImported = (importedTasks: Task[]) => {
    setTasks(prev => [...importedTasks, ...prev])
    toast.success(`${importedTasks.length} task successfully imported from Jira!`)
  }

  const handleStartSprint = () => {
    if (!currentSprint) return
    
    setSprints(prev => prev.map(sprint => 
      sprint.id === currentSprint.id 
        ? { ...sprint, status: 'active', updatedAt: new Date() }
        : sprint
    ))
    setCurrentSprint(prev => prev ? { ...prev, status: 'active' } : null)
    toast.success('Sprint started successfully')
  }

  const handleEndSprint = () => {
    if (!currentSprint) return
    
    setSprints(prev => prev.map(sprint => 
      sprint.id === currentSprint.id 
        ? { ...sprint, status: 'completed', updatedAt: new Date() }
        : sprint
    ))
    setCurrentSprint(prev => prev ? { ...prev, status: 'completed' } : null)
    toast.success('Sprint completed successfully')
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeTask = tasks.find(task => task.id === active.id)
    if (!activeTask) return

    const overId = over.id.toString()
    let newStatus: Task['status'] | null = null

    if (overId.startsWith('column-')) {
      const statusValue = overId.replace('column-', '')
      const statusExists = TASK_STATUSES.find(s => s.value === statusValue)
      if (statusExists) {
        newStatus = statusValue as Task['status']
      }
    } else {
      const overTask = tasks.find(task => task.id === over.id)
      if (overTask) {
        newStatus = overTask.status
      }
    }

    if (newStatus && activeTask.status !== newStatus) {
      handleStatusChange(activeTask.id, newStatus)
    }
  }

  const getTasksByStatus = (status: Task['status']) => {
    return getFilteredTasks().filter(task => task.status === status)
  }

  const activeTask = activeId ? tasks.find(task => task.id === activeId) : null

  const getSprintAnalytics = () => {
    if (!currentSprint) return null
    
    const sprintTasks = tasks.filter(t => t.sprintId === currentSprint.id)
    const completedTasks = sprintTasks.filter(t => t.status === 'done')
    const totalStoryPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
    const completedStoryPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
    
    return {
      totalTasks: sprintTasks.length,
      completedTasks: completedTasks.length,
      totalStoryPoints,
      completedStoryPoints,
      completionRate: sprintTasks.length > 0 ? (completedTasks.length / sprintTasks.length) * 100 : 0,
      storyPointsRate: totalStoryPoints > 0 ? (completedStoryPoints / totalStoryPoints) * 100 : 0
    }
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FolderPlus className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
          <p className="text-muted-foreground mb-4">Create a project to start managing tasks</p>
          <Button onClick={() => setIsProjectDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Task Management</h1>
            <Select value={currentProject.id} onValueChange={(projectId) => {
              const project = projects.find(p => p.id === projectId)
              setCurrentProject(project || null)
            }}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{project.key}</Badge>
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-muted-foreground">
            Organize and track your team's work in {currentProject.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsJiraIntegrationOpen(true)}>
            <LinkIcon className="w-4 h-4 mr-2" />
            Import from Jira
          </Button>
          <Button variant="outline" onClick={() => setIsProjectDialogOpen(true)}>
            <FolderPlus className="w-4 h-4 mr-2" />
            New Project
          </Button>
          <Button variant="outline" onClick={() => setIsSprintDialogOpen(true)}>
            <Timer className="w-4 h-4 mr-2" />
            New Sprint
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Sprint Management */}
      {currentSprint && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  {currentSprint.name}
                  <Badge variant={
                    currentSprint.status === 'active' ? 'default' : 
                    currentSprint.status === 'completed' ? 'secondary' : 'outline'
                  }>
                    {currentSprint.status}
                  </Badge>
                </CardTitle>
                <CardDescription>{currentSprint.goal}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsSprintDetailsOpen(true)}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
                {currentSprint.status === 'planned' && (
                  <Button size="sm" onClick={handleStartSprint}>
                    <Play className="w-4 h-4 mr-2" />
                    Start Sprint
                  </Button>
                )}
                {currentSprint.status === 'active' && (
                  <Button size="sm" variant="destructive" onClick={handleEndSprint}>
                    <Square className="w-4 h-4 mr-2" />
                    End Sprint
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="backlog">Backlog</TabsTrigger>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="backlog" className="space-y-4">
          <BacklogView
            user={user}
            project={currentProject}
            tasks={tasks.filter(t => t.projectId === currentProject.id)}
            sprints={sprints.filter(s => s.projectId === currentProject.id)}
            onTaskUpdate={handleTaskUpdate}
            onTaskClick={setSelectedTask}
            onCreateSprint={() => setIsSprintDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="board" className="space-y-4">
          <TaskBoard 
            tasks={getFilteredTasks()}
            project={currentProject}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onStatusChange={handleStatusChange}
            onTaskClick={setSelectedTask}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            activeTask={activeTask}
          />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <TaskBoard 
            tasks={getFilteredTasks()}
            project={currentProject}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onStatusChange={handleStatusChange}
            onTaskClick={setSelectedTask}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            activeTask={activeTask}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TaskDetailDialog
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleTaskUpdate}
        project={currentProject}
      />

      {/* Create Project Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Set up a new project to organize your team's work
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                placeholder="Enter project name..."
                value={newProject.name}
                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="projectKey">Project Key *</Label>
              <Input
                id="projectKey"
                placeholder="e.g., TCP, PROJ"
                value={newProject.key}
                onChange={(e) => setNewProject(prev => ({ ...prev, key: e.target.value.toUpperCase() }))}
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used for task numbering (e.g., {newProject.key || 'KEY'}-123)
              </p>
            </div>
            <div>
              <Label htmlFor="projectDescription">Description</Label>
              <Textarea
                id="projectDescription"
                placeholder="Enter project description..."
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsProjectDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject}>
                Create Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Sprint Dialog */}
      <Dialog open={isSprintDialogOpen} onOpenChange={setIsSprintDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Sprint</DialogTitle>
            <DialogDescription>
              Plan a new sprint for {currentProject.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sprintName">Sprint Name *</Label>
              <Input
                id="sprintName"
                placeholder="e.g., Sprint 1 - Core Features"
                value={newSprint.name}
                onChange={(e) => setNewSprint(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="sprintGoal">Sprint Goal</Label>
              <Textarea
                id="sprintGoal"
                placeholder="What do you want to achieve in this sprint?"
                value={newSprint.goal}
                onChange={(e) => setNewSprint(prev => ({ ...prev, goal: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newSprint.startDate}
                  onChange={(e) => setNewSprint(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newSprint.endDate}
                  onChange={(e) => setNewSprint(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSprintDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSprint}>
                Create Sprint
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to {currentProject.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter task title..."
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter task description..."
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newTask.priority} onValueChange={(value: Task['priority']) => 
                  setNewTask(prev => ({ ...prev, priority: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <Flag className={`w-4 h-4 mr-2 ${priority.color}`} />
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assignee">Assignee</Label>
                <Select value={newTask.assigneeId || 'unassigned'} onValueChange={(value) => 
                  setNewTask(prev => ({ ...prev, assigneeId: value === 'unassigned' ? '' : value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {TEAM_MEMBERS.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-xs">{member.avatar}</AvatarFallback>
                          </Avatar>
                          {member.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storyPoints">Story Points</Label>
                <Input
                  id="storyPoints"
                  type="number"
                  min="0"
                  max="100"
                  value={newTask.storyPoints}
                  onChange={(e) => setNewTask(prev => ({ 
                    ...prev, 
                    storyPoints: parseInt(e.target.value) || 0 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={newTask.type} onValueChange={(value: 'backlog' | 'sprint') => 
                  setNewTask(prev => ({ ...prev, type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="sprint">Sprint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask}>
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sprint Analytics Dialog */}
      <Dialog open={isSprintDetailsOpen} onOpenChange={setIsSprintDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Sprint Analytics</DialogTitle>
            <DialogDescription>
              {currentSprint?.name} - Performance Overview
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const analytics = getSprintAnalytics()
            if (!analytics) return null
            
            return (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Task Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.completedTasks}/{analytics.totalTasks}</div>
                      <p className="text-xs text-muted-foreground">
                        {analytics.completionRate.toFixed(1)}% completed
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Story Points</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.completedStoryPoints}/{analytics.totalStoryPoints}</div>
                      <p className="text-xs text-muted-foreground">
                        {analytics.storyPointsRate.toFixed(1)}% completed
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Task Breakdown by Status</h4>
                  <div className="space-y-2">
                    {TASK_STATUSES.map(status => {
                      const statusTasks = tasks.filter(t => 
                        t.sprintId === currentSprint?.id && t.status === status.value
                      )
                      const statusPoints = statusTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
                      
                      return (
                        <div key={status.value} className="flex items-center justify-between p-2 rounded border">
                          <div className="flex items-center gap-2">
                            <Badge className={status.color}>{status.label}</Badge>
                            <span className="text-sm">{statusTasks.length} tasks</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {statusPoints} story points
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Team Performance</h4>
                  <div className="space-y-2">
                    {TEAM_MEMBERS.map(member => {
                      const memberTasks = tasks.filter(t => 
                        t.sprintId === currentSprint?.id && t.assigneeId === member.id
                      )
                      const completedTasks = memberTasks.filter(t => t.status === 'done')
                      const memberPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
                      
                      if (memberTasks.length === 0) return null
                      
                      return (
                        <div key={member.id} className="flex items-center justify-between p-2 rounded border">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">{member.avatar}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{member.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {completedTasks.length}/{memberTasks.length} tasks • {memberPoints} pts
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Jira Integration Dialog */}
      <JiraIntegration
        user={user}
        project={currentProject}
        isOpen={isJiraIntegrationOpen}
        onClose={() => setIsJiraIntegrationOpen(false)}
        onTasksImported={handleTasksImported}
      />
    </div>
  )
}