import { CheckCircleOutlined, CopyOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useCopilot } from '@renderer/hooks/useCopilot'
import { useProvider } from '@renderer/hooks/useProvider'
import { Provider } from '@renderer/types'
import { Alert, Button, Input, message, Popconfirm, Slider, Space, Tooltip, Typography } from 'antd'
import { FC, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { SettingDivider, SettingGroup, SettingHelpText, SettingRow, SettingTitle } from '..'

interface GithubCopilotSettingsProps {
  provider: Provider
  setApiKey: (apiKey: string) => void
}

enum AuthStatus {
  NOT_STARTED,
  CODE_GENERATED,
  AUTHENTICATED
}

const GithubCopilotSettings: FC<GithubCopilotSettingsProps> = ({ provider: initialProvider, setApiKey }) => {
  const { t } = useTranslation()
  const { provider, updateProvider } = useProvider(initialProvider.id)
  const { username, avatar, defaultHeaders, updateState, updateDefaultHeaders } = useCopilot()
  // State management
  const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.NOT_STARTED)
  const [deviceCode, setDeviceCode] = useState<string>('')
  const [userCode, setUserCode] = useState<string>('')
  const [verificationUri, setVerificationUri] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [showHeadersForm, setShowHeadersForm] = useState<boolean>(false)
  const [headerText, setHeaderText] = useState<string>(JSON.stringify(defaultHeaders || {}, null, 2))
  const [verificationPageOpened, setVerificationPageOpened] = useState<boolean>(false)

  // Initialization and synchronization of state
  useEffect(() => {
    if (provider.isAuthed) {
      setAuthStatus(AuthStatus.AUTHENTICATED)
    } else {
      setAuthStatus(AuthStatus.NOT_STARTED)
      // Reset other states
      setDeviceCode('')
      setUserCode('')
      setVerificationUri('')
    }
  }, [provider])

  // Get device code
  const handleGetDeviceCode = useCallback(async () => {
    try {
      setLoading(true)
      const { device_code, user_code, verification_uri } = await window.api.copilot.getAuthMessage(defaultHeaders)

      setDeviceCode(device_code)
      setUserCode(user_code)
      setVerificationUri(verification_uri)
      setAuthStatus(AuthStatus.CODE_GENERATED)
    } catch (error) {
      console.error('Failed to get device code:', error)
      message.error(t('settings.provider.copilot.code_failed'))
    } finally {
      setLoading(false)
    }
  }, [t, defaultHeaders])

  // Use device code to get access token
  const handleGetToken = useCallback(async () => {
    try {
      setLoading(true)
      const { access_token } = await window.api.copilot.getCopilotToken(deviceCode, defaultHeaders)

      await window.api.copilot.saveCopilotToken(access_token)
      const { token } = await window.api.copilot.getToken(defaultHeaders)

      if (token) {
        const { login, avatar } = await window.api.copilot.getUser(access_token)
        setAuthStatus(AuthStatus.AUTHENTICATED)
        updateState({ username: login, avatar: avatar })
        updateProvider({ ...provider, apiKey: token, isAuthed: true })
        setApiKey(token)
        message.success(t('settings.provider.copilot.auth_success'))
      }
    } catch (error) {
      console.error('Failed to get token:', error)
      message.error(t('settings.provider.copilot.auth_failed'))
    } finally {
      setLoading(false)
    }
  }, [deviceCode, t, updateProvider, provider, setApiKey, updateState, defaultHeaders])

  // Logout
  const handleLogout = useCallback(async () => {
    try {
      setLoading(true)

      // 1. Save logout status to local
      updateProvider({ ...provider, apiKey: '', isAuthed: false })
      setApiKey('')

      // 3. Clear the locally stored token
      await window.api.copilot.logout()

      // 4. Update UI state
      setAuthStatus(AuthStatus.NOT_STARTED)
      setDeviceCode('')
      setUserCode('')
      setVerificationUri('')

      message.success(t('settings.provider.copilot.logout_success'))
    } catch (error) {
      console.error('Failed to logout:', error)
      message.error(t('settings.provider.copilot.logout_failed'))
      // If logout fails, reset logout status
      updateProvider({ ...provider, apiKey: '', isAuthed: false })
      setApiKey('')
    } finally {
      setLoading(false)
    }
  }, [t, updateProvider, provider, setApiKey])

  // Copy user code
  const handleCopyUserCode = useCallback(() => {
    navigator.clipboard.writeText(userCode)
    message.success(t('common.copied'))
  }, [userCode, t])

  // Open verification page
  const handleOpenVerificationPage = useCallback(() => {
    if (verificationUri) {
      window.open(verificationUri, '_blank')
      setVerificationPageOpened(true)
    }
  }, [verificationUri])

  // Handle update request headers
  const handleUpdateHeaders = useCallback(() => {
    try {
      // Handle the case where headerText may be empty
      const headers = headerText.trim() ? JSON.parse(headerText) : {}
      updateDefaultHeaders(headers)
      message.success(t('message.save.success.title'))
    } catch (error) {
      message.error(t('settings.provider.copilot.invalid_json'))
    }
  }, [headerText, updateDefaultHeaders, t])

  // Render different UI based on authentication status
  const renderAuthContent = () => {
    switch (authStatus) {
      case AuthStatus.AUTHENTICATED:
        return (
          <>
            <Alert
              type="success"
              message={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {avatar && (
                      <img
                        src={avatar}
                        alt="Avatar"
                        style={{ width: 20, height: 20, borderRadius: '50%', marginRight: 8 }}
                        loading="lazy"
                      />
                    )}
                    <span>{username || t('settings.provider.copilot.auth_success_title')}</span>
                  </div>
                  <Button type="primary" danger size="small" loading={loading} onClick={handleLogout}>
                    {t('settings.provider.copilot.logout')}
                  </Button>
                </div>
              }
              icon={<CheckCircleOutlined />}
              showIcon
            />
          </>
        )

      case AuthStatus.CODE_GENERATED:
        return (
          <>
            <Alert
              style={{ marginTop: 12, marginBottom: 12 }}
              type="info"
              message={t('settings.provider.copilot.code_generated_title')}
              description={
                <>
                  <p>{t('settings.provider.copilot.code_generated_desc')}</p>
                  <Typography.Link onClick={handleOpenVerificationPage}>{verificationUri}</Typography.Link>
                </>
              }
              showIcon
            />
            <SettingRow>
              <Input value={userCode} readOnly />
              <Button icon={<CopyOutlined />} onClick={handleCopyUserCode}>
                {t('common.copy')}
              </Button>
            </SettingRow>
            <SettingRow>
              <Tooltip title={!verificationPageOpened ? t('settings.provider.copilot.open_verification_first') : ''}>
                <Button type="primary" loading={loading} disabled={!verificationPageOpened} onClick={handleGetToken}>
                  {t('settings.provider.copilot.connect')}
                </Button>
              </Tooltip>
            </SettingRow>
          </>
        )

      default: // AuthStatus.NOT_STARTED
        return (
          <>
            <Alert
              style={{ marginTop: 12, marginBottom: 12 }}
              type="warning"
              message={t('settings.provider.copilot.tooltip')}
              description={t('settings.provider.copilot.description')}
              showIcon
            />

            <Popconfirm
              title={t('settings.provider.copilot.confirm_title')}
              description={t('settings.provider.copilot.confirm_login')}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
              onConfirm={handleGetDeviceCode}
              icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}>
              <Button type="primary" loading={loading}>
                {t('settings.provider.copilot.login')}
              </Button>
            </Popconfirm>
          </>
        )
    }
  }

  return (
    <Container>
      <Space direction="vertical" style={{ width: '100%' }}>
        {renderAuthContent()}
        <SettingDivider />
        <SettingGroup>
          <SettingTitle> {t('settings.provider.copilot.model_setting')}</SettingTitle>
          <SettingDivider />
          <SettingRow>
            {t('settings.provider.copilot.rate_limit')}
            <Slider
              defaultValue={provider.rateLimit ?? 10}
              style={{ width: 200 }}
              min={1}
              max={60}
              step={1}
              marks={{ 1: '1', 10: t('settings.websearch.search_result_default'), 60: '60' }}
              onChangeComplete={(value) => updateProvider({ ...provider, rateLimit: value })}
            />
          </SettingRow>
          <SettingRow>
            {t('settings.provider.copilot.custom_headers')}
            <Button onClick={() => setShowHeadersForm((prev) => !prev)} style={{ width: 200 }}>
              {t('settings.provider.copilot.expand')}
            </Button>
          </SettingRow>
          {showHeadersForm && (
            <SettingRow>
              <Space direction="vertical" style={{ width: '100%' }}>
                <SettingHelpText>{t('settings.provider.copilot.headers_description')}</SettingHelpText>
                <Input.TextArea
                  rows={5}
                  autoSize={{ minRows: 2, maxRows: 8 }}
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder={`{\n  "Header-Name": "Header-Value"\n}`}
                />
                <Space>
                  <Button onClick={handleUpdateHeaders} type="primary">
                    {t('common.save')}
                  </Button>
                  <Button onClick={() => setHeaderText(JSON.stringify({}, null, 2))}>{t('common.reset')}</Button>
                </Space>
              </Space>
            </SettingRow>
          )}
        </SettingGroup>
      </Space>
    </Container>
  )
}

const Container = styled.div``

export default GithubCopilotSettings
