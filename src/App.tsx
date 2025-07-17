import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { AuthScreen } from './components/AuthScreen'
import { Dashboard } from './components/Dashboard'
import { TaskManagement } from './components/TaskManagement'
import { RefinementVoting } from './components/RefinementVoting'
import { Retrospective } from './components/Retrospective'
import { ProfileSettings } from './components/ProfileSettings'
import { Sidebar } from './components/Sidebar'
import { Toaster } from './components/ui/sonner'
import { User } from './types'

export type ActiveModule = 'dashboard' | 'tasks' | 'refinement' | 'retrospective' | 'profile'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Auth state management
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      if (state.user) {
        const userData: User = {
          id: state.user.id,
          email: state.user.email || '',
          displayName: state.user.displayName || state.user.email?.split('@')[0] || 'User',
          avatarUrl: state.user.avatarUrl || null,
          role: 'member',
          createdAt: new Date(),
          updatedAt: new Date()
        }
        setUser(userData)
      } else {
        setUser(null)
      }
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const renderActiveModule = () => {
    if (!user) return null

    switch (activeModule) {
      case 'dashboard':
        return <Dashboard user={user} onModuleChange={setActiveModule} />
      case 'tasks':
        return <TaskManagement user={user} />
      case 'refinement':
        return <RefinementVoting user={user} />
      case 'retrospective':
        return <Retrospective user={user} />
      case 'profile':
        return <ProfileSettings user={user} />
      default:
        return <Dashboard user={user} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar
          user={user}
          activeModule={activeModule}
          onModuleChange={setActiveModule}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-16'
        }`}>
          <div className="p-6">
            {renderActiveModule()}
          </div>
        </main>
      </div>
      
      <Toaster />
    </div>
  )
}

export default App