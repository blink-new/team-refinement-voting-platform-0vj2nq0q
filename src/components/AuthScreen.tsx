import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Users, BarChart3, MessageSquare, Target } from 'lucide-react'
import { blink } from '../blink/client'

export function AuthScreen() {
  const handleSignIn = () => {
    blink.auth.login()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pviser
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Team Collaboration Platform
          </p>
          <p className="text-gray-500">
            Streamline your team's workflow with integrated task management, refinement voting, and retrospectives
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <Target className="w-8 h-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Task Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Organize and track your team's work with intuitive Kanban boards
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="w-8 h-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Story Point Voting</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Conduct efficient refinement sessions with real-time voting
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Retrospectives</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Facilitate team retrospectives and continuous improvement
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Work together seamlessly with real-time updates and notifications
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Sign in to access your team workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={handleSignIn}
              size="lg"
              className="w-full"
            >
              Sign In to Continue
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              Secure authentication powered by Blink
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}