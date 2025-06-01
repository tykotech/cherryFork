import { XMLParser } from 'fast-xml-parser'

export interface ExtractResults {
  websearch?: WebsearchExtractResults
  knowledge?: KnowledgeExtractResults
}

export interface WebsearchExtractResults {
  question: string[]
  links?: string[]
}

export interface KnowledgeExtractResults {
  rewrite: string
  question: string[]
}
/**
 * Extracts information from text containing XML tags
 * @public
 * @param text Text containing XML tags
 * @returns Extracted information object
 * @throws
 */
export const extractInfoFromXML = (text: string): ExtractResults => {
  // Logger.log('extract text', text)
  const parser = new XMLParser({
    isArray: (name) => {
      return name === 'question' || name === 'links'
    }
  })
  // Logger.log('Extracted results:', extractResults)
  return parser.parse(text)
}
