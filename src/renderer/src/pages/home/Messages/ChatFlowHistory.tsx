import '@xyflow/react/dist/style.css'

import { RobotOutlined, UserOutlined } from '@ant-design/icons'
import ModelAvatar from '@renderer/components/Avatar/ModelAvatar'
import { getModelLogo } from '@renderer/config/models'
import { useTheme } from '@renderer/context/ThemeProvider'
import { useSettings } from '@renderer/hooks/useSettings'
import { EVENT_NAMES, EventEmitter } from '@renderer/services/EventService'
import { RootState } from '@renderer/store'
import { selectMessagesForTopic } from '@renderer/store/newMessage'
import { Model } from '@renderer/types'
import { getMainTextContent } from '@renderer/utils/messageUtils/find'
import { Controls, Handle, MiniMap, ReactFlow, ReactFlowProvider } from '@xyflow/react'
import { Edge, Node, NodeTypes, Position, useEdgesState, useNodesState } from '@xyflow/react'
import { Avatar, Spin, Tooltip } from 'antd'
import { isEqual } from 'lodash'
import { FC, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import styled from 'styled-components'

// Define Tooltip related styled components
const TooltipContent = styled.div`
  max-width: 300px;
`

const TooltipTitle = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 4px;
`

const TooltipBody = styled.div`
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 8px;
  white-space: pre-wrap;
`

const TooltipFooter = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
`

// Custom node component
const CustomNode: FC<{ data: any }> = ({ data }) => {
  const { t } = useTranslation()
  const nodeType = data.type
  let borderColor = 'var(--color-border)'
  let title = ''
  let backgroundColor = 'var(--bg-color)'
  let gradientColor = 'rgba(0, 0, 0, 0.03)'
  let avatar: React.ReactNode | null = null

  // Set different styles and icons based on message type
  if (nodeType === 'user') {
    borderColor = 'var(--color-icon)'
    backgroundColor = 'rgba(var(--color-info-rgb), 0.03)'
    gradientColor = 'rgba(var(--color-info-rgb), 0.08)'
    title = data.userName || t('chat.history.user_node')

    // User avatar
    if (data.userAvatar) {
      avatar = <Avatar src={data.userAvatar} alt={title} />
    } else {
      avatar = <Avatar icon={<UserOutlined />} style={{ backgroundColor: 'var(--color-info)' }} />
    }
  } else if (nodeType === 'assistant') {
    borderColor = 'var(--color-primary)'
    backgroundColor = 'rgba(var(--color-primary-rgb), 0.03)'
    gradientColor = 'rgba(var(--color-primary-rgb), 0.08)'
    title = `${data.model || t('chat.history.assistant_node')}`

    // Model avatar
    if (data.modelInfo) {
      avatar = <ModelAvatar model={data.modelInfo} size={32} />
    } else if (data.modelId) {
      const modelLogo = getModelLogo(data.modelId)
      avatar = (
        <Avatar
          src={modelLogo}
          icon={!modelLogo ? <RobotOutlined /> : undefined}
          style={{ backgroundColor: 'var(--color-primary)' }}
        />
      )
    } else {
      avatar = <Avatar icon={<RobotOutlined />} style={{ backgroundColor: 'var(--color-primary)' }} />
    }
  }

  // Handle node click event, scroll to corresponding message
  const handleNodeClick = () => {
    if (data.messageId) {
      // Create a custom event to locate the message and switch the tab
      const customEvent = new CustomEvent('flow-navigate-to-message', {
        detail: {
          messageId: data.messageId,
          modelId: data.modelId,
          modelName: data.model,
          nodeType: nodeType
        },
        bubbles: true
      })

      // Let the listener handle the tab switch
      document.dispatchEvent(customEvent)

      setTimeout(() => {
        EventEmitter.emit(EVENT_NAMES.LOCATE_MESSAGE + ':' + data.messageId)
      }, 250)
    }
  }

  // General style for hiding connection points
  const handleStyle = {
    opacity: 0,
    width: '12px',
    height: '12px',
    background: 'transparent',
    border: 'none'
  }

  return (
    <Tooltip
      title={
        <TooltipContent>
          <TooltipTitle>{title}</TooltipTitle>
          <TooltipBody>{data.content}</TooltipBody>
          <TooltipFooter>{t('chat.history.click_to_navigate')}</TooltipFooter>
        </TooltipContent>
      }
      placement="top"
      color="rgba(0, 0, 0, 0.85)"
      mouseEnterDelay={0.3}
      mouseLeaveDelay={0.1}
      destroyTooltipOnHide>
      <CustomNodeContainer
        style={{
          borderColor,
          background: `linear-gradient(135deg, ${backgroundColor} 0%, ${gradientColor} 100%)`,
          boxShadow: `0 4px 10px rgba(0, 0, 0, 0.1), 0 0 0 2px ${borderColor}40`
        }}
        onClick={handleNodeClick}>
        <Handle type="target" position={Position.Top} style={handleStyle} isConnectable={false} />
        <Handle type="target" position={Position.Left} style={handleStyle} isConnectable={false} />

        <NodeHeader>
          <NodeAvatar>{avatar}</NodeAvatar>
          <NodeTitle>{title}</NodeTitle>
        </NodeHeader>
        <NodeContent title={data.content}>{data.content}</NodeContent>

        <Handle type="source" position={Position.Bottom} style={handleStyle} isConnectable={false} />
        <Handle type="source" position={Position.Right} style={handleStyle} isConnectable={false} />
      </CustomNodeContainer>
    </Tooltip>
  )
}

// Create custom node types
const nodeTypes: NodeTypes = { custom: CustomNode }

interface ChatFlowHistoryProps {
  conversationId?: string
}

// Define node and edge types
type FlowNode = Node<any>
type FlowEdge = Edge<any>

// Unified edge style
const commonEdgeStyle = {
  stroke: 'var(--color-border)',
  strokeDasharray: '4,4',
  strokeWidth: 2
}

// Unified edge configuration
const defaultEdgeOptions = {
  animated: true,
  style: commonEdgeStyle,
  type: 'step',
  markerEnd: undefined,
  zIndex: 5
}

const ChatFlowHistory: FC<ChatFlowHistoryProps> = ({ conversationId }) => {
  const { t } = useTranslation()
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([])
  const [loading, setLoading] = useState(true)
  const { userName } = useSettings()
  const { theme } = useTheme()

  const topicId = conversationId

  // Only update when actual message content changes, not property changes (such as foldSelected)
  const messages = useSelector(
    (state: RootState) => selectMessagesForTopic(state, topicId || ''),
    (prev, next) => {
      // Only compare key properties of messages, ignore display-related properties (such as foldSelected)
      if (prev.length !== next.length) return false

      // Compare the content and key properties of each message, ignoring UI state-related properties
      return prev.every((prevMsg, index) => {
        const nextMsg = next[index]
        const prevMsgContent = getMainTextContent(prevMsg)
        const nextMsgContent = getMainTextContent(nextMsg)
        return (
          prevMsg.id === nextMsg.id &&
          prevMsgContent === nextMsgContent &&
          prevMsg.role === nextMsg.role &&
          prevMsg.createdAt === nextMsg.createdAt &&
          prevMsg.askId === nextMsg.askId &&
          isEqual(prevMsg.model, nextMsg.model)
        )
      })
    }
  )

  // Get user avatar
  const userAvatar = useSelector((state: RootState) => state.runtime.avatar)

  // Message filtering
  const { userMessages, assistantMessages } = useMemo(() => {
    const userMsgs = messages.filter((msg) => msg.role === 'user')
    const assistantMsgs = messages.filter((msg) => msg.role === 'assistant')
    return { userMessages: userMsgs, assistantMessages: assistantMsgs }
  }, [messages])

  const buildConversationFlowData = useCallback(() => {
    if (!topicId || !messages.length) return { nodes: [], edges: [] }

    // Create nodes and edges
    const flowNodes: FlowNode[] = []
    const flowEdges: FlowEdge[] = []

    // Layout parameters
    const verticalGap = 200
    const horizontalGap = 350
    const baseX = 150

    // If there are no messages to display, return empty result
    if (userMessages.length === 0 && assistantMessages.length === 0) {
      return { nodes: [], edges: [] }
    }

    // Create nodes for all user messages
    userMessages.forEach((message, index) => {
      const nodeId = `user-${message.id}`
      const yPosition = index * verticalGap * 2

      // Get user name
      const userNameValue = userName || t('chat.history.user_node')

      // Get user avatar
      const msgUserAvatar = userAvatar || null

      flowNodes.push({
        id: nodeId,
        type: 'custom',
        data: {
          userName: userNameValue,
          content: getMainTextContent(message),
          type: 'user',
          messageId: message.id,
          userAvatar: msgUserAvatar
        },
        position: { x: baseX, y: yPosition },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top
      })

      // Find assistant replies after user message
      const userMsgTime = new Date(message.createdAt).getTime()
      const relatedAssistantMsgs = assistantMessages.filter((aMsg) => {
        const aMsgTime = new Date(aMsg.createdAt).getTime()
        return (
          aMsgTime > userMsgTime &&
          (index === userMessages.length - 1 || aMsgTime < new Date(userMessages[index + 1].createdAt).getTime())
        )
      })

      // Create nodes for related assistant messages
      relatedAssistantMsgs.forEach((aMsg, aIndex) => {
        const assistantNodeId = `assistant-${aMsg.id}`
        const isMultipleResponses = relatedAssistantMsgs.length > 1
        const assistantX = baseX + (isMultipleResponses ? horizontalGap * aIndex : 0)
        const assistantY = yPosition + verticalGap

        // Determine connection point positions based on layout
        let sourcePos = Position.Bottom // Default output downwards
        let targetPos = Position.Top // Default input from above

        // When arranging multiple assistant messages horizontally, adjust connection points
        // Note: Now all assistant nodes are directly connected to user node, not to each other
        if (isMultipleResponses) {
          // All assistant nodes use top as input (from user node)
          targetPos = Position.Top

          // All assistant nodes use bottom as output (to next user node)
          sourcePos = Position.Bottom
        }

        const aMsgAny = aMsg as any

        // Get model name
        const modelName = (aMsgAny.model && aMsgAny.model.name) || t('chat.history.assistant_node')

        // Get model ID
        const modelId = (aMsgAny.model && aMsgAny.model.id) || ''

        // Complete model info
        const modelInfo = aMsgAny.model as Model | undefined

        flowNodes.push({
          id: assistantNodeId,
          type: 'custom',
          data: {
            model: modelName,
            content: getMainTextContent(aMsg),
            type: 'assistant',
            messageId: aMsg.id,
            modelId: modelId,
            modelInfo
          },
          position: { x: assistantX, y: assistantY },
          sourcePosition: sourcePos,
          targetPosition: targetPos
        })

        // Connect messages - connect each assistant node directly to user node
        if (aIndex === 0) {
          // Connect user message to first assistant reply
          flowEdges.push({
            id: `edge-${nodeId}-to-${assistantNodeId}`,
            source: nodeId,
            target: assistantNodeId
          })
        } else {
          // Directly connect user message to all other assistant replies
          flowEdges.push({
            id: `edge-${nodeId}-to-${assistantNodeId}`,
            source: nodeId,
            target: assistantNodeId
          })
        }
      })

      // Connect adjacent user messages
      if (index > 0) {
        const prevUserNodeId = `user-${userMessages[index - 1].id}`
        const prevUserTime = new Date(userMessages[index - 1].createdAt).getTime()

        // Find all assistant replies for previous user message
        const prevAssistantMsgs = assistantMessages.filter((aMsg) => {
          const aMsgTime = new Date(aMsg.createdAt).getTime()
          return aMsgTime > prevUserTime && aMsgTime < userMsgTime
        })

        if (prevAssistantMsgs.length > 0) {
          // All previous user's assistant messages connect to current user message
          prevAssistantMsgs.forEach((aMsg) => {
            const assistantId = `assistant-${aMsg.id}`
            flowEdges.push({
              id: `edge-${assistantId}-to-${nodeId}`,
              source: assistantId,
              target: nodeId
            })
          })
        } else {
          // If no assistant messages, connect two user messages directly
          flowEdges.push({
            id: `edge-${prevUserNodeId}-to-${nodeId}`,
            source: prevUserNodeId,
            target: nodeId
          })
        }
      }
    })

    // Handle orphan assistant messages (no corresponding user message)
    const orphanAssistantMsgs = assistantMessages.filter(
      (aMsg) => !flowNodes.some((node) => node.id === `assistant-${aMsg.id}`)
    )

    if (orphanAssistantMsgs.length > 0) {
      // Add these orphan messages at the top of the chart
      const startY = flowNodes.length > 0 ? Math.min(...flowNodes.map((node) => node.position.y)) - verticalGap * 2 : 0

      orphanAssistantMsgs.forEach((aMsg, index) => {
        const assistantNodeId = `orphan-assistant-${aMsg.id}`

        // Get model data
        const aMsgAny = aMsg as any

        // Get model name
        const modelName = (aMsgAny.model && aMsgAny.model.name) || t('chat.history.assistant_node')

        // Get model ID
        const modelId = (aMsgAny.model && aMsgAny.model.id) || ''

        // Complete model info
        const modelInfo = aMsgAny.model as Model | undefined

        flowNodes.push({
          id: assistantNodeId,
          type: 'custom',
          data: {
            model: modelName,
            content: getMainTextContent(aMsg),
            type: 'assistant',
            messageId: aMsg.id,
            modelId: modelId,
            modelInfo
          },
          position: { x: baseX, y: startY - index * verticalGap },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top
        })

        // Connect adjacent orphan messages
        if (index > 0) {
          const prevNodeId = `orphan-assistant-${orphanAssistantMsgs[index - 1].id}`
          flowEdges.push({
            id: `edge-${prevNodeId}-to-${assistantNodeId}`,
            source: prevNodeId,
            target: assistantNodeId
          })
        }
      })
    }

    return { nodes: flowNodes, edges: flowEdges }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, messages, userMessages, assistantMessages, t])

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      const { nodes: flowNodes, edges: flowEdges } = buildConversationFlowData()
      setNodes([...flowNodes])
      setEdges([...flowEdges])
      setLoading(false)
    }, 500)
  }, [buildConversationFlowData, setNodes, setEdges])

  return (
    <FlowContainer>
      {loading ? (
        <LoadingContainer>
          <Spin size="large" />
        </LoadingContainer>
      ) : nodes.length > 0 ? (
        <ReactFlowProvider>
          <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              nodesDraggable={false}
              nodesConnectable={false}
              edgesFocusable={true}
              zoomOnDoubleClick={true}
              preventScrolling={true}
              elementsSelectable={true}
              selectNodesOnDrag={false}
              nodesFocusable={true}
              zoomOnScroll={true}
              panOnScroll={false}
              minZoom={0.4}
              maxZoom={1}
              defaultEdgeOptions={defaultEdgeOptions}
              fitView={true}
              fitViewOptions={{
                padding: 0.3,
                includeHiddenNodes: false,
                minZoom: 0.4,
                maxZoom: 1
              }}
              proOptions={{ hideAttribution: true }}
              className="react-flow-container"
              colorMode={theme === 'auto' ? 'system' : theme}>
              <Controls showInteractive={false} />
              <MiniMap
                nodeStrokeWidth={3}
                zoomable
                pannable
                nodeColor={(node) => (node.data.type === 'user' ? 'var(--color-info)' : 'var(--color-primary)')}
              />
            </ReactFlow>
          </div>
        </ReactFlowProvider>
      ) : (
        <EmptyContainer>
          <EmptyText>{t('chat.history.no_messages')}</EmptyText>
        </EmptyContainer>
      )}
    </FlowContainer>
  )
}

