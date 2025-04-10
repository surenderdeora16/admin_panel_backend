// src/components/modals/QuestionImportModal.jsx
import { useEffect, useState } from 'react'
import Modal from './Modal'
import AxiosHelper from '../../../../helper/AxiosHelper'

const QuestionImportModal = ({ isOpen, onClose, onImport }) => {
  const [file, setFile] = useState(null)
  const [topicId, setTopicId] = useState('')
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const { data } = await AxiosHelper.getData('topics')
        setTopics(data?.data?.record)
      } catch (err) {
        console.error(err)
      }
    }
    fetchTopics()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || !topicId) {
      return setError('Please select a file and topic')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('topicId', topicId)

    try {
      setLoading(true)
      await AxiosHelper.postData('/questions/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      onImport()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Questions">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Topic</option>
            {topics.map(topic => (
              <option key={topic._id} value={topic._id}>{topic.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CSV/Excel File
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            accept=".csv,.xlsx,.xls"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg border"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Importing...' : 'Import'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default  QuestionImportModal