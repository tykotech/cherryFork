import { omit } from 'lodash'
import React from 'react'

import CitationTooltip from './CitationTooltip'

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  node?: any
  citationData?: {
    url: string
    title?: string
    content?: string
  }
}

const Link: React.FC<LinkProps> = (props) => {
  // Handle internal links
  if (props.href?.startsWith('#')) {
    return <span className="link">{props.children}</span>
  }

  // Contains <sup> tag indicates a citation link
  const isCitation = React.Children.toArray(props.children).some((child) => {
    if (typeof child === 'object' && 'type' in child) {
      return child.type === 'sup'
    }
    return false
  })

  // If it is a citation link and citation data is available, use CitationTooltip
  if (isCitation && props.citationData) {
    return (
      <CitationTooltip citation={props.citationData}>
        <a
          {...omit(props, ['node', 'citationData'])}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
        />
      </CitationTooltip>
    )
  }

  // Normal link
  return (
    <a
      {...omit(props, ['node', 'citationData'])}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
    />
  )
}

export default Link
