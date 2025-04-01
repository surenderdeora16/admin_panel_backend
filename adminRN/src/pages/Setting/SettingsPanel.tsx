import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import WebsiteSelector from './WebsiteSelector'

const SettingsPanel: React.FC = () => {
  const [selectedWebsite, setSelectedWebsite] = useState('')

  return (
    <div className="w-full mx-auto p-10">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 py-4 px-6">
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Settings
          </h3>
        </div>
        <div className="p-6 space-y-6">
          {/* <WebsiteSelector onSelect={setSelectedWebsite} /> */}
          <Outlet context={{ selectedWebsite }} />
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel

