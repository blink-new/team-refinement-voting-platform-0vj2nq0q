import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Checkbox } from './ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  ExternalLink, 
  Download, 
  Settings, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Filter,
  Search,
  Calendar,
  User,
  Flag,
  Link as LinkIcon,
  Import,
  Database,
  Zap
} from 'lucide-react'
import { User as UserType, Task, Project } from '../types'
import { toast } from 'sonner'

interface JiraIntegrationProps {
  user: UserType
  project: Project
  isOpen: boolean
  onClose: () => void
  onTasksImported: (tasks: Task[]) => void
}

interface JiraConfig {
  serverUrl: string
  email: string
  apiToken: string
  projectKey: string
}

interface JiraIssue {
  id: string
  key: string
  summary: string
  description?: string
  status: {
    name: string
    statusCategory: {
      key: string
    }
  }
  priority: {
    name: string
  }
  assignee?: {
    displayName: string
    emailAddress: string
  }
  reporter: {
    displayName: string
    emailAddress: string
  }
  storyPoints?: number
  issueType: {
    name: string
  }
  created: string
  updated: string
}

const JIRA_STATUS_MAPPING: Record<string, Task['status']> = {
  'To Do': 'todo',
  'In Progress': 'in_progress',
  'In Review': 'review',
  'Done': 'done',
  'Backlog': 'todo',
  'Selected for Development': 'todo',
  'Code Review': 'review',
  'Testing': 'review',
  'Closed': 'done',
  'Resolved': 'done'
}

const JIRA_PRIORITY_MAPPING: Record<string, Task['priority']> = {
  'Lowest': 'low',
  'Low': 'low',
  'Medium': 'medium',
  'High': 'high',
  'Highest': 'urgent',
  'Critical': 'urgent',
  'Blocker': 'urgent'
}

