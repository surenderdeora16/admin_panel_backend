// src/components/modals/TopicModal.jsx
import { useState, useEffect } from 'react'
import Modal from './Modal'
import AxiosHelper from '../../../../helper/AxiosHelper'

const TopicModal = ({ isOpen, onClose, topic, onSave }) => {
  const [formData, setFormData] = useState({ name: '', chapterId: '' })
  const [chapters, setChapters] = useState([])
  const [errors, setErrors] = useState({})
  const [loadingChapters, setLoadingChapters] = useState(true)

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const { data } = await AxiosHelper.getData('chapters')
        setChapters(data?.data?.record)
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingChapters(false)
      }
    }
    fetchChapters()
  }, [])

  useEffect(() => {
    if (topic) {
      setFormData({
        name: topic.name,
        chapterId: topic.chapterId?._id || topic.chapterId
      })
    } else {
      setFormData({ name: '', chapterId: '' })
    }
    setErrors({})
  }, [topic, isOpen])

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.chapterId) newErrors.chapterId = 'Chapter is required'
    return newErrors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      return setErrors(validationErrors)
    }
    onSave(formData)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={topic ? 'Edit Topic' : 'Create Topic'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chapter</label>
          <select
            value={formData.chapterId}
            onChange={(e) => setFormData({ ...formData, chapterId: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.chapterId ? 'border-red-500' : 'border-gray-300'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            disabled={loadingChapters}
          >
            <option value="">Select Chapter</option>
            {chapters.map((chapter) => (
              <option key={chapter._id} value={chapter._id}>
                {chapter.name}
              </option>
            ))}
          </select>
          {errors.chapterId && <p className="mt-1 text-sm text-red-600">{errors.chapterId}</p>}
          {loadingChapters && <p className="mt-1 text-sm text-gray-500">Loading chapters...</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default TopicModal