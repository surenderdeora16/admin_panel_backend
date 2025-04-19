"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { FaSave, FaTimes } from "react-icons/fa"
import axios from "axios"
import { toast } from "react-toastify"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

const CouponForm = ({ coupon, onClose, onSave }) => {
  const [loading, setLoading] = useState(false)
  const [examPlans, setExamPlans] = useState([])
  const [notes, setNotes] = useState([])
  const [startDate, setStartDate] = useState(coupon ? new Date(coupon.startDate) : new Date())
  const [endDate, setEndDate] = useState(
    coupon ? new Date(coupon.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  )
  const [specificItems, setSpecificItems] = useState(coupon?.specificItems || [])
  const [applicableFor, setApplicableFor] = useState(coupon?.applicableFor || "ALL")

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      code: coupon?.code || "",
      description: coupon?.description || "",
      discountType: coupon?.discountType || "PERCENTAGE",
      discountValue: coupon?.discountValue || 10,
      maxDiscountAmount: coupon?.maxDiscountAmount || "",
      minPurchaseAmount: coupon?.minPurchaseAmount || 0,
      applicableFor: coupon?.applicableFor || "ALL",
      usageLimit: coupon?.usageLimit || "",
      perUserLimit: coupon?.perUserLimit || 1,
      isActive: coupon?.isActive !== undefined ? coupon.isActive : true,
    },
  })

  const discountType = watch("discountType")

  // Fetch exam plans and notes for specific items selection
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const [examPlansRes, notesRes] = await Promise.all([
          axios.get("/api/admin/exam-plans?limit=100"),
          axios.get("/api/admin/notes?limit=100"),
        ])

        setExamPlans(examPlansRes.data.data)
        setNotes(notesRes.data.data)
      } catch (error) {
        console.error("Error fetching items:", error)
        toast.error("Failed to fetch items")
      }
    }

    fetchItems()
  }, [])

  // Set form values when coupon changes
  useEffect(() => {
    if (coupon) {
      setValue("code", coupon.code)
      setValue("description", coupon.description)
      setValue("discountType", coupon.discountType)
      setValue("discountValue", coupon.discountValue)
      setValue("maxDiscountAmount", coupon.maxDiscountAmount)
      setValue("minPurchaseAmount", coupon.minPurchaseAmount)
      setValue("applicableFor", coupon.applicableFor)
      setValue("usageLimit", coupon.usageLimit)
      setValue("perUserLimit", coupon.perUserLimit)
      setValue("isActive", coupon.isActive)

      setStartDate(new Date(coupon.startDate))
      setEndDate(new Date(coupon.endDate))
      setSpecificItems(coupon.specificItems || [])
      setApplicableFor(coupon.applicableFor)
    }
  }, [coupon, setValue])

  const onSubmit = async (data) => {
    try {
      setLoading(true)

      // Prepare coupon data
      const couponData = {
        ...data,
        startDate,
        endDate,
        specificItems: applicableFor === "SPECIFIC" ? specificItems : [],
      }

      // Convert empty strings to null
      if (couponData.maxDiscountAmount === "") couponData.maxDiscountAmount = null
      if (couponData.usageLimit === "") couponData.usageLimit = null

      let response

      if (coupon) {
        // Update existing coupon
        response = await axios.put(`/api/admin/coupons/${coupon._id}`, couponData)
        toast.success("Coupon updated successfully")
      } else {
        // Create new coupon
        response = await axios.post("/api/admin/coupons", couponData)
        toast.success("Coupon created successfully")
      }

      onSave(response.data.data)
    } catch (error) {
      console.error("Error saving coupon:", error)
      toast.error(error.response?.data?.message || "Failed to save coupon")
    } finally {
      setLoading(false)
    }
  }

  const handleAddSpecificItem = (itemType, itemId) => {
    // Check if item already exists
    const exists = specificItems.some((item) => item.itemType === itemType && item.itemId === itemId)

    if (!exists) {
      setSpecificItems([...specificItems, { itemType, itemId }])
    }
  }

  const handleRemoveSpecificItem = (index) => {
    const updatedItems = [...specificItems]
    updatedItems.splice(index, 1)
    setSpecificItems(updatedItems)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">{coupon ? "Edit Coupon" : "Create New Coupon"}</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FaTimes className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coupon Code */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code*</label>
            <input
              type="text"
              {...register("code", {
                required: "Coupon code is required",
                minLength: {
                  value: 3,
                  message: "Coupon code must be at least 3 characters",
                },
                maxLength: {
                  value: 20,
                  message: "Coupon code cannot exceed 20 characters",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., SUMMER20"
              disabled={coupon}
            />
            {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>}
          </div>

          {/* Description */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              {...register("description", {
                maxLength: {
                  value: 500,
                  message: "Description cannot exceed 500 characters",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., 20% off for summer sale"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
          </div>

          {/* Discount Type */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type*</label>
            <select
              {...register("discountType", { required: "Discount type is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount (₹)</option>
            </select>
            {errors.discountType && <p className="mt-1 text-sm text-red-600">{errors.discountType.message}</p>}
          </div>

          {/* Discount Value */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value*</label>
            <input
              type="number"
              {...register("discountValue", {
                required: "Discount value is required",
                min: {
                  value: 0,
                  message: "Discount value cannot be negative",
                },
                max: {
                  value: discountType === "PERCENTAGE" ? 100 : 10000,
                  message:
                    discountType === "PERCENTAGE"
                      ? "Percentage cannot exceed 100%"
                      : "Fixed amount cannot exceed ₹10,000",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder={discountType === "PERCENTAGE" ? "e.g., 20" : "e.g., 500"}
            />
            {errors.discountValue && <p className="mt-1 text-sm text-red-600">{errors.discountValue.message}</p>}
          </div>

          {/* Max Discount Amount (for percentage) */}
          {discountType === "PERCENTAGE" && (
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount Amount (₹)</label>
              <input
                type="number"
                {...register("maxDiscountAmount", {
                  min: {
                    value: 0,
                    message: "Max discount amount cannot be negative",
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., 500 (leave empty for no limit)"
              />
              {errors.maxDiscountAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.maxDiscountAmount.message}</p>
              )}
            </div>
          )}

          {/* Min Purchase Amount */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Purchase Amount (₹)</label>
            <input
              type="number"
              {...register("minPurchaseAmount", {
                min: {
                  value: 0,
                  message: "Min purchase amount cannot be negative",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., 1000 (0 for no minimum)"
            />
            {errors.minPurchaseAmount && (
              <p className="mt-1 text-sm text-red-600">{errors.minPurchaseAmount.message}</p>
            )}
          </div>

          {/* Start Date */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date*</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              dateFormat="yyyy-MM-dd"
              minDate={new Date()}
            />
          </div>

          {/* End Date */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date*</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              dateFormat="yyyy-MM-dd"
              minDate={startDate}
            />
          </div>

          {/* Applicable For */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Applicable For*</label>
            <select
              {...register("applicableFor", { required: "This field is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              onChange={(e) => setApplicableFor(e.target.value)}
              value={applicableFor}
            >
              <option value="ALL">All Items</option>
              <option value="EXAM_PLAN">Exam Plans Only</option>
              <option value="NOTE">Notes Only</option>
              <option value="SPECIFIC">Specific Items</option>
            </select>
          </div>

          {/* Usage Limit */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Usage Limit</label>
            <input
              type="number"
              {...register("usageLimit", {
                min: {
                  value: 0,
                  message: "Usage limit cannot be negative",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., 100 (leave empty for unlimited)"
            />
            {errors.usageLimit && <p className="mt-1 text-sm text-red-600">{errors.usageLimit.message}</p>}
          </div>

          {/* Per User Limit */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Per User Limit*</label>
            <input
              type="number"
              {...register("perUserLimit", {
                required: "Per user limit is required",
                min: {
                  value: 1,
                  message: "Per user limit must be at least 1",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., 1"
            />
            {errors.perUserLimit && <p className="mt-1 text-sm text-red-600">{errors.perUserLimit.message}</p>}
          </div>

          {/* Is Active */}
          <div className="col-span-1">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register("isActive")}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
          </div>
        </div>

        {/* Specific Items Selection (if applicable) */}
        {applicableFor === "SPECIFIC" && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Select Specific Items</h3>

            {/* Selected Items */}
            {specificItems.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Items:</h4>
                <div className="flex flex-wrap gap-2">
                  {specificItems.map((item, index) => (
                    <div
                      key={`${item.itemType}-${item.itemId}`}
                      className="flex items-center bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full"
                    >
                      <span>
                        {item.itemType === "EXAM_PLAN"
                          ? examPlans.find((p) => p._id === item.itemId)?.title || "Exam Plan"
                          : notes.find((n) => n._id === item.itemId)?.title || "Note"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecificItem(index)}
                        className="ml-2 text-purple-600 hover:text-purple-800"
                      >
                        <FaTimes className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exam Plans */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Exam Plans:</h4>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                {examPlans.length > 0 ? (
                  examPlans.map((plan) => (
                    <div key={plan._id} className="flex items-center py-1">
                      <button
                        type="button"
                        onClick={() => handleAddSpecificItem("EXAM_PLAN", plan._id)}
                        className="text-sm text-purple-600 hover:text-purple-800"
                        disabled={specificItems.some(
                          (item) => item.itemType === "EXAM_PLAN" && item.itemId === plan._id,
                        )}
                      >
                        {specificItems.some((item) => item.itemType === "EXAM_PLAN" && item.itemId === plan._id)
                          ? "Added"
                          : "Add"}
                      </button>
                      <span className="ml-2 text-sm text-gray-700">{plan.title}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No exam plans available</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Notes:</h4>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                {notes.length > 0 ? (
                  notes.map((note) => (
                    <div key={note._id} className="flex items-center py-1">
                      <button
                        type="button"
                        onClick={() => handleAddSpecificItem("NOTE", note._id)}
                        className="text-sm text-purple-600 hover:text-purple-800"
                        disabled={specificItems.some((item) => item.itemType === "NOTE" && item.itemId === note._id)}
                      >
                        {specificItems.some((item) => item.itemType === "NOTE" && item.itemId === note._id)
                          ? "Added"
                          : "Add"}
                      </button>
                      <span className="ml-2 text-sm text-gray-700">{note.title}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No notes available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                {coupon ? "Update Coupon" : "Create Coupon"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CouponForm
