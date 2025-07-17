import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Users, Hash } from 'lucide-react'

interface RoomJoinProps {
  onJoinRoom: (roomCode: string, userName: string) => void
  onCreateRoom: (roomName: string, managerName: string) => void
}

export function RoomJoin({ onJoinRoom, onCreateRoom }: RoomJoinProps) {
  const [roomCode, setRoomCode] = useState('')
  const [userName, setUserName] = useState('')
  const [roomName, setRoomName] = useState('')
  const [managerName, setManagerName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomCode.trim() && userName.trim()) {
      onJoinRoom(roomCode.trim().toUpperCase(), userName.trim())
    }
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomName.trim() && managerName.trim()) {
      onCreateRoom(roomName.trim(), managerName.trim())
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Team Refinement
          </h1>
          <p className="text-gray-600">
            Story point estimation made simple
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={!isCreating ? 'default' : 'outline'}
              onClick={() => setIsCreating(false)}
              className="flex-1"
            >
              <Users className="w-4 h-4 mr-2" />
              Join Room
            </Button>
            <Button
              variant={isCreating ? 'default' : 'outline'}
              onClick={() => setIsCreating(true)}
              className="flex-1"
            >
              <Hash className="w-4 h-4 mr-2" />
              Create Room
            </Button>
          </div>

          {!isCreating ? (
            <Card>
              <CardHeader>
                <CardTitle>Join Existing Room</CardTitle>
                <CardDescription>
                  Enter the room code and your name to join
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomCode">Room Code</Label>
                    <Input
                      id="roomCode"
                      placeholder="Enter room code"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className="text-center text-lg font-mono tracking-wider"
                      maxLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userName">Your Name</Label>
                    <Input
                      id="userName"
                      placeholder="Enter your name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={!roomCode.trim() || !userName.trim()}
                  >
                    Join Room
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Create New Room</CardTitle>
                <CardDescription>
                  Start a new refinement session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomName">Room Name</Label>
                    <Input
                      id="roomName"
                      placeholder="e.g., Sprint 24 Planning"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="managerName">Your Name (Manager)</Label>
                    <Input
                      id="managerName"
                      placeholder="Enter your name"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={!roomName.trim() || !managerName.trim()}
                  >
                    Create Room
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}