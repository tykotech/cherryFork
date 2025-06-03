import { UndoOutlined } from '@ant-design/icons' // Import reset icon
import { getCurrentMinApps } from '@renderer/config/minapps'
import { useTheme } from '@renderer/context/ThemeProvider'
import { useMinapps } from '@renderer/hooks/useMinapps'
import { useSettings } from '@renderer/hooks/useSettings'
import { useAppDispatch } from '@renderer/store'
import {
  setMaxKeepAliveMinapps,
  setMinappsOpenLinkExternal,
  setShowOpenedMinappsInSidebar
} from '@renderer/store/settings'
import { Button, message, Slider, Switch, Tooltip } from 'antd'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { SettingContainer, SettingDescription, SettingDivider, SettingGroup, SettingRowTitle, SettingTitle } from '..'
import MiniAppIconsManager from './MiniAppIconsManager'

// Default mini app cache count
const DEFAULT_MAX_KEEPALIVE = 3

const MiniAppSettings: FC = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const dispatch = useAppDispatch()
  const { maxKeepAliveMinapps, showOpenedMinappsInSidebar, minappsOpenLinkExternal } = useSettings()
  const { minapps, disabled, updateMinapps, updateDisabledMinapps } = useMinapps()

  const [visibleMiniApps, setVisibleMiniApps] = useState(minapps)
  const [disabledMiniApps, setDisabledMiniApps] = useState(disabled || [])
  const [messageApi, contextHolder] = message.useMessage()
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleResetMinApps = useCallback(async () => {
    try {
      const allApps = await getCurrentMinApps()
      setVisibleMiniApps(allApps)
      setDisabledMiniApps([])
      updateMinapps(allApps)
      updateDisabledMinapps([])
    } catch (error) {
      console.error('Failed to reset mini apps:', error)
      // Fallback to current minapps if reset fails
      setVisibleMiniApps(minapps)
      setDisabledMiniApps([])
      updateMinapps(minapps)
      updateDisabledMinapps([])
    }
  }, [minapps, updateDisabledMinapps, updateMinapps])

  // Restore default cache count
  const handleResetCacheLimit = useCallback(() => {
    dispatch(setMaxKeepAliveMinapps(DEFAULT_MAX_KEEPALIVE))
    messageApi.info(t('settings.miniapps.cache_change_notice'))
  }, [dispatch, messageApi, t])

  // Handle cache count change
  const handleCacheChange = useCallback(
    (value: number) => {
      dispatch(setMaxKeepAliveMinapps(value))

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        messageApi.info(t('settings.miniapps.cache_change_notice'))
        debounceTimerRef.current = null
      }, 500)
    },
    [dispatch, messageApi, t]
  )

  // Clear timer on component unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return (
    <SettingContainer theme={theme}>
      {contextHolder} {/* Add message context */}
      <SettingGroup theme={theme}>
        <SettingTitle>{t('settings.miniapps.title')}</SettingTitle>
        <SettingDivider />

        <SettingTitle
          style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{t('settings.miniapps.display_title')}</span>
          <ResetButtonWrapper>
            <Button onClick={handleResetMinApps}>{t('common.reset')}</Button>
          </ResetButtonWrapper>
        </SettingTitle>
        <BorderedContainer>
          <MiniAppIconsManager
            visibleMiniApps={visibleMiniApps}
            disabledMiniApps={disabledMiniApps}
            setVisibleMiniApps={setVisibleMiniApps}
            setDisabledMiniApps={setDisabledMiniApps}
          />
        </BorderedContainer>
        <SettingDivider />
        <SettingRow style={{ height: 40, alignItems: 'center' }}>
          <SettingLabelGroup>
            <SettingRowTitle>{t('settings.miniapps.open_link_external.title')}</SettingRowTitle>
          </SettingLabelGroup>
          <Switch
            checked={minappsOpenLinkExternal}
            onChange={(checked) => dispatch(setMinappsOpenLinkExternal(checked))}
          />
        </SettingRow>
        <SettingDivider />

        {/* Cache mini app count setting */}
        <SettingRow>
          <SettingLabelGroup>
            <SettingRowTitle>{t('settings.miniapps.cache_title')}</SettingRowTitle>
            <SettingDescription>{t('settings.miniapps.cache_description')}</SettingDescription>
          </SettingLabelGroup>
          <CacheSettingControls>
            <SliderWithResetContainer>
              <Tooltip title={t('settings.miniapps.reset_tooltip')} placement="top">
                <ResetButton onClick={handleResetCacheLimit}>
                  <UndoOutlined />
                </ResetButton>
              </Tooltip>
              <Slider
                min={1}
                max={5}
                value={maxKeepAliveMinapps}
                onChange={handleCacheChange}
                marks={{
                  1: '1',
                  3: '3',
                  5: '5'
                }}
                tooltip={{ formatter: (value) => `${value}` }}
              />
            </SliderWithResetContainer>
          </CacheSettingControls>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingLabelGroup>
            <SettingRowTitle>{t('settings.miniapps.sidebar_title')}</SettingRowTitle>
            <SettingDescription>{t('settings.miniapps.sidebar_description')}</SettingDescription>
          </SettingLabelGroup>
          <Switch
            checked={showOpenedMinappsInSidebar}
            onChange={(checked) => dispatch(setShowOpenedMinappsInSidebar(checked))}
          />
        </SettingRow>
      </SettingGroup>
    </SettingContainer>
  )
}

// Modified and new styles
const SettingRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin: 0;
  gap: 20px;
`

const SettingLabelGroup = styled.div`
  flex: 1;
`

// New control container, includes slider and reset button
const CacheSettingControls = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 240px;
`

const SliderWithResetContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;

  .ant-slider {
    flex: 1;
  }

  .ant-slider-track {
    background-color: var(--color-primary);
  }

  .ant-slider-handle {
    border-color: var(--color-primary);
  }
`

// Reset button style
const ResetButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  min-width: 28px; /* Ensure it won't be compressed */
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-1);
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  color: var(--color-text);

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  &:active {
    background-color: var(--color-bg-2);
  }
`

const ResetButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

// New: Bordered container component
const BorderedContainer = styled.div`
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 8px;
  margin: 8px 0 8px;
  background-color: var(--color-bg-1);
`

export default MiniAppSettings
