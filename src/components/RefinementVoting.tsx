import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Avatar, AvatarFallback } from './ui/avatar'
import { VotingCard } from './VotingCard'
import { 
  Plus, 
  Users, 
  Play, 
  Square, 
  Copy, 
  CheckCircle,
  Clock,
  BarChart3,
  Hash,
  Eye
} from 'lucide-react'
import { User, VotingRoom, RoomParticipant, Vote, VoteValue } from '../types'
import { toast } from 'sonner'
import { blink } from '../blink/client'

interface RefinementVotingProps {
  user: User
}

const VOTE_VALUES: VoteValue[] = ['1', '2', '3', '5', '8', '13', '21', '?', '☕']

export function RefinementVoting({ user }: RefinementVotingProps) {
  const [rooms, setRooms] = useState<VotingRoom[]>([])
  const [currentRoom, setCurrentRoom] = useState<VotingRoom | null>(null)
  const [currentUser, setCurrentUser] = useState<RoomParticipant | null>(null)
  const [participants, setParticipants] = useState<RoomParticipant[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [newRoom, setNewRoom] = useState({ name: '' })
  const [joinData, setJoinData] = useState({ roomCode: '' })
  const [storyTitle, setStoryTitle] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load rooms from localStorage and realtime
  const loadRooms = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load from localStorage
      const storedRooms = JSON.parse(localStorage.getItem('votingRooms') || '[]')
      setRooms(storedRooms)
      
      // Subscribe to realtime updates for voting rooms
      const channel = blink.realtime.channel('voting-rooms')
      await channel.subscribe({
        userId: user.id,
        metadata: { displayName: user.displayName }
      })
      
      // Listen for room updates
      channel.onMessage((message) => {
        if (message.type === 'room_created') {
          const newRoom = message.data as VotingRoom
          setRooms(prev => {
            const updated = [newRoom, ...prev.filter(r => r.id !== newRoom.id)]
            localStorage.setItem('votingRooms', JSON.stringify(updated))
            return updated
          })
        } else if (message.type === 'room_updated') {
          const updatedRoom = message.data as VotingRoom
          setRooms(prev => {
            const updated = prev.map(r => r.id === updatedRoom.id ? updatedRoom : r)
            localStorage.setItem('votingRooms', JSON.stringify(updated))
            return updated
          })
          
          // Update current room if it's the one being updated
          if (currentRoom?.id === updatedRoom.id) {
            setCurrentRoom(updatedRoom)
          }
        }
      })
      
    } catch (error) {
      console.error('Failed to load rooms:', error)
      toast.error('Failed to load voting rooms')
    } finally {
      setLoading(false)
    }
  }, [user.id, user.displayName, currentRoom?.id])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  useEffect(() => {
    if (!currentRoom?.votingActive) {
      setShowResults(true)
    } else {
      setShowResults(false)
    }
  }, [currentRoom?.votingActive])

  // Subscribe to room-specific updates when in a room
  useEffect(() => {
    if (!currentRoom) return

    const subscribeToRoom = async () => {
      try {
        const roomChannel = blink.realtime.channel(`voting-room-${currentRoom.id}`)
        await roomChannel.subscribe({
          userId: user.id,
          metadata: { displayName: user.displayName }
        })

        // Listen for participants and votes
        roomChannel.onMessage((message) => {
          if (message.type === 'participant_joined') {
            const participant = message.data as RoomParticipant
            setParticipants(prev => {
              const updated = [...prev.filter(p => p.userId !== participant.userId), participant]
              return updated
            })
          } else if (message.type === 'participant_left') {
            const userId = message.data.userId
            setParticipants(prev => prev.filter(p => p.userId !== userId))
          } else if (message.type === 'vote_cast') {
            const vote = message.data as Vote
            setVotes(prev => {
              const updated = [...prev.filter(v => v.userId !== vote.userId), vote]
              return updated
            })
          } else if (message.type === 'voting_started') {
            setVotes([])
            setCurrentRoom(prev => prev ? { ...prev, votingActive: true, currentStory: message.data.storyTitle } : null)
          } else if (message.type === 'voting_ended') {
            setCurrentRoom(prev => prev ? { ...prev, votingActive: false } : null)
          }
        })

        // Get current participants
        const presence = await roomChannel.getPresence()
        const roomParticipants: RoomParticipant[] = presence.map(p => ({
          id: `participant-${p.userId}`,
          roomId: currentRoom.id,
          userId: p.userId,
          userName: p.metadata?.displayName || 'Unknown',
          isManager: p.userId === currentRoom.managerId,
          joinedAt: new Date(p.joinedAt)
        }))
        setParticipants(roomParticipants)

        // Broadcast that we joined
        await roomChannel.publish('participant_joined', {
          id: `participant-${user.id}`,
          roomId: currentRoom.id,
          userId: user.id,
          userName: user.displayName,
          isManager: user.id === currentRoom.managerId,
          joinedAt: new Date()
        })

      } catch (error) {
        console.error('Failed to subscribe to room:', error)
      }
    }

    subscribeToRoom()
  }, [currentRoom, user.id, user.displayName])

  const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleCreateRoom = async () => {
    if (!newRoom.name.trim()) {
      toast.error('Room name is required')
      return
    }

    try {
      const roomCode = generateRoomCode()
      const room: VotingRoom = {
        id: `room-${Date.now()}`,
        teamId: 'team-1',
        name: newRoom.name,
        code: roomCode,
        managerId: user.id,
        votingActive: false,
        createdAt: new Date()
      }

      // Save to localStorage
      const updatedRooms = [room, ...rooms]
      setRooms(updatedRooms)
      localStorage.setItem('votingRooms', JSON.stringify(updatedRooms))

      // Broadcast room creation
      const channel = blink.realtime.channel('voting-rooms')
      await channel.publish('room_created', room)

      // Log activity
      const activityChannel = blink.realtime.channel('team-activity')
      await activityChannel.publish('activity', {
        type: 'voting_started',
        title: `Voting Room Created: ${room.name}`,
        description: `${user.displayName} created a new voting room`,
        userId: user.id,
        userName: user.displayName
      })

      setCurrentRoom(room)
      setCurrentUser({
        id: `participant-${Date.now()}`,
        roomId: room.id,
        userId: user.id,
        userName: user.displayName,
        isManager: true,
        joinedAt: new Date()
      })
      setParticipants([])
      setVotes([])
      setNewRoom({ name: '' })
      setIsCreateDialogOpen(false)
      
      toast.success(`Room created! Code: ${roomCode}`)
    } catch (error) {
      console.error('Failed to create room:', error)
      toast.error('Failed to create room')
    }
  }

  const handleJoinRoom = async () => {
    if (!joinData.roomCode.trim()) {
      toast.error('Room code is required')
      return
    }

    try {
      const room = rooms.find(r => r.code === joinData.roomCode.toUpperCase())
      if (!room) {
        toast.error('Room not found')
        return
      }

      const participant: RoomParticipant = {
        id: `participant-${Date.now()}`,
        roomId: room.id,
        userId: user.id,
        userName: user.displayName,
        isManager: false,
        joinedAt: new Date()
      }

      setCurrentRoom(room)
      setCurrentUser(participant)
      setParticipants([])
      setVotes([])
      setJoinData({ roomCode: '' })
      setIsJoinDialogOpen(false)
      
      toast.success(`Joined room ${room.name}!`)
    } catch (error) {
      console.error('Failed to join room:', error)
      toast.error('Failed to join room')
    }
  }

  const handleStartVoting = async () => {
    if (!storyTitle.trim() || !currentRoom || !currentUser?.isManager) return

    try {
      const updatedRoom = {
        ...currentRoom,
        currentStory: storyTitle.trim(),
        votingActive: true
      }
      
      setCurrentRoom(updatedRoom)
      setVotes([])
      
      // Update localStorage
      const updatedRooms = rooms.map(r => r.id === currentRoom.id ? updatedRoom : r)
      setRooms(updatedRooms)
      localStorage.setItem('votingRooms', JSON.stringify(updatedRooms))

      // Broadcast voting start
      const roomChannel = blink.realtime.channel(`voting-room-${currentRoom.id}`)
      await roomChannel.publish('voting_started', { storyTitle: storyTitle.trim() })

      // Broadcast room update
      const channel = blink.realtime.channel('voting-rooms')
      await channel.publish('room_updated', updatedRoom)
      
      setStoryTitle('')
      toast.success('Voting started!')
    } catch (error) {
      console.error('Failed to start voting:', error)
      toast.error('Failed to start voting')
    }
  }

  const handleEndVoting = async () => {
    if (!currentRoom || !currentUser?.isManager) return

    try {
      const updatedRoom = {
        ...currentRoom,
        votingActive: false
      }
      
      setCurrentRoom(updatedRoom)
      
      // Update localStorage
      const updatedRooms = rooms.map(r => r.id === currentRoom.id ? updatedRoom : r)
      setRooms(updatedRooms)
      localStorage.setItem('votingRooms', JSON.stringify(updatedRooms))

      // Broadcast voting end
      const roomChannel = blink.realtime.channel(`voting-room-${currentRoom.id}`)
      await roomChannel.publish('voting_ended', {})

      // Broadcast room update
      const channel = blink.realtime.channel('voting-rooms')
      await channel.publish('room_updated', updatedRoom)
      
      toast.success('Voting ended!')
    } catch (error) {
      console.error('Failed to end voting:', error)
      toast.error('Failed to end voting')
    }
  }

  const handleVote = async (voteValue: VoteValue) => {
    if (!currentRoom || !currentUser || !currentRoom.votingActive) return

    const existingVote = votes.find(v => v.userId === currentUser.userId)
    if (existingVote) return

    try {
      const vote: Vote = {
        id: `vote-${Date.now()}`,
        roomId: currentRoom.id,
        userId: currentUser.userId,
        userName: currentUser.userName,
        storyTitle: currentRoom.currentStory || '',
        voteValue: voteValue,
        createdAt: new Date()
      }

      setVotes(prev => [...prev, vote])

      // Broadcast vote
      const roomChannel = blink.realtime.channel(`voting-room-${currentRoom.id}`)
      await roomChannel.publish('vote_cast', vote)
      
      toast.success(`Vote cast: ${voteValue}`)
    } catch (error) {
      console.error('Failed to cast vote:', error)
      toast.error('Failed to cast vote')
    }
  }

  const handleLeaveRoom = async () => {
    if (!currentRoom || !currentUser) return

    try {
      // Broadcast that we're leaving
      const roomChannel = blink.realtime.channel(`voting-room-${currentRoom.id}`)
      await roomChannel.publish('participant_left', { userId: user.id })
      
      setCurrentRoom(null)
      setCurrentUser(null)
      setParticipants([])
      setVotes([])
      toast.success('Left room')
    } catch (error) {
      console.error('Failed to leave room:', error)
      toast.error('Failed to leave room')
    }
  }

  const copyRoomCode = async () => {
    if (!currentRoom) return
    
    try {
      await navigator.clipboard.writeText(currentRoom.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy room code:', err)
    }
  }

  const calculateResults = () => {
    const numericVotes = votes
      .filter(v => !['?', '☕'].includes(v.voteValue))
      .map(v => parseInt(v.voteValue))
    
    if (numericVotes.length === 0) return null

    const average = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length
    const min = Math.min(...numericVotes)
    const max = Math.max(...numericVotes)

    return { average: Math.round(average * 10) / 10, min, max }
  }

  const currentUserVote = votes.find(v => v.userId === currentUser?.userId)
  const votedParticipants = votes.length
  const totalParticipants = participants.length
  const results = calculateResults()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading voting rooms...</p>
        </div>
      </div>
    )
  }

  // If not in a room, show room selection
  if (!currentRoom) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Refinement Voting</h1>
            <p className="text-muted-foreground mt-1">
              Story point estimation made simple
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Hash className="w-4 h-4 mr-2" />
                  Join Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Voting Room</DialogTitle>
                  <DialogDescription>
                    Enter the room code to join an existing session
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="roomCode">Room Code</Label>
                    <Input
                      id="roomCode"
                      placeholder="Enter 6-digit code"
                      value={joinData.roomCode}
                      onChange={(e) => setJoinData({ roomCode: e.target.value.toUpperCase() })}
                      className="text-center text-lg font-mono tracking-wider"
                      maxLength={6}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsJoinDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleJoinRoom}>
                      Join Room
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Voting Room</DialogTitle>
                  <DialogDescription>
                    Start a new refinement session for your team
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="roomName">Room Name</Label>
                    <Input
                      id="roomName"
                      placeholder="e.g., Sprint 24 Planning"
                      value={newRoom.name}
                      onChange={(e) => setNewRoom({ name: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRoom}>
                      Create Room
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Existing Rooms */}
        <Card>
          <CardHeader>
            <CardTitle>Your Voting Rooms</CardTitle>
            <CardDescription>
              Recent and active voting sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rooms.length > 0 ? (
              <div className="space-y-3">
                {rooms.map(room => (
                  <div key={room.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{room.name}</h3>
                        <Badge variant={room.votingActive ? 'default' : 'secondary'}>
                          {room.votingActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {room.managerId === user.id && (
                          <Badge variant="outline">Manager</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Code: {room.code} • Created {room.createdAt ? new Date(room.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                      {room.currentStory && (
                        <p className="text-sm text-primary">
                          Current: {room.currentStory}
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const participant: RoomParticipant = {
                          id: `participant-${Date.now()}`,
                          roomId: room.id,
                          userId: user.id,
                          userName: user.displayName,
                          isManager: room.managerId === user.id,
                          joinedAt: new Date()
                        }
                        setCurrentRoom(room)
                        setCurrentUser(participant)
                        setParticipants([])
                        setVotes([])
                      }}
                    >
                      Enter Room
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No voting rooms yet</p>
                <p className="text-sm">Create your first room to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // In room view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{currentRoom.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">Room Code:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyRoomCode}
              className="font-mono text-lg font-semibold text-primary hover:bg-primary/10"
            >
              {currentRoom.code}
              {copied ? (
                <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 ml-2" />
              )}
            </Button>
          </div>
        </div>
        <Button variant="outline" onClick={handleLeaveRoom}>
          Leave Room
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Voting Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Manager Controls */}
          {currentUser?.isManager && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Manager Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!currentRoom.votingActive ? (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="storyTitle">Story Title</Label>
                      <Input
                        id="storyTitle"
                        placeholder="Enter story title to vote on..."
                        value={storyTitle}
                        onChange={(e) => setStoryTitle(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleStartVoting()}
                      />
                    </div>
                    <Button
                      onClick={handleStartVoting}
                      disabled={!storyTitle.trim()}
                      className="mt-6"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Voting
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Current Story:</p>
                      <p className="text-sm text-muted-foreground">{currentRoom.currentStory}</p>
                    </div>
                    <Button onClick={handleEndVoting} variant="destructive">
                      <Square className="w-4 h-4 mr-2" />
                      End Voting
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Current Story Display */}
          {currentRoom.currentStory && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Current Story
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{currentRoom.currentStory}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant={currentRoom.votingActive ? 'default' : 'secondary'}>
                    {currentRoom.votingActive ? 'Voting Active' : 'Voting Ended'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {votedParticipants}/{totalParticipants} voted
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Voting Cards */}
          {currentRoom.votingActive && (
            <Card>
              <CardHeader>
                <CardTitle>Cast Your Vote</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 sm:grid-cols-9 gap-3 justify-items-center">
                  {VOTE_VALUES.map((value) => (
                    <VotingCard
                      key={value}
                      value={value}
                      isSelected={currentUserVote?.voteValue === value}
                      onClick={() => handleVote(value)}
                      disabled={!!currentUserVote}
                    />
                  ))}
                </div>
                {currentUserVote && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✓ You voted: <span className="font-semibold">{currentUserVote.voteValue}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {showResults && votes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Voting Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results && (
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{results.average}</p>
                      <p className="text-sm text-muted-foreground">Average</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{results.min}</p>
                      <p className="text-sm text-muted-foreground">Minimum</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{results.max}</p>
                      <p className="text-sm text-muted-foreground">Maximum</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <h4 className="font-medium">Individual Votes:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {votes.map((vote) => (
                      <div
                        key={vote.id}
                        className="flex items-center justify-between p-2 bg-background border rounded"
                      >
                        <span className="text-sm">{vote.userName}</span>
                        <Badge variant="outline">{vote.voteValue}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Participants Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participants ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {participants.map((participant) => {
                  const hasVoted = votes.some(v => v.userId === participant.userId)
                  return (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          hasVoted ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {participant.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm font-medium">
                            {participant.userName}
                          </span>
                          {participant.isManager && (
                            <Badge variant="secondary" className="text-xs ml-2">
                              Manager
                            </Badge>
                          )}
                        </div>
                      </div>
                      {currentRoom.votingActive && (
                        <div className="text-xs text-muted-foreground">
                          {hasVoted ? '✓' : '⏳'}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}