'use client';

import type React from 'react';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ToastContainer, toast } from 'react-toastify';
import {
  FaTrashAlt,
  FaImages,
  FaInfoCircle,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaPlus,
  FaExclamationTriangle,
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaCloudUploadAlt,
  FaLightbulb,
} from 'react-icons/fa';
import { BiImageAdd, BiSortAlt2, BiHelpCircle } from 'react-icons/bi';
import {
  MdDragIndicator,
  MdOutlinePhotoLibrary,
  MdOutlineAddPhotoAlternate,
} from 'react-icons/md';
import {
  AiOutlineCloudUpload,
  AiOutlineDelete,
  AiOutlineEdit,
  AiOutlineEye,
} from 'react-icons/ai';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { AnimatePresence, motion } from 'framer-motion';
import AxiosHelper from '../helper/AxiosHelper';

// Types
interface BannerImage {
  _id: string;
  url: string;
  order: number;
  isActive: boolean;
  deletedAt: string | null;
}

interface Banner {
  _id: string;
  images: BannerImage[];
  isActive: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Constants
const ASPECT_RATIO = 16 / 9;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGES = 10;

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function AppBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [processingImageIds, setProcessingImageIds] = useState<Set<string>>(
    new Set(),
  );
  const [activeTab, setActiveTab] = useState<string>('manage');
  const [isDragging, setIsDragging] = useState(false);

