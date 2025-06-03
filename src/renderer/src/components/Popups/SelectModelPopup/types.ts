import { Model } from '@renderer/types'
import { ReactNode } from 'react'

// List item type, group name is also a list item
export type ListItemType = 'group' | 'model'

// Scroll trigger source type
export type ScrollTrigger = 'initial' | 'search' | 'keyboard' | 'none'

// Flattened list item interface
export interface FlatListItem {
  key: string
  type: ListItemType
  icon?: ReactNode
  name: ReactNode
  tags?: ReactNode
  model?: Model
  isPinned?: boolean
  isSelected?: boolean
}

// State type related to scroll and focus
export interface ScrollState {
  focusedItemKey: string
  scrollTrigger: ScrollTrigger
  lastScrollOffset: number
  stickyGroup: FlatListItem | null
  isMouseOver: boolean
}

// Action type related to scroll and focus
export type ScrollAction =
  | { type: 'SET_FOCUSED_ITEM_KEY'; payload: string }
  | { type: 'SET_SCROLL_TRIGGER'; payload: ScrollTrigger }
  | { type: 'SET_LAST_SCROLL_OFFSET'; payload: number }
  | { type: 'SET_STICKY_GROUP'; payload: FlatListItem | null }
  | { type: 'SET_IS_MOUSE_OVER'; payload: boolean }
  | { type: 'FOCUS_NEXT_ITEM'; payload: { modelItems: FlatListItem[]; step: number } }
  | { type: 'FOCUS_PAGE'; payload: { modelItems: FlatListItem[]; currentIndex: number; step: number } }
  | { type: 'SEARCH_CHANGED'; payload: { searchText: string } }
  | { type: 'FOCUS_ON_LIST_CHANGE'; payload: { modelItems: FlatListItem[] } }
