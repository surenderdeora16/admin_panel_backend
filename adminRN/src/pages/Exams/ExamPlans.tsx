"use client"

import { useState, useEffect } from "react"
import * as Yup from "yup"
import { STATUS } from "../../constant/constant"
import AxiosHelper from "../../helper/AxiosHelper"
import DataManager from "../../components/DataManager"
import { useParams, useNavigate } from "react-router-dom"

// Custom hook to fetch batches
const useBatches = () => {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true)
        const response = await AxiosHelper.getData("/batches", {
          limit: 100,
          pageNo: 1,
          orderBy: "name",
          orderDirection: "asc",
        })
        const batchOptions = response.data.data.record.map((batch: any) => ({
          id: batch._id,
          name: batch.name,
        }))
        setBatches(batchOptions)
      } catch (error) {
        console.error("Failed to fetch batches:", error)
        setError("Could not load batches")
        setBatches([])
      } finally {
        setLoading(false)
      }
    }

    fetchBatches()
  }, [])

  return { batches, loading, error }
}

const ExamPlans = () => {
  const { batchId } = useParams()
  const navigate = useNavigate()
  const [modalType, setModalType] = useState<"add" | "edit" | "">("")
  const [batchName, setBatchName] = useState("")

  const { batches, loading: batchesLoading, error: batchesError } = useBatches()

  console.log("batchId>>>", batchId)
  // Fetch batch name if batchId is provided
  useEffect(() => {
    if (batchId) {
      const fetchBatchName = async () => {
        try {
          const response = await AxiosHelper.getData(`/batches/${batchId}`)
          if (response?.data?.status) {
            setBatchName(response.data.data.name)
          }
        } catch (error) {
          console.error("Error fetching batch:", error)
        }
      }
      fetchBatchName()
    }
  }, [batchId])

  const title = batchId ? `${batchName} - Exam Plans` : "Exam Plans Management"
  const itemName = "Exam Plan"

  const endpoints = {
    list: batchId ? `/exam-plans?batchId=${batchId}` : "/exam-plans",
    create: "/exam-plans",
    update: (id: string) => `/exam-plans/${id}`,
    delete: (id: string) => `/exam-plans/${id}`,
  }

  const validationSchema = Yup.object().shape({
    title: Yup.string()
      .required("Title is required")
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title cannot exceed 200 characters"),
    // description: Yup.string().max(1000, "Description cannot exceed 1000 characters"),
    // batchId: Yup.string().required("Batch is required"),
    // price: Yup.number()
    //   .min(0, "Price cannot be negative")
    //   .when("isFree", {
    //     is: false,
    //     then: Yup.number().required("Price is required"),
    //   }),
    // mrp: Yup.number()
    //   .min(0, "MRP cannot be negative")
    //   .when("isFree", {
    //     is: false,
    //     then: Yup.number().required("MRP is required"),
    //   }),
    // validityDays: Yup.number()
    //   .required("Validity days is required")
    //   .min(1, "Validity must be at least 1 day")
    //   .integer("Validity days must be a whole number"),
    // image: Yup.mixed(),
    // sequence: Yup.number().min(0, "Sequence cannot be negative").integer("Sequence must be a whole number"),
    // status: Yup.boolean(),
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
      label: "Batch",
      name: "batchId",
      type: "select2",
      options: [{ id: "", name: "Select Batch" }, ...batches],
      disabled: !!batchId || batchesLoading || !!batchesError,
      col: 12,
    },
    {
      label: "Image",
      name: "image",
      type: "image-file",
      col: 12,
    },
    {
      label: "Price (₹)",
      name: "price",
      type: "number",
      min: 0,
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
      col: 12,
    },
  ]

  const tableColumns = [
    {
      header: 'Image',
      accessor: 'image',
      render: (value: any) => (
        <div className="w-[150px] h-[110px] overflow-hidden rounded-lg shadow-3">
          <img src={value} alt="" className="w-full h-full object-cover object-center" />
        </div>
      ),
    },
    { header: "Title", accessor: "title", sortable: true },
    ...(batchId
      ? []
      : [
          {
            header: "Batch",
            accessor: "batchId",
            render: (value: any) => value?.name || "N/A",
          },
        ]),
      // {
      //   header: "Batch Name",
      //   accessor: "batchId",
      //   render: (value: any) => value?.name || "N/A",
      // },
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
    batchId: batchId || "",
    price: 0,
    mrp: 0,
    validityDays: 30,
    image: null,
    sequence: 0,
    status: true,
  }

  // Custom render actions to add View Test Series button
  const renderActions = (item: any) => {
    return (
      <button
        onClick={() => navigate(`/test-series/${item._id}`)}
        className="cursor-pointer bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700"
      >
        View Test Series
      </button>
    )
  }

  if (batchesLoading) return <div>Loading batches...</div>
  if (batchesError) return <div>{batchesError}</div>

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

export default ExamPlans
