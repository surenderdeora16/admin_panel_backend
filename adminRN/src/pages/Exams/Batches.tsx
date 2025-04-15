"use client"

import { useState } from "react"
import * as Yup from "yup"
import { STATUS } from "../../constant/constant"
import DataManager from "../../components/DataManager"
import { useNavigate } from "react-router-dom"

const Batches = () => {
  const navigate = useNavigate()
  const [modalType, setModalType] = useState<"add" | "edit" | "">("")

  const title = "Batches Management"
  const itemName = "Batch"

  const endpoints = {
    list: "/batches",
    create: "/batches",
    update: (id: string) => `/batches/${id}`,
    delete: (id: string) => `/batches/${id}`,
  }

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required("Batch name is required")
      .min(2, "Batch name must be at least 2 characters")
      .max(100, "Batch name cannot exceed 100 characters"),
    description: Yup.string().max(500, "Description cannot exceed 500 characters"),
    image: Yup.mixed(),
    sequence: Yup.number().min(0, "Sequence must be a non-negative integer").integer("Sequence must be an integer"),
    status: Yup.boolean(),
  })

  const formFields = [
    {
      label: "Batch Name",
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
      label: "Image",
      name: "image",
      type: "image-file",
      col: 12,
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
    { header: "Name", accessor: "name", sortable: true },
    { header: "Description", accessor: "description" },
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
    description: "",
    image: null,
    sequence: 0,
    status: true,
  }

  // Custom render actions to add View Exam Plans button
  const renderActions = (item: any) => {
    return (
      <button
        onClick={() => navigate(`/exam-plans/${item._id}`)}
        className="cursor-pointer bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700"
      >
        View Exam Plans
      </button>
    )
  }

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

export default Batches
