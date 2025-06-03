import ObsidianExportDialog from '@renderer/components/ObsidianExportDialog'
import { createRoot } from 'react-dom/client'

interface ObsidianExportOptions {
  title: string
  markdown: string
  processingMethod: string | '3' // Default is to add (overwrite if exists)
}

/**
 * Configure Obsidian note properties dialog
 * @param options.title Title
 * @param options.markdown Markdown content
 * @param options.processingMethod Processing method
 * @returns
 */
const showObsidianExportDialog = async (options: ObsidianExportOptions): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    const div = document.createElement('div')
    document.body.appendChild(div)
    const root = createRoot(div)

    const handleClose = (success: boolean) => {
      root.unmount()
      document.body.removeChild(div)
      resolve(success)
    }
    // No longer get tag configuration from store
    root.render(
      <ObsidianExportDialog
        title={options.title}
        markdown={options.markdown}
        obsidianTags=""
        processingMethod={options.processingMethod}
        open={true}
        onClose={handleClose}
      />
    )
  })
}

export default {
  show: showObsidianExportDialog
}
