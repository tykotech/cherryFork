import { CSSProperties } from 'react'

interface DividerWithTextProps {
  text: string
  style?: CSSProperties
}

export default function DividerWithText({ text, style }: DividerWithTextProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', margin: '0px 0', ...style }}>
      <span style={{ fontSize: 12, color: 'var(--color-text-2)', marginRight: 8 }}>{text}</span>
      <div style={{ flex: 1, height: 1, backgroundColor: 'var(--color-border)' }} />
    </div>
  )
}