export function JiraIntegration({ user, project, isOpen, onClose, onTasksImported }: JiraIntegrationProps) {
  const [activeTab, setActiveTab] = useState('config')
  const [config, setConfig] = useState<JiraConfig>({
    serverUrl: '',
    email: '',
    apiToken: '',
    projectKey: ''
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [jiraIssues, setJiraIssues] = useState<JiraIssue[]>([])
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set())
  const [isImporting, setIsImporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  // Mock Jira issues for demonstration
  const mockJiraIssues: JiraIssue[] = [
    {
      id: 'jira-1',
      key: 'STA-680',
      summary: 'Kullanıcı profil sayfası tasarımının güncellenmesi',
      description: 'Kullanıcı profil sayfasının yeni tasarım sistemine uygun olarak güncellenmesi gerekiyor.',
      status: {
        name: 'To Do',
        statusCategory: { key: 'new' }
      },
      priority: { name: 'Medium' },
      assignee: {
        displayName: 'Ahmet Yılmaz',
        emailAddress: 'ahmet@company.com'
      },
      reporter: {
        displayName: 'Ayşe Kaya',
        emailAddress: 'ayse@company.com'
      },
      storyPoints: 5,
      issueType: { name: 'Story' },
      created: '2024-01-15T10:30:00.000Z',
      updated: '2024-01-16T14:20:00.000Z'
    },
    {
      id: 'jira-2',
      key: 'STA-681',
      summary: 'API rate limiting implementasyonu',
      description: 'Backend API\'lerde rate limiting mekanizmasının eklenmesi.',
      status: {
        name: 'In Progress',
        statusCategory: { key: 'indeterminate' }
      },
      priority: { name: 'High' },
      assignee: {
        displayName: 'Mehmet Demir',
        emailAddress: 'mehmet@company.com'
      },
      reporter: {
        displayName: 'Fatma Özkan',
        emailAddress: 'fatma@company.com'
      },
      storyPoints: 8,
      issueType: { name: 'Task' },
      created: '2024-01-14T09:15:00.000Z',
      updated: '2024-01-17T11:45:00.000Z'
    },
    {
      id: 'jira-3',
      key: 'STA-682',
      summary: 'Mobile app push notification sistemi',
      description: 'Mobil uygulamaya push notification desteğinin eklenmesi.',
      status: {
        name: 'Code Review',
        statusCategory: { key: 'indeterminate' }
      },
      priority: { name: 'High' },
      assignee: {
        displayName: 'Zeynep Aktaş',
        emailAddress: 'zeynep@company.com'
      },
      reporter: {
        displayName: 'Can Yıldız',
        emailAddress: 'can@company.com'
      },
      storyPoints: 13,
      issueType: { name: 'Epic' },
      created: '2024-01-12T16:00:00.000Z',
      updated: '2024-01-17T09:30:00.000Z'
    },
    {
      id: 'jira-4',
      key: 'STA-683',
      summary: 'Database performans optimizasyonu',
      description: 'Veritabanı sorgularının optimize edilmesi ve indexlerin gözden geçirilmesi.',
      status: {
        name: 'Done',
        statusCategory: { key: 'done' }
      },
      priority: { name: 'Critical' },
      assignee: {
        displayName: 'Ali Kara',
        emailAddress: 'ali@company.com'
      },
      reporter: {
        displayName: 'Selin Güneş',
        emailAddress: 'selin@company.com'
      },
      storyPoints: 21,
      issueType: { name: 'Bug' },
      created: '2024-01-10T08:45:00.000Z',
      updated: '2024-01-16T17:20:00.000Z'
    },
    {
      id: 'jira-5',
      key: 'STA-684',
      summary: 'Unit test coverage artırılması',
      description: 'Mevcut kod tabanının unit test coverage\'ının %80\'e çıkarılması.',
      status: {
        name: 'Backlog',
        statusCategory: { key: 'new' }
      },
      priority: { name: 'Low' },
      reporter: {
        displayName: 'Emre Şahin',
        emailAddress: 'emre@company.com'
      },
      storyPoints: 3,
      issueType: { name: 'Improvement' },
      created: '2024-01-08T13:20:00.000Z',
      updated: '2024-01-08T13:20:00.000Z'
    }
  ]

  const handleConnect = async () => {
    if (!config.serverUrl || !config.email || !config.apiToken || !config.projectKey) {
      toast.error('Lütfen tüm alanları doldurun')
      return
    }

    setIsConnecting(true)
    
    try {
      // Simulate API connection
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In real implementation, this would make actual Jira API calls
      // const response = await fetch(`${config.serverUrl}/rest/api/3/search?jql=project=${config.projectKey}`, {
      //   headers: {
      //     'Authorization': `Basic ${btoa(`${config.email}:${config.apiToken}`)}`,
      //     'Accept': 'application/json'
      //   }
      // })
      
      setJiraIssues(mockJiraIssues)
      setIsConnected(true)
      setActiveTab('import')
      toast.success('Jira bağlantısı başarılı!')
    } catch (error) {
      toast.error('Jira bağlantısı başarısız. Lütfen bilgilerinizi kontrol edin.')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleRefresh = async () => {
    setIsConnecting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Refresh issues from Jira
      setJiraIssues(mockJiraIssues)
      toast.success('Issues refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh issues')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSelectAll = () => {
    const filteredIssues = getFilteredIssues()
    if (selectedIssues.size === filteredIssues.length) {
      setSelectedIssues(new Set())
    } else {
      setSelectedIssues(new Set(filteredIssues.map(issue => issue.id)))
    }
  }

  const handleSelectIssue = (issueId: string) => {
    const newSelected = new Set(selectedIssues)
    if (newSelected.has(issueId)) {
      newSelected.delete(issueId)
    } else {
      newSelected.add(issueId)
    }
    setSelectedIssues(newSelected)
  }

  const getFilteredIssues = () => {
    return jiraIssues.filter(issue => {
      const matchesSearch = issue.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           issue.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           issue.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || issue.status.name === statusFilter
      const matchesPriority = priorityFilter === 'all' || issue.priority.name === priorityFilter
      
      return matchesSearch && matchesStatus && matchesPriority
    })
  }

  const convertJiraIssueToTask = (jiraIssue: JiraIssue, taskNumber: number): Task => {
    return {
      id: `imported-${jiraIssue.id}`,
      projectId: project.id,
      taskNumber,
      title: jiraIssue.summary,
      description: jiraIssue.description,
      status: JIRA_STATUS_MAPPING[jiraIssue.status.name] || 'todo',
      priority: JIRA_PRIORITY_MAPPING[jiraIssue.priority.name] || 'medium',
      assigneeId: undefined, // Would need to map Jira users to local users
      reporterId: user.id,
      storyPoints: jiraIssue.storyPoints,
      type: 'backlog',
      createdAt: new Date(jiraIssue.created),
      updatedAt: new Date(jiraIssue.updated)
    }
  }

  const handleImport = async () => {
    if (selectedIssues.size === 0) {
      toast.error('Lütfen import edilecek issue\'ları seçin')
      return
    }

    setIsImporting(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const selectedJiraIssues = jiraIssues.filter(issue => selectedIssues.has(issue.id))
      const importedTasks = selectedJiraIssues.map((issue, index) => 
        convertJiraIssueToTask(issue, 1000 + index) // Start from task number 1000
      )
      
      onTasksImported(importedTasks)
      toast.success(`${selectedIssues.size} task başarıyla import edildi!`)
      onClose()
    } catch (error) {
      toast.error('Import işlemi başarısız')
    } finally {
      setIsImporting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
      case 'Highest':
        return 'text-red-600 bg-red-50'
      case 'High':
        return 'text-orange-600 bg-orange-50'
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'Low':
      case 'Lowest':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done':
      case 'Resolved':
      case 'Closed':
        return 'text-green-600 bg-green-50'
      case 'In Progress':
      case 'Code Review':
      case 'Testing':
        return 'text-blue-600 bg-blue-50'
      case 'To Do':
      case 'Backlog':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-yellow-600 bg-yellow-50'
    }
  }

  const uniqueStatuses = [...new Set(jiraIssues.map(issue => issue.status.name))]
  const uniquePriorities = [...new Set(jiraIssues.map(issue => issue.priority.name))]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Jira Integration
          </DialogTitle>
          <DialogDescription>
            Import tasks from your Jira project to {project.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="import" disabled={!isConnected} className="flex items-center gap-2">
              <Import className="w-4 h-4" />
              Import Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Jira Connection Settings</CardTitle>
                <CardDescription>
                  Configure your Jira server connection to import issues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="serverUrl">Jira Server URL *</Label>
                  <Input
                    id="serverUrl"
                    placeholder="https://yourcompany.atlassian.net"
                    value={config.serverUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, serverUrl: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your Jira Cloud or Server URL
                  </p>
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your-email@company.com"
                    value={config.email}
                    onChange={(e) => setConfig(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="apiToken">API Token *</Label>
                  <Input
                    id="apiToken"
                    type="password"
                    placeholder="Your Jira API token"
                    value={config.apiToken}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiToken: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    <a 
                      href="https://id.atlassian.com/manage-profile/security/api-tokens" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Create API Token <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                </div>

                <div>
                  <Label htmlFor="projectKey">Jira Project Key *</Label>
                  <Input
                    id="projectKey"
                    placeholder="e.g., STA, PROJ"
                    value={config.projectKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, projectKey: e.target.value.toUpperCase() }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The project key from your Jira project
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleConnect} disabled={isConnecting}>
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        Connect to Jira
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {isConnected && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    Connection Successful
                  </CardTitle>
                  <CardDescription>
                    Connected to {config.serverUrl} • Project: {config.projectKey}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Found {jiraIssues.length} issues in the project. You can now switch to the Import tab to select and import tasks.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {uniqueStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {uniquePriorities.map(priority => (
                    <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isConnecting}>
                <RefreshCw className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Selection Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIssues.size === getFilteredIssues().length && getFilteredIssues().length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm">
                  Select All ({selectedIssues.size} of {getFilteredIssues().length} selected)
                </span>
              </div>
              
              <Button 
                onClick={handleImport} 
                disabled={selectedIssues.size === 0 || isImporting}
                className="flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Import Selected ({selectedIssues.size})
                  </>
                )}
              </Button>
            </div>

            {/* Issues List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getFilteredIssues().map(issue => (
                <Card key={issue.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIssues.has(issue.id)}
                      onCheckedChange={() => handleSelectIssue(issue.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs font-mono">
                              {issue.key}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {issue.issueType.name}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(issue.status.name)}`}>
                              {issue.status.name}
                            </Badge>
                            <Badge className={`text-xs ${getPriorityColor(issue.priority.name)}`}>
                              <Flag className="w-3 h-3 mr-1" />
                              {issue.priority.name}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-sm">{issue.summary}</h4>
                          {issue.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {issue.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right text-xs text-muted-foreground">
                          {issue.storyPoints && (
                            <div className="mb-1">
                              <Badge variant="outline" className="text-xs">
                                {issue.storyPoints} pts
                              </Badge>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(issue.updated)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>Reporter: {issue.reporter.displayName}</span>
                          </div>
                          {issue.assignee && (
                            <div className="flex items-center gap-1">
                              <Avatar className="w-4 h-4">
                                <AvatarFallback className="text-xs">
                                  {issue.assignee.displayName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span>Assignee: {issue.assignee.displayName}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-muted-foreground">
                          Created: {formatDate(issue.created)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              
              {getFilteredIssues().length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>No issues found matching your filters</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}