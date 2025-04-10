// src/pages/SubjectsPage.jsx
import { useState, useEffect } from 'react'
import DataTable from './components/DataTable'
import SubjectModal from './components/modals/SubjectModal'
import ConfirmModal from './components/modals/ConfirmModal'
import AxiosHelper from '../../helper/AxiosHelper'

const SubjectsPage  = ()=> {
  const [subjects, setSubjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState(null)

  const columns = [
    { key: 'name', title: 'Subject Name' },
    { 
      key: 'createdAt', 
      title: 'Created At',
      render: (item) => new Date(item.createdAt).toLocaleDateString()
    },
  ]

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async (search = '') => {
    setIsLoading(true)
    try {
      const { data } = await AxiosHelper.getData(`subjects?query=${search}`)
      setSubjects(data?.data?.record)
    } catch (error) {
      console.error(error)
    }
    setIsLoading(false)
  }

  const handleSave = async (subjectData) => {
    try {
      if (selectedSubject) {
        await AxiosHelper.putData(`subjects/${selectedSubject._id}`, subjectData)
      } else {
        await AxiosHelper.postData('subjects', subjectData)
      }
      fetchSubjects()
      setShowModal(false)
    } catch (error) {
      console.error(error)
    }
  }

  const handleDelete = async () => {
    try {
      await AxiosHelper.deleteData(`subjects/${selectedSubject._id}`)
      fetchSubjects()
      setShowDeleteModal(false)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <DataTable
        columns={columns}
        data={subjects}
        isLoading={isLoading}
        onAdd={() => {
          setSelectedSubject(null)
          setShowModal(true)
        }}
        onEdit={(subject) => {
          setSelectedSubject(subject)
          setShowModal(true)
        }}
        onDelete={(subject) => {
          setSelectedSubject(subject)
          setShowDeleteModal(true)
        }}
        onSearch={fetchSubjects}
      />

      <SubjectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        subject={selectedSubject}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Subject"
        message={`Are you sure you want to delete "${selectedSubject?.name}"? All related chapters, topics and questions will also be deleted.`}
      />
    </div>
  )
}

export default SubjectsPage