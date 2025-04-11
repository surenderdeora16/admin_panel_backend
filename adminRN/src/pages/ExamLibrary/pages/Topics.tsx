"use client"

import type React from "react"
import { useState, useEffect } from "react"
import DataManager from "../../../components/DataManager"
import * as Yup from "yup"
import AxiosHelper from "../../../helper/AxiosHelper"
import { STATUS } from "../../../constant/constant"
import { useNavigate } from "react-router-dom"
import Status from '../../../helper/Status';

// Interface for Subject and Chapter options
interface Option {
  id: string
  name: string
}

// Custom hook to fetch subjects
const useSubjects = () => {
  const [subjects, setSubjects] = useState<Option[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true)
        const response = await AxiosHelper.getData("/subjects")
        const subjectOptions = response.data.data.record.map((subject: any) => ({
          id: subject._id,
          name: subject.name,
        }))
        setSubjects(subjectOptions)
      } catch (error) {
        console.error("Failed to fetch subjects:", error)
        setError("Could not load subjects")
        setSubjects([])
      } finally {
        setLoading(false)
      }
    }

    fetchSubjects()
  }, [])

  return { subjects, loading, error }
}

// Custom hook to fetch chapters based on subjectId
const useChapters = (subjectId: string) => {
  const [chapters, setChapters] = useState<Option[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!subjectId) {
      setChapters([])
      return
    }

    const fetchChapters = async () => {
      try {
        setLoading(true)
        const response = await AxiosHelper.getData(`chapters/subject/${subjectId}`) // Pass subjectId as query param
        const chapterOptions = response?.data?.data.map((chapter: any) => ({
          id: chapter._id,
          name: chapter.name,
        }))
        console.log("chapterOptions", chapterOptions)
        setChapters(chapterOptions)
      } catch (error: any) {
        console.error("Failed to fetch chapters:", error)
        setError("Could not load chapters")
        setChapters([])
      } finally {
        setLoading(false)
      }
    }

    fetchChapters()
  }, [subjectId])

  return { chapters, loading, error }
}

const Topics: React.FC = () => {
  const navigate = useNavigate()
  const [modalType, setModalType] = useState<"add" | "edit" | "">("")
  const [selectedSubjectId, setSelectedSubjectId] = useState<any>("")

  const { subjects, loading: subjectsLoading, error: subjectsError } = useSubjects()
  const { chapters, loading: chaptersLoading, error: chaptersError } = useChapters(selectedSubjectId)

  const title = "Topics Management"
  const itemName = "Topic"

  console.log("chapters<>>", chapters)
  const endpoints = {
    list: "/topics",
    create: "/topics",
    update: (id: string) => `/topics/${id}`,
    delete: (id: string) => `/topics/${id}`,
  }

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required("Topic name is required")
      .min(2, "Topic name must be at least 2 characters")
      .max(100, "Topic name cannot exceed 100 characters"),
    description: Yup.string().max(500, "Description cannot exceed 500 characters"),
    subjectId: Yup.string().required("Subject is required"),
    chapterId: Yup.string().required("Chapter is required"),
    sequence: Yup.number().min(0, "Sequence must be a non-negative integer").integer("Sequence must be an integer"),
    status: Yup.boolean(),
  })

  const formFields = [
    {
      label: "Topic Name",
      name: "name",
      type: "text",
      col: 12,
    },
    {
      label: "Description",
      name: "description",
      type: "text-editer",
      col: 12,
    },
    {
      label: "Subject",
      name: "subjectId",
      type: "select2",
      options:
        modalType === "add"
          ? [{ id: "", name: "Select Subject" }, ...subjects]
          : [{ id: "", name: "Select Subject" }, ...subjects],
      disabled: subjectsLoading || !!subjectsError,
      onChange: (value: any) => setSelectedSubjectId(value?.id?.toString() || ""),
      col: 6,
    },
    {
      label: "Chapter",
      name: "chapterId",
      type: "select2",
      options: chaptersLoading
        ? [{ id: "", name: "Loading chapters..." }]
        : chaptersError
          ? [{ id: "", name: "Error loading chapters" }]
          : [{ id: "", name: "Select Chapter" }, ...chapters],
      // disabled: !selectedSubjectId || chaptersLoading || !!chaptersError,
      dependsOn: "subjectId", // Indicates dependency on subjectId
      col: 6,
    },
    {
      label: "Sequence",
      name: "sequence",
      type: "number",
      col: 6,
    },
    {
      label: "Status",
      name: "status",
      type: "select2",
      options: STATUS,
      col: 6,
    },
  ]

  const tableColumns = [
    {
      header: "Subject",
      accessor: "subjectId",
      render: (value: any) => value?.name || "-",
    },
    {
      header: "Chapter",
      accessor: "chapterId",
      render: (value: any) => value?.name || "-",
    },
    { header: "Topic", accessor: "name", sortable: true },
    { header: "Questions", accessor: "questionCount" },
    { header: "Sequence", accessor: "sequence", sortable: true },
    {
      header: "Status",
      accessor: "status",
      render: (value: any, item: any) => (
        <Status table="topics" status={value} data_id={item._id} />
      ),
      sortable: true,
    },
  ]

  const initialFormValues = {
    name: "",
    description: "",
    subjectId: "",
    chapterId: "",
    sequence: 0,
    status: true,
  }

  const transformInitialValues = (item: any) => ({
    ...item,
    subjectId: item.subjectId?._id || item.subjectId || "",
    chapterId: item.chapterId?._id || item.chapterId || "",
  })

  const canDelete = (item: any) => item.questionCount === 0

  // Custom render actions to add Manage Questions button
  const renderActions = (item: any) => {
    return (
      <button
        onClick={() =>
          navigate(`/exam-library/topics/manage-questions/${item.subjectId?._id}/${item.chapterId?._id}/${item._id}`)
        }
        className="cursor-pointer bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700"
      >
        Manage Questions
      </button>
    )
  }

  if (subjectsLoading) return <div>Loading subjects...</div>
  if (subjectsError) return <div>{subjectsError}</div>

  return (
    <DataManager
      title={title}
      itemName={itemName}
      setModalType={setModalType}
      endpoints={endpoints}
      validationSchema={validationSchema}
      formFields={formFields}
      tableColumns={tableColumns}
      initialFormValues={initialFormValues}
      transformInitialValues={transformInitialValues}
      showPagination={true}
      showAdd={true}
      showEdit={true}
      showDelete={true}
      canDelete={canDelete}
      multipartFormData={false}
      renderActions={renderActions} // Add custom render actions
    />
  )
}

export default Topics
