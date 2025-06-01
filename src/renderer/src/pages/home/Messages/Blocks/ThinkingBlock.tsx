import { CheckOutlined } from '@ant-design/icons'
import { useSettings } from '@renderer/hooks/useSettings'
import { MessageBlockStatus, type ThinkingMessageBlock } from '@renderer/types/newMessage'
import { lightbulbVariants } from '@renderer/utils/motionVariants'
import { Collapse, message as antdMessage, Tooltip } from 'antd'
import { Lightbulb } from 'lucide-react'
import { motion } from 'motion/react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import Markdown from '../../Markdown/Markdown'

interface Props {
  block: ThinkingMessageBlock
}

const ThinkingBlock: React.FC<Props> = ({ block }) => {
  const [copied, setCopied] = useState(false)
  const { t } = useTranslation()
  const { messageFont, fontSize, thoughtAutoCollapse } = useSettings()
  const [activeKey, setActiveKey] = useState<'thought' | ''>(thoughtAutoCollapse ? '' : 'thought')
  const [thinkingTime, setThinkingTime] = useState(block.thinking_millsec || 0)
  const intervalId = useRef<NodeJS.Timeout>(null)

  const isThinking = useMemo(() => block.status === MessageBlockStatus.STREAMING, [block.status])

  const fontFamily = useMemo(() => {
    return messageFont === 'serif'
      ? 'serif'
      : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans","Helvetica Neue", sans-serif'
  }, [messageFont])

  useEffect(() => {
    if (!isThinking && thoughtAutoCollapse) {
      setActiveKey('')
    } else {
      setActiveKey('thought')
    }
  }, [isThinking, thoughtAutoCollapse])

  const copyThought = useCallback(() => {
    if (block.content) {
      navigator.clipboard
        .writeText(block.content)
        .then(() => {
          antdMessage.success({ content: t('message.copied'), key: 'copy-message' })
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
        .catch((error) => {
          console.error('Failed to copy text:', error)
          antdMessage.error({ content: t('message.copy.failed'), key: 'copy-message-error' })
        })
    }
  }, [block.content, t])

  // FIXME: 这里统计的和请求处统计的有一定误差
  useEffect(() => {
    if (isThinking) {
      intervalId.current = setInterval(() => {
        setThinkingTime((prev) => prev + 100)
      }, 100)
    } else if (intervalId.current) {
      // 立即清除计时器
      clearInterval(intervalId.current)
      intervalId.current = null
    }

    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current)
        intervalId.current = null
      }
    }
  }, [isThinking])

  const thinkingTimeSeconds = useMemo(() => (thinkingTime / 1000).toFixed(1), [thinkingTime])

  if (!block.content) {
    return null
  }

  return (
    <CollapseContainer
      activeKey={activeKey}
      size="small"
      onChange={() => setActiveKey((key) => (key ? '' : 'thought'))}
      className="message-thought-container"
      expandIconPosition="end"
      items={[
        {
          key: 'thought',
          label: (
            <MessageTitleLabel>
              <motion.span
                style={{ height: '18px' }}
                variants={lightbulbVariants}
                animate={isThinking ? 'active' : 'idle'}
                initial="idle">
                <Lightbulb size={18} />
              </motion.span>
              <ThinkingText>
                {t(isThinking ? 'chat.thinking' : 'chat.deeply_thought', {
                  seconds: thinkingTimeSeconds
                })}
              </ThinkingText>
              {/* {isThinking && <BarLoader color="#9254de" />} */}
              {!isThinking && (
                <Tooltip title={t('common.copy')} mouseEnterDelay={0.8}>
                  <ActionButton
                    className="message-action-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      copyThought()
                    }}
                    aria-label={t('common.copy')}>
                    {!copied && <i className="iconfont icon-copy"></i>}
                    {copied && <CheckOutlined style={{ color: 'var(--color-primary)' }} />}
                  </ActionButton>
                </Tooltip>
              )}
            </MessageTitleLabel>
          ),
          children: (
            //  FIXME: 临时兼容
            <div style={{ fontFamily, fontSize }}>
              <Markdown block={block} />
            </div>
          )
        }
      ]}
    />
  )
}

const CollapseContainer = styled(Collapse)`
  margin-bottom: 15px;
`

const MessageTitleLabel = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 22px;
  gap: 4px;
`

const ThinkingText = styled.span`
  color: var(--color-text-2);
`

const ActionButton = styled.button`
  background: none;
  border: none;
  color: var(--color-text-2);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  opacity: 0.6;
  transition: all 0.3s;

  &:hover {
    opacity: 1;
    color: var(--color-text);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .iconfont {
    font-size: 14px;
  }
`

export default memo(ThinkingBlock)
