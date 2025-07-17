import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Label } from './ui/label'
import { Avatar, AvatarFallback } from './ui/avatar'
import { 
  Plus, 
  MessageSquare, 
  ThumbsUp, 
  AlertTriangle, 
  Target,
  Users,
  Calendar,
  Archive,
  MoreHorizontal
} from 'lucide-react'
import { User, RetroBoard, RetroItem } from '../types'
import { toast } from 'sonner'

interface RetrospectiveProps {
  user: User
}

const RETRO_CATEGORIES = [
  {
    id: 'went_well' as const,
    title: 'What went well?',
    description: 'Things that worked great',
    icon: ThumbsUp,
    color: 'bg-green-50 border-green-200',
    iconColor: 'text-green-600'
  },
  {
    id: 'improve' as const,
    title: 'What could improve?',
    description: 'Areas for improvement',
    icon: AlertTriangle,
    color: 'bg-yellow-50 border-yellow-200',
    iconColor: 'text-yellow-600'
  },
  {
    id: 'action_items' as const,
    title: 'Action items',
    description: 'Next steps to take',
    icon: Target,
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600'
  }
]

export function Retrospective({ user }: RetrospectiveProps) {
  const [boards, setBoards] = useState<RetroBoard[]>([])
  const [currentBoard, setCurrentBoard] = useState<RetroBoard | null>(null)
  const [items, setItems] = useState<RetroItem[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newBoard, setNewBoard] = useState({ name: '' })
  const [newItem, setNewItem] = useState({
    category: 'went_well' as RetroItem['category'],
    content: ''
  })
  const [isAddingItem, setIsAddingItem] = useState<RetroItem['category'] | null>(null)

  useEffect(() => {
    // Load existing boards
    const mockBoards: RetroBoard[] = [
      {
        id: 'board-1',
        teamId: 'team-1',
        name: 'Sprint 23 Retrospective',
        facilitatorId: user.id,
        status: 'completed',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
      },
      {
        id: 'board-2',
        teamId: 'team-1',
        name: 'Q1 Team Retrospective',
        facilitatorId: 'other-user',
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
      }
    ]
    setBoards(mockBoards)
  }, [user.id])

  useEffect(() => {
    if (currentBoard) {
      // Load items for current board
      const mockItems: RetroItem[] = [
        {
          id: 'item-1',
          boardId: currentBoard.id,
          userId: user.id,
          category: 'went_well',
          content: 'Great team collaboration on the authentication feature',
          votes: 5,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1)
        },
        {
          id: 'item-2',
          boardId: currentBoard.id,
          userId: 'user-2',
          category: 'went_well',
          content: 'Code reviews were thorough and helpful',
          votes: 3,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
        },
        {
          id: 'item-3',
          boardId: currentBoard.id,
          userId: 'user-3',
          category: 'improve',
          content: 'Need better communication about requirement changes',
          votes: 7,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3)
        },
        {
          id: 'item-4',
          boardId: currentBoard.id,
          userId: user.id,
          category: 'improve',
          content: 'Testing could be more comprehensive',
          votes: 4,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4)
        },
        {
          id: 'item-5',
          boardId: currentBoard.id,
          userId: 'user-2',
          category: 'action_items',
          content: 'Set up weekly requirement review meetings',
          votes: 6,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5)
        },
        {
          id: 'item-6',
          boardId: currentBoard.id,
          userId: 'user-3',
          category: 'action_items',
          content: 'Create testing guidelines document',
          votes: 2,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6)
        }
      ]
      setItems(mockItems)
    }
  }, [currentBoard, user.id])

  const handleCreateBoard = () => {
    if (!newBoard.name.trim()) {
      toast.error('Board name is required')
      return
    }

    const board: RetroBoard = {
      id: `board-${Date.now()}`,
      teamId: 'team-1',
      name: newBoard.name,
      facilitatorId: user.id,
      status: 'active',
      createdAt: new Date()
    }

    setBoards(prev => [board, ...prev])
    setCurrentBoard(board)
    setItems([])
    setNewBoard({ name: '' })
    setIsCreateDialogOpen(false)
    
    toast.success('Retrospective board created!')
  }

  const handleAddItem = () => {
    if (!newItem.content.trim() || !currentBoard) {
      toast.error('Item content is required')
      return
    }

    const item: RetroItem = {
      id: `item-${Date.now()}`,
      boardId: currentBoard.id,
      userId: user.id,
      category: newItem.category,
      content: newItem.content,
      votes: 0,
      createdAt: new Date()
    }

    setItems(prev => [...prev, item])
    setNewItem({ category: 'went_well', content: '' })
    setIsAddingItem(null)
    
    toast.success('Item added!')
  }

  const handleVoteItem = (itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, votes: item.votes + 1 }
        : item
    ))
    toast.success('Vote added!')
  }

  const handleCompleteBoard = () => {
    if (!currentBoard) return

    const updatedBoard = { ...currentBoard, status: 'completed' as const }
    setBoards(prev => prev.map(board => 
      board.id === currentBoard.id ? updatedBoard : board
    ))
    setCurrentBoard(updatedBoard)
    toast.success('Retrospective completed!')
  }

  const getItemsByCategory = (category: RetroItem['category']) => {
    return items
      .filter(item => item.category === category)
      .sort((a, b) => b.votes - a.votes)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // If not in a board, show board selection
  if (!currentBoard) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Retrospectives</h1>
            <p className="text-muted-foreground mt-1">
              Facilitate team retrospectives and continuous improvement
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Retrospective
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Retrospective Board</DialogTitle>
                <DialogDescription>
                  Start a new retrospective session for your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="boardName">Board Name</Label>
                  <Input
                    id="boardName"
                    placeholder="e.g., Sprint 24 Retrospective"
                    value={newBoard.name}
                    onChange={(e) => setNewBoard({ name: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBoard}>
                    Create Board
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Existing Boards */}
        <Card>
          <CardHeader>
            <CardTitle>Your Retrospective Boards</CardTitle>
            <CardDescription>
              Recent and active retrospective sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {boards.length > 0 ? (
              <div className="space-y-3">
                {boards.map(board => (
                  <div key={board.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{board.name}</h3>
                        <Badge variant={board.status === 'active' ? 'default' : 'secondary'}>
                          {board.status}
                        </Badge>
                        {board.facilitatorId === user.id && (
                          <Badge variant="outline">Facilitator</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Created {formatDate(board.createdAt)}
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => setCurrentBoard(board)}
                    >
                      Open Board
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No retrospective boards yet</p>
                <p className="text-sm">Create your first board to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // In board view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{currentBoard.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={currentBoard.status === 'active' ? 'default' : 'secondary'}>
              {currentBoard.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Created {formatDate(currentBoard.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {currentBoard.facilitatorId === user.id && currentBoard.status === 'active' && (
            <Button onClick={handleCompleteBoard}>
              <Archive className="w-4 h-4 mr-2" />
              Complete Retro
            </Button>
          )}
          <Button variant="outline" onClick={() => setCurrentBoard(null)}>
            Back to Boards
          </Button>
        </div>
      </div>

      {/* Retrospective Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {RETRO_CATEGORIES.map(category => {
          const categoryItems = getItemsByCategory(category.id)
          const Icon = category.icon
          
          return (
            <Card key={category.id} className={`${category.color} border-2`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className={`w-5 h-5 ${category.iconColor}`} />
                  {category.title}
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Add Item Button */}
                {currentBoard.status === 'active' && (
                  <div>
                    {isAddingItem === category.id ? (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Enter your thoughts..."
                          value={newItem.content}
                          onChange={(e) => setNewItem(prev => ({ 
                            ...prev, 
                            content: e.target.value,
                            category: category.id
                          }))}
                          className="min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleAddItem}>
                            Add
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setIsAddingItem(null)
                              setNewItem({ category: 'went_well', content: '' })
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setIsAddingItem(category.id)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                    )}
                  </div>
                )}

                {/* Items */}
                {categoryItems.map(item => (
                  <Card key={item.id} className="p-3 bg-background/50">
                    <div className="space-y-2">
                      <p className="text-sm">{item.content}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                              {item.userId === user.id ? 'You' : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleVoteItem(item.id)}
                            className="h-6 px-2"
                          >
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            {item.votes}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                {categoryItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No items yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Session Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {getItemsByCategory('went_well').length}
              </p>
              <p className="text-sm text-muted-foreground">Positive Items</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {getItemsByCategory('improve').length}
              </p>
              <p className="text-sm text-muted-foreground">Improvement Areas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {getItemsByCategory('action_items').length}
              </p>
              <p className="text-sm text-muted-foreground">Action Items</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {items.reduce((sum, item) => sum + item.votes, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Votes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}