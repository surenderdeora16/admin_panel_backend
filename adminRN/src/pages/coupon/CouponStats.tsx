"use client"

import { useState, useEffect } from "react"
import { FaTimes, FaChartBar, FaUsers, FaRupeeSign, FaCalendarAlt } from "react-icons/fa"
import axios from "axios"
import { toast } from "react-toastify"

const CouponStats = ({ coupon, onClose }) => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [usageData, setUsageData] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })

  // Fetch coupon stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)

        // Fetch stats and usage data in parallel
        const [statsRes, usageRes] = await Promise.all([
          axios.get(`/api/admin/coupons/${coupon._id}/stats`),
          axios.get(`/api/admin/coupons/${coupon._id}/usage`, {
            params: {
              page: pagination.page,
              limit: pagination.limit,
            },
          }),
        ])

        setStats(statsRes.data.data)
        setUsageData(usageRes.data.data)
        setPagination({
          ...pagination,
          total: usageRes.data.total,
          pages: usageRes.data.pagination.pages,
        })
      } catch (error) {
        console.error("Error fetching coupon stats:", error)
        toast.error("Failed to fetch coupon statistics")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [coupon._id, pagination.page, pagination.limit])

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination({ ...pagination, page: newPage })
    }
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
          <FaChartBar className="text-purple-500 mr-2" />
          Coupon Statistics: {coupon.code}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FaTimes className="h-5 w-5" />
        </button>
      </div>

      {loading && !stats ? (
        <div className="flex justify-center py-8">
          {/* <Loader size="large" /> */}
          loading...
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
                  <FaUsers className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Usage</p>
                  <p className="text-xl font-semibold">
                    {stats.usageCount} / {stats.usageLimit || "∞"}
                  </p>
                </div>
              </div>
              {stats.usageLimit && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-purple-600 h-2.5 rounded-full"
                      style={{ width: `${Math.min(stats.usagePercentage, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stats.usagePercentage.toFixed(1)}% used</p>
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                  <FaRupeeSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Discount</p>
                  <p className="text-xl font-semibold">₹{stats.totalDiscountAmount.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Avg. Discount: ₹
                {stats.usageCount > 0 ? (stats.totalDiscountAmount / stats.usageCount).toFixed(2) : "0.00"}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                  <FaRupeeSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Sales</p>
                  <p className="text-xl font-semibold">₹{stats.totalFinalAmount.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Original Value: ₹{stats.totalOriginalAmount.toFixed(2)}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
                  <FaCalendarAlt className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Validity</p>
                  <p className="text-xl font-semibold">
                    {new Date(coupon.endDate) > new Date() ? "Active" : "Expired"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {formatDate(coupon.startDate)} to {formatDate(coupon.endDate)}
              </p>
            </div>
          </div>

          {/* Usage History */}
          <h3 className="text-lg font-medium text-gray-800 mb-4">Usage History</h3>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader />
            </div>
          ) : usageData.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-gray-500">No usage data available for this coupon</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Item
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Order
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Amount
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Used At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usageData.map((usage) => (
                      <tr key={usage._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{usage.userId.name}</div>
                          <div className="text-sm text-gray-500">{usage.userId.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {usage.orderId.itemId.title || usage.orderId.itemId.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {usage.orderId.itemType === "EXAM_PLAN" ? "Exam Plan" : "Note"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{usage.orderId.orderNumber}</div>
                          <div className="text-sm text-gray-500">{usage.orderId.status}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">₹{usage.finalAmount.toFixed(2)}</div>
                          <div className="text-sm text-green-600">-₹{usage.discountAmount.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(usage.usedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        pagination.page === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        pagination.page === pagination.pages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                        <span className="font-medium">
                          {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{" "}
                        of <span className="font-medium">{pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                            pagination.page === 1
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <span className="sr-only">Previous</span>
                          <span>Prev</span>
                        </button>

                        {/* Page Numbers */}
                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                          let pageNum
                          if (pagination.pages <= 5) {
                            pageNum = i + 1
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1
                          } else if (pagination.page >= pagination.pages - 2) {
                            pageNum = pagination.pages - 4 + i
                          } else {
                            pageNum = pagination.page - 2 + i
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border ${
                                pagination.page === pageNum
                                  ? "z-10 bg-purple-50 border-purple-500 text-purple-600"
                                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                              } text-sm font-medium`}
                            >
                              {pageNum}
                            </button>
                          )
                        })}

                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.pages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                            pagination.page === pagination.pages
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <span className="sr-only">Next</span>
                          <span>Next</span>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CouponStats
