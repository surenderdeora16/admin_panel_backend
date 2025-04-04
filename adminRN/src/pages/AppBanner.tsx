"use client"

import { useEffect, useState } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
// import { Trash2, Upload, Image, AlertCircle, Check, X, Loader2, GripVertical } from "lucide-react"
import axios from "axios"
import { toast } from "react-toastify"

// API Configuration
const API_BASE_URL = "http://localhost:3000/api-v1/admin"

export default function BannerManagement() {
  // State Management
  const [banner, setBanner] = useState(null)
  const [newImages, setNewImages] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Fetch the latest banner on component mount
  useEffect(() => {
    fetchLatestBanner()
  }, [])

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 10) {
      toast.error("Maximum 10 images allowed at once")
      return
    }

    setNewImages(files)

    // Generate preview URLs
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file))
    setPreviewUrls(newPreviewUrls)
  }

  // Fetch the latest banner
  const fetchLatestBanner = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/getSingleBannerWithImages`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.data.status && response.data.data) {
        setBanner(response.data.data)
      } else {
        toast.error(response.data.message || "Failed to fetch banner")
      }
    } catch (error) {
      console.error("Error fetching banner:", error)
      toast.error(error.response?.data?.message || "Failed to fetch banner")
    } finally {
      setLoading(false)
    }
  }

  // Update banner with new images and/or reordered images
  const updateBanner = async () => {
    if (!banner) {
      toast.error("No banner found to update")
      return
    }

    const formData = new FormData()

    // Add new images if any
    newImages.forEach((file) => {
      formData.append("images", file)
    })

    // Add current active status
    formData.append("isActive", banner.isActive.toString())

    // Add image orders
    const imageOrdersData = banner.images.map((img, index) => ({
      id: img._id,
      order: index,
    }))

    formData.append("imageOrders", JSON.stringify(imageOrdersData))

    try {
      setUpdating(true)
      setUploadProgress(0)

      const response = await axios.put(`${API_BASE_URL}/banner/update/${banner._id}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percentCompleted)
        },
      })

      if (response.data.status) {
        toast.success("Banner updated successfully")
        setNewImages([])
        setPreviewUrls([])
        fetchLatestBanner()
      } else {
        toast.error(response.data.message || "Failed to update banner")
      }
    } catch (error) {
      console.error("Error updating banner:", error)
      toast.error(error.response?.data?.message || "Failed to update banner")
    } finally {
      setUpdating(false)
      setUploadProgress(0)
    }
  }

  // Delete an image
  const deleteImage = async (imageId) => {
    if (!banner) return

    try {
      setLoading(true)
      const response = await axios.delete(`${API_BASE_URL}/banner/delete-image/${banner._id}/${imageId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.data.status) {
        toast.success("Image deleted successfully")
        fetchLatestBanner()
      } else {
        toast.error(response.data.message || "Failed to delete image")
      }
    } catch (error) {
      console.error("Error deleting image:", error)
      toast.error(error.response?.data?.message || "Failed to delete image")
    } finally {
      setLoading(false)
    }
  }

  // Handle drag end event
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setBanner((banner) => {
        const oldIndex = banner.images.findIndex((img) => img._id === active.id)
        const newIndex = banner.images.findIndex((img) => img._id === over.id)

        return {
          ...banner,
          images: arrayMove(banner.images, oldIndex, newIndex),
        }
      })
    }
  }

  // Clear selected new images
  const clearNewImages = () => {
    setNewImages([])
    setPreviewUrls([])
  }

  // Render loading state
  if (loading && !banner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        {/* <Loader2 className="w-12 h-12 text-blue-600 animate-spin" /> */}
        <h2 className="mt-4 text-xl font-semibold text-gray-700">Loading Banner Data...</h2>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Banner Management</h1>
          <p className="text-gray-600">
            Manage your banner images, reorder them using drag and drop, and upload new images.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Upload Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload New Images</h2>

            <div className="flex flex-col space-y-4">
              {/* File Input */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                  {/* <Upload className="w-12 h-12 text-blue-500 mb-2" /> */}
                  <span className="text-sm font-medium text-gray-700">Click to select images</span>
                  <span className="text-xs text-gray-500 mt-1">or drag and drop (max 10 images)</span>
                </label>
              </div>

              {/* Preview Section */}
              {previewUrls.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-gray-700">Selected Images ({previewUrls.length})</h3>
                    <button
                      onClick={clearNewImages}
                      className="text-red-500 hover:text-red-700 flex items-center text-sm"
                    >
                        X
                      Clear All
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={url || "/placeholder.svg"}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => {
                              const newFiles = [...newImages]
                              newFiles.splice(index, 1)
                              setNewImages(newFiles)

                              const newUrls = [...previewUrls]
                              URL.revokeObjectURL(newUrls[index])
                              newUrls.splice(index, 1)
                              setPreviewUrls(newUrls)
                            }}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                          >
                            {/* <Trash2 className="w-4 h-4" /> */}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {previewUrls.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={updateBanner}
                    disabled={updating || !banner}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {updating ? (
                      <>
                        {/* <Loader2 className="w-5 h-5 mr-2 animate-spin" /> */}
                        Uploading... {uploadProgress}%
                      </>
                    ) : (
                      <>
                        {/* <Upload className="w-5 h-5 mr-2" /> */}
                        Upload and Update Banner
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Current Images Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Banner Images</h2>

            {banner && banner.images.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={banner.images.map((img) => img._id)} strategy={verticalListSortingStrategy}>
                    <div className="divide-y divide-gray-200">
                      {banner.images.map((image, index) => (
                        <SortableImageItem key={image._id} image={image} index={index} onDelete={deleteImage} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {/* Update Order Button */}
                <div className="bg-gray-50 p-4 flex justify-end">
                  <button
                    onClick={updateBanner}
                    disabled={updating}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {updating ? (
                      <>
                        {/* <Loader2 className="w-4 h-4 mr-2 animate-spin" /> */}
                        Saving...
                      </>
                    ) : (
                      <>
                        {/* <Check className="w-4 h-4 mr-2" /> */}
                        Save Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center">
                {/* <Image className="w-16 h-16 text-gray-400 mb-4" /> */}
                <h3 className="text-lg font-medium text-gray-700 mb-1">No Images Found</h3>
                <p className="text-gray-500 text-center max-w-md">
                  {loading ? "Loading images..." : "Upload new images to display them here."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start">
            {/* <AlertCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" /> */}
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-1">How to use this interface</h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
                <li>Drag and drop images to reorder them</li>
                <li>Click the trash icon to delete an image</li>
                <li>Upload new images using the upload section</li>
                <li>Click "Save Order" after reordering to save changes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Sortable Image Item Component
function SortableImageItem({ image, index, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-white p-4 flex items-center gap-4 hover:bg-gray-50">
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600"
      >
        {/* <GripVertical className="w-5 h-5" /> */}
      </div>

      <div className="w-16 h-16 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
        <img
          src={image.url || "/placeholder.svg"}
          alt={`Banner image ${index + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <span className="font-medium text-gray-700">Image {index + 1}</span>
          <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Order: {image.order}</span>
        </div>
        <p className="text-sm text-gray-500 truncate">{image.url.split("/").pop()}</p>
      </div>

      <button
        onClick={() => onDelete(image._id)}
        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
        title="Delete image"
      >
        {/* <Trash2 className="w-5 h-5" /> */}
      </button>
    </div>
  )
}

