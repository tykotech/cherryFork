import { initializeCustomApps } from '@renderer/config/minapps'
import { initializeMinApps } from '@renderer/store/minapps'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

/**
 * Component that initializes custom mini apps when the app starts
 */
export const MinAppsInitializer = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    const initializeApps = async () => {
      try {
        // This will trigger the initialization logic we created
        await initializeCustomApps()

        // Get the current apps from the module (after initialization)
        const { DEFAULT_MIN_APPS } = await import('@renderer/config/minapps')

        // Initialize the Redux store with the loaded apps
        dispatch(initializeMinApps(DEFAULT_MIN_APPS))

        console.log('Successfully initialized mini apps in Redux store')
      } catch (error) {
        console.error('Failed to initialize mini apps:', error)
      }
    }

    initializeApps()
  }, [dispatch])

  // This component doesn't render anything
  return null
}

export default MinAppsInitializer
