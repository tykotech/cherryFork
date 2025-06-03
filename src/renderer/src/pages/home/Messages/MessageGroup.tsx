import Scrollbar from '@renderer/components/Scrollbar'
import { useMessageOperations } from '@renderer/hooks/useMessageOperations'
import { useSettings } from '@renderer/hooks/useSettings'
import { EVENT_NAMES, EventEmitter } from '@renderer/services/EventService'
import { MultiModelMessageStyle } from '@renderer/store/settings'
import type { Topic } from '@renderer/types'
import type { Message } from '@renderer/types/newMessage'
import { classNames } from '@renderer/utils'
import { Popover } from 'antd'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import styled, { css } from 'styled-components'

import MessageItem from './Message'
import MessageGroupMenuBar from './MessageGroupMenuBar'

interface Props {
  messages: (Message & { index: number })[]
  topic: Topic
  hidePresetMessages?: boolean
}

const MessageGroup = ({ messages, topic, hidePresetMessages }: Props) => {
  const { editMessage } = useMessageOperations(topic)
  const { multiModelMessageStyle: multiModelMessageStyleSetting, gridColumns, gridPopoverTrigger } = useSettings()

  const [multiModelMessageStyle, setMultiModelMessageStyle] = useState<MultiModelMessageStyle>(
    messages[0].multiModelMessageStyle || multiModelMessageStyleSetting
  )

  const messageLength = messages.length
  const prevMessageLengthRef = useRef(messageLength)
  const [selectedIndex, setSelectedIndex] = useState(messageLength - 1)

  const getSelectedMessageId = useCallback(() => {
    const selectedMessage = messages.find((message) => message.foldSelected)
    if (selectedMessage) {
      return selectedMessage.id
    }
    return messages[0]?.id
  }, [messages])

  const setSelectedMessage = useCallback(
    (message: Message) => {
      messages.forEach(async (m) => {
        await editMessage(m.id, { foldSelected: m.id === message.id })
      })

      setTimeout(() => {
        const messageElement = document.getElementById(`message-${message.id}`)
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 200)
    },
    [editMessage, messages]
  )

  const isGrouped = messageLength > 1 && messages.every((m) => m.role === 'assistant')
  const isHorizontal = multiModelMessageStyle === 'horizontal'
  const isGrid = multiModelMessageStyle === 'grid'

  useEffect(() => {
    if (messageLength > prevMessageLengthRef.current) {
      setSelectedIndex(messageLength - 1)
      const lastMessage = messages[messageLength - 1]
      if (lastMessage) {
        setSelectedMessage(lastMessage)
      }
    } else {
      const selectedId = getSelectedMessageId()
      const newIndex = messages.findIndex((msg) => msg.id === selectedId)
      if (newIndex !== -1) {
        setSelectedIndex(newIndex)
      }
    }
    prevMessageLengthRef.current = messageLength
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageLength])

  // Add event listener for flowchart node click events
  useEffect(() => {
    // Only add listener when component mounts and messages array changes
    if (!isGrouped || messageLength <= 1) return

    const handleFlowNavigate = (event: CustomEvent) => {
      const { messageId } = event.detail

      // Find the index of the corresponding message in the current message group
      const targetIndex = messages.findIndex((msg) => msg.id === messageId)

      // If the message is found and it's not the currently selected index, switch tabs
      if (targetIndex !== -1 && targetIndex !== selectedIndex) {
        setSelectedIndex(targetIndex)

        // Use setSelectedMessage function to switch tabs, this is key to handling foldSelected
        const targetMessage = messages[targetIndex]
        if (targetMessage) {
          setSelectedMessage(targetMessage)
        }
      }
    }

    // Add event listener
    document.addEventListener('flow-navigate-to-message', handleFlowNavigate as EventListener)

    // Cleanup function
    return () => {
      document.removeEventListener('flow-navigate-to-message', handleFlowNavigate as EventListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, selectedIndex, isGrouped, messageLength])

  // Add event listener for LOCATE_MESSAGE event
  useEffect(() => {
    // Register a locate event listener for each message
    const eventHandlers: { [key: string]: () => void } = {}

    messages.forEach((message) => {
      const eventName = EVENT_NAMES.LOCATE_MESSAGE + ':' + message.id
      const handler = () => {
        // Check if the message is visible
        const element = document.getElementById(`message-${message.id}`)
        if (element) {
          const display = window.getComputedStyle(element).display

          if (display === 'none') {
            // If the message is hidden, switch tab first
            setSelectedMessage(message)
          } else {
            // Scroll directly
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }
      }

      eventHandlers[eventName] = handler
      EventEmitter.on(eventName, handler)
    })

    // Cleanup function
    return () => {
      // Remove all event listeners
      Object.entries(eventHandlers).forEach(([eventName, handler]) => {
        EventEmitter.off(eventName, handler)
      })
    }
  }, [messages, setSelectedMessage])

  const renderMessage = useCallback(
    (message: Message & { index: number }, index: number) => {
      const isGridGroupMessage = isGrid && message.role === 'assistant' && isGrouped
      const messageProps = {
        isGrouped,
        message,
        topic,
        index: message.index,
        hidePresetMessages,
        style: {
          paddingTop: isGrouped && ['horizontal', 'grid'].includes(multiModelMessageStyle) ? 0 : 15
        }
      }

      const messageWrapper = (
        <MessageWrapper
          id={`message-${message.id}`}
          $layout={multiModelMessageStyle}
          $selected={index === selectedIndex}
          $isGrouped={isGrouped}
          key={message.id}
          className={classNames({
            'group-message-wrapper': message.role === 'assistant' && isHorizontal && isGrouped,
            [multiModelMessageStyle]: isGrouped,
            selected: message.id === getSelectedMessageId()
          })}>
          <MessageItem {...messageProps} />
        </MessageWrapper>
      )

      if (isGridGroupMessage) {
        return (
          <Popover
            key={message.id}
            content={
              <MessageWrapper
                $layout={multiModelMessageStyle}
                $selected={index === selectedIndex}
                $isGrouped={isGrouped}
                $isInPopover={true}>
                <MessageItem {...messageProps} />
              </MessageWrapper>
            }
            trigger={gridPopoverTrigger}
            styles={{ root: { maxWidth: '60vw', minWidth: '550px', overflowY: 'auto', zIndex: 1000 } }}
            getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}>
            {messageWrapper}
          </Popover>
        )
      }

      return messageWrapper
    },
    [
      isGrid,
      isGrouped,
      isHorizontal,
      multiModelMessageStyle,
      selectedIndex,
      topic,
      hidePresetMessages,
      gridPopoverTrigger,
      getSelectedMessageId
    ]
  )

  return (
    <GroupContainer
      id={`message-group-${messages[0].askId}`}
      $isGrouped={isGrouped}
      $layout={multiModelMessageStyle}
      className={classNames([isGrouped && 'group-container', isHorizontal && 'horizontal', isGrid && 'grid'])}>
      <GridContainer
        $count={messageLength}
        $layout={multiModelMessageStyle}
        $gridColumns={gridColumns}
        className={classNames([isGrouped && 'group-grid-container', isHorizontal && 'horizontal', isGrid && 'grid'])}>
        {messages.map(renderMessage)}
      </GridContainer>
      {isGrouped && (
        <MessageGroupMenuBar
          multiModelMessageStyle={multiModelMessageStyle}
          setMultiModelMessageStyle={(style) => {
            setMultiModelMessageStyle(style)
            messages.forEach((message) => {
              editMessage(message.id, { multiModelMessageStyle: style })
            })
          }}
          messages={messages}
          selectMessageId={getSelectedMessageId()}
          setSelectedMessage={setSelectedMessage}
          topic={topic}
        />
      )}
    </GroupContainer>
  )
}

const GroupContainer = styled.div<{ $isGrouped: boolean; $layout: MultiModelMessageStyle }>`
  padding-top: ${({ $isGrouped, $layout }) => ($isGrouped && 'horizontal' === $layout ? '15px' : '0')};
  &.group-container.horizontal,
  &.group-container.grid {
    padding: 0 20px;
    .message {
      padding: 0;
    }
    .group-menu-bar {
      margin-left: 0;
      margin-right: 0;
    }
  }
`

const GridContainer = styled.div<{ $count: number; $layout: MultiModelMessageStyle; $gridColumns: number }>`
  width: 100%;
  display: grid;
  gap: ${({ $layout }) => ($layout === 'horizontal' ? '16px' : '0')};
  grid-template-columns: repeat(
    ${({ $layout, $count }) => (['fold', 'vertical'].includes($layout) ? 1 : $count)},
    minmax(550px, 1fr)
  );
  @media (max-width: 800px) {
    grid-template-columns: repeat(
      ${({ $layout, $count }) => (['fold', 'vertical'].includes($layout) ? 1 : $count)},
      minmax(400px, 1fr)
    );
  }
  ${({ $layout }) =>
    $layout === 'horizontal' &&
    css`
      margin-top: 15px;
    `}
  ${({ $gridColumns, $layout, $count }) =>
    $layout === 'grid' &&
    css`
      margin-top: 15px;
      grid-template-columns: repeat(${$count > 1 ? $gridColumns || 2 : 1}, minmax(0, 1fr));
      grid-template-rows: auto;
      gap: 16px;
    `}
  ${({ $layout }) => {
    return $layout === 'horizontal'
      ? css`
          overflow-y: auto;
        `
      : 'overflow-y: visible;'
  }}
`

interface MessageWrapperProps {
  $layout: 'fold' | 'horizontal' | 'vertical' | 'grid'
  $selected: boolean
  $isGrouped: boolean
  $isInPopover?: boolean
}

const MessageWrapper = styled(Scrollbar)<MessageWrapperProps>`
  width: 100%;
  &.horizontal {
    display: inline-block;
  }
  &.grid {
    display: inline-block;
  }
  &.fold {
    display: none;
    &.selected {
      display: inline-block;
    }
  }

  ${({ $layout, $isGrouped }) => {
    if ($layout === 'horizontal' && $isGrouped) {
      return css`
        border: 0.5px solid var(--color-border);
        padding: 10px;
        border-radius: 6px;
        max-height: 600px;
        margin-bottom: 10px;
      `
    }
    return ''
  }}

  ${({ $layout, $isInPopover, $isGrouped }) => {
    // If the layout is grid, and it's a group message, set max height and overflow behavior (card not scrollable, clickable to expand and then scrollable)
    // If the layout is horizontal, set overflow behavior (card scrollable)
    // If the layout is fold or vertical, height is not restricted, consistent with normal message flow layout, set card not scrollable (visible)
    return $layout === 'grid' && $isGrouped
      ? css`
          max-height: ${$isInPopover ? '50vh' : '300px'};
          overflow-y: ${$isInPopover ? 'auto' : 'hidden'};
          border: 0.5px solid ${$isInPopover ? 'transparent' : 'var(--color-border)'};
          padding: 10px;
          border-radius: 6px;
          background-color: var(--color-background);
        `
      : css`
          overflow-y: ${$layout === 'horizontal' ? 'auto' : 'visible'};
          border-radius: 6px;
        `
  }}
`

export default memo(MessageGroup)
