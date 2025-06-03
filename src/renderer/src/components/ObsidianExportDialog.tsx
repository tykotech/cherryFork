import i18n from '@renderer/i18n'
import store from '@renderer/store'
import { exportMarkdownToObsidian } from '@renderer/utils/export'
import { Alert, Empty, Form, Input, Modal, Select, Spin, TreeSelect } from 'antd'
import React, { useEffect, useState } from 'react'

const { Option } = Select

interface ObsidianExportDialogProps {
  title: string
  markdown: string
  open: boolean
  onClose: (success: boolean) => void
  obsidianTags: string | null
  processingMethod: string | '3' //default append (overwrite if exists)
}

interface FileInfo {
  path: string
  type: 'folder' | 'markdown'
  name: string
}

// Convert file info array to tree structure
const convertToTreeData = (files: FileInfo[]) => {
  const treeData: any[] = [
    {
      title: i18n.t('chat.topics.export.obsidian_root_directory'),
      value: '',
      isLeaf: false,
      selectable: true
    }
  ]

  // Record created node paths
  const pathMap: Record<string, any> = {
    '': treeData[0]
  }

  // Group by type, process folders first
  const folders = files.filter((file) => file.type === 'folder')
  const mdFiles = files.filter((file) => file.type === 'markdown')

  // Sort by path, ensure parent folders are created first
  const sortedFolders = [...folders].sort((a, b) => a.path.split('/').length - b.path.split('/').length)

  // Process all folders first, build directory structure
  for (const folder of sortedFolders) {
    const parts = folder.path.split('/')
    let currentPath = ''
    let parentPath = ''

    // Traverse each part of the folder path, ensure full path is created
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]

      // Build current path
      currentPath = currentPath ? `${currentPath}/${part}` : part

      // If this path node hasn't been created
      if (!pathMap[currentPath]) {
        const node = {
          title: part,
          value: currentPath,
          key: currentPath,
          isLeaf: false,
          selectable: true,
          children: []
        }

        // Get parent node, add current node to parent's children
        const parentNode = pathMap[parentPath]
        if (parentNode) {
          if (!parentNode.children) {
            parentNode.children = []
          }
          parentNode.children.push(node)
        }

        pathMap[currentPath] = node
      }

      // Update parent path for next level
      parentPath = currentPath
    }
  }

  // Then process md files
  for (const file of mdFiles) {
    const fullPath = file.path
    const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'))
    const fileName = file.name

    // Get parent folder node
    const parentNode = pathMap[dirPath] || pathMap['']

    // Create file node
    const fileNode = {
      title: fileName,
      value: fullPath,
      isLeaf: true,
      selectable: true,
      icon: <span style={{ marginRight: 4 }}>📄</span>
    }

    // Add to parent node
    if (!parentNode.children) {
      parentNode.children = []
    }
    parentNode.children.push(fileNode)
  }

  return treeData
}

