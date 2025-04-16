"use client"

import { useState, useEffect } from "react"
import * as Yup from "yup"
import { STATUS } from "../../constant/constant"
import AxiosHelper from "../../helper/AxiosHelper"
import DataManager from "../../components/DataManager"
import { useParams, useNavigate } from "react-router-dom"

// Custom hook to fetch subjects
const useSubjects = () => {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true)
        const response = await AxiosHelper.getData("/subjects", {
          limit: 100,
          pageNo: 1,
          orderBy: "name",
          orderDirection: "asc",
        })
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

const Notes = () => {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const [modalType, setModalType] = useState<"add" | "edit" | "">("")
  const [subjectName, setSubjectName] = useState("")

  const { subjects, loading: subjectsLoading, error: subjectsError } = useSubjects()

  // Fetch subject name if subjectId is provided
  useEffect(() => {
    if (subjectId) {
      const fetchSubjectName = async () => {
        try {
          const response = await AxiosHelper.getData(`/subjects/${subjectId}`)
          if (response?.data?.status) {
            setSubjectName(response.data.data.name)
          }
        } catch (error) {
          console.error("Error fetching subject:", error)
        }
      }
      fetchSubjectName()
    }
  }, [subjectId])

  const title = subjectId ? `${subjectName} - Notes` : "Notes Management"
  const itemName = "Note"

  const endpoints = {
    list: "/notes",
    create: "/notes",
    update: (id: string) => `/notes/${id}`,
    delete: (id: string) => `/notes/${id}`,
  }

  const validationSchema = Yup.object().shape({
    title: Yup.string()
      .required("Title is required")
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title cannot exceed 200 characters"),
    description: Yup.string().max(1000, "Description cannot exceed 1000 characters"),
    subjectId: Yup.string().required("Subject is required"),
    // pdfFile: Yup.mixed().when("_", {
    //   is: () => modalType === "add",
    //   then: Yup.mixed().required("PDF file is required"),
    //   otherwise: Yup.mixed(),
    // }),
    thumbnailImage: Yup.mixed(),
    mrp: Yup.number().min(0, "MRP cannot be negative"),
    price: Yup.number().min(0, "Price cannot be negative"),
    isFree: Yup.boolean(),
    validityDays: Yup.number()
      .min(1, "Validity must be at least 1 day")
      .integer("Validity days must be a whole number"),
    sequence: Yup.number().min(0, "Sequence cannot be negative").integer("Sequence must be a whole number"),
    status: Yup.boolean(),
  })

  const formFields = [
    {
      label: "Title",
      name: "title",
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
      options: [{ id: "", name: "Select Subject" }, ...subjects],
      disabled: !!subjectId || subjectsLoading || !!subjectsError,
      col: 12,
    },
    {
      label: "PDF File",
      name: "pdfFile",
      type: "file",
      accept: ".pdf",
      col: 12,
    },
    {
      label: "Thumbnail Image",
      name: "thumbnailImage",
      type: "image-file",
      col: 12,
    },
    {
      label: "Is Free",
      name: "isFree",
      type: "check",
      col: 6,
    },
    {
      label: "MRP (₹)",
      name: "mrp",
      type: "number",
      min: 0,
      col: 6,
    },
    {
      label: "Price (₹)",
      name: "price",
      type: "number",
      min: 0,
      col: 6,
    },
    {
      label: "Validity (Days)",
      name: "validityDays",
      type: "number",
      min: 1,
      col: 6,
    },
    {
      label: "Sequence",
      name: "sequence",
      type: "number",
      min: 0,
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
    { header: "Title", accessor: "title", sortable: true },
    ...(subjectId
      ? []
      : [
          {
            header: "Subject",
            accessor: "subjectId",
            render: (value: any) => value?.name || "N/A",
          },
        ]),
    {
      header: "Price",
      accessor: "price",
      render: (value: number, item: any) =>
        item.isFree ? "Free" : `₹${value} ${item.mrp > value ? `(MRP: ₹${item.mrp})` : ""}`,
    },
    { header: "Validity", accessor: "validityDays", render: (value: number) => `${value} days` },
    {
      header: "Status",
      accessor: "status",
      render: (value: boolean) => (value ? "Active" : "Inactive"),
      sortable: true,
    },
  ]

  const initialFormValues = {
    title: "",
    description: "",
    subjectId: subjectId || "",
    pdfFile: null,
    thumbnailImage: null,
    mrp: 2500,
    price: 1999,
    isFree: false,
    validityDays: 180,
    sequence: 0,
    status: true,
  }

  // Custom render actions to add Preview button
  const renderActions = (item: any) => {
    return (
      <button
        onClick={() => window.open(item.pdfFile, "_blank")}
        className="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
      >
        Preview
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
      showPagination={true}
      showAdd={true}
      showEdit={true}
      showDelete={true}
      multipartFormData={true}
      renderActions={renderActions}
    />
  )
}

export default Notes
