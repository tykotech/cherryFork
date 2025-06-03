import { FC } from 'react'
import { Route, Routes } from 'react-router-dom'
import styled from 'styled-components'

import AihubmixPage from './AihubmixPage'
import SiliconPage from './PaintingsPage'

const PaintingsRoutePage: FC = () => {
  return (
    <PageContainer>
      <Routes>
        <Route path="/" element={<SiliconPage />} />
        <Route path="/aihubmix" element={<AihubmixPageWrapper />} />
        <Route path="/silicon" element={<SiliconPage />} />
      </Routes>
    </PageContainer>
  )
}

// Wrapper component to provide proper styling context for AihubmixPage
const AihubmixPageWrapper = () => {
  return (
    <AihubmixContainer>
      <AihubmixPage />
    </AihubmixContainer>
  )
}

const PageContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
`

const AihubmixContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100vh;
  background-color: var(--color-background);

  /* Tailwind CSS equivalents for AihubmixPage */
  .p-4 {
    padding: 1rem;
  }

  .text-2xl {
    font-size: 1.5rem;
    line-height: 2rem;
  }

  .font-bold {
    font-weight: 700;
  }

  .mb-6 {
    margin-bottom: 1.5rem;
  }

  .grid {
    display: grid;
  }

  .grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  .grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 768px) {
    .md\\:grid-cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .md\\:col-span-1 {
      grid-column: span 1 / span 1;
    }
    .md\\:col-span-2 {
      grid-column: span 2 / span 2;
    }
  }

  .gap-4 {
    gap: 1rem;
  }

  .border-2 {
    border-width: 2px;
  }

  .border-dashed {
    border-style: dashed;
  }

  .rounded-lg {
    border-radius: 0.5rem;
  }

  .flex {
    display: flex;
  }

  .items-center {
    align-items: center;
  }

  .justify-center {
    justify-content: center;
  }

  .text-center {
    text-align: center;
  }

  .text-gray-500 {
    color: var(--color-text-3);
  }

  .space-y-6 > * + * {
    margin-top: 1.5rem;
  }

  .space-y-4 > * + * {
    margin-top: 1rem;
  }

  .w-full {
    width: 100%;
  }

  .max-w-full {
    max-width: 100%;
  }

  .max-h-80 {
    max-height: 20rem;
  }

  .object-contain {
    object-fit: contain;
  }

  .block {
    display: block;
  }

  .text-sm {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  .font-medium {
    font-weight: 500;
  }

  .mb-1 {
    margin-bottom: 0.25rem;
  }

  .mb-4 {
    margin-bottom: 1rem;
  }

  .space-x-2 > * + * {
    margin-left: 0.5rem;
  }

  .pt-4 {
    padding-top: 1rem;
  }

  .justify-between {
    justify-content: space-between;
  }

  /* Style overrides to match project theme */
  .ant-card {
    background-color: var(--color-background);
    border: 0.5px solid var(--color-border);
    border-radius: var(--list-item-border-radius);
  }

  .ant-card-head {
    border-bottom: 0.5px solid var(--color-border);
    background-color: var(--color-background-soft);
  }

  .ant-card-body {
    background-color: var(--color-background);
  }

  .ant-input {
    background-color: var(--color-background);
    border-color: var(--color-border);
    color: var(--color-text);
  }

  .ant-input:focus,
  .ant-input:hover {
    border-color: var(--color-primary);
  }

  .ant-slider-track {
    background-color: var(--color-primary);
  }

  .ant-slider-handle {
    border-color: var(--color-primary);
  }

  .ant-btn-primary {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
  }

  .ant-btn-primary:hover {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    opacity: 0.8;
  }
`

export default PaintingsRoutePage