const ObsidianExportDialog: React.FC<ObsidianExportDialogProps> = ({
  title,
  markdown,
  open,
  onClose,
  obsidianTags,
  processingMethod
}) => {
  const defaultObsidianVault = store.getState().settings.defaultObsidianVault
  const [state, setState] = useState({
    title,
    tags: obsidianTags || '',
    createdAt: new Date().toISOString().split('T')[0],
    source: 'TykoTech Fork',
    processingMethod: processingMethod,
    folder: ''
  })

  // Whether the title has been manually edited
  const [hasTitleBeenManuallyEdited, setHasTitleBeenManuallyEdited] = useState(false)
  const [vaults, setVaults] = useState<Array<{ path: string; name: string }>>([])
  const [files, setFiles] = useState<FileInfo[]>([])
  const [fileTreeData, setFileTreeData] = useState<any[]>([])
  const [selectedVault, setSelectedVault] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Handle file data conversion to tree structure
  useEffect(() => {
    if (files.length > 0) {
      const treeData = convertToTreeData(files)
      setFileTreeData(treeData)
    } else {
      setFileTreeData([
        {
          title: i18n.t('chat.topics.export.obsidian_root_directory'),
          value: '',
          isLeaf: false,
          selectable: true
        }
      ])
    }
  }, [files])

  // Fetch vault list on component mount
  useEffect(() => {
    const fetchVaults = async () => {
      try {
        setLoading(true)
        setError(null)
        const vaultsData = await window.obsidian.getVaults()

        if (vaultsData.length === 0) {
          setError(i18n.t('chat.topics.export.obsidian_no_vaults'))
          setLoading(false)
          return
        }

        setVaults(vaultsData)

        // Use default or first vault if none selected
        const vaultToUse = defaultObsidianVault || vaultsData[0]?.name
        if (vaultToUse) {
          setSelectedVault(vaultToUse)

          // Fetch files and folders of the selected vault
          const filesData = await window.obsidian.getFiles(vaultToUse)
          setFiles(filesData)
        }
      } catch (error) {
        console.error('Failed to fetch Obsidian Vault:', error)
        setError(i18n.t('chat.topics.export.obsidian_fetch_error'))
      } finally {
        setLoading(false)
      }
    }

    fetchVaults()
  }, [defaultObsidianVault])

  // Fetch files and folders of the selected vault
  useEffect(() => {
    if (selectedVault) {
      const fetchFiles = async () => {
        try {
          setLoading(true)
          setError(null)
          const filesData = await window.obsidian.getFiles(selectedVault)
          setFiles(filesData)
        } catch (error) {
          console.error('Failed to fetch Obsidian files:', error)
          setError(i18n.t('chat.topics.export.obsidian_fetch_folders_error'))
        } finally {
          setLoading(false)
        }
      }

      fetchFiles()
    }
  }, [selectedVault])

  const handleOk = async () => {
    if (!selectedVault) {
      setError(i18n.t('chat.topics.export.obsidian_no_vault_selected'))
      return
    }

    // Build content and copy to clipboard
    let content = ''
    if (state.processingMethod !== '3') {
      content = `\n---\n${markdown}`
    } else {
      content = `---
      \ntitle: ${state.title}
      \ncreated: ${state.createdAt}
      \nsource: ${state.source}
      \ntags: ${state.tags}
      \n---\n${markdown}`
    }
    if (content === '') {
      window.message.error(i18n.t('chat.topics.export.obsidian_export_failed'))
      return
    }

    await navigator.clipboard.writeText(content)

    // Export to Obsidian
    exportMarkdownToObsidian({
      ...state,
      folder: state.folder,
      vault: selectedVault
    })

    onClose(true)
  }

  const handleCancel = () => {
    onClose(false)
  }

  const handleChange = (key: string, value: any) => {
    setState((prevState) => ({ ...prevState, [key]: value }))
  }

  // Handle title input change
  const handleTitleInputChange = (newTitle: string) => {
    handleChange('title', newTitle)
    setHasTitleBeenManuallyEdited(true)
  }

  const handleVaultChange = (value: string) => {
    setSelectedVault(value)
    // Folder will be fetched automatically via useEffect
    setState((prevState) => ({
      ...prevState,
      folder: ''
    }))
  }

  // Handle file selection
  const handleFileSelect = (value: string) => {
    // Update folder value
    handleChange('folder', value)

    // Check if an md file is selected
    if (value) {
      const selectedFile = files.find((file) => file.path === value)
      if (selectedFile) {
        if (selectedFile.type === 'markdown') {
          // If it's an md file, auto-set title to filename and processing method to 1 (append)
          const fileName = selectedFile.name
          const titleWithoutExt = fileName.endsWith('.md') ? fileName.substring(0, fileName.length - 3) : fileName
          handleChange('title', titleWithoutExt)
          // Reset manual edit flag, as this is a non-user-set title
          setHasTitleBeenManuallyEdited(false)
          handleChange('processingMethod', '1')
        } else {
          // If it's a folder, auto-set title to topic name and processing method to 3 (new)
          handleChange('processingMethod', '3')
          // Only reset to props.title if the user hasn't manually edited the title
          if (!hasTitleBeenManuallyEdited) {
            // title is props.title
            handleChange('title', title)
          }
        }
      }
    }
  }

  return (
    <Modal
      title={i18n.t('chat.topics.export.obsidian_atributes')}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      width={600}
      closable
      maskClosable
      centered
      transitionName="animation-move-down"
      okButtonProps={{
        type: 'primary',
        disabled: vaults.length === 0 || loading || !!error
      }}
      okText={i18n.t('chat.topics.export.obsidian_btn')}>
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

      <Form layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} labelAlign="left">
        <Form.Item label={i18n.t('chat.topics.export.obsidian_title')}>
          <Input
            value={state.title}
            onChange={(e) => handleTitleInputChange(e.target.value)}
            placeholder={i18n.t('chat.topics.export.obsidian_title_placeholder')}
          />
        </Form.Item>

        <Form.Item label={i18n.t('chat.topics.export.obsidian_vault')}>
          {vaults.length > 0 ? (
            <Select
              loading={loading}
              value={selectedVault}
              onChange={handleVaultChange}
              placeholder={i18n.t('chat.topics.export.obsidian_vault_placeholder')}
              style={{ width: '100%' }}>
              {vaults.map((vault) => (
                <Option key={vault.name} value={vault.name}>
                  {vault.name}
                </Option>
              ))}
            </Select>
          ) : (
            <Empty
              description={
                loading
                  ? i18n.t('chat.topics.export.obsidian_loading')
                  : i18n.t('chat.topics.export.obsidian_no_vaults')
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Form.Item>

        <Form.Item label={i18n.t('chat.topics.export.obsidian_path')}>
          <Spin spinning={loading}>
            {selectedVault ? (
              <TreeSelect
                value={state.folder}
                onChange={handleFileSelect}
                placeholder={i18n.t('chat.topics.export.obsidian_path_placeholder')}
                style={{ width: '100%' }}
                showSearch
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                treeDefaultExpandAll={false}
                treeNodeFilterProp="title"
                treeData={fileTreeData}></TreeSelect>
            ) : (
              <Empty
                description={i18n.t('chat.topics.export.obsidian_select_vault_first')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Spin>
        </Form.Item>

        <Form.Item label={i18n.t('chat.topics.export.obsidian_tags')}>
          <Input
            value={state.tags}
            onChange={(e) => handleChange('tags', e.target.value)}
            placeholder={i18n.t('chat.topics.export.obsidian_tags_placeholder')}
          />
        </Form.Item>
        <Form.Item label={i18n.t('chat.topics.export.obsidian_created')}>
          <Input
            value={state.createdAt}
            onChange={(e) => handleChange('createdAt', e.target.value)}
            placeholder={i18n.t('chat.topics.export.obsidian_created_placeholder')}
          />
        </Form.Item>
        <Form.Item label={i18n.t('chat.topics.export.obsidian_source')}>
          <Input
            value={state.source}
            onChange={(e) => handleChange('source', e.target.value)}
            placeholder={i18n.t('chat.topics.export.obsidian_source_placeholder')}
          />
        </Form.Item>

        <Form.Item label={i18n.t('chat.topics.export.obsidian_operate')}>
          <Select
            value={state.processingMethod}
            onChange={(value) => handleChange('processingMethod', value)}
            placeholder={i18n.t('chat.topics.export.obsidian_operate_placeholder')}
            allowClear>
            <Option value="1">{i18n.t('chat.topics.export.obsidian_operate_append')}</Option>
            <Option value="2">{i18n.t('chat.topics.export.obsidian_operate_prepend')}</Option>
            <Option value="3">{i18n.t('chat.topics.export.obsidian_operate_new_or_overwrite')}</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default ObsidianExportDialog
