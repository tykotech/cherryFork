import { DeleteOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons'
import { Button, Card, Input, message, Slider, Upload } from 'antd'
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface'
import React, { useState } from 'react'

interface Painting {
  id: string
  prompt: string
  image?: string
  width: number
  height: number
  steps: number
  guidanceScale: number
  seed: number
  timestamp: number
}

const DEFAULT_PAINTING: Painting = {
  id: '1',
  prompt: '',
  width: 512,
  height: 512,
  steps: 50,
  guidanceScale: 7.5,
  seed: Math.floor(Math.random() * 1000000),
  timestamp: Date.now()
}

interface AihubmixPageProps {
  // Add any props here if needed in the future
}

const AihubmixPage: React.FC<AihubmixPageProps> = () => {
  const [painting, setPainting] = useState<Painting>(DEFAULT_PAINTING)
  const [isGenerating, setIsGenerating] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  const handleGenerate = async () => {
    if (!painting.prompt.trim()) {
      message.warning('Please enter a prompt')
      return
    }

    try {
      setIsGenerating(true)
      // TODO: Implement actual generation logic
      await new Promise((resolve) => setTimeout(resolve, 2000))
      message.success('Image generated successfully')
    } catch (error) {
      console.error('Error generating image:', error)
      message.error('Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!painting.image) return
    const link = document.createElement('a')
    link.href = painting.image
    link.download = `ai-painting-${painting.id}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleClear = () => {
    setPainting((prev) => ({
      ...DEFAULT_PAINTING,
      id: prev.id,
      timestamp: Date.now()
    }))
    setFileList([])
  }

  const handleUpload = (info: UploadChangeParam<UploadFile>) => {
    const file = info.file.originFileObj as File | undefined
    if (file) {
      const reader = new FileReader()
      reader.onload = (e: ProgressEvent<FileReader>) => {
        setPainting((prev) => ({
          ...prev,
          image: e.target?.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">AI HubMix</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <div
            className="border-2 border-dashed rounded-lg p-4 flex items-center justify-center"
            style={{ minHeight: '300px' }}>
            {painting.image ? (
              <img src={painting.image} alt="Generated preview" className="max-w-full max-h-80 object-contain" />
            ) : (
              <div className="text-center">
                <p className="text-gray-500 mb-4">No image generated yet</p>
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={() => false}
                  onChange={handleUpload}
                  fileList={fileList}>
                  <Button icon={<UploadOutlined />}>Upload Image</Button>
                </Upload>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card title="Image Generation" className="w-full">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Prompt</label>
                <Input.TextArea
                  rows={3}
                  value={painting.prompt}
                  onChange={(e) => setPainting({ ...painting, prompt: e.target.value })}
                  placeholder="Describe what you want to generate..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Width: {painting.width}px</label>
                  <Slider
                    min={256}
                    max={1024}
                    step={64}
                    value={painting.width}
                    onChange={(value) => setPainting({ ...painting, width: value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Height: {painting.height}px</label>
                  <Slider
                    min={256}
                    max={1024}
                    step={64}
                    value={painting.height}
                    onChange={(value) => setPainting({ ...painting, height: value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Steps: {painting.steps}</label>
                <Slider
                  min={10}
                  max={100}
                  step={1}
                  value={painting.steps}
                  onChange={(value) => setPainting({ ...painting, steps: value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Guidance Scale: {painting.guidanceScale}</label>
                <Slider
                  min={1}
                  max={20}
                  step={0.5}
                  value={painting.guidanceScale}
                  onChange={(value) => setPainting({ ...painting, guidanceScale: value })}
                />
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button type="primary" loading={isGenerating} onClick={handleGenerate}>
                  Generate
                </Button>
                <div className="space-x-2">
                  <Button icon={<DownloadOutlined />} onClick={handleDownload} disabled={!painting.image}>
                    Download
                  </Button>
                  <Button danger icon={<DeleteOutlined />} onClick={handleClear}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AihubmixPage
