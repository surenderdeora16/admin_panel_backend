'use client';

import { useEffect, useState, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaTrashAlt,
  FaUpload,
  FaImages,
  FaInfoCircle,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaGripVertical,
  FaEdit,
  FaPlus,
} from 'react-icons/fa';
import { Modal } from 'react-bootstrap';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { AnimatePresence, motion } from 'framer-motion';

// API Configuration
const API_BASE_URL =
  'http://localhost:3000/api-v1/admin';

export default function BannerManagement() {
  // State Management
  const [banner, setBanner] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Image editing states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);
  const [crop, setCrop] = useState({
    unit: '%',
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);

  // Fixed aspect ratio for images
  const ASPECT_RATIO = 16 / 9;

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

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      toast.error('Maximum 10 images allowed at once');
      return;
    }

    setNewImages(files);

    // Generate preview URLs
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(newPreviewUrls);
  };

  // Fetch the latest banner
  const fetchLatestBanner = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/getSingleBannerWithImages`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );

      if (response.data.status && response.data.data) {
        setBanner(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to fetch banner');
      }
    } catch (error) {
      console.error('Error fetching banner:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch banner');
    } finally {
      setLoading(false);
    }
  };

  // Update banner with new images and/or reordered images
  const updateBanner = async () => {
    if (!banner) {
      toast.error('No banner found to update');
      return;
    }

    const formData = new FormData();

    // Add new images if any
    if (newImages.length > 0) {
      newImages.forEach((file) => {
        formData.append("images", file)
      })
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
  formData.append("orderUpdateOnly", "true")
}

    try {
      setUpdating(true);
      setUploadProgress(0);

      const response = await axios.put(
        `${API_BASE_URL}/banner-update/${banner._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(percentCompleted);
          },
        },
      );

      if (response.data.status) {
        toast.success('Banner updated successfully');
        setNewImages([]);
        setPreviewUrls([]);
        fetchLatestBanner();
      } else {
        toast.error(response.data.message || 'Failed to update banner');
      }
    } catch (error) {
      console.error('Error updating banner:', error);
      toast.error(error.response?.data?.message || 'Failed to update banner');
    } finally {
      setUpdating(false);
      setUploadProgress(0);
    }
  };

  // Delete an image
  const deleteImage = async (imageId) => {
    if (!banner) return;

    try {
      setLoading(true);
      const response = await axios.delete(
        `${API_BASE_URL}/banner-delete-image/${banner._id}/${imageId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );

      if (response.data.status) {
        toast.success('Image deleted successfully');
        fetchLatestBanner();
      } else {
        toast.error(response.data.message || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error(error.response?.data?.message || 'Failed to delete image');
    } finally {
      setLoading(false);
    }
  };

  // Handle drag end event
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setBanner((banner) => {
        const oldIndex = banner.images.findIndex(
          (img) => img._id === active.id,
        );
        const newIndex = banner.images.findIndex((img) => img._id === over.id);

        return {
          ...banner,
          images: arrayMove(banner.images, oldIndex, newIndex),
        };
      });
    }
  };

  // Clear selected new images
  const clearNewImages = () => {
    setNewImages([]);
    setPreviewUrls([]);
  };

  // Open edit modal for a specific image
  const openEditModal = (image) => {
    setEditingImage(image);
    setShowEditModal(true);
  };

  // Handle image edit file selection
  const handleEditImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setEditImageFile(file);

      // Create a preview URL
      const reader = new FileReader();
      reader.addEventListener(
        'load',
        () => (imgRef.current.src = reader.result),
      );
      reader.readAsDataURL(file);
    }
  };

  // Update a specific image
  const updateSingleImage = async () => {
    if (!editingImage || !editImageFile) {
      toast.error('No image selected for update');
      return;
    }

    try {
      setUpdating(true);

      // Create a canvas with the cropped image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!completedCrop || !imgRef.current) {
        toast.error('Please select a crop area');
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
        const file = new File([blob], editImageFile.name, {
          type: 'image/jpeg',
        });

        const formData = new FormData();
        formData.append('image', file);
        formData.append('imageId', editingImage._id);

        const response = await axios.put(
          `${API_BASE_URL}/update-single-image/${banner._id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data',
            },
          },
        );

        if (response.data.status) {
          toast.success('Image updated successfully');
          setShowEditModal(false);
          setEditingImage(null);
          setEditImageFile(null);
          fetchLatestBanner();
        } else {
          toast.error(response.data.message || 'Failed to update image');
        }

        setUpdating(false);
      }, 'image/jpeg');
    } catch (error) {
      console.error('Error updating image:', error);
      toast.error(error.response?.data?.message || 'Failed to update image');
      setUpdating(false);
    }
  };

  // Render loading state
  if (loading && !banner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <FaSpinner className="w-12 h-12 text-blue-600 animate-spin" />
        <h2 className="mt-4 text-xl font-semibold text-gray-700">
          Loading Banner Data...
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Banner Management
          </h1>
          <p className="text-gray-600">
            Manage your banner images, reorder them using drag and drop, and
            upload new images.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Upload Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Upload New Images
            </h2>

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
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FaUpload className="w-12 h-12 text-blue-500 mb-2" />
                  <span className="text-sm font-medium text-gray-700">
                    Click to select images
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    or drag and drop (max 10 images)
                  </span>
                </label>
              </div>

              {/* Preview Section */}
              {previewUrls.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-gray-700">
                      Selected Images ({previewUrls.length})
                    </h3>
                    <button
                      onClick={clearNewImages}
                      className="text-red-500 hover:text-red-700 flex items-center text-sm"
                    >
                      <FaTimes className="w-4 h-4 mr-1" />
                      Clear All
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-[16/9] rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={url || '/placeholder.svg'}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => {
                              const newFiles = [...newImages];
                              newFiles.splice(index, 1);
                              setNewImages(newFiles);

                              const newUrls = [...previewUrls];
                              URL.revokeObjectURL(newUrls[index]);
                              newUrls.splice(index, 1);
                              setPreviewUrls(newUrls);
                            }}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                          >
                            <FaTrashAlt className="w-4 h-4" />
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
                        <FaSpinner className="w-5 h-5 mr-2 animate-spin" />
                        Uploading... {uploadProgress}%
                      </>
                    ) : (
                      <>
                        <FaUpload className="w-5 h-5 mr-2" />
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
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Current Banner Images
            </h2>

            {banner && banner.images.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={banner.images.map((img) => img._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="divide-y divide-gray-200">
                      {banner.images.map((image, index) => (
                        <SortableImageItem
                          key={image._id}
                          image={image}
                          index={index}
                          onDelete={deleteImage}
                          onEdit={() => openEditModal(image)}
                        />
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
                        <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
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
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center">
                <FaImages className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-1">
                  No Images Found
                </h3>
                <p className="text-gray-500 text-center max-w-md">
                  {loading
                    ? 'Loading images...'
                    : 'Upload new images to display them here.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start">
            <FaInfoCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-1">
                How to use this interface
              </h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
                <li>Drag and drop images to reorder them</li>
                <li>Click the trash icon to delete an image</li>
                <li>Click the edit icon to replace a specific image</li>
                <li>Upload new images using the upload section</li>
                <li>Click "Save Order" after reordering to save changes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Toast Container for notifications */}
        <ToastContainer position="bottom-right" autoClose={3000} />

       <AnimatePresence>
  {showEditModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ zIndex: '214748364' }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 sm:p-8"
    >
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 relative">
        <h4 className="text-2xl font-semibold text-gray-800">Edit Image</h4>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h4 className="text-lg font-medium text-gray-700">Current Image</h4>
            <div className="flex items-center">
              <label
                htmlFor="edit-image-upload"
                className="cursor-pointer bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
              >
                <FaPlus className="w-4 h-4" />
                Select New Image
              </label>
              <input
                type="file"
                id="edit-image-upload"
                accept="image/*"
                onChange={handleEditImageChange}
                className="hidden"
              />
            </div>
          </div>

          {editingImage && (
            <div className="aspect-[16/9] rounded-xl overflow-hidden border border-gray-300">
              <img
                src={editingImage.url || '/placeholder.svg'}
                alt="Current image"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {editImageFile && (
            <>
              <div>
                <h4 className="text-lg font-medium text-gray-700">New Image Preview</h4>
                <p className="text-sm text-gray-500">
                  Drag to crop the image to the desired area (16:9 aspect ratio)
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 overflow-auto max-h-[400px]">
                <ReactCrop
                  src=""
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={ASPECT_RATIO}
                >
                  <img
                    ref={imgRef}
                    alt="Crop preview"
                    className="max-w-full"
                  />
                </ReactCrop>
              </div>

              <canvas
                ref={previewCanvasRef}
                style={{
                  display: 'none',
                  width: completedCrop?.width ?? 0,
                  height: completedCrop?.height ?? 0,
                }}
              />
            </>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowEditModal(false)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={updateSingleImage}
            disabled={!editImageFile || updating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? (
              <>
                <FaSpinner className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <FaCheck className="w-4 h-4" />
                Update Image
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>

        {/* Edit Image Modal */}
        {/* <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Edit Image</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            
          </Modal.Body>
          <Modal.Footer>
           
          </Modal.Footer>
        </Modal> */}
      </div>
    </div>
  );
}

// Sortable Image Item Component
function SortableImageItem({ image, index, onDelete, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: image._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-4 flex items-center gap-4 hover:bg-gray-50"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600"
      >
        <FaGripVertical className="w-5 h-5" />
      </div>

      <div className="w-24 h-16 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
        <img
          src={image.url || '/placeholder.svg'}
          alt={`Banner image ${index + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <span className="font-medium text-gray-700">Image {index + 1}</span>
          <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
            Order: {image.order}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate">
          {image.url.split('/').pop()}
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onEdit}
          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
          title="Edit image"
        >
          <FaEdit className="w-5 h-5" />
        </button>

        <button
          onClick={() => onDelete(image._id)}
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
          title="Delete image"
        >
          <FaTrashAlt className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
