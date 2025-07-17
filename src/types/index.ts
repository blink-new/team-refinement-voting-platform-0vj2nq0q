// User types
export interface User {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  role: 'admin' | 'manager' | 'member'
  createdAt: Date
  updatedAt: Date
}

// Team types
export interface Team {
  id: string
  name: string
  description?: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  role: 'admin' | 'manager' | 'member'
  joinedAt: Date
}

// Project Management types
export interface Project {
  id: string
  name: string
  key: string
  description?: string
  ownerId: string
  teamId: string
  createdAt: Date
  updatedAt: Date
}

export interface Sprint {
  id: string
  projectId: string
  name: string
  goal?: string
  startDate: Date
  endDate: Date
  status: 'planned' | 'active' | 'completed'
  totalStoryPoints: number
  completedStoryPoints: number
  createdAt: Date
  updatedAt: Date
}

// Task Management types
export interface Task {
  id: string
  projectId: string
  taskNumber: number // Auto-generated based on project key (e.g., PROJ-123)
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigneeId?: string
  reporterId: string
  storyPoints?: number
  type: 'backlog' | 'sprint'
  sprintId?: string
  createdAt: Date
  updatedAt: Date
}

// Voting types
export interface VotingRoom {
  id: string
  teamId: string
  name: string
  code: string
  managerId: string
  currentStory?: string
  votingActive: boolean
  createdAt: Date
}

export interface RoomParticipant {
  id: string
  roomId: string
  userId: string
  userName: string
  isManager: boolean
  joinedAt: Date
}

export interface Vote {
  id: string
  roomId: string
  userId: string
  userName: string
  storyTitle: string
  voteValue: VoteValue
  createdAt: Date
}

export interface VotingSession {
  id: string
  roomId: string
  storyTitle: string
  startedAt: Date
  endedAt?: Date
  averageVote?: number
  totalVotes: number
  votes: Vote[]
}

export type VoteValue = '1' | '2' | '3' | '5' | '8' | '13' | '21' | '?' | '☕'

// Retrospective types
export interface RetroBoard {
  id: string
  teamId: string
  name: string
  facilitatorId: string
  status: 'active' | 'completed' | 'archived'
  createdAt: Date
}

export interface RetroItem {
  id: string
  boardId: string
  userId: string
  category: 'went_well' | 'improve' | 'action_items'
  content: string
  votes: number
  createdAt: Date
}

// Dashboard types
export interface DashboardStats {
  totalTasks: number
  completedTasks: number
  activeVotingSessions: number
  teamMembers: number
  recentActivity: ActivityItem[]
}

export interface ActivityItem {
  id: string
  type: 'task_created' | 'task_completed' | 'voting_started' | 'retro_created'
  title: string
  description: string
  userId: string
  userName: string
  timestamp: Date
}