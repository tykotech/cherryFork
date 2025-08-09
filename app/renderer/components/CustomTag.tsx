import { CloseOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import { FC, memo, useMemo } from 'react'

interface CustomTagProps {
  icon?: React.ReactNode
  children?: React.ReactNode | string
  color: string
  size?: number
  tooltip?: string
  closable?: boolean
  onClose?: () => void
}

const CustomTag: FC<CustomTagProps> = ({ children, icon, color, size = 12, tooltip, closable = false, onClose }) => {
  const tagContent = useMemo(() => {
    const tagStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: `${size / 3}px ${size * 0.8}px`,
      paddingRight: closable ? `${size * 1.8}px` : `${size * 0.8}px`,
      borderRadius: 99,
      color,
      backgroundColor: `${color}20`,
      fontSize: size,
      lineHeight: 1,
      whiteSpace: 'nowrap',
      position: 'relative'
    }

    const closeIconStyle: React.CSSProperties = {
      cursor: 'pointer',
      fontSize: size * 0.8,
      color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      right: size * 0.2,
      top: size * 0.2,
      bottom: size * 0.2,
      borderRadius: 99,
      transition: 'all 0.2s ease',
      aspectRatio: '1',
      lineHeight: 1
    }

    return (
      <div style={tagStyle}>
        {icon} {children}
        {closable && <CloseOutlined style={closeIconStyle} onClick={onClose} />}
      </div>
    )
  }, [children, closable, color, icon, onClose, size])

  return tooltip ? (
    <Tooltip title={tooltip} placement="top" mouseEnterDelay={0.3}>
      {tagContent}
    </Tooltip>
  ) : (
    tagContent
  )
}

export default memo(CustomTag)
