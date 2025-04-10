// src/components/modals/QuestionModal.jsx
import { useState, useEffect } from 'react'
import Modal from './Modal'
import AxiosHelper from '../../../../helper/AxiosHelper'

const QuestionModal = ({ isOpen, onClose, question, onSave }) => {
  const [formData, setFormData] = useState({
    questionText: '',
    options: ['', ''],
    correctAnswer: '',
    topicId: '',
    difficulty: 'medium'
  })
  
  const [topics, setTopics] = useState([])
  const [errors, setErrors] = useState({})
  const [loadingTopics, setLoadingTopics] = useState(true)

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const { data } = await AxiosHelper.getData('topics')
        setTopics(data?.data?.record)
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingTopics(false)
      }
    }
    fetchTopics()
  }, [])

  useEffect(() => {
    if (question) {
      setFormData({
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        topicId: question.topicId?._id || question.topicId,
        difficulty: question.difficulty
      })
    } else {
      setFormData({
        questionText: '',
        options: ['', ''],
        correctAnswer: '',
        topicId: '',
        difficulty: 'medium'
      })
    }
    setErrors({})
  }, [question, isOpen])

  const validate = () => {
    const newErrors = {}
    if (!formData.questionText.trim()) newErrors.questionText = 'Question text is required'
    if (!formData.topicId) newErrors.topicId = 'Topic is required'
    if (formData.options.some(opt => !opt.trim())) newErrors.options = 'All options must be filled'
    if (!formData.correctAnswer) newErrors.correctAnswer = 'Correct answer is required'
    return newErrors
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData({ ...formData, options: newOptions })
  }

  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData({ ...formData, options: [...formData.options, ''] })
    }
  }

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index)
      setFormData({ ...formData, options: newOptions })
    }
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
    <Modal isOpen={isOpen} onClose={onClose} title={question ? 'Edit Question' : 'Create Question'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
          <select
            value={formData.topicId}
            onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.topicId ? 'border-red-500' : 'border-gray-300'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            disabled={loadingTopics}
          >
            <option value="">Select Topic</option>
            {topics.map((topic) => (
              <option key={topic._id} value={topic._id}>
                {topic.name}
              </option>
            ))}
          </select>
          {errors.topicId && <p className="mt-1 text-sm text-red-600">{errors.topicId}</p>}
          {loadingTopics && <p className="mt-1 text-sm text-gray-500">Loading topics...</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
          <textarea
            value={formData.questionText}
            onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.questionText ? 'border-red-500' : 'border-gray-300'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            rows={3}
          />
          {errors.questionText && <p className="mt-1 text-sm text-red-600">{errors.questionText}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
          <div className="space-y-2">
            {formData.options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded-lg ${
                    errors.options ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="px-2 text-red-600 hover:text-red-700 disabled:opacity-50"
                  disabled={formData.options.length <= 2}
                >
                  ×
                </button>
              </div>
            ))}
            {errors.options && <p className="mt-1 text-sm text-red-600">{errors.options}</p>}
            <button
              type="button"
              onClick={addOption}
              className="text-blue-600 text-sm hover:text-blue-700"
              disabled={formData.options.length >= 10}
            >
              + Add Option
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
          <select
            value={formData.correctAnswer}
            onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.correctAnswer ? 'border-red-500' : 'border-gray-300'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          >
            <option value="">Select Correct Answer</option>
            {formData.options.map((option, index) => (
              <option key={index} value={option}>
                Option {index + 1}
              </option>
            ))}
          </select>
          {errors.correctAnswer && <p className="mt-1 text-sm text-red-600">{errors.correctAnswer}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
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

export default QuestionModal