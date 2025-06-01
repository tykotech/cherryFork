import { FC } from 'react'
import { Route, Routes } from 'react-router-dom'

import AihubmixPage from './AihubmixPage'
import SiliconPage from './PaintingsPage'

const PaintingsRoutePage: FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AihubmixPage />} />
      <Route path="/aihubmix" element={<AihubmixPage />} />
      <Route path="/silicon" element={<SiliconPage />} />
    </Routes>
  )
}

export default PaintingsRoutePage
