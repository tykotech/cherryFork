import { useMinapps } from '@renderer/hooks/useMinapps'
import { useRuntime } from '@renderer/hooks/useRuntime'
import { useSettings } from '@renderer/hooks/useSettings' // Use values from settings
import { useAppDispatch } from '@renderer/store'
import {
  setCurrentMinappId,
  setMinappShow,
  setOpenedKeepAliveMinapps,
  setOpenedOneOffMinapp
} from '@renderer/store/runtime'
import { MinAppType } from '@renderer/types'

/**
 * Usage:
 *
 *   To control the minapp popup, you can use the following hooks:
 *     import { useMinappPopup } from '@renderer/hooks/useMinappPopup'
 *
 *   in the component:
 *     const { openMinapp, openMinappKeepAlive, openMinappById,
 *             closeMinapp, hideMinappPopup, closeAllMinapps } = useMinappPopup()
 *
 *   To use some key states of the minapp popup:
 *     import { useRuntime } from '@renderer/hooks/useRuntime'
 *     const { openedKeepAliveMinapps, openedOneOffMinapp, minappShow } = useRuntime()
 */
export const useMinappPopup = () => {
  const dispatch = useAppDispatch()
  const { minapps } = useMinapps()
  const { openedKeepAliveMinapps, openedOneOffMinapp, minappShow } = useRuntime()
  const { maxKeepAliveMinapps } = useSettings() // Use values from settings

  /** Open a minapp (popup shows and minapp loaded) */
  const openMinapp = (app: MinAppType, keepAlive: boolean = false) => {
    if (keepAlive) {
      // If the minapp is already open, just switch to display it
      if (openedKeepAliveMinapps.some((item) => item.id === app.id)) {
        dispatch(setCurrentMinappId(app.id))
        dispatch(setMinappShow(true))
        return
      }

      // If the cache count is below the limit, add to the cache list
      if (openedKeepAliveMinapps.length < maxKeepAliveMinapps) {
        dispatch(setOpenedKeepAliveMinapps([app, ...openedKeepAliveMinapps]))
      } else {
        // If the cache count reaches the limit, remove the last one and add the new one
        dispatch(setOpenedKeepAliveMinapps([app, ...openedKeepAliveMinapps.slice(0, maxKeepAliveMinapps - 1)]))
      }

      dispatch(setOpenedOneOffMinapp(null))
      dispatch(setCurrentMinappId(app.id))
      dispatch(setMinappShow(true))
      return
    }

    // If the minapp is not keep alive, open it as one-off minapp
    dispatch(setOpenedOneOffMinapp(app))
    dispatch(setCurrentMinappId(app.id))
    dispatch(setMinappShow(true))
    return
  }

  /** a wrapper of openMinapp(app, true) */
  const openMinappKeepAlive = (app: MinAppType) => {
    openMinapp(app, true)
  }

  /** Open a minapp by id (look up the minapp in the available apps) */
  const openMinappById = (id: string, keepAlive: boolean = false) => {
    const app = minapps.find((app) => app?.id === id)
    if (app) {
      openMinapp(app, keepAlive)
    } else {
      console.warn(`Minapp with id '${id}' not found in available apps`)
    }
  }

  /** Close a minapp immediately (popup hides and minapp unloaded) */
  const closeMinapp = (appid: string) => {
    if (openedKeepAliveMinapps.some((item) => item.id === appid)) {
      dispatch(setOpenedKeepAliveMinapps(openedKeepAliveMinapps.filter((item) => item.id !== appid)))
    } else if (openedOneOffMinapp?.id === appid) {
      dispatch(setOpenedOneOffMinapp(null))
    }

    dispatch(setCurrentMinappId(''))
    dispatch(setMinappShow(false))
    return
  }

  /** Close all minapps (popup hides and all minapps unloaded) */
  const closeAllMinapps = () => {
    dispatch(setOpenedKeepAliveMinapps([]))
    dispatch(setOpenedOneOffMinapp(null))
    dispatch(setCurrentMinappId(''))
    dispatch(setMinappShow(false))
  }

  /** Hide the minapp popup (only one-off minapp unloaded) */
  const hideMinappPopup = () => {
    if (!minappShow) return

    if (openedOneOffMinapp) {
      dispatch(setOpenedOneOffMinapp(null))
      dispatch(setCurrentMinappId(''))
    }
    dispatch(setMinappShow(false))
  }

  return {
    openMinapp,
    openMinappKeepAlive,
    openMinappById,
    closeMinapp,
    hideMinappPopup,
    closeAllMinapps
  }
}
