"use client"

import { useState } from "react"
import * as Yup from "yup"
import { useNavigate } from "react-router-dom"
import DataManager from "../components/DataManager"

const DynamicContent = () => {
  const [modalType, setModalType] = useState("")
  const navigate = useNavigate()

  const title = "Dynamic Content Management"
  const itemName = "Content"

  const endpoints = {
    list: "/policy",
    create: "/policy",
    update: (id:any) => `/policy/${id}`,
    delete: (id:any) => `/policy/${id}`,
  }

  const validationSchema = Yup.object().shape({
    type: Yup.string().required("Content type is required"),
    title: Yup.string()
      .required("Title is required")
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title cannot exceed 200 characters"),
    content: Yup.string().required("Content is required"),
    status: Yup.boolean(),
  })

  const contentTypes = [
    { id: "", name: "Select Content Type" },
    { id: "PRIVACY_POLICY", name: "Privacy Policy" },
    { id: "TERMS_CONDITIONS", name: "Terms & Conditions" },
    { id: "ABOUT_US", name: "About Us" },
    { id: "CONTACT_US", name: "Contact Us" },
    { id: "FAQ", name: "FAQ" },
    { id: "HELP", name: "Help" },
  ]

  const formFields = [
    {
      label: "Content Type",
      name: "type",
      type: "select2",
      options: contentTypes,
      col: 12,
    },
    {
      label: "Title",
      name: "title",
      type: "text",
      col: 12,
    },
    {
      label: "Content",
      name: "content",
      type: "text-editer",
      col: 12,
    },
    {
      label: "Status",
      name: "status",
      type: "check",
      col: 12,
    },
  ]

  const tableColumns = [
    {
      header: "Type",
      accessor: "type",
      render: (value:any) => {
        const contentType = contentTypes.find((type) => type.id === value)
        return contentType ? contentType.name : value
      },
      sortable: true,
    },
    { header: "Title", accessor: "title", sortable: true },
    {
      header: "Status",
      accessor: "status",
      render: (value:any) => (value ? "Active" : "Inactive"),
      sortable: true,
    },
    {
      header: "Last Updated",
      accessor: "updatedAt",
      render: (value:any) => new Date(value).toLocaleDateString(),
      sortable: true,
    },
  ]

  const initialFormValues = {
    type: "",
    title: "",
    content: "",
    status: true,
  }

  // Custom render actions to add Preview button
  const renderActions = (item:any) => {
    return (
      <button
        onClick={() => window.open(`/content/${item.type}`, "_blank")}
        className="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
      >
        Preview
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
      renderActions={renderActions}
    />
  )
}

export default DynamicContent
