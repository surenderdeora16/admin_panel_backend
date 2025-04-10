// src/pages/ChaptersPage.jsx
import { useState, useEffect } from 'react'
import DataTable from './components/DataTable'
import ChapterModal from './components/modals/ChapterModal'
import ConfirmModal from './components/modals/ConfirmModal'
import AxiosHelper from '../../helper/AxiosHelper'


const ChaptersPage = ()=> {
  const [chapters, setChapters] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState(null)

  const columns = [
    { key: 'name', title: 'Chapter Name' },
    { 
      key: 'subjectId', 
      title: 'Subject',
      render: (item) => item.subjectId?.name || 'N/A'
    },
    { 
      key: 'createdAt', 
      title: 'Created At',
      render: (item) => new Date(item.createdAt).toLocaleDateString()
    },
  ]

  useEffect(() => {
    fetchChapters()
  }, [])

  const fetchChapters = async (search = '') => {
    setIsLoading(true)
    try {
      const { data } = await AxiosHelper.getData(`chapters?query=${search}`)
      setChapters(data?.data?.record)
    } catch (error) {
      console.error(error)
    }
    setIsLoading(false)
  }

  const handleSave = async (chapterData) => {
    try {
      if (selectedChapter) {
        await AxiosHelper.putData(`chapters/${selectedChapter._id}`, chapterData)
      } else {
        await AxiosHelper.postData('chapters', chapterData)
      }
      fetchChapters()
      setShowModal(false)
    } catch (error) {
      console.error(error)
    }
  }

  const handleDelete = async () => {
    try {
      await AxiosHelper.deleteData(`chapters/${selectedChapter._id}`)
      fetchChapters()
      setShowDeleteModal(false)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <DataTable
        columns={columns}
        data={chapters}
        isLoading={isLoading}
        onAdd={() => {
          setSelectedChapter(null)
          setShowModal(true)
        }}
        onEdit={(chapter) => {
          setSelectedChapter(chapter)
          setShowModal(true)
        }}
        onDelete={(chapter) => {
          setSelectedChapter(chapter)
          setShowDeleteModal(true)
        }}
        onSearch={fetchChapters}
      />

      <ChapterModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        chapter={selectedChapter}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Chapter"
        message={`Are you sure you want to delete "${selectedChapter?.name}"? All related topics and questions will also be deleted.`}
      />
    </div>
  )
}

export default ChaptersPage