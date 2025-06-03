import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ORIGIN_DEFAULT_MIN_APPS } from '@renderer/config/minapps'
import { MinAppType, SidebarIcon } from '@renderer/types'

export const DEFAULT_SIDEBAR_ICONS: SidebarIcon[] = [
  'assistants',
  'agents',
  'paintings',
  'translate',
  'minapp',
  'knowledge',
  'files'
]

export interface MinAppsState {
  enabled: MinAppType[]
  disabled: MinAppType[]
  pinned: MinAppType[]
}

const initialState: MinAppsState = {
  enabled: ORIGIN_DEFAULT_MIN_APPS,
  disabled: [],
  pinned: []
}

const minAppsSlice = createSlice({
  name: 'minApps',
  initialState,
  reducers: {
    initializeMinApps: (state, action: PayloadAction<MinAppType[]>) => {
      // Initialize with all apps (default + custom) if not already initialized
      if (state.enabled.length === ORIGIN_DEFAULT_MIN_APPS.length) {
        state.enabled = action.payload.map((app) => ({ ...app, logo: undefined }))
      }
    },
    setMinApps: (state, action: PayloadAction<MinAppType[]>) => {
      state.enabled = action.payload.map((app) => ({ ...app, logo: undefined }))
    },
    addMinApp: (state, action: PayloadAction<MinAppType>) => {
      state.enabled.push(action.payload)
    },
    setDisabledMinApps: (state, action: PayloadAction<MinAppType[]>) => {
      state.disabled = action.payload.map((app) => ({ ...app, logo: undefined }))
    },
    setPinnedMinApps: (state, action: PayloadAction<MinAppType[]>) => {
      state.pinned = action.payload.map((app) => ({ ...app, logo: undefined }))
    }
  }
})

export const { initializeMinApps, setMinApps, addMinApp, setDisabledMinApps, setPinnedMinApps } = minAppsSlice.actions

export default minAppsSlice.reducer
