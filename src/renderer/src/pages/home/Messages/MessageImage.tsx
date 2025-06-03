import {
  CopyOutlined,
  DownloadOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined
} from '@ant-design/icons'
import type { ImageMessageBlock } from '@renderer/types/newMessage'
import { Image as AntdImage, Space } from 'antd'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  block: ImageMessageBlock
}

const MessageImage: FC<Props> = ({ block }) => {
  const { t } = useTranslation()

  const onDownload = (imageBase64: string, index: number) => {
    try {
      const link = document.createElement('a')
      link.href = imageBase64
      link.download = `image-${Date.now()}-${index}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.message.success(t('message.download.success'))
    } catch (error) {
      console.error('Failed to download image:', error)
      window.message.error(t('message.download.failed'))
    }
  }

  // Copy image to clipboard
  const onCopy = async (type: string, image: string) => {
    try {
      switch (type) {
        case 'base64': {
          // Handle base64 format image
          const parts = image.split(';base64,')
          if (parts.length === 2) {
            const mimeType = parts[0].replace('data:', '')
            const base64Data = parts[1]
            const byteCharacters = atob(base64Data)
            const byteArrays: Uint8Array[] = []

            for (let offset = 0; offset < byteCharacters.length; offset += 512) {
              const slice = byteCharacters.slice(offset, offset + 512)
              const byteNumbers = new Array(slice.length)
              for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i)
              }
              const byteArray = new Uint8Array(byteNumbers)
              byteArrays.push(byteArray)
            }

            const blob = new Blob(byteArrays, { type: mimeType })
            await navigator.clipboard.write([new ClipboardItem({ [mimeType]: blob })])
          } else {
            throw new Error('Invalid base64 image format')
          }
          break
        }
        case 'url':
          {
            // Handle URL format image
            const response = await fetch(image)
            const blob = await response.blob()

            await navigator.clipboard.write([
              new ClipboardItem({
                [blob.type]: blob
              })
            ])
          }
          break
      }

      window.message.success(t('message.copy.success'))
    } catch (error) {
      console.error('Failed to copy image:', error)
      window.message.error(t('message.copy.failed'))
    }
  }

  const renderToolbar =
    (currentImage: string, currentIndex: number) =>
    (
      _: any,
      {
        transform: { scale },
        actions: { onFlipY, onFlipX, onRotateLeft, onRotateRight, onZoomOut, onZoomIn, onReset }
      }: any
    ) => (
      <ToobarWrapper size={12} className="toolbar-wrapper">
        <SwapOutlined rotate={90} onClick={onFlipY} />
        <SwapOutlined onClick={onFlipX} />
        <RotateLeftOutlined onClick={onRotateLeft} />
        <RotateRightOutlined onClick={onRotateRight} />
        <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
        <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
        <UndoOutlined onClick={onReset} />
        <CopyOutlined onClick={() => onCopy(block.metadata?.generateImageResponse?.type!, currentImage)} />
        <DownloadOutlined onClick={() => onDownload(currentImage, currentIndex)} />
      </ToobarWrapper>
    )

  const images = block.metadata?.generateImageResponse?.images?.length
    ? block.metadata?.generateImageResponse?.images
    : block?.file?.path
      ? [`file://${block?.file?.path}`]
      : []

  return (
    <Container style={{ marginBottom: 8 }}>
      {images.map((image, index) => (
        <Image
          src={image}
          key={`image-${index}`}
          style={{ maxWidth: 500, maxHeight: 500 }}
          preview={{ toolbarRender: renderToolbar(image, index) }}
        />
      ))}
    </Container>
  )
}
const Container = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  margin-top: 8px;
`
const Image = styled(AntdImage)`
  padding: 5px;
  border-radius: 8px;
`
const ToobarWrapper = styled(Space)`
  padding: 0px 24px;
  color: #fff;
  font-size: 20px;
  background-color: rgba(238, 233, 233, 0.1);
  border-radius: 100px;
  .anticon {
    padding: 12px;
    cursor: pointer;
  }
  .anticon:hover {
    opacity: 0.3;
  }
`

export default MessageImage
