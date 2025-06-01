import { DynamicIcon, IconName } from 'lucide-react/dynamic'
import { FC } from 'react'

interface Props {
  groupName: string
  size?: number
  strokeWidth?: number
}

export const AgentGroupIcon: FC<Props> = ({ groupName, size = 20, strokeWidth = 1.2 }) => {
  const iconMap: { [key: string]: IconName } = {
    'My Agents': 'user-check',
    Featured: 'star',
    Career: 'briefcase',
    Business: 'handshake',
    Tools: 'wrench',
    Languages: 'languages',
    Office: 'file-text',
    General: 'settings',
    Writing: 'pen-tool',
    Programming: 'code',
    Emotions: 'heart',
    Education: 'graduation-cap',
    Creativity: 'lightbulb',
    Academics: 'book-open',
    Design: 'wand-sparkles',
    Art: 'palette',
    Entertainment: 'gamepad-2',
    Lifestyle: 'coffee',
    Medical: 'stethoscope',
    Gaming: 'gamepad-2',
    Translation: 'languages',
    Music: 'music',
    Reviews: 'message-square-more',
    Copywriting: 'file-text',
    Encyclopedia: 'book',
    Health: 'heart-pulse',
    Marketing: 'trending-up',
    Science: 'flask-conical',
    Analysis: 'bar-chart',
    Legal: 'scale',
    Consulting: 'messages-square',
    Finance: 'banknote',
    Travel: 'plane',
    Management: 'users',
    Search: 'search'
  } as const

  return <DynamicIcon name={iconMap[groupName] || 'bot-message-square'} size={size} strokeWidth={strokeWidth} />
}
