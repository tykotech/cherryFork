export const download = (url: string, filename?: string) => {
  // Handle file:// protocol
  if (url.startsWith('file://')) {
    const link = document.createElement('a')
    link.href = url
    link.download = filename || url.split('/').pop() || 'download'
    document.body.appendChild(link)
    link.click()
    link.remove()
    return
  }

  // Handle Blob URL
  if (url.startsWith('blob:')) {
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `${Date.now()}_diagram.svg`
    document.body.appendChild(link)
    link.click()
    link.remove()
    return
  }

  // Handle regular URL
  fetch(url)
    .then((response) => {
      let finalFilename = filename || 'download'

      if (!filename) {
        // Try to get filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition')
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
          if (filenameMatch) {
            finalFilename = filenameMatch[1]
          }
        }

        // If URL contains a filename, use it
        const urlFilename = url.split('/').pop()
        if (urlFilename && urlFilename.includes('.')) {
          finalFilename = urlFilename
        }

        // If filename has no extension, add one based on Content-Type
        if (!finalFilename.includes('.')) {
          const contentType = response.headers.get('Content-Type')
          const extension = getExtensionFromMimeType(contentType)
          finalFilename += extension
        }

        // Add timestamp to ensure unique filename
        finalFilename = `${Date.now()}_${finalFilename}`
      }

      return response.blob().then((blob) => ({ blob, finalFilename }))
    })
    .then(({ blob, finalFilename }) => {
      const blobUrl = URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = finalFilename
      document.body.appendChild(link)
      link.click()
      URL.revokeObjectURL(blobUrl)
      link.remove()
    })
}

// Helper function: Get file extension from MIME type
function getExtensionFromMimeType(mimeType: string | null): string {
  if (!mimeType) return '.bin' // Default binary file extension

  const mimeToExtension: { [key: string]: string } = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
  }

  return mimeToExtension[mimeType] || '.bin'
}
