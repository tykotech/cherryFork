import { UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { Modal, Tree, Upload } from 'antd'
import type { DataNode } from 'antd/es/tree'
import React, { useEffect, useState } from 'react'

interface PreviewFile {
  url: string
  type: string
}

const FilePage: React.FC = () => {
  const [treeData, setTreeData] = useState<DataNode[]>([])
  const [preview, setPreview] = useState<PreviewFile | null>(null)

  const loadFiles = async () => {
    try {
      const res = await fetch('/api/files')
      const data = await res.json()
      setTreeData(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [])

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,

    customRequest: async (options: any) => {
      const form = new FormData()
      form.append('file', options.file as File)
      try {
        await fetch('/api/files/upload', {
          method: 'POST',
          body: form
        })
        options.onSuccess?.(null, options.file)
        loadFiles()
      } catch (e) {
        console.error(e)
        options.onError?.(e as Error)
      }
    }
  }

  const handleSelect = async (_: React.Key[], info: any) => {
    if (info.node.isLeaf) {
      try {
        const res = await fetch(`/api/files/${info.node.key}`)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setPreview({ url, type: blob.type })
      } catch (e) {
        console.error(e)
      }
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <Upload.Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <UploadOutlined />
        </p>
        <p>Drag files here to upload</p>
      </Upload.Dragger>
      <Tree style={{ marginTop: 16 }} treeData={treeData} onSelect={handleSelect} />
      <Modal open={!!preview} footer={null} onCancel={() => setPreview(null)} width={800}>
        {preview?.type.startsWith('image/') ? (
          <img src={preview.url} style={{ width: '100%' }} />
        ) : (
          <iframe src={preview?.url} style={{ width: '100%', height: '80vh' }} sandbox="" />
        )}
      </Modal>
    </div>
  )
}

export default FilePage
