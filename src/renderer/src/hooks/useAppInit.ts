import { useEffect } from 'react'

import { useLiveQuery } from 'dexie-react-hooks'

import { isMac } from '@renderer/config/constant'
import { isLocalAi } from '@renderer/config/env'
import { useTheme } from '@renderer/context/ThemeProvider'
import db from '@renderer/databases'
import i18n from '@renderer/i18n'
import { useAppDispatch } from '@renderer/store'
import { setAvatar, setFilesPath, setResourcesPath, setUpdateState } from '@renderer/store/runtime'
import { delay, runAsyncFunction } from '@renderer/utils'
import { defaultLanguage } from '@shared/config/constant'

import { useDefaultModel } from './useAssistant'
import useFullScreenNotice from './useFullScreenNotice'
import { useRuntime } from './useRuntime'
import { useSettings } from './useSettings'
import useUpdateHandler from './useUpdateHandler'

export function useAppInit() {
  const dispatch = useAppDispatch()
  const { proxyUrl, language, windowStyle, autoCheckUpdate, proxyMode, customCss, enableDataCollection } = useSettings()
  const { minappShow } = useRuntime()
  const { setDefaultModel, setTopicNamingModel, setTranslateModel } = useDefaultModel()
  const avatar = useLiveQuery(() => db.settings.get('image://avatar'))
  const { theme } = useTheme()

  useUpdateHandler()
  useFullScreenNotice()

  useEffect(() => {
    avatar?.value && dispatch(setAvatar(avatar.value))
  }, [avatar, dispatch])

  useEffect(() => {
    document.getElementById('spinner')?.remove()
    runAsyncFunction(async () => {
      const { isPackaged } = await window.api.getAppInfo()
      if (isPackaged && autoCheckUpdate) {
        await delay(2)
        const { updateInfo } = await window.api.checkForUpdate()
        dispatch(setUpdateState({ info: updateInfo }))
      }
    })
  }, [dispatch, autoCheckUpdate])

  useEffect(() => {
    if (proxyMode === 'system') {
      window.api.setProxy('system')
    } else if (proxyMode === 'custom') {
      proxyUrl && window.api.setProxy(proxyUrl)
    } else {
      window.api.setProxy('')
    }
  }, [proxyUrl, proxyMode])

  useEffect(() => {
    i18n.changeLanguage(language || navigator.language || defaultLanguage)
  }, [language])

  useEffect(() => {
    const transparentWindow = windowStyle === 'transparent' && isMac && !minappShow

    if (minappShow) {
      window.root.style.background = theme === 'dark' ? 'var(--color-black)' : 'var(--color-white)'
      return
    }

    window.root.style.background = transparentWindow ? 'var(--navbar-background-mac)' : 'var(--navbar-background)'
  }, [windowStyle, minappShow, theme])

  useEffect(() => {
    if (isLocalAi) {
      const model = JSON.parse(import.meta.env.VITE_RENDERER_INTEGRATED_MODEL)
      setDefaultModel(model)
      setTopicNamingModel(model)
      setTranslateModel(model)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // set files path
    console.log('Fetching app info from main process...')
    window.api.getAppInfo()
      .then((info) => {
        console.log('Received app info:', {
          filesPath: info.filesPath,
          resourcesPath: info.resourcesPath,
          appPath: info.appPath,
          isPackaged: info.isPackaged
        })
        
        // Ensure the resources path is set correctly
        const resourcesPath = info.resourcesPath || ''
        console.log('Setting resources path:', resourcesPath)
        
        dispatch(setFilesPath(info.filesPath))
        dispatch(setResourcesPath(resourcesPath))
        
        // Verify the agents.json file exists by trying to read it
        if (resourcesPath) {
          const agentsPath = `${resourcesPath}/data/agents.json`
          console.log('Attempting to read agents.json from:', agentsPath)
          window.api.fs
            .read(agentsPath)
            .then((content) => {
              console.log('Successfully read agents.json file')
              try {
                const agents = JSON.parse(content)
                console.log(`Loaded ${agents.length} agents from file`)
              } catch (error) {
                console.error('Error parsing agents.json:', error)
              }
            })
            .catch((error) => {
              console.error('Error reading agents.json:', error)
            })
        }
      })
      .catch((error) => {
        console.error('Failed to get app info:', error)
        // Set default paths if the API call fails
        const defaultResourcesPath = window.process?.resourcesPath || ''
        console.log('Using default resources path:', defaultResourcesPath)
        dispatch(setResourcesPath(defaultResourcesPath))
      })
  }, [dispatch])

  useEffect(() => {
    import('@renderer/queue/KnowledgeQueue')
  }, [])

  useEffect(() => {
    let customCssElement = document.getElementById('user-defined-custom-css') as HTMLStyleElement
    if (customCssElement) {
      customCssElement.remove()
    }

    if (customCss) {
      customCssElement = document.createElement('style')
      customCssElement.id = 'user-defined-custom-css'
      customCssElement.textContent = customCss
      document.head.appendChild(customCssElement)
    }
  }, [customCss])

  useEffect(() => {
    // TODO: init data collection
  }, [enableDataCollection])
}
