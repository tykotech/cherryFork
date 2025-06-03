import { ScrollAction, ScrollState } from './types'

/**
 * Initial state
 */
export const initialScrollState: ScrollState = {
  focusedItemKey: '',
  scrollTrigger: 'initial',
  lastScrollOffset: 0,
  stickyGroup: null,
  isMouseOver: false
}

/**
 * Reducer for scroll state, used to avoid state update issues caused by complex dependencies
 * @param state Current state
 * @param action Action
 * @returns New state
 */
export const scrollReducer = (state: ScrollState, action: ScrollAction): ScrollState => {
  switch (action.type) {
    case 'SET_FOCUSED_ITEM_KEY':
      return { ...state, focusedItemKey: action.payload }

    case 'SET_SCROLL_TRIGGER':
      return { ...state, scrollTrigger: action.payload }

    case 'SET_LAST_SCROLL_OFFSET':
      return { ...state, lastScrollOffset: action.payload }

    case 'SET_STICKY_GROUP':
      return { ...state, stickyGroup: action.payload }

    case 'SET_IS_MOUSE_OVER':
      return { ...state, isMouseOver: action.payload }

    case 'FOCUS_NEXT_ITEM': {
      const { modelItems, step } = action.payload

      if (modelItems.length === 0) {
        return {
          ...state,
          focusedItemKey: '',
          scrollTrigger: 'keyboard'
        }
      }

      const currentIndex = modelItems.findIndex((item) => item.key === state.focusedItemKey)
      const nextIndex = (currentIndex < 0 ? 0 : currentIndex + step + modelItems.length) % modelItems.length

      return {
        ...state,
        focusedItemKey: modelItems[nextIndex].key,
        scrollTrigger: 'keyboard'
      }
    }

    case 'FOCUS_PAGE': {
      const { modelItems, currentIndex, step } = action.payload
      const nextIndex = Math.max(0, Math.min(currentIndex + step, modelItems.length - 1))

      return {
        ...state,
        focusedItemKey: modelItems.length > 0 ? modelItems[nextIndex].key : '',
        scrollTrigger: 'keyboard'
      }
    }

    case 'SEARCH_CHANGED':
      return {
        ...state,
        scrollTrigger: action.payload.searchText ? 'search' : 'initial'
      }

    case 'FOCUS_ON_LIST_CHANGE': {
      const { modelItems } = action.payload

      // When the list changes, try to focus a model:
      // - If it's the initial state, try to focus the currently selected model first
      // - If it's the search state, try to focus the first model
      let newFocusedKey = ''
      if (state.scrollTrigger === 'initial' || state.scrollTrigger === 'search') {
        const selectedItem = modelItems.find((item) => item.isSelected)
        if (selectedItem && state.scrollTrigger === 'initial') {
          newFocusedKey = selectedItem.key
        } else if (modelItems.length > 0) {
          newFocusedKey = modelItems[0].key
        }
      } else {
        newFocusedKey = state.focusedItemKey
      }

      return {
        ...state,
        focusedItemKey: newFocusedKey
      }
    }

    default:
      return state
  }
}
