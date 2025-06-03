import {
  MdiLightbulbAutoOutline,
  MdiLightbulbOffOutline,
  MdiLightbulbOn10,
  MdiLightbulbOn50,
  MdiLightbulbOn90
} from '@renderer/components/Icons/SVGIcon'
import { useQuickPanel } from '@renderer/components/QuickPanel'
import {
  isSupportedReasoningEffortGrokModel,
  isSupportedThinkingTokenGeminiModel,
  isSupportedThinkingTokenQwenModel
} from '@renderer/config/models'
import { useAssistant } from '@renderer/hooks/useAssistant'
import { Assistant, Model, ReasoningEffortOptions } from '@renderer/types'
import { Tooltip } from 'antd'
import { FC, ReactElement, useCallback, useEffect, useImperativeHandle, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

type ThinkingOption = ReasoningEffortOptions | 'off'

export interface ThinkingButtonRef {
  openQuickPanel: () => void
}

interface Props {
  ref?: React.RefObject<ThinkingButtonRef | null>
  model: Model
  assistant: Assistant
  ToolbarButton: any
}

// Model type to supported options mapping
const MODEL_SUPPORTED_OPTIONS: Record<string, ThinkingOption[]> = {
  default: ['off', 'low', 'medium', 'high'],
  grok: ['off', 'low', 'high'],
  gemini: ['off', 'low', 'medium', 'high', 'auto'],
  qwen: ['off', 'low', 'medium', 'high']
}

// Fallback mapping: alternative options when not supported
const OPTION_FALLBACK: Record<ThinkingOption, ThinkingOption> = {
  off: 'off',
  low: 'low',
  medium: 'high', // medium -> high (for Grok models)
  high: 'high',
  auto: 'high' // auto -> high (for non-Gemini models)
}

const ThinkingButton: FC<Props> = ({ ref, model, assistant, ToolbarButton }): ReactElement => {
  const { t } = useTranslation()
  const quickPanel = useQuickPanel()
  const { updateAssistantSettings } = useAssistant(assistant.id)

  const isGrokModel = isSupportedReasoningEffortGrokModel(model)
  const isGeminiModel = isSupportedThinkingTokenGeminiModel(model)
  const isQwenModel = isSupportedThinkingTokenQwenModel(model)

  const currentReasoningEffort = useMemo(() => {
    return assistant.settings?.reasoning_effort || 'off'
  }, [assistant.settings?.reasoning_effort])

  // Determine the current model type
  const modelType = useMemo(() => {
    if (isGeminiModel) return 'gemini'
    if (isGrokModel) return 'grok'
    if (isQwenModel) return 'qwen'
    return 'default'
  }, [isGeminiModel, isGrokModel, isQwenModel])

  // Get the current supported options for the model
  const supportedOptions = useMemo(() => {
    return MODEL_SUPPORTED_OPTIONS[modelType]
  }, [modelType])

  // Check if current setting is compatible with the model
  useEffect(() => {
    if (currentReasoningEffort && !supportedOptions.includes(currentReasoningEffort)) {
      // Use the fallback option defined in the mapping
      const fallbackOption = OPTION_FALLBACK[currentReasoningEffort as ThinkingOption]

      updateAssistantSettings({
        reasoning_effort: fallbackOption === 'off' ? undefined : fallbackOption,
        qwenThinkMode: fallbackOption === 'off'
      })
    }
  }, [currentReasoningEffort, supportedOptions, updateAssistantSettings, model.id])

  const createThinkingIcon = useCallback((option?: ThinkingOption, isActive: boolean = false) => {
    const iconColor = isActive ? 'var(--color-link)' : 'var(--color-icon)'

    switch (true) {
      case option === 'low':
        return <MdiLightbulbOn10 width={18} height={18} style={{ color: iconColor, marginTop: -2 }} />
      case option === 'medium':
        return <MdiLightbulbOn50 width={18} height={18} style={{ color: iconColor, marginTop: -2 }} />
      case option === 'high':
        return <MdiLightbulbOn90 width={18} height={18} style={{ color: iconColor, marginTop: -2 }} />
      case option === 'auto':
        return <MdiLightbulbAutoOutline width={18} height={18} style={{ color: iconColor, marginTop: -2 }} />
      case option === 'off':
        return <MdiLightbulbOffOutline width={18} height={18} style={{ color: iconColor, marginTop: -2 }} />
      default:
        return <MdiLightbulbOffOutline width={18} height={18} style={{ color: iconColor }} />
    }
  }, [])

  const onThinkingChange = useCallback(
    (option?: ThinkingOption) => {
      const isEnabled = option !== undefined && option !== 'off'
      // Then update the settings
      if (!isEnabled) {
        updateAssistantSettings({
          reasoning_effort: undefined,
          qwenThinkMode: false
        })
        return
      }
      updateAssistantSettings({
        reasoning_effort: option,
        qwenThinkMode: true
      })
      return
    },
    [updateAssistantSettings]
  )

  const baseOptions = useMemo(() => {
    // Create UI options based on supported options
    return supportedOptions.map((option) => ({
      level: option,
      label: t(`assistants.settings.reasoning_effort.${option === 'auto' ? 'default' : option}`),
      description: '',
      icon: createThinkingIcon(option),
      isSelected: currentReasoningEffort === option,
      action: () => onThinkingChange(option)
    }))
  }, [t, createThinkingIcon, currentReasoningEffort, supportedOptions, onThinkingChange])

  const panelItems = baseOptions

  const openQuickPanel = useCallback(() => {
    quickPanel.open({
      title: t('assistants.settings.reasoning_effort'),
      list: panelItems,
      symbol: 'thinking'
    })
  }, [quickPanel, panelItems, t])

  const handleOpenQuickPanel = useCallback(() => {
    if (quickPanel.isVisible && quickPanel.symbol === 'thinking') {
      quickPanel.close()
    } else {
      openQuickPanel()
    }
  }, [openQuickPanel, quickPanel])

  // Get the current icon to display
  const getThinkingIcon = useCallback(() => {
    // If the current option is not supported, show the fallback option's icon
    if (currentReasoningEffort && !supportedOptions.includes(currentReasoningEffort)) {
      const fallbackOption = OPTION_FALLBACK[currentReasoningEffort as ThinkingOption]
      return createThinkingIcon(fallbackOption, true)
    }
    return createThinkingIcon(currentReasoningEffort, currentReasoningEffort !== 'off')
  }, [createThinkingIcon, currentReasoningEffort, supportedOptions])

  useImperativeHandle(ref, () => ({
    openQuickPanel
  }))

  return (
    <Tooltip placement="top" title={t('assistants.settings.reasoning_effort')} arrow>
      <ToolbarButton type="text" onClick={handleOpenQuickPanel}>
        {getThinkingIcon()}
      </ToolbarButton>
    </Tooltip>
  )
}

export default ThinkingButton
