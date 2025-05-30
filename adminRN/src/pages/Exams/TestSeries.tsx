"use client"

import { useState, useEffect } from "react"
import * as Yup from "yup"
import { STATUS, TRUE_FALSE_OPTIONS } from "../../constant/constant"
import AxiosHelper from "../../helper/AxiosHelper"
import DataManager from "../../components/DataManager"
import { useParams, useNavigate } from "react-router-dom"

// Custom hook to fetch exam plans
const useExamPlans = () => {
  const [examPlans, setExamPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExamPlans = async () => {
      try {
        setLoading(true)
        const response = await AxiosHelper.getData("/exam-plans", {
          limit: 100,
          pageNo: 1,
          orderBy: "title",
          orderDirection: "asc",
        })
        const examPlanOptions = response.data.data.record.map((plan: any) => ({
          id: plan._id,
          name: plan.title,
        }))
        setExamPlans(examPlanOptions)
      } catch (error) {
        console.error("Failed to fetch exam plans:", error)
        setError("Could not load exam plans")
        setExamPlans([])
      } finally {
        setLoading(false)
      }
    }

    fetchExamPlans()
  }, [])

  return { examPlans, loading, error }
}

const TestSeries = () => {
  const { examPlanId } = useParams()
  const navigate = useNavigate()
  const [modalType, setModalType] = useState<"add" | "edit" | "">("")
  const [examPlanTitle, setExamPlanTitle] = useState("")

  const { examPlans, loading: examPlansLoading, error: examPlansError } = useExamPlans()

  // Fetch exam plan title if examPlanId is provided
  useEffect(() => {
    if (examPlanId) {
      const fetchExamPlanTitle = async () => {
        try {
          const response = await AxiosHelper.getData(`/exam-plans/${examPlanId}`)
          if (response?.data?.status) {
            setExamPlanTitle(response.data.data.title)
          }
        } catch (error) {
          console.error("Error fetching exam plan:", error)
        }
      }
      fetchExamPlanTitle()
    }
  }, [examPlanId])

  const title = examPlanId ? `${examPlanTitle} - Test Series` : "Test Series Management"
  const itemName = "Test Series"

  const endpoints = {
    // list: "/test-series",
    list: examPlanId ? `/test-series?examPlanId=${examPlanId}` : "/test-series",
    create: "/test-series",
    update: (id: string) => `/test-series/${id}`,
    delete: (id: string) => `/test-series/${id}`,
  }

  const validationSchema = Yup.object().shape({
    title: Yup.string()
      .required("Title is required")
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title cannot exceed 200 characters"),
    examPlanId: Yup.string().required("Exam plan is required"),
    duration: Yup.number()
      .required("Duration is required")
      .min(1, "Duration must be at least 1 minute")
      .integer("Duration must be a whole number"),
    correctMarks: Yup.number().min(0, "Correct marks cannot be negative"),
    negativeMarks: Yup.number().min(0, "Negative marks cannot be negative"),
    passingPercentage: Yup.number()
      .min(0, "Passing percentage cannot be negative")
      .max(100, "Passing percentage cannot exceed 100"),
    instructions: Yup.string(),
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
      label: "Exam Plan",
      name: "examPlanId",
      type: "select2",
      options: [{ id: "", name: "Select Exam Plan" }, ...examPlans],
      disabled: !!examPlanId || examPlansLoading || !!examPlansError,
      col: 12,
    },
    {
      label: "Duration (minutes)",
      name: "duration",
      type: "number",
      min: 1,
      col: 6,
    },
    {
      label: "Correct Marks",
      name: "correctMarks",
      type: "number",
      min: 0,
      step: 0.01, // Allow finer increments
      col: 6,
    },
    {
      label: "Negative Marks",
      name: "negativeMarks",
      type: "number",
      min: 0,
      step: 0.01, // Allow finer increments
      col: 6,
    },
    {
      label: "Passing Percentage",
      name: "passingPercentage",
      type: "number",
      min: 0,
      max: 100,
      col: 6,
    },
    {
      label: "Instructions",
      name: "instructions",
      type: "text-editer",
      col: 12,
    },
    {
      label: "Is Free",
      name: "isFree",
      type: "select2",
      options: TRUE_FALSE_OPTIONS,
      col: 6,
    },
    // {
    //   label: "Sequence",
    //   name: "sequence",
    //   type: "number",
    //   min: 0,
    //   col: 6,
    // },
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
    ...(examPlanId
      ? []
      : [
          {
            header: "Exam Plan",
            accessor: "examPlanId",
            render: (value: any) => value?.title || "N/A",
          },
        ]),
    { header: "Duration", accessor: "duration", render: (value: number) => `${value} min` },
    { header: "Questions", accessor: "totalQuestions" },
    { header: "Sections", accessor: "sectionCount" },
    {
      header: "Marks",
      accessor: "correctMarks",
      render: (value: number, item: any) => `+${value} / -${item.negativeMarks}`,
    },
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
    examPlanId: "",
    duration: 60,
    correctMarks: 1,
    negativeMarks: 0.25,
    passingPercentage: 33,
    instructions: "",
    isFree: false,
    sequence: 0,
    status: true,
  }

  // Custom render actions to add Manage Sections and Questions buttons
  const renderActions = (item: any) => {
    return (
      <div className="flex space-x-2">
        <button
          onClick={() => navigate(`/test-series/${item._id}/sections`)}
          className="cursor-pointer bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700"
        >
          Sections
        </button>
        {/* <button
          onClick={() => navigate(`/test-series/${item._id}/questions`)}
          className="cursor-pointer bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
        >
          Questions
        </button> */}
      </div>
    )
  }

  if (examPlansLoading) return <div>Loading exam plans...</div>
  if (examPlansError) return <div>{examPlansError}</div>

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
      multipartFormData={false}
      renderActions={renderActions}
    />
  )
}

export default TestSeries
