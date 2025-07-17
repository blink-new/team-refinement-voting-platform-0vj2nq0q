import { VoteValue } from '../types'
import { Button } from './ui/button'
import { Coffee } from 'lucide-react'

interface VotingCardProps {
  value: VoteValue
  isSelected: boolean
  onClick: () => void
  disabled?: boolean
}

export function VotingCard({ value, isSelected, onClick, disabled }: VotingCardProps) {
  const getCardContent = () => {
    if (value === '☕') {
      return <Coffee className="w-6 h-6" />
    }
    return value
  }

  const getCardColor = () => {
    if (disabled) return 'bg-gray-100 text-gray-400 cursor-not-allowed'
    if (isSelected) return 'bg-primary text-primary-foreground shadow-lg scale-105'
    return 'bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-primary/50'
  }

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      className={`
        h-20 w-16 rounded-lg transition-all duration-200 font-semibold text-lg
        ${getCardColor()}
      `}
    >
      {getCardContent()}
    </Button>
  )
}