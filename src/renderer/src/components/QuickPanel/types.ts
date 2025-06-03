import React from 'react'

export type QuickPanelCloseAction = 'enter' | 'click' | 'esc' | 'outsideclick' | 'enter_empty' | string | undefined
export type QuickPanelCallBackOptions = {
  symbol: string
  action: QuickPanelCloseAction
  item: QuickPanelListItem
  searchText?: string
  /** Whether in multi-select state */
  multiple?: boolean
}

export type QuickPanelOpenOptions = {
  /** Displayed at the bottom left, similar to a placeholder */
  title?: string
  /** default: [] */
  list: QuickPanelListItem[]
  /** default: 0 */
  defaultIndex?: number
  /** default: 7 */
  pageSize?: number
  /** Whether to support multi-select by holding cmd/ctrl key, default: false */
  multiple?: boolean
  /**
   * Used to identify which quick panel, not for triggering display
   * Can be /@# symbol or other string
   */
  symbol: string
  beforeAction?: (options: QuickPanelCallBackOptions) => void
  afterAction?: (options: QuickPanelCallBackOptions) => void
  onClose?: (options: QuickPanelCallBackOptions) => void
}

export type QuickPanelListItem = {
  label: React.ReactNode | string
  description?: React.ReactNode | string
  /**
   * Since title and description may be ReactNode,
   * a separate text for search filtering is needed,
   * this filterText can be a combination of title and description as strings
   */
  filterText?: string
  icon: React.ReactNode | string
  suffix?: React.ReactNode | string
  isSelected?: boolean
  isMenu?: boolean
  disabled?: boolean
  action?: (options: QuickPanelCallBackOptions) => void
}

// Define context type
export interface QuickPanelContextType {
  readonly open: (options: QuickPanelOpenOptions) => void
  readonly close: (action?: QuickPanelCloseAction) => void
  readonly isVisible: boolean
  readonly symbol: string
  readonly list: QuickPanelListItem[]
  readonly title?: string
  readonly defaultIndex: number
  readonly pageSize: number
  readonly multiple: boolean

  readonly onClose?: (Options: QuickPanelCallBackOptions) => void
  readonly beforeAction?: (Options: QuickPanelCallBackOptions) => void
  readonly afterAction?: (Options: QuickPanelCallBackOptions) => void
}

export type QuickPanelScrollTrigger = 'initial' | 'keyboard' | 'none'
