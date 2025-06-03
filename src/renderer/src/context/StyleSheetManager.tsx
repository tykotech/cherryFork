import isPropValid from '@emotion/is-prop-valid'
import type { ReactNode } from 'react'
import { StyleSheetManager as StyledComponentsStyleSheetManager } from 'styled-components'

interface StyleSheetManagerProps {
  children: ReactNode
}

const StyleSheetManager = ({ children }: StyleSheetManagerProps): React.ReactElement => {
  return (
    <StyledComponentsStyleSheetManager
      shouldForwardProp={(prop, element) => {
        // For HTML elements, use isPropValid to check
        if (typeof element === 'string') {
          return isPropValid(prop)
        }
        // For custom components, allow all non-special props
        return prop !== '$' && !prop.startsWith('$')
      }}>
      {children}
    </StyledComponentsStyleSheetManager>
  )
}

export default StyleSheetManager
