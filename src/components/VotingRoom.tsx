import { useState, useEffect } from 'react'
import { VotingCard } from './VotingCard'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Separator } from './ui/separator'
import { VotingRoom as VotingRoomType, RoomParticipant, Vote, VoteValue } from '../types'
import { 
  Users, 
  Play, 
  Square, 
  Eye, 
  EyeOff, 
  Copy, 
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react'
import { blink } from '../blink/client'

interface VotingRoomProps {
  room: VotingRoomType
  currentUser: RoomParticipant
  participants: RoomParticipant[]
  votes: Vote[]
  onStartVoting: (storyTitle: string) => void
  onEndVoting: () => void
  onVote: (voteValue: VoteValue) => void
  onLeaveRoom: () => void
}

const VOTE_VALUES: VoteValue[] = ['1', '2', '3', '5', '8', '13', '21', '?', '☕']

export function VotingRoom({
  room,
  currentUser,
  participants,
  votes,
  onStartVoting,
  onEndVoting,
  onVote,
  onLeaveRoom
}: VotingRoomProps) {
  const [storyTitle, setStoryTitle] = useState('')
  const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [copied, setCopied] = useState(false)

  const currentUserVote = votes.find(v => v.userId === currentUser.userId)
  const votedParticipants = votes.length
  const totalParticipants = participants.length

  useEffect(() => {
    if (!room.votingActive) {
      setShowResults(true)
      setSelectedVote(null)
    } else {
      setShowResults(false)
    }
  }, [room.votingActive])

  const handleVote = (value: VoteValue) => {
    if (!room.votingActive || currentUserVote) return
    setSelectedVote(value)
    onVote(value)
  }

  const handleStartVoting = () => {
    if (storyTitle.trim()) {
      onStartVoting(storyTitle.trim())
      setStoryTitle('')
    }
  }

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code)
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

  const results = calculateResults()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-600">Room Code:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyRoomCode}
                className="font-mono text-lg font-semibold text-primary hover:bg-primary/10"
              >
                {room.code}
                {copied ? (
                  <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 ml-2" />
                )}
              </Button>
            </div>
          </div>
          <Button variant="outline" onClick={onLeaveRoom}>
            Leave Room
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Voting Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Manager Controls */}
            {currentUser.isManager && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Manager Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!room.votingActive ? (
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
                        <p className="text-sm text-gray-600">{room.currentStory}</p>
                      </div>
                      <Button onClick={onEndVoting} variant="destructive">
                        <Square className="w-4 h-4 mr-2" />
                        End Voting
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Current Story Display */}
            {room.currentStory && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Current Story
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">{room.currentStory}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant={room.votingActive ? 'default' : 'secondary'}>
                      {room.votingActive ? 'Voting Active' : 'Voting Ended'}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {votedParticipants}/{totalParticipants} voted
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Voting Cards */}
            {room.votingActive && (
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
                        isSelected={selectedVote === value || currentUserVote?.voteValue === value}
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
                    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{results.average}</p>
                        <p className="text-sm text-gray-600">Average</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{results.min}</p>
                        <p className="text-sm text-gray-600">Minimum</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{results.max}</p>
                        <p className="text-sm text-gray-600">Maximum</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Individual Votes:</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {votes.map((vote) => (
                        <div
                          key={vote.id}
                          className="flex items-center justify-between p-2 bg-white border rounded"
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
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            hasVoted ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                          <span className="text-sm font-medium">
                            {participant.userName}
                          </span>
                          {participant.isManager && (
                            <Badge variant="secondary" className="text-xs">
                              Manager
                            </Badge>
                          )}
                        </div>
                        {room.votingActive && (
                          <div className="text-xs text-gray-500">
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
    </div>
  )
}