  // Image editing states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingImage, setEditingImage] = useState<BannerImage | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cache for API responses to prevent redundant calls
  const apiCache = useRef<Map<string, any>>(new Map());

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
  );

  // Fetch the latest banner on component mount
  useEffect(() => {
    fetchLatestBanner();
  }, []);

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Handle keyboard navigation in preview mode
  useEffect(() => {
    if (previewMode && banner && banner.images.length > 1) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
          navigatePreview('prev');
        } else if (e.key === 'ArrowRight') {
          navigatePreview('next');
        } else if (e.key === 'Escape') {
          togglePreviewMode();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [previewMode, banner, currentPreviewIndex]);

  // Validate file before adding
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'File type not supported. Please upload JPEG, PNG, or WebP images.';
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return `File size exceeds 5MB limit. Current size: ${(
        file.size /
        (1024 * 1024)
      ).toFixed(2)}MB`;
    }

    return null;
  };

  // Handle file selection with validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);

    if (files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed at once`, {
        position: 'bottom-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [];
    let hasErrors = false;

    files.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`, {
          position: 'bottom-right',
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        hasErrors = true;
      } else {
        validFiles.push(file);
        newPreviewUrls.push(URL.createObjectURL(file));
      }
    });

    if (hasErrors) {
      // Clean up any created object URLs if there were errors
      newPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      return;
    }

    setNewImages(validFiles);
    setPreviewUrls(newPreviewUrls);
    setError(null);

    // Reset file input value to allow selecting the same file again
    if (e.target.value) e.target.value = '';
  };

  // Handle drag and drop for file upload
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        ALLOWED_FILE_TYPES.includes(file.type),
      );

      if (files.length === 0) {
        toast.error(
          'No valid image files found. Please upload JPEG, PNG, or WebP images.',
          {
            position: 'bottom-right',
            autoClose: 4000,
          },
        );
        return;
      }

      if (files.length > MAX_IMAGES) {
        toast.error(`Maximum ${MAX_IMAGES} images allowed at once`, {
          position: 'bottom-right',
          autoClose: 4000,
        });
        return;
      }

      // Process the files
      const validFiles: File[] = [];
      const newPreviewUrls: string[] = [];
      let hasErrors = false;

      files.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          toast.error(`${file.name}: ${error}`, {
            position: 'bottom-right',
            autoClose: 4000,
          });
          hasErrors = true;
        } else {
          validFiles.push(file);
          newPreviewUrls.push(URL.createObjectURL(file));
        }
      });

      if (hasErrors) {
        // Clean up any created object URLs if there were errors
        newPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
        return;
      }

      setNewImages(validFiles);
      setPreviewUrls(newPreviewUrls);
      setError(null);
    }
  };

  // Fetch the latest banner with caching
  const fetchLatestBanner = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first (with a 30-second expiry)
      const cacheKey = 'getSingleBannerWithImages';
      const cachedData = apiCache.current.get(cacheKey);
      const now = Date.now();

      if (cachedData && now - cachedData.timestamp < 30000) {
        setBanner(cachedData.data);
        setLoading(false);
        return;
      }

      const response = await AxiosHelper.getData(`getSingleBannerWithImages`);

      if (response?.data?.status && response.data.data) {
        // Update cache
        apiCache.current.set(cacheKey, {
          data: response.data.data,
          timestamp: now,
        });

        setBanner(response.data.data);
      } else {
        setError(response?.data?.message || 'Failed to fetch banner');
        toast.error(response?.data?.message || 'Failed to fetch banner', {
          position: 'bottom-right',
          autoClose: 4000,
        });
      }
    } catch (error: any) {
      console.error('Error fetching banner:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to fetch banner';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'bottom-right',
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Update banner with new images and/or reordered images
  const updateBanner = async () => {
    if (!banner) {
      toast.error('No banner found to update', {
        position: 'bottom-right',
        autoClose: 4000,
      });
      return;
    }

    if (updating) {
      return; // Prevent multiple simultaneous updates
    }

    const formData = new FormData();

    // Add new images if any
    if (newImages.length > 0) {
      newImages.forEach((file) => {
        formData.append('images', file);
      });
    }

    // Add current active status
    formData.append('isActive', banner.isActive.toString());

    // Add image orders
    const imageOrdersData = banner.images.map((img, index) => ({
      id: img._id,
      order: index,
    }));

    formData.append('imageOrders', JSON.stringify(imageOrdersData));

    // If we're just reordering (no new images), add a flag to skip image validation
    if (newImages.length === 0) {
      formData.append('orderUpdateOnly', 'true');
    }

    try {
      setUpdating(true);
      setUploadProgress(0);
      setError(null);

      // Clear cache for banner data
      apiCache.current.delete('getSingleBannerWithImages');

      // Add onUploadProgress to track upload progress
      const response = await AxiosHelper.putData(
        `banner-update/${banner._id}`,
        formData,
        true,
        {
          onUploadProgress: (progressEvent: any) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(percentCompleted);
          },
        },
      );

      if (response?.data?.status) {
        toast.success('Banner updated successfully', {
          position: 'bottom-right',
          autoClose: 3000,
          icon: <FaCheck className="text-green-500" />,
        });
        setNewImages([]);
        // Clean up preview URLs
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        setPreviewUrls([]);
        fetchLatestBanner();
      } else {
        const errorMessage =
          response?.data?.message || 'Failed to update banner';
        setError(errorMessage);
        toast.error(errorMessage, {
          position: 'bottom-right',
          autoClose: 4000,
        });
      }
    } catch (error: any) {
      console.error('Error updating banner:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to update banner';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'bottom-right',
        autoClose: 4000,
      });
    } finally {
      setUpdating(false);
      setUploadProgress(0);
    }
  };

  // Delete an image with protection against multiple clicks
  const deleteImage = async (imageId: string) => {
    if (!banner) return;

    // Check if this image is already being processed
    if (processingImageIds.has(imageId)) {
      return;
    }

    try {
      // Mark this image as being processed
      setProcessingImageIds((prev) => new Set(prev).add(imageId));

      // Clear cache for banner data
      apiCache.current.delete('getSingleBannerWithImages');

      const response = await AxiosHelper.deleteData(
        `banner-delete-image/${banner._id}/${imageId}`,
      );

      if (response?.data?.status) {
        toast.success('Image deleted successfully', {
          position: 'bottom-right',
          autoClose: 3000,
          icon: <FaCheck className="text-green-500" />,
        });
        fetchLatestBanner();
      } else {
        const errorMessage =
          response?.data?.message || 'Failed to delete image';
        setError(errorMessage);
        toast.error(errorMessage, {
          position: 'bottom-right',
          autoClose: 4000,
        });
      }
    } catch (error: any) {
      console.error('Error deleting image:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to delete image';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'bottom-right',
        autoClose: 4000,
      });
    } finally {
      // Remove this image from the processing set
      setProcessingImageIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  };

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over?.id) {
      setBanner((prevBanner) => {
        if (!prevBanner) return null;

        const oldIndex = prevBanner.images.findIndex(
          (img) => img._id === active.id,
        );
        const newIndex = prevBanner.images.findIndex(
          (img) => img._id === over.id,
        );

        // Show a toast notification for the reordering
        toast.info(`Image ${oldIndex + 1} moved to position ${newIndex + 1}`, {
          position: 'bottom-right',
          autoClose: 2000,
          hideProgressBar: true,
          icon: <BiSortAlt2 className="text-blue-500" />,
        });

        return {
          ...prevBanner,
          images: arrayMove(prevBanner.images, oldIndex, newIndex),
        };
      });
    }
  };

  // Clear selected new images
  const clearNewImages = useCallback(() => {
    // Clean up preview URLs
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setNewImages([]);
    setPreviewUrls([]);
  }, [previewUrls]);

  // Open edit modal for a specific image
  const openEditModal = (image: BannerImage) => {
    setEditingImage(image);
    setShowEditModal(true);
    setCompletedCrop(null);
    setEditImageFile(null);
  };

  // Handle image edit file selection
  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const error = validateFile(file);

    if (error) {
      toast.error(error, {
        position: 'bottom-right',
        autoClose: 4000,
      });
      return;
    }

    setEditImageFile(file);

    // Create a preview URL
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (imgRef.current && reader.result) {
        imgRef.current.src = reader.result.toString();
      }
    });
    reader.readAsDataURL(file);

    // Reset file input value to allow selecting the same file again
    if (e.target.value) e.target.value = '';
  };

  // Update a specific image
  const updateSingleImage = async () => {
    if (!editingImage || !editImageFile || !banner) {
      toast.error('No image selected for update', {
        position: 'bottom-right',
        autoClose: 4000,
      });
      return;
    }

    if (updating) {
      return; // Prevent multiple simultaneous updates
    }

    if (!completedCrop || !imgRef.current) {
      toast.error('Please select a crop area', {
        position: 'bottom-right',
        autoClose: 4000,
      });
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      setUploadProgress(0);

      // Create a canvas with the cropped image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        toast.error('Could not create image context', {
          position: 'bottom-right',
          autoClose: 4000,
        });
        setUpdating(false);
        return;
      }

      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;

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
      );

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Failed to process image', {
            position: 'bottom-right',
            autoClose: 4000,
          });
          setUpdating(false);
          return;
        }

        const file = new File([blob], editImageFile.name, {
          type: 'image/jpeg',
        });

        const formData = new FormData();
        formData.append('image', file);
        formData.append('imageId', editingImage._id);

        // Clear cache for banner data
        apiCache.current.delete('getSingleBannerWithImages');

        const response = await AxiosHelper.putData(
          `update-single-image/${banner._id}`,
          formData,
          true,
          {
            onUploadProgress: (progressEvent: any) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              setUploadProgress(percentCompleted);
            },
          },
        );

        if (response?.data?.status) {
          toast.success('Image updated successfully', {
            position: 'bottom-right',
            autoClose: 3000,
            icon: <FaCheck className="text-green-500" />,
          });
          setShowEditModal(false);
          setEditingImage(null);
          setEditImageFile(null);
          fetchLatestBanner();
        } else {
          const errorMessage =
            response?.data?.message || 'Failed to update image';
          setError(errorMessage);
          toast.error(errorMessage, {
            position: 'bottom-right',
            autoClose: 4000,
          });
        }

        setUpdating(false);
        setUploadProgress(0);
      }, 'image/jpeg');
    } catch (error: any) {
      console.error('Error updating image:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to update image';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'bottom-right',
        autoClose: 4000,
      });
      setUpdating(false);
      setUploadProgress(0);
    }
  };

  // Toggle preview mode
  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
    setCurrentPreviewIndex(0);
  };

  // Navigate through preview images
  const navigatePreview = (direction: 'next' | 'prev') => {
    if (!banner || banner.images.length === 0) return;

    if (direction === 'next') {
      setCurrentPreviewIndex((prev) =>
        prev === banner.images.length - 1 ? 0 : prev + 1,
      );
    } else {
      setCurrentPreviewIndex((prev) =>
        prev === 0 ? banner.images.length - 1 : prev - 1,
      );
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Render loading state
  if (loading && !banner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="relative">
          <FaSpinner className="w-16 h-16 text-blue-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <FaImages className="w-6 h-6 text-blue-800" />
          </div>
        </div>
        <h2 className="mt-6 text-xl font-semibold text-gray-700">
          Loading Banner Data...
        </h2>
        <p className="mt-2 text-gray-500 max-w-md text-center">
          Please wait while we retrieve your banner images
        </p>
      </div>
    );
  }

  // Render error state
  if (error && !banner && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full border border-red-100">
          <div className="flex flex-col items-center text-center">
            <div className="bg-red-50 p-3 rounded-full mb-4">
              <FaExclamationTriangle className="w-16 h-16 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Failed to Load Banner
            </h2>
            <p className="text-gray-600 mb-6 bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </p>
            <button
              onClick={fetchLatestBanner}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md flex items-center justify-center"
            >
              <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-10">
      <div className="w-full mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-4xl flex items-center font-bold text-gray-900/90 dark:text-white mb-2">
              Banner Management
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {banner && banner.images.length > 0 && (
              <button
                onClick={togglePreviewMode}
                className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  previewMode
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                }`}
                aria-label={
                  previewMode ? 'Exit preview mode' : 'Preview banner'
                }
              >
                {previewMode ? (
                  <>
                    <FaArrowLeft className="w-4 h-4 mr-2" />
                    Exit Preview
                  </>
                ) : (
                  <>
                    <AiOutlineEye className="w-5 h-5 mr-2" />
                    Preview Banner
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* Preview Mode */}
        {previewMode && banner && banner.images.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="bg-white rounded-xl w-[70%] mx-auto shadow-md overflow-hidden mb-6 border border-gray-100"
          >
            <div className="relative">
              <div className="aspect-[16/9] overflow-hidden bg-gray-900">
                <motion.img
                  key={currentPreviewIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  src={
                    banner.images[currentPreviewIndex]?.url ||
                    '/placeholder.svg'
                  }
                  alt={`Banner preview ${currentPreviewIndex + 1}`}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              </div>

              {banner.images.length > 1 && (
                <>
                  <button
                    onClick={() => navigatePreview('prev')}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-colors h-12 w-12 flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Previous image"
                  >
                    <FaChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => navigatePreview('next')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-colors h-12 w-12 flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Next image"
                  >
                    <FaChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <div className="bg-black/50 rounded-full px-4 py-1 text-white text-sm font-medium">
                  {currentPreviewIndex + 1} / {banner.images.length}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center py-6 bg-gray-50 border-t border-gray-100">
              {banner.images.length > 1 && (
                <div className="flex space-x-2 mb-4">
                  {banner.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPreviewIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        currentPreviewIndex === index
                          ? 'bg-blue-600 scale-125'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
              <button
                onClick={togglePreviewMode}
                className="mt-2 inline-flex items-center justify-center px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                <FaArrowLeft className="w-4 h-4 mr-2" />
                Return to Management
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Tabs */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="mb-6"
            >
              <div className="flex border-b border-gray-200 bg-white rounded-t-xl shadow-sm">
                <button
                  onClick={() => setActiveTab('manage')}
                  className={`px-6 py-4 font-medium text-sm flex items-center ${
                    activeTab === 'manage'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  } transition-colors rounded-tl-xl`}
                  aria-selected={activeTab === 'manage'}
                  role="tab"
                >
                  <BiSortAlt2
                    className={`w-5 h-5 mr-2 ${
                      activeTab === 'manage' ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  />
                  Manage Images
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-6 py-4 font-medium text-sm flex items-center ${
                    activeTab === 'upload'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  } transition-colors`}
                  aria-selected={activeTab === 'upload'}
                  role="tab"
                >
                  <AiOutlineCloudUpload
                    className={`w-5 h-5 mr-2 ${
                      activeTab === 'upload' ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  />
                  Upload New Images
                </button>
              </div>
            </motion.div>

            {/* Main Content */}
            {activeTab === 'manage' && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={slideUp}
                className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100"
              >
                <div className="mb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                      <BiSortAlt2 className="w-5 h-5 mr-2 text-blue-600" />
                      Current Banner Images
                    </h2>
                    <p className="text-gray-500 text-sm mt-1 ml-7">
                      {banner && banner.images.length > 0
                        ? 'Drag to reorder images or use the edit/delete buttons'
                        : 'No images have been uploaded yet'}
                    </p>
                  </div>
                </div>

                {banner && banner.images.length > 0 ? (
                  <motion.div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={banner.images.map((img) => img._id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <motion.div
                          className="divide-y divide-gray-100 my-4"
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

                    {/* Update Order Button */}
                    <div className="bg-gray-50 p-4 flex justify-between items-center border-t border-gray-100">
                      <p className="text-sm text-gray-500 hidden md:block">
                        {banner.images.length}{' '}
                        {banner.images.length === 1 ? 'image' : 'images'} in
                        total
                      </p>
                      <button
                        onClick={updateBanner}
                        disabled={updating}
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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
                  </motion.div>
                ) : (
                  <motion.div
                    variants={fadeIn}
                    className="flex flex-col items-center justify-center py-16 px-4 border border-dashed rounded-xl bg-gray-50 border-gray-200"
                  >
                    <div className="bg-gray-100 p-6 rounded-full mb-4">
                      <FaImages className="w-16 h-16 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">
                      No Images Found
                    </h3>
                    <p className="text-gray-500 text-center max-w-md mb-8">
                      {loading
                        ? 'Loading images...'
                        : "Your banner doesn't have any images yet. Add some to get started."}
                    </p>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <MdOutlineAddPhotoAlternate className="w-5 h-5 mr-2" />
                      Add Your First Image
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'upload' && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={slideUp}
                className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100"
              >
                <div className="mb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                      <AiOutlineCloudUpload className="w-5 h-5 mr-2 text-blue-600" />
                      Upload New Images
                    </h2>
                    <p className="text-gray-500 text-sm mt-1 ml-7">
                      Select images to add to your banner (max {MAX_IMAGES} at
                      once)
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* File Input */}
                  <div
                    className={`border-2 ${
                      isDragging
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100'
                    } rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer relative`}
                    onClick={triggerFileInput}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    role="button"
                    tabIndex={0}
                    aria-label="Click or drag to upload images"
                  >
                    <input
                      type="file"
                      id="image-upload"
                      ref={fileInputRef}
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                      aria-hidden="true"
                    />
                    <div
                      className={`transition-transform duration-300 ${
                        isDragging ? 'scale-110' : ''
                      }`}
                    >
                      <div className="bg-blue-100 p-4 w-20 h-20 rounded-full mx-auto mb-4 flex justify-center items-center">
                        <AiOutlineCloudUpload className="w-14 h-14 text-blue-500" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2 text-center">
                        {isDragging
                          ? 'Drop images here'
                          : 'Click to upload or drag images here'}
                      </h3>
                      <p className="text-gray-500 text-center text-sm">
                        Supports JPEG, PNG, WebP (max {MAX_IMAGES} images, 5MB
                        each)
                      </p>
                    </div>
                  </div>

                  {/* Preview Section */}
                  {previewUrls.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-700 flex items-center">
                          <BiImageAdd className="w-5 h-5 mr-2 text-blue-600" />
                          Selected Images ({previewUrls.length})
                        </h3>
                        <button
                          onClick={clearNewImages}
                          className="inline-flex items-center justify-center px-3 py-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                        >
                          <FaTimes className="w-4 h-4 mr-1.5" />
                          Clear All
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {previewUrls.map((url, index) => (
                          <motion.div
                            key={index}
                            className="relative group"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <div className="aspect-[16/9] rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                              <img
                                src={url || '/placeholder.svg'}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newFiles = [...newImages];
                                  newFiles.splice(index, 1);
                                  setNewImages(newFiles);

                                  // Revoke the URL to avoid memory leaks
                                  URL.revokeObjectURL(previewUrls[index]);
                                  const newUrls = [...previewUrls];
                                  newUrls.splice(index, 1);
                                  setPreviewUrls(newUrls);
                                }}
                                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                aria-label="Remove image"
                              >
                                <FaTrashAlt className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                              {index + 1}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Upload Button */}
                      <div className="mt-8">
                        <button
                          onClick={updateBanner}
                          disabled={updating || !banner}
                          className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          {updating ? (
                            <>
                              <FaSpinner className="w-5 h-5 mr-3 animate-spin" />
                              Uploading... {uploadProgress}%
                            </>
                          ) : (
                            <>
                              <FaCloudUploadAlt className="w-6 h-6 mr-3" />
                              Upload and Update Banner
                            </>
                          )}
                        </button>
                        {updating && (
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-3 overflow-hidden">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
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

        {/* Toast Container for notifications */}
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
        />

        {/* Edit Image Modal */}
        <AnimatePresence>
          {showEditModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              style={{ zIndex: '214748364' }}
              className="fixed inset-0 bg-gradient-to-br from-black/70 to-gray-900/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 z-50"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                transition={{
                  duration: 0.4,
                  ease: 'easeOut',
                  type: 'spring',
                  damping: 20,
                }}
                className="bg-white dark:bg-gray-800 w-full max-w-4xl max-h-[95%] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 relative border border-gray-200 dark:border-gray-700 overflow-y-auto"
              >
                {/* Header with Gradient Accent */}
                <div className="relative">
                  <div className="flex justify-between items-center">
                    <h4 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                      <AiOutlineEdit className="w-6 h-6 mr-3 text-blue-600 dark:text-blue-400" />
                      Edit Banner Image
                    </h4>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                      aria-label="Close modal"
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 ml-9">
                    Customize your banner by replacing or cropping the image
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Current Image Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                        Current Image
                      </h4>
                      {editingImage && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="aspect-[16/9] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-shadow duration-300"
                        >
                          <img
                            src={editingImage.url || '/placeholder.svg'}
                            alt="Current banner image"
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </motion.div>
                      )}
                    </div>

                    {/* Upload New Image */}
                    <div className="flex flex-col items-start sm:items-end">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                        Replace Image
                      </h4>
                      <label
                        htmlFor="edit-image-upload"
                        className="cursor-pointer inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <FaPlus className="w-4 h-4" />
                        Choose New Image
                      </label>
                      <input
                        type="file"
                        id="edit-image-upload"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleEditImageChange}
                        className="hidden"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Supports JPEG, PNG, WebP (max 5MB)
                      </p>
                    </div>
                  </div>

                  {/* Crop Section */}
                  {editImageFile && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <hr className="border-gray-200 dark:border-gray-700" />
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center">
                          <BiImageAdd className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                          Crop New Image
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 ml-7">
                          Adjust the crop area (16:9 aspect ratio)
                        </p>
                      </div>

                      <div className="relative rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                        <ReactCrop
                          crop={crop}
                          onChange={(c) => setCrop(c)}
                          onComplete={(c) => setCompletedCrop(c)}
                          aspect={ASPECT_RATIO}
                          className="max-w-full rounded-xl "
                        >
                          <img
                            ref={imgRef}
                            alt="Crop preview"
                            className="max-w-full rounded-xl transition-transform duration-300"
                          />
                        </ReactCrop>
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                          16:9
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {uploadProgress > 0 && updating && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-2"
                        >
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="bg-gradient-to-r from-blue-500 to-blue-700 h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300 text-right">
                            Uploading: {uploadProgress}%
                          </p>
                        </motion.div>
                      )}

                      <canvas
                        ref={previewCanvasRef}
                        style={{
                          display: 'none',
                          width: completedCrop?.width ?? 0,
                          height: completedCrop?.height ?? 0,
                        }}
                      />
                    </motion.div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowEditModal(false)}
                    className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl transition-all duration-200 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={updateSingleImage}
                    disabled={!editImageFile || updating}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {updating ? (
                      <>
                        <FaSpinner className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaCheck className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Sortable Image Item Component
interface SortableImageItemProps {
  image: BannerImage;
  index: number;
  onDelete: (id: string) => void;
  onEdit: () => void;
  isProcessing: boolean;
}

function SortableImageItem({
  image,
  index,
  onDelete,
  onEdit,
  isProcessing,
}: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: image._id,
    transition: {
      duration: 300,
      easing: 'ease-in-out',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      ref={setNodeRef}
      style={style}
      className={`bg-white p-4 flex items-center gap-4 hover:bg-gray-50/80 group relative ${
        isDragging
          ? 'shadow-lg rounded-lg border border-blue-200 bg-blue-50/50'
          : ''
      }`}
      variants={slideUp}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 touch-none bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        aria-label="Drag to reorder"
      >
        <MdDragIndicator className="w-5 h-5" />
      </div>

      <div className="w-24 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 shadow-sm">
        <img
          src={image.url || '/placeholder.svg'}
          alt={`Banner image ${index + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-800">Image {index + 1}</span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
            Order: {image.order}
          </span>
          {index === 0 && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              Primary
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate mt-1">
          {image.url.split('/').pop()}
        </p>
      </div>

      <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          title="Edit image"
          aria-label="Edit image"
        >
          <AiOutlineEdit className="w-4 h-4" />
        </button>

        <button
          onClick={() => onDelete(image._id)}
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          title="Delete image"
          aria-label="Delete image"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <FaSpinner className="w-4 h-4 animate-spin" />
          ) : (
            <AiOutlineDelete className="w-4 h-4" />
          )}
        </button>
      </div>
    </motion.div>
  );
}
