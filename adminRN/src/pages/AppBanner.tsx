"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ToastContainer, toast } from "react-toastify"
import {
  FaTrashAlt,
  FaImages,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaPlus,
  FaExclamationTriangle,
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaCloudUploadAlt,
  FaCrop,
  FaEye,
  FaEdit,
  FaSave,
  FaUpload,
} from "react-icons/fa"
import { BiImageAdd, BiSortAlt2 } from "react-icons/bi"
import { MdDragIndicator } from "react-icons/md"
import { AiOutlineCloudUpload, AiOutlineDelete, AiOutlineEdit } from "react-icons/ai"
import ReactCrop, { type Crop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { AnimatePresence, motion } from "framer-motion"
import AxiosHelper from "../helper/AxiosHelper"

// Types
interface BannerImage {
  _id: string
  url: string
  order: number
  isActive: boolean
  deletedAt: string | null
}

interface Banner {
  _id: string
  images: BannerImage[]
  isActive: boolean
  createdBy: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

interface CropModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (croppedFile: File) => void
  imageFile: File | null
  title: string
}

// Constants
const ASPECT_RATIO = 16 / 9
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_IMAGES = 10

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
}

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// Crop Modal Component
function CropModal({ isOpen, onClose, onSave, imageFile, title }: CropModalProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  })
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile)
      setImageUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [imageFile])

  const handleSave = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !imageFile) {
      toast.error("Please select a crop area")
      return
    }

    setIsProcessing(true)

    try {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        toast.error("Could not create canvas context")
        return
      }

      const image = imgRef.current
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height

      canvas.width = completedCrop.width
      canvas.height = completedCrop.height

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height,
      )

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const croppedFile = new File([blob], imageFile.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            })
            onSave(croppedFile)
            onClose()
          } else {
            toast.error("Failed to process image")
          }
          setIsProcessing(false)
        },
        "image/jpeg",
        0.95,
      )
    } catch (error) {
      console.error("Error processing image:", error)
      toast.error("Failed to process image")
      setIsProcessing(false)
    }
  }, [completedCrop, imageFile, onSave, onClose])

  if (!isOpen || !imageFile) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FaCrop className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-500">Adjust the crop area to fit 16:9 aspect ratio</p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <FaTimes className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Crop Area */}
          <div className="p-6 max-h-[60vh] overflow-auto">
            <div className="bg-gray-50 rounded-xl p-4">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={ASPECT_RATIO}
                className="max-w-full"
              >
                <img
                  ref={imgRef}
                  src={imageUrl || "/placeholder.svg"}
                  alt="Crop preview"
                  className="max-w-full rounded-lg"
                  style={{ maxHeight: "50vh" }}
                />
              </ReactCrop>
            </div>
            <div className="mt-4 flex items-center justify-center">
              <div className="bg-blue-50 px-4 py-2 rounded-full">
                <span className="text-sm font-medium text-blue-700">16:9 Aspect Ratio</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing || !completedCrop}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <FaSpinner className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <FaSave className="w-4 h-4" />
                  <span>Apply Crop</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function AppBanner() {
  // State management
  const [banner, setBanner] = useState<Banner | null>(null)
  const [newImages, setNewImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewMode, setPreviewMode] = useState(false)
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [processingImageIds, setProcessingImageIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<string>("upload")
  const [isDragging, setIsDragging] = useState(false)
  const [noBannerExists, setNoBannerExists] = useState(false)

  // Crop modal states
  const [showCropModal, setShowCropModal] = useState(false)
  const [cropModalImage, setCropModalImage] = useState<File | null>(null)
  const [cropModalTitle, setCropModalTitle] = useState("")
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [currentFileIndex, setCurrentFileIndex] = useState(0)

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingImage, setEditingImage] = useState<BannerImage | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const apiCache = useRef<Map<string, any>>(new Map())

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

  // Initialize component
  useEffect(() => {
    fetchLatestBanner()
  }, [])

  // Clean up preview URLs
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  // Keyboard navigation for preview
  useEffect(() => {
    if (previewMode && banner && banner.images.length > 1) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") {
          navigatePreview("prev")
        } else if (e.key === "ArrowRight") {
          navigatePreview("next")
        } else if (e.key === "Escape") {
          togglePreviewMode()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }
  }, [previewMode, banner, currentPreviewIndex])

  // File validation
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "File type not supported. Please upload JPEG, PNG, or WebP images."
    }
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return `File size exceeds 5MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
    }
    return null
  }

  // Fetch banner data
  const fetchLatestBanner = async () => {
    try {
      setLoading(true)
      setError(null)
      setNoBannerExists(false)

      const cacheKey = "getSingleBannerWithImages"
      const cachedData = apiCache.current.get(cacheKey)
      const now = Date.now()

      if (cachedData && now - cachedData.timestamp < 30000) {
        setBanner(cachedData.data)
        setActiveTab(cachedData.data ? "manage" : "upload")
        setLoading(false)
        return
      }

      const response = await AxiosHelper.getData("getSingleBannerWithImages")

      if (response?.data?.status && response.data.data) {
        apiCache.current.set(cacheKey, {
          data: response.data.data,
          timestamp: now,
        })
        setBanner(response.data.data)
        setActiveTab("manage")
      } else {
        // No banner exists - this is normal for new users
        setBanner(null)
        setNoBannerExists(true)
        setActiveTab("upload")
      }
    } catch (error: any) {
      console.error("Error fetching banner:", error)

      if (error.response?.status === 404) {
        // No banner exists
        setBanner(null)
        setNoBannerExists(true)
        setActiveTab("upload")
      } else {
        // Actual error
        const errorMessage = error.response?.data?.message || "Failed to fetch banner"
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const files = Array.from(e.target.files)
    processSelectedFiles(files)

    // Reset input
    if (e.target.value) e.target.value = ""
  }

  // Process selected files
  const processSelectedFiles = (files: File[]) => {
    if (files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed at once`)
      return
    }

    // Validate files
    const validFiles: File[] = []
    let hasErrors = false

    files.forEach((file) => {
      const error = validateFile(file)
      if (error) {
        toast.error(`${file.name}: ${error}`)
        hasErrors = true
      } else {
        validFiles.push(file)
      }
    })

    if (hasErrors || validFiles.length === 0) return

    // Start cropping process
    setPendingFiles(validFiles)
    setCurrentFileIndex(0)
    startCroppingProcess(validFiles, 0)
  }

  // Start cropping process
  const startCroppingProcess = (files: File[], index: number) => {
    if (index >= files.length) return

    const file = files[index]
    setCropModalImage(file)
    setCropModalTitle(`Crop Image ${index + 1} of ${files.length}`)
    setShowCropModal(true)
  }

  // Handle crop save
  const handleCropSave = (croppedFile: File) => {
    // Add cropped file to new images
    setNewImages((prev) => [...prev, croppedFile])
    setPreviewUrls((prev) => [...prev, URL.createObjectURL(croppedFile)])

    // Process next file
    const nextIndex = currentFileIndex + 1
    if (nextIndex < pendingFiles.length) {
      setCurrentFileIndex(nextIndex)
      setTimeout(() => startCroppingProcess(pendingFiles, nextIndex), 100)
    } else {
      // All files processed
      setPendingFiles([])
      setCurrentFileIndex(0)
      toast.success(`${pendingFiles.length} image(s) processed and ready to upload`)
    }
  }

  // Handle crop modal close
  const handleCropModalClose = () => {
    setShowCropModal(false)
    setCropModalImage(null)
    setPendingFiles([])
    setCurrentFileIndex(0)
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter((file) => ALLOWED_FILE_TYPES.includes(file.type))

      if (files.length === 0) {
        toast.error("No valid image files found. Please upload JPEG, PNG, or WebP images.")
        return
      }

      processSelectedFiles(files)
    }
  }

  // Create or update banner
  const saveBanner = async () => {
    if (newImages.length === 0) {
      toast.error("Please select at least one image")
      return
    }

    if (updating) return

    const formData = new FormData()
    newImages.forEach((file) => {
      formData.append("images", file)
    })

    try {
      setUpdating(true)
      setUploadProgress(0)
      setError(null)

      let response

      if (banner) {
        // Update existing banner
        formData.append("isActive", banner.isActive.toString())
        const imageOrdersData = banner.images.map((img, index) => ({
          id: img._id,
          order: index,
        }))
        formData.append("imageOrders", JSON.stringify(imageOrdersData))

        response = await AxiosHelper.putData(`banner-update/${banner._id}`, formData, true, {
          onUploadProgress: (progressEvent: any) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percentCompleted)
          },
        })
      } else {
        // Create new banner
        formData.append("isActive", "true")

        response = await AxiosHelper.postData("banner-create", formData, true, {
          onUploadProgress: (progressEvent: any) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percentCompleted)
          },
        })
      }

      if (response?.data?.status) {
        toast.success(banner ? "Banner updated successfully" : "Banner created successfully")

        // Clear new images
        setNewImages([])
        previewUrls.forEach((url) => URL.revokeObjectURL(url))
        setPreviewUrls([])

        // Clear cache and refetch
        apiCache.current.delete("getSingleBannerWithImages")
        await fetchLatestBanner()

        setActiveTab("manage")
      } else {
        const errorMessage = response?.data?.message || "Failed to save banner"
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } catch (error: any) {
      console.error("Error saving banner:", error)
      const errorMessage = error.response?.data?.message || "Failed to save banner"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setUpdating(false)
      setUploadProgress(0)
    }
  }

  // Update banner order only
  const updateBannerOrder = async () => {
    if (!banner || updating) return

    const formData = new FormData()
    formData.append("isActive", banner.isActive.toString())
    formData.append("orderUpdateOnly", "true")

    const imageOrdersData = banner.images.map((img, index) => ({
      id: img._id,
      order: index,
    }))
    formData.append("imageOrders", JSON.stringify(imageOrdersData))

    try {
      setUpdating(true)
      setError(null)

      const response = await AxiosHelper.putData(`banner-update/${banner._id}`, formData, true)

      if (response?.data?.status) {
        toast.success("Banner order updated successfully")
        apiCache.current.delete("getSingleBannerWithImages")
        await fetchLatestBanner()
      } else {
        const errorMessage = response?.data?.message || "Failed to update banner order"
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } catch (error: any) {
      console.error("Error updating banner order:", error)
      const errorMessage = error.response?.data?.message || "Failed to update banner order"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setUpdating(false)
    }
  }

  // Delete image
  const deleteImage = async (imageId: string) => {
    if (!banner || processingImageIds.has(imageId)) return

    try {
      setProcessingImageIds((prev) => new Set(prev).add(imageId))

      const response = await AxiosHelper.deleteData(`banner-delete-image/${banner._id}/${imageId}`)

      if (response?.data?.status) {
        toast.success("Image deleted successfully")
        apiCache.current.delete("getSingleBannerWithImages")
        await fetchLatestBanner()
      } else {
        const errorMessage = response?.data?.message || "Failed to delete image"
        toast.error(errorMessage)
      }
    } catch (error: any) {
      console.error("Error deleting image:", error)
      const errorMessage = error.response?.data?.message || "Failed to delete image"
      toast.error(errorMessage)
    } finally {
      setProcessingImageIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(imageId)
        return newSet
      })
    }
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id && over?.id) {
      setBanner((prevBanner) => {
        if (!prevBanner) return null

        const oldIndex = prevBanner.images.findIndex((img) => img._id === active.id)
        const newIndex = prevBanner.images.findIndex((img) => img._id === over.id)

        toast.info(`Image ${oldIndex + 1} moved to position ${newIndex + 1}`)

        return {
          ...prevBanner,
          images: arrayMove(prevBanner.images, oldIndex, newIndex),
        }
      })
    }
  }

  // Clear new images
  const clearNewImages = useCallback(() => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    setNewImages([])
    setPreviewUrls([])
  }, [previewUrls])

  // Edit image
  const openEditModal = (image: BannerImage) => {
    setEditingImage(image)
    setShowEditModal(true)
  }

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    const error = validateFile(file)

    if (error) {
      toast.error(error)
      return
    }

    // Start crop process for edit
    setCropModalImage(file)
    setCropModalTitle("Crop Replacement Image")
    setShowCropModal(true)

    // Set up for edit mode
    setPendingFiles([file])
    setCurrentFileIndex(0)

    // Reset input
    if (e.target.value) e.target.value = ""
  }

  // Handle edit crop save
  const handleEditCropSave = async (croppedFile: File) => {
    if (!editingImage || !banner) return

    try {
      setUpdating(true)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append("image", croppedFile)
      formData.append("imageId", editingImage._id)

      const response = await AxiosHelper.putData(`update-single-image/${banner._id}`, formData, true, {
        onUploadProgress: (progressEvent: any) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percentCompleted)
        },
      })

      if (response?.data?.status) {
        toast.success("Image updated successfully")
        setShowEditModal(false)
        setEditingImage(null)
        apiCache.current.delete("getSingleBannerWithImages")
        await fetchLatestBanner()
      } else {
        const errorMessage = response?.data?.message || "Failed to update image"
        toast.error(errorMessage)
      }
    } catch (error: any) {
      console.error("Error updating image:", error)
      const errorMessage = error.response?.data?.message || "Failed to update image"
      toast.error(errorMessage)
    } finally {
      setUpdating(false)
      setUploadProgress(0)
    }
  }

  // Preview functions
  const togglePreviewMode = () => {
    setPreviewMode(!previewMode)
    setCurrentPreviewIndex(0)
  }

  const navigatePreview = (direction: "next" | "prev") => {
    if (!banner || banner.images.length === 0) return

    if (direction === "next") {
      setCurrentPreviewIndex((prev) => (prev === banner.images.length - 1 ? 0 : prev + 1))
    } else {
      setCurrentPreviewIndex((prev) => (prev === 0 ? banner.images.length - 1 : prev - 1))
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FaSpinner className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Banner</h2>
          <p className="text-gray-600">Please wait while we retrieve your banner data...</p>
        </motion.div>
      </div>
    )
  }

  // Error state (only for actual errors)
  if (error && !noBannerExists) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FaExclamationTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchLatestBanner}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <FaSpinner className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-full mx-auto p-10">
        {/* Header */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {noBannerExists ? "Create Your First Banner" : "Banner Management"}
              </h1>
              <p className="text-gray-600">
                {noBannerExists
                  ? "Get started by uploading your first banner images"
                  : "Manage your banner images with professional tools"}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {banner && banner.images.length > 0 && (
                <button
                  onClick={togglePreviewMode}
                  className={`inline-flex items-center px-4 py-2.5 rounded-xl font-medium transition-all ${
                    previewMode
                      ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                  }`}
                >
                  {previewMode ? (
                    <>
                      <FaArrowLeft className="w-4 h-4 mr-2" />
                      Exit Preview
                    </>
                  ) : (
                    <>
                      <FaEye className="w-4 h-4 mr-2" />
                      Preview Banner
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Preview Mode */}
        {previewMode && banner && banner.images.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8"
          >
            <div className="relative">
              <div className="aspect-[16/9] overflow-hidden bg-gray-900">
                <motion.img
                  key={currentPreviewIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  src={banner.images[currentPreviewIndex]?.url || "/placeholder.svg?height=720&width=1280"}
                  alt={`Banner preview ${currentPreviewIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {banner.images.length > 1 && (
                <>
                  <button
                    onClick={() => navigatePreview("prev")}
                    className="absolute left-6 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors flex items-center justify-center backdrop-blur-sm"
                  >
                    <FaChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigatePreview("next")}
                    className="absolute right-6 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors flex items-center justify-center backdrop-blur-sm"
                  >
                    <FaChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 text-white font-medium">
                  {currentPreviewIndex + 1} / {banner.images.length}
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-50 border-t border-gray-200">
              <div className="flex flex-col items-center">
                {banner.images.length > 1 && (
                  <div className="flex space-x-2 mb-4">
                    {banner.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPreviewIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all ${
                          currentPreviewIndex === index ? "bg-blue-600 scale-125" : "bg-gray-300 hover:bg-gray-400"
                        }`}
                      />
                    ))}
                  </div>
                )}
                <button
                  onClick={togglePreviewMode}
                  className="inline-flex items-center px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition-colors font-medium"
                >
                  <FaArrowLeft className="w-4 h-4 mr-2" />
                  Return to Management
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Navigation Tabs - Only show if banner exists */}
            {banner && (
              <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mb-8">
                <div className="bg-white rounded-2xl shadow-lg p-2">
                  <div className="flex">
                    <button
                      onClick={() => setActiveTab("manage")}
                      className={`flex-1 flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-all ${
                        activeTab === "manage"
                          ? "bg-blue-600 text-white shadow-lg"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <BiSortAlt2 className="w-5 h-5 mr-2" />
                      Manage Images
                    </button>
                    <button
                      onClick={() => setActiveTab("upload")}
                      className={`flex-1 flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-all ${
                        activeTab === "upload"
                          ? "bg-blue-600 text-white shadow-lg"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <FaUpload className="w-5 h-5 mr-2" />
                      Upload New Images
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Manage Tab */}
            {activeTab === "manage" && banner && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={slideUp}
                className="bg-white rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <BiSortAlt2 className="w-5 h-5 mr-2 text-blue-600" />
                        Current Banner Images
                      </h2>
                      <p className="text-gray-600 text-sm mt-1">Drag to reorder images or use the action buttons</p>
                    </div>
                  </div>
                </div>

                {banner.images.length > 0 ? (
                  <div className="p-6">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext
                        items={banner.images.map((img) => img._id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <motion.div
                          className="space-y-4"
                          variants={staggerContainer}
                          initial="hidden"
                          animate="visible"
                        >
                          {banner.images.map((image, index) => (
                            <SortableImageItem
                              key={image._id}
                              image={image}
                              index={index}
                              onDelete={deleteImage}
                              onEdit={() => openEditModal(image)}
                              isProcessing={processingImageIds.has(image._id)}
                            />
                          ))}
                        </motion.div>
                      </SortableContext>
                    </DndContext>

                    <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        {banner.images.length} {banner.images.length === 1 ? "image" : "images"} in total
                      </p>
                      <button
                        onClick={updateBannerOrder}
                        disabled={updating}
                        className="inline-flex items-center px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                      >
                        {updating ? (
                          <>
                            <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <FaCheck className="w-4 h-4 mr-2" />
                            Save Order
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-12">
                    <motion.div variants={fadeIn} className="text-center">
                      <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FaImages className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Images Found</h3>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Your banner doesn't have any images yet. Add some to get started.
                      </p>
                      <button
                        onClick={() => setActiveTab("upload")}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium shadow-lg hover:shadow-xl"
                      >
                        <FaPlus className="w-5 h-5 mr-2" />
                        Add Your First Image
                      </button>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Upload Tab */}
            {(activeTab === "upload" || noBannerExists) && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={slideUp}
                className="bg-white rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FaUpload className="w-5 h-5 mr-2 text-blue-600" />
                    {noBannerExists ? "Upload Banner Images" : "Upload New Images"}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Select images to {noBannerExists ? "create your banner" : "add to your banner"} (max {MAX_IMAGES} at
                    once, 16:9 cropping required)
                  </p>
                </div>

                <div className="p-6 space-y-8">
                  {/* File Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                      isDragging
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
                    }`}
                    onClick={triggerFileInput}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div className={`transition-transform ${isDragging ? "scale-110" : ""}`}>
                      <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <AiOutlineCloudUpload className="w-10 h-10 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {isDragging ? "Drop images here" : "Upload Banner Images"}
                      </h3>
                      <p className="text-gray-600 mb-4">Click to browse or drag and drop your images</p>
                      <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                        <span>JPEG, PNG, WebP</span>
                        <span>•</span>
                        <span>Max {MAX_IMAGES} images</span>
                        <span>•</span>
                        <span>5MB each</span>
                        <span>•</span>
                        <span className="text-blue-600 font-medium">16:9 Auto-Crop</span>
                      </div>
                    </div>
                  </div>

                  {/* Preview Section */}
                  {previewUrls.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <BiImageAdd className="w-5 h-5 mr-2 text-blue-600" />
                          Ready to {noBannerExists ? "Create Banner" : "Upload"} ({previewUrls.length})
                        </h3>
                        <button
                          onClick={clearNewImages}
                          className="inline-flex items-center px-3 py-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                        >
                          <FaTimes className="w-4 h-4 mr-1.5" />
                          Clear All
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {previewUrls.map((url, index) => (
                          <motion.div
                            key={index}
                            className="relative group"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <div className="aspect-[16/9] rounded-xl overflow-hidden border border-gray-200 shadow-md group-hover:shadow-lg transition-shadow">
                              <img
                                src={url || "/placeholder.svg"}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const newFiles = [...newImages]
                                  newFiles.splice(index, 1)
                                  setNewImages(newFiles)
                                  URL.revokeObjectURL(previewUrls[index])
                                  const newUrls = [...previewUrls]
                                  newUrls.splice(index, 1)
                                  setPreviewUrls(newUrls)
                                }}
                                className="w-10 h-10 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center shadow-lg"
                              >
                                <FaTrashAlt className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="absolute top-3 right-3 w-6 h-6 bg-black/70 text-white text-xs rounded-full flex items-center justify-center font-medium">
                              {index + 1}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Save Button */}
                      <div className="pt-6 border-t border-gray-200">
                        <button
                          onClick={saveBanner}
                          disabled={updating}
                          className="w-full inline-flex items-center justify-center px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                          {updating ? (
                            <>
                              <FaSpinner className="w-5 h-5 mr-3 animate-spin" />
                              {noBannerExists ? "Creating Banner..." : "Uploading..."} {uploadProgress}%
                            </>
                          ) : (
                            <>
                              {noBannerExists ? (
                                <>
                                  <FaPlus className="w-6 h-6 mr-3" />
                                  Create Banner
                                </>
                              ) : (
                                <>
                                  <FaCloudUploadAlt className="w-6 h-6 mr-3" />
                                  Upload and Update Banner
                                </>
                              )}
                            </>
                          )}
                        </button>

                        {updating && (
                          <div className="w-full bg-gray-200 rounded-full h-3 mt-4 overflow-hidden">
                            <div
                              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Crop Modal */}
        <CropModal
          isOpen={showCropModal}
          onClose={handleCropModalClose}
          onSave={showEditModal ? handleEditCropSave : handleCropSave}
          imageFile={cropModalImage}
          title={cropModalTitle}
        />

        {/* Edit Image Modal */}
        <AnimatePresence>
          {showEditModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9821631]"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full h-[95vh] overflow-y-auto max-w-3xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FaEdit className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">Replace Banner Image</h3>
                        <p className="text-sm text-gray-500">Upload a new image to replace the current one</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowEditModal(false)
                        setEditingImage(null)
                      }}
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <FaTimes className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Current Image */}
                  {editingImage && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3">Current Image</h4>
                      <div className="aspect-[16/9] rounded-xl overflow-hidden border border-gray-200 shadow-md">
                        <img
                          src={editingImage.url || "/placeholder.svg"}
                          alt="Current banner image"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Upload New Image */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Upload Replacement</h4>
                    <label
                      htmlFor="edit-image-upload"
                      className="block w-full p-8 border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <FaPlus className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-gray-900 font-medium mb-1">Choose New Image</p>
                      <p className="text-sm text-gray-500">JPEG, PNG, WebP (max 5MB) - Will be cropped to 16:9</p>
                    </label>
                    <input
                      type="file"
                      id="edit-image-upload"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleEditImageChange}
                      className="hidden"
                    />
                  </div>

                  {/* Progress Bar */}
                  {uploadProgress > 0 && updating && (
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 text-center">Uploading: {uploadProgress}%</p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingImage(null)
                    }}
                    className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Container */}
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          toastClassName="rounded-xl"
        />
      </div>
    </div>
  )
}

// Sortable Image Item Component
interface SortableImageItemProps {
  image: BannerImage
  index: number
  onDelete: (id: string) => void
  onEdit: () => void
  isProcessing: boolean
}

function SortableImageItem({ image, index, onDelete, onEdit, isProcessing }: SortableImageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image._id,
    transition: {
      duration: 300,
      easing: "ease-in-out",
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <motion.div
      layout
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-md group transition-all ${
        isDragging ? "shadow-xl border-blue-300 bg-blue-50" : ""
      }`}
      variants={slideUp}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <MdDragIndicator className="w-5 h-5" />
      </div>

      <div className="w-32 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 shadow-sm">
        <img
          src={image.url || "/placeholder.svg"}
          alt={`Banner image ${index + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="font-semibold text-gray-900">Image {index + 1}</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
            Position: {image.order}
          </span>
          {index === 0 && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Primary</span>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">{image.url.split("/").pop()}</p>
      </div>

      <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="w-10 h-10 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center"
          title="Edit image"
        >
          <AiOutlineEdit className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(image._id)}
          className="w-10 h-10 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          title="Delete image"
          disabled={isProcessing}
        >
          {isProcessing ? <FaSpinner className="w-4 h-4 animate-spin" /> : <AiOutlineDelete className="w-5 h-5" />}
        </button>
      </div>
    </motion.div>
  )
}
