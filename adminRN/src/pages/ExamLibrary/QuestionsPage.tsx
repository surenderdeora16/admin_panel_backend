// src/pages/QuestionsPage.jsx
import { useState, useEffect } from 'react'
import DataTable from './components/DataTable'
import QuestionModal from './components/modals/QuestionModal'
import QuestionImportModal from './components/modals/QuestionImportModal'
import ConfirmModal from './components/modals/ConfirmModal'
import AxiosHelper from '../../helper/AxiosHelper'


const QuestionsPage=()=> {
  const [questions, setQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)

  const columns = [
    { 
      key: 'questionText', 
      title: 'Question',
      render: (item) => <div className="max-w-prose">{item.questionText}</div>
    },
    { 
      key: 'topicId', 
      title: 'Topic',
      render: (item) => item.topicId?.name || 'N/A'
    },
    { 
      key: 'difficulty', 
      title: 'Difficulty',
      render: (item) => <span className="capitalize">{item.difficulty}</span>
    },
  ]

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async (search = '') => {
    setIsLoading(true)
    try {
      const { data } = await AxiosHelper.getData(`questions?query=${search}`)
      setQuestions(data?.data?.record)
    } catch (error) {
      console.error(error)
    }
    setIsLoading(false)
  }

  const handleSave = async (questionData) => {
    try {
      if (selectedQuestion) {
        await AxiosHelper.putData(`/questions/${selectedQuestion._id}`, questionData)
      } else {
        await AxiosHelper.postData('/questions', questionData)
      }
      fetchQuestions()
      setShowModal(false)
    } catch (error) {
      console.error(error)
    }
  }

  const handleImport = () => {
    fetchQuestions()
    setShowImportModal(false)
  }

  const handleDelete = async () => {
    try {
      await AxiosHelper.deleteData(`/questions/${selectedQuestion._id}`)
      fetchQuestions()
      setShowDeleteModal(false)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <DataTable
        columns={columns}
        data={questions}
        isLoading={isLoading}
        onAdd={() => {
          setSelectedQuestion(null)
          setShowModal(true)
        }}
        onEdit={(question) => {
          setSelectedQuestion(question)
          setShowModal(true)
        }}
        onDelete={(question) => {
          setSelectedQuestion(question)
          setShowDeleteModal(true)
        }}
        onSearch={fetchQuestions}
        onImport={() => setShowImportModal(true)}
      />

      <QuestionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        question={selectedQuestion}
        onSave={handleSave}
      />

      <QuestionImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Question"
        message="Are you sure you want to delete this question?"
      />
    </div>
  )
}

export default QuestionsPage