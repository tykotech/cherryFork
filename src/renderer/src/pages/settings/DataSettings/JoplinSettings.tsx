import { InfoCircleOutlined } from '@ant-design/icons'
import { HStack } from '@renderer/components/Layout'
import { useTheme } from '@renderer/context/ThemeProvider'
import { useMinappPopup } from '@renderer/hooks/useMinappPopup'
import { RootState, useAppDispatch } from '@renderer/store'
import { setJoplinToken, setJoplinUrl } from '@renderer/store/settings'
import { Button, Tooltip } from 'antd'
import Input from 'antd/es/input/Input'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { SettingDivider, SettingGroup, SettingRow, SettingRowTitle, SettingTitle } from '..'

const JoplinSettings: FC = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const dispatch = useAppDispatch()
  const { openMinapp } = useMinappPopup()

  const joplinToken = useSelector((state: RootState) => state.settings.joplinToken)
  const joplinUrl = useSelector((state: RootState) => state.settings.joplinUrl)

  const handleJoplinTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setJoplinToken(e.target.value))
  }

  const handleJoplinUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setJoplinUrl(e.target.value))
  }

  const handleJoplinUrlBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let url = e.target.value
    // Ensure the URL ends with a slash, but only do this on blur
    if (url && !url.endsWith('/')) {
      url = `${url}/`
      dispatch(setJoplinUrl(url))
    }
  }

  const handleJoplinConnectionCheck = async () => {
    try {
      if (!joplinToken) {
        window.message.error(
          t('settings.data.joplin.check.empty_token', { defaultValue: 'Please enter the Joplin token.' })
        )
        return
      }
      if (!joplinUrl) {
        window.message.error(
          t('settings.data.joplin.check.empty_url', { defaultValue: 'Please enter the Joplin URL.' })
        )
        return
      }

      const response = await fetch(`${joplinUrl}notes?limit=1&token=${joplinToken}`)

      const data = await response.json()

      if (!response.ok || data?.error) {
        window.message.error(
          t('settings.data.joplin.check.fail', {
            defaultValue: 'Failed to connect to Joplin. Please check your settings.'
          })
        )
        return
      }

      window.message.success(
        t('settings.data.joplin.check.success', { defaultValue: 'Successfully connected to Joplin!' })
      )
    } catch (e) {
      window.message.error(
        t('settings.data.joplin.check.fail', {
          defaultValue: 'Failed to connect to Joplin. Please check your settings.'
        })
      )
    }
  }

  const handleJoplinHelpClick = () => {
    openMinapp({
      id: 'joplin-help',
      name: 'Joplin Help',
      url: 'https://joplinapp.org/help/apps/clipper'
    })
  }

  return (
    <SettingGroup theme={theme}>
      <SettingTitle>{t('settings.data.joplin.title', { defaultValue: 'Joplin Integration' })}</SettingTitle>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.data.joplin.url', { defaultValue: 'Joplin URL' })}</SettingRowTitle>
        <HStack alignItems="center" gap="5px" style={{ width: 315 }}>
          <Input
            type="text"
            value={joplinUrl || ''}
            onChange={handleJoplinUrlChange}
            onBlur={handleJoplinUrlBlur}
            style={{ width: 315 }}
            placeholder={t('settings.data.joplin.url_placeholder', {
              defaultValue: 'Enter the Joplin Web Clipper URL, e.g. http://127.0.0.1:41184/'
            })}
          />
        </HStack>
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle style={{ display: 'flex', alignItems: 'center' }}>
          <span>{t('settings.data.joplin.token', { defaultValue: 'Joplin Token' })}</span>
          <Tooltip
            title={t('settings.data.joplin.help', { defaultValue: 'How to get the Joplin token?' })}
            placement="left">
            <InfoCircleOutlined
              style={{ color: 'var(--color-text-2)', cursor: 'pointer', marginLeft: 4 }}
              onClick={handleJoplinHelpClick}
            />
          </Tooltip>
        </SettingRowTitle>
        <HStack alignItems="center" gap="5px" style={{ width: 315 }}>
          <Input
            type="password"
            value={joplinToken || ''}
            onChange={handleJoplinTokenChange}
            style={{ width: 250 }}
            placeholder={t('settings.data.joplin.token_placeholder', { defaultValue: 'Enter your Joplin token' })}
          />
          <Button onClick={handleJoplinConnectionCheck}>
            {t('settings.data.joplin.check.button', { defaultValue: 'Check Connection' })}
          </Button>
        </HStack>
      </SettingRow>
    </SettingGroup>
  )
}

export default JoplinSettings
