import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Separator } from './ui/separator'
import { Badge } from './ui/badge'
import { 
  LayoutDashboard, 
  CheckSquare, 
  BarChart3, 
  MessageSquare, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react'
import { User } from '../types'
import { ActiveModule } from '../App'
import { blink } from '../blink/client'

interface SidebarProps {
  user: User
  activeModule: ActiveModule
  onModuleChange: (module: ActiveModule) => void
  isOpen: boolean
  onToggle: () => void
}

const navigationItems = [
  {
    id: 'dashboard' as ActiveModule,
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview and analytics'
  },
  {
    id: 'tasks' as ActiveModule,
    label: 'Tasks',
    icon: CheckSquare,
    description: 'Task management'
  },
  {
    id: 'refinement' as ActiveModule,
    label: 'Refinement',
    icon: BarChart3,
    description: 'Story point voting'
  },
  {
    id: 'retrospective' as ActiveModule,
    label: 'Retrospective',
    icon: MessageSquare,
    description: 'Team retrospectives'
  }
]

export function Sidebar({ user, activeModule, onModuleChange, isOpen, onToggle }: SidebarProps) {
  const handleSignOut = () => {
    blink.auth.logout()
  }

  return (
    <div className={`fixed left-0 top-0 h-full bg-white border-r border-border transition-all duration-300 z-50 ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {isOpen && (
              <div>
                <h1 className="text-xl font-bold text-primary">Pviser</h1>
                <p className="text-xs text-muted-foreground">Team Platform</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="ml-auto"
            >
              {isOpen ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <Badge variant="secondary" className="text-xs mt-1">
                  {user.role}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = activeModule === item.id
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  className={`w-full justify-start gap-3 ${
                    !isOpen ? 'px-2' : ''
                  }`}
                  onClick={() => onModuleChange(item.id)}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && (
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  )}
                </Button>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="space-y-2">
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 ${
                !isOpen ? 'px-2' : ''
              }`}
              onClick={() => onModuleChange('profile')}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span>Settings</span>}
            </Button>
            
            <Separator />
            
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 text-destructive hover:text-destructive ${
                !isOpen ? 'px-2' : ''
              }`}
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span>Sign Out</span>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}