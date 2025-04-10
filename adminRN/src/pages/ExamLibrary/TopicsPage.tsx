// src/pages/TopicsPage.jsx
import { useState, useEffect } from 'react'
import DataTable from './components/DataTable'
import TopicModal from './components/modals/TopicModal'
import ConfirmModal from './components/modals/ConfirmModal'
import AxiosHelper from '../../helper/AxiosHelper'

const TopicsPage = ()=> {
  const [topics, setTopics] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState(null)

  const columns = [
    { key: 'name', title: 'Topic Name' },
    { 
      key: 'chapterId', 
      title: 'Chapter',
      render: (item) => item.chapterId?.name || 'N/A'
    },
    { 
      key: 'createdAt', 
      title: 'Created At',
      render: (item) => new Date(item.createdAt).toLocaleDateString()
    },
  ]

  useEffect(() => {
    fetchTopics()
  }, [])

  const fetchTopics = async (search = '') => {
    setIsLoading(true)
    try {
      const { data } = await AxiosHelper.getData(`topics?query=${search}`)
      setTopics(data?.data?.record)
    } catch (error) {
      console.error(error)
    }
    setIsLoading(false)
  }

  const handleSave = async (topicData) => {
    try {
      if (selectedTopic) {
        await AxiosHelper.putData(`/topics/${selectedTopic._id}`, topicData)
      } else {
        await AxiosHelper.postData('/topics', topicData)
      }
      fetchTopics()
      setShowModal(false)
    } catch (error) {
      console.error(error)
    }
  }

  const handleDelete = async () => {
    try {
      await AxiosHelper.deleteData(`/topics/${selectedTopic._id}`)
      fetchTopics()
      setShowDeleteModal(false)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <DataTable
        columns={columns}
        data={topics}
        isLoading={isLoading}
        onAdd={() => {
          setSelectedTopic(null)
          setShowModal(true)
        }}
        onEdit={(topic) => {
          setSelectedTopic(topic)
          setShowModal(true)
        }}
        onDelete={(topic) => {
          setSelectedTopic(topic)
          setShowDeleteModal(true)
        }}
        onSearch={fetchTopics}
      />

      <TopicModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        topic={selectedTopic}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Topic"
        message={`Are you sure you want to delete "${selectedTopic?.name}"? All related questions will also be deleted.`}
      />
    </div>
  )
}

export default TopicsPage