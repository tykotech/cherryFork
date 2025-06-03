import i18n from '@renderer/i18n'
import imageCompression from 'browser-image-compression'
import * as htmlToImage from 'html-to-image'

/**
 * Convert a file to a Base64-encoded string or ArrayBuffer.
 * @param file The file to convert
 * @returns Promise<string | ArrayBuffer | null> The converted Base64-encoded data, or null if an error occurs
 */
export const convertToBase64 = (file: File): Promise<string | ArrayBuffer | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Compress an image file, limiting the maximum size and dimensions.
 * @param file The image file to compress
 * @returns Promise<File> The compressed image file
 */
export const compressImage = async (file: File) => {
  return await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 300,
    useWebWorker: false
  })
}

/**
 * Capture the image data of the specified div element.
 * @param divRef The reference to the div element
 * @returns Promise<string | undefined> The image data URL, or undefined if it fails
 */
export async function captureDiv(divRef: React.RefObject<HTMLDivElement>) {
  if (divRef.current) {
    try {
      const canvas = await htmlToImage.toCanvas(divRef.current)
      const imageData = canvas.toDataURL('image/png')
      return imageData
    } catch (error) {
      console.error('Error capturing div:', error)
      return Promise.reject()
    }
  }
  return Promise.resolve(undefined)
}

/**
 * Capture the full content image of a scrollable div element.
 * @param divRef The reference to the scrollable div element
 * @returns Promise<HTMLCanvasElement | undefined> The captured canvas object, or undefined if it fails
 */
export const captureScrollableDiv = async (divRef: React.RefObject<HTMLDivElement | null>) => {
  if (divRef.current) {
    try {
      const div = divRef.current

      // Save original styles
      const originalStyle = {
        height: div.style.height,
        maxHeight: div.style.maxHeight,
        overflow: div.style.overflow,
        position: div.style.position
      }

      const originalScrollTop = div.scrollTop

      // Modify styles to show full content
      div.style.height = 'auto'
      div.style.maxHeight = 'none'
      div.style.overflow = 'visible'
      div.style.position = 'static'

      // calculate the size of the div
      const totalWidth = div.scrollWidth
      const totalHeight = div.scrollHeight

      // check if the size of the div is too large
      const MAX_ALLOWED_DIMENSION = 32767 // the maximum allowed pixel size
      if (totalHeight > MAX_ALLOWED_DIMENSION || totalWidth > MAX_ALLOWED_DIMENSION) {
        // restore the original styles
        div.style.height = originalStyle.height
        div.style.maxHeight = originalStyle.maxHeight
        div.style.overflow = originalStyle.overflow
        div.style.position = originalStyle.position

        // restore the original scroll position
        setTimeout(() => {
          div.scrollTop = originalScrollTop
        }, 0)

        window.message.error({
          content: i18n.t('message.error.dimension_too_large'),
          key: 'export-error'
        })
        return Promise.reject()
      }

      const canvas = await new Promise<HTMLCanvasElement>((resolve, reject) => {
        htmlToImage
          .toCanvas(div, {
            backgroundColor: getComputedStyle(div).getPropertyValue('--color-background'),
            cacheBust: true,
            pixelRatio: window.devicePixelRatio,
            skipAutoScale: true,
            canvasWidth: div.scrollWidth,
            canvasHeight: div.scrollHeight,
            style: {
              backgroundColor: getComputedStyle(div).backgroundColor,
              color: getComputedStyle(div).color
            }
          })
          .then((canvas) => resolve(canvas))
          .catch((error) => reject(error))
      })

      // Restore original styles
      div.style.height = originalStyle.height
      div.style.maxHeight = originalStyle.maxHeight
      div.style.overflow = originalStyle.overflow
      div.style.position = originalStyle.position

      const imageData = canvas

      // Restore original scroll position
      setTimeout(() => {
        div.scrollTop = originalScrollTop
      }, 0)

      return imageData
    } catch (error) {
      console.error('Error capturing scrollable div:', error)
      throw error
    }
  }

  return Promise.resolve(undefined)
}

/**
 * Convert the image data of a scrollable div element to Data URL format.
 * @param divRef The reference to the scrollable div element
 * @returns Promise<string | undefined> The image data URL, or undefined if it fails
 */
export const captureScrollableDivAsDataURL = async (divRef: React.RefObject<HTMLDivElement | null>) => {
  return captureScrollableDiv(divRef).then((canvas) => {
    if (canvas) {
      return canvas.toDataURL('image/png')
    }
    return Promise.resolve(undefined)
  })
}

/**
 * Convert the image data of a scrollable div element to Blob format.
 * @param divRef The reference to the scrollable div element
 * @param func The Blob callback function
 * @returns Promise<void> The result of the processing
 */
export const captureScrollableDivAsBlob = async (
  divRef: React.RefObject<HTMLDivElement | null>,
  func: BlobCallback
) => {
  await captureScrollableDiv(divRef).then((canvas) => {
    canvas?.toBlob(func, 'image/png')
  })
}
