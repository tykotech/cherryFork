import { useDispatch, useSelector } from 'react-redux'

import type { RootState } from '../store'
import {
  type CopilotState,
  resetCopilotState,
  setAvatar,
  setDefaultHeaders,
  setUsername,
  updateCopilotState
} from '../store/copilot'

/**
 * Hook function for accessing and manipulating Copilot-related state
 * @returns Copilot state and operation methods
 */
export function useCopilot() {
  const dispatch = useDispatch()
  const copilotState = useSelector((state: RootState) => state.copilot)

  const updateUsername = (username: string) => {
    dispatch(setUsername(username))
  }

  const updateAvatar = (avatar: string) => {
    dispatch(setAvatar(avatar))
  }

  const updateDefaultHeaders = (headers: Record<string, string>) => {
    dispatch(setDefaultHeaders(headers))
  }

  const updateState = (state: Partial<CopilotState>) => {
    dispatch(updateCopilotState(state))
  }

  const resetState = () => {
    dispatch(resetCopilotState())
  }

  return {
    // Current state
    ...copilotState,

    // State update methods
    updateUsername,
    updateAvatar,
    updateDefaultHeaders,
    updateState,
    resetState
  }
}
