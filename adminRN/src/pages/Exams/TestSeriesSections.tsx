"use client"

import { useState, useEffect } from "react"
import * as Yup from "yup"
import { STATUS } from "../../constant/constant"
import AxiosHelper from "../../helper/AxiosHelper"
import DataManager from "../../components/DataManager"
import { useParams, useNavigate, Link } from "react-router-dom"

const TestSeriesSections = () => {
  const { testSeriesId } = useParams()
  const navigate = useNavigate()
  const [modalType, setModalType] = useState<"add" | "edit" | "">("")
  const [testSeriesTitle, setTestSeriesTitle] = useState("")

  // Fetch test series details
  useEffect(() => {
    if (testSeriesId) {
      const fetchTestSeriesDetails = async () => {
        try {
          const response = await AxiosHelper.getData(`/test-series/${testSeriesId}`)
          if (response?.data?.status) {
            setTestSeriesTitle(response.data.data.title)
          }
        } catch (error) {
          console.error("Error fetching test series:", error)
        }
      }
      fetchTestSeriesDetails()
    }
  }, [testSeriesId])

  const title = `${testSeriesTitle} - Sections`
  const itemName = "Section"

  const endpoints = {
    list: `/test-series/${testSeriesId}/sections`,
    create: `/test-series/${testSeriesId}/sections`,
    update: (id: string) => `/test-series/sections/${id}`,
    delete: (id: string) => `/test-series/sections/${id}`,
  }

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required("Section name is required")
      .min(2, "Section name must be at least 2 characters")
      .max(100, "Section name cannot exceed 100 characters"),
    sequence: Yup.number().min(0, "Sequence cannot be negative").integer("Sequence must be a whole number"),
    status: Yup.boolean(),
  })

  const formFields = [
    {
      label: "Section Name",
      name: "name",
      type: "text",
      col: 12,
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
    { header: "Name", accessor: "name", sortable: true },
    { header: "Questions", accessor: "questionCount" },
    { header: "Sequence", accessor: "sequence", sortable: true },
    {
      header: "Status",
      accessor: "status",
      render: (value: boolean) => (value ? "Active" : "Inactive"),
      sortable: true,
    },
  ]

  const initialFormValues = {
    name: "",
    sequence: 0,
    status: true,
  }

  // Custom render actions to add Manage Questions button
  const renderActions = (item: any) => {
    return (
      <button
        onClick={() => navigate(`/test-series/${testSeriesId}/sections/${item._id}/questions`)}
        className="cursor-pointer bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
      >
        Manage Questions
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-10">
      <div className="max-w-full mx-auto space-y-8">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <Link to="/test-series" className="hover:text-purple-600 transition-colors">
            Test Series
          </Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">Sections</span>
        </div>

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
          multipartFormData={false}
          renderActions={renderActions}
        />
      </div>
    </div>
  )
}

export default TestSeriesSections
