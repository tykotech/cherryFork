import { useTheme } from '@renderer/context/ThemeProvider'
import { getShikiInstance } from '@renderer/utils/shiki'
import { Card } from 'antd'
import MarkdownIt from 'markdown-it'
import { npxFinder } from 'npx-scope-finder'
import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

interface McpDescriptionProps {
  searchKey: string
}

const MCPDescription = ({ searchKey }: McpDescriptionProps) => {
  const [renderedMarkdown, setRenderedMarkdown] = useState('')
  const [loading, setLoading] = useState(false)

  const md = useRef<MarkdownIt>(
    new MarkdownIt({
      linkify: true, // Automatically convert URLs to links
      typographer: true // Enable typography format optimization
    })
  )
  const { theme } = useTheme()

  const getMcpInfo = useCallback(async () => {
    setLoading(true)
    const packages = await npxFinder(searchKey).finally(() => setLoading(false))
    const readme = packages[0]?.original?.readme ?? 'No description available'
    setRenderedMarkdown(md.current.render(readme))
  }, [md, searchKey])

  useEffect(() => {
    const sk = getShikiInstance(theme)
    md.current.use(sk)
    getMcpInfo()
  }, [getMcpInfo, theme])

  return (
    <Section>
      <Card loading={loading}>
        <div className="markdown" dangerouslySetInnerHTML={{ __html: renderedMarkdown }} />
      </Card>
    </Section>
  )
}
const Section = styled.div`
  padding-top: 8px;
`

export default MCPDescription