// Style component definitions
const FlowContainer = styled.div`
  width: 100%;
  height: 100%;
  min-height: 500px;
`

const LoadingContainer = styled.div`
  width: 100%;
  height: 100%;
  min-height: 500px;
  display: flex;
  justify-content: center;
  align-items: center;
`

const EmptyContainer = styled.div`
  width: 100%;
  height: 100%;
  min-height: 500px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--color-text-secondary);
`

const EmptyText = styled.div`
  font-size: 16px;
  margin-bottom: 8px;
  font-weight: bold;
`

const CustomNodeContainer = styled.div`
  padding: 12px;
  border-radius: 10px;
  border: 2px solid;
  width: 280px;
  height: 120px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 6px 10px rgba(0, 0, 0, 0.1),
      0 0 0 2px ${(props) => props.style?.borderColor || 'var(--color-border)'}80 !important;
    filter: brightness(1.02);
  }

  /* Add click animation effect */
  &:active {
    transform: scale(0.98);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.1s ease;
  }
`

const NodeHeader = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  color: var(--color-text);
  display: flex;
  align-items: center;
  min-height: 32px;
`

const NodeAvatar = styled.span`
  margin-right: 10px;
  display: flex;
  align-items: center;

  .ant-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`

const NodeTitle = styled.span`
  flex: 1;
  font-size: 16px;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const NodeContent = styled.div`
  margin: 2px 0;
  color: var(--color-text);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-height: 1.5;
  word-break: break-word;
  font-size: 14px;
  padding: 3px;
`

// Ensure the component is wrapped with React.memo to reduce unnecessary re-renders
export default memo(ChatFlowHistory)
