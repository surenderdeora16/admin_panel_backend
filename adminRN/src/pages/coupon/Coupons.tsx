'use client';

import { useState, useCallback, useEffect } from 'react';
import * as Yup from 'yup';
import {
  FaChartBar,
  FaTimes,
  FaUsers,
  FaRupeeSign,
  FaCalendarAlt,
} from 'react-icons/fa';
import AxiosHelper from '../../helper/AxiosHelper';
import DataManager from '../../components/DataManager';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Status from '../../helper/Status';

// Validation Schema for Coupon
const validationSchema = Yup.object().shape({
  code: Yup.string()
    .required('Coupon code is required')
    .min(3, 'Coupon code must be at least 3 characters')
    .max(20, 'Coupon code cannot exceed 20 characters'),

  discountType: Yup.string()
    .required('Discount type is required')
    .oneOf(['PERCENTAGE', 'FIXED'], 'Invalid discount type'),
  discountValue: Yup.number()
    .required('Discount value is required')
    .min(0, 'Discount value cannot be negative')
    .when('discountType', {
      is: 'PERCENTAGE',
      then: Yup.number().max(100, 'Percentage cannot exceed 100%'),
    }),
  maxDiscountAmount: Yup.number().min(
    0,
    'Max discount amount cannot be negative',
  ),
  minPurchaseAmount: Yup.number().min(
    0,
    'Min purchase amount cannot be negative',
  ),
  startDate: Yup.date().required('Start date is required'),
  endDate: Yup.date()
    .required('End date is required')
    .min(Yup.ref('startDate'), 'End date must be after start date'),
  applicableFor: Yup.string()
    .required('Applicable for is required')
    .oneOf(
      ['ALL', 'EXAM_PLAN', 'NOTE', 'SPECIFIC'],
      'Invalid applicable for value',
    ),
  usageLimit: Yup.number().min(0, 'Usage limit cannot be negative'),
  perUserLimit: Yup.number()
    .required('Per user limit is required')
    .min(1, 'Per user limit must be at least 1'),
  status: Yup.boolean(),
});

// Form Fields for Coupon
const formFields = [
  { label: 'Coupon Code', name: 'code', type: 'text', col: 6 },
  { label: 'Description', name: 'description', type: 'textarea', col: 6 },
  {
    label: 'Discount Type',
    name: 'discountType',
    type: 'select',
    options: [
      { id: 'PERCENTAGE', name: 'Percentage' },
      { id: 'FIXED', name: 'Fixed Amount' },
    ],
    disabled: true,
    col: 6,
  },
  { label: 'Discount Value', name: 'discountValue', type: 'number', col: 6 },
  // {
  //   label: 'Max Discount Amount',
  //   name: 'maxDiscountAmount',
  //   type: 'number',
  //   col: 6,
  // },
  // {
  //   label: 'Min Purchase Amount',
  //   name: 'minPurchaseAmount',
  //   type: 'number',
  //   col: 6,
  // },
  { label: 'Start Date', name: 'startDate', type: 'date', col: 6 },
  { label: 'End Date', name: 'endDate', type: 'date', col: 6 },
  {
    label: 'Applicable For',
    name: 'applicableFor',
    type: 'select',
    options: [
      { id: 'ALL', name: 'All Items' },
      { id: 'EXAM_PLAN', name: 'Exam Plans Only' },
      { id: 'NOTE', name: 'Notes Only' },
      { id: 'SPECIFIC', name: 'Specific Items' },
    ],
    disabled: true,
    col: 6,
  },
  { label: 'Usage Limit', name: 'usageLimit', type: 'number', col: 6 },
  { label: 'Per User Limit', name: 'perUserLimit', type: 'number', col: 12 },
  // { label: 'Is Active', name: 'status', type: 'check', col: 6 },
];

// Initial Form Values

// Coupon Component
const Coupons = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ status: '', applicableFor: '' });
  const [search, setSearch] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [stats, setStats] = useState(null);
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [editData, setEditData] = useState();

  // Date formatting utility
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Fetch coupons using DataManager
  const fetchCoupons = useCallback(
    async (params) => {
      const { pageNo, limit, query, orderBy, orderDirection } = params;
      const apiParams = {
        page: pageNo,
        limit,
        search: query || search,
        sortBy: orderBy || 'createdAt',
        sortOrder: orderDirection === 1 ? 'asc' : 'desc',
        status: filters.status,
        applicableFor: filters.applicableFor,
      };
      const response = await AxiosHelper.getData('/coupons', apiParams);
      if (response?.data) {
        return {
          data: {
            data: {
              record: response.data.data,
              current_page: apiParams.page,
              totalPages: response.data.pagination.pages,
              count: response.data.total,
              limit: apiParams.limit,
            },
          },
        };
      }
      return response;
    },
    [filters, search],
  );

  // Fetch coupon stats and usage
  const fetchStatsAndUsage = async () => {
    if (!selectedCoupon || !('_id' in selectedCoupon)) return;
    try {
      setLoading(true);

      const statsRes = await AxiosHelper.getData(
        `/coupon/${selectedCoupon._id}/stats`,
      );
      if (statsRes?.data?.status) {
        setStats(statsRes.data.data);
      } else {
        setStats({
          usageCount: 0,
          totalDiscountAmount: 0,
          totalOriginalAmount: 0,
          totalFinalAmount: 0,
          usageLimit: 0,
          usagePercentage: 0,
        });
      }

      const usageRes = await AxiosHelper.getData(
        `/coupon/${selectedCoupon._id}/usage?page=${pagination.page}&limit=${pagination.limit}`,
      );
      if (usageRes?.data?.status) {
        setUsageData(usageRes.data.data.record || []);
        setPagination({
          ...pagination,
          total: usageRes.data.data.count || 0,
          pages: usageRes.data.data.totalPages || 0,
        });
      } else {
        setUsageData([]);
        setPagination({
          ...pagination,
          total: 0,
          pages: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching coupon stats:', error);
      toast.error('Failed to fetch coupon statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showStats) {
      fetchStatsAndUsage();
    }
  }, [showStats, selectedCoupon, pagination.page, pagination.limit]);

  // Handle opening stats modal
  const handleOpenStats = (coupon) => {
    setSelectedCoupon(coupon);
    setShowStats(true);
  };

  // Handle page change for usage history
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination({ ...pagination, page: newPage });
    }
  };

  // Custom render actions for stats button
  const renderActions = (item) => (
    <div className="flex gap-2">
      <button
        onClick={() => handleOpenStats(item)}
        className="text-purple-600 hover:text-purple-900"
        title="View Stats"
      >
        <FaChartBar />
      </button>
    </div>
  );

  // Table Columns for DataManager
  const tableColumns = [
    { header: 'Code', accessor: 'code', sortable: true },
    {
      header: 'Discount',
      accessor: 'discountValue',
      sortable: true,
      render: (value, item) =>
        `${item.discountType === 'PERCENTAGE' ? `${value}%` : `₹${value}`}${
          item.discountType === 'PERCENTAGE' && item.maxDiscountAmount
            ? ` (Max: ₹${item.maxDiscountAmount})`
            : ''
        }`,
    },
    {
      header: 'Applicable For',
      accessor: 'applicableFor',
      sortable: true,
      render: (value) =>
        value === 'ALL'
          ? 'All Items'
          : value === 'EXAM_PLAN'
          ? 'Exam Plans'
          : value === 'NOTE'
          ? 'Notes'
          : 'Specific Items',
    },
    {
      header: 'Validity',
      accessor: 'startDate',
      sortable: true,
      render: (value, item) =>
        `${formatDate(item.startDate)} to ${formatDate(item.endDate)}`,
    },
    {
      header: 'Usage',
      accessor: 'usageCount',
      sortable: true,
      render: (value, item) => `${value} / ${item.usageLimit || '∞'}`,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value: any, item: any) => (
        <Status table="coupons" status={value} data_id={item._id} />
      ),
    },
  ];

  useEffect(() => {
    if (editData) {
      console.log('DATE', new Date().toISOString().split('T')[0]);
      console.log('editData?.startDate', editData?.startDate.split('T')[0]);
    }
  }, [editData]);

  const initialFormValues = {
    code: '',
    description: '',
    discountType: 'FIXED',
    discountValue: 10,
    maxDiscountAmount: 0,
    minPurchaseAmount: 0,
    startDate: editData?.startDate.split('T')[0] || '',
    endDate: editData?.endDate.split('T')[0] || '', // 30 days from now
    applicableFor: 'EXAM_PLAN',
    usageLimit: '',
    perUserLimit: 1,
    // status: true,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <DataManager
        title="Coupons Management"
        itemName="Coupon"
        endpoints={{
          // list: fetchCoupons,
          list: '/coupons',
          create: '/coupon',
          update: (id) => `/coupon/${id}`,
          delete: (id) => `/coupon/${id}`,
        }}
        validationSchema={validationSchema}
        formFields={formFields}
        tableColumns={tableColumns}
        initialFormValues={initialFormValues}
        onEditButton={(value) => setEditData(value)}
        showPagination={true}
        showAdd={true}
        showEdit={true}
        showDelete={true}
        renderActions={renderActions}
      />

      {/* Stats Modal */}
      {showStats && selectedCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <FaChartBar className="text-purple-500 mr-2" />
                  Coupon Statistics: {selectedCoupon.code}
                </h2>
                <button
                  onClick={() => setShowStats(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              {loading || !stats ? (
                <div className="flex justify-center py-8">Loading...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
                          <FaUsers className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Usage</p>
                          <p className="text-xl font-semibold">
                            {stats.usageCount} / {stats.usageLimit || '∞'}
                          </p>
                        </div>
                      </div>
                      {stats.usageLimit && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-purple-600 h-2.5 rounded-full"
                              style={{
                                width: `${Math.min(
                                  stats.usagePercentage,
                                  100,
                                )}%`,
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {stats.usagePercentage.toFixed(1)}% used
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                          <FaRupeeSign className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Total Discount
                          </p>
                          <p className="text-xl font-semibold">
                            ₹{stats.totalDiscountAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Avg. Discount: ₹
                        {stats.usageCount > 0
                          ? (
                              stats.totalDiscountAmount / stats.usageCount
                            ).toFixed(2)
                          : '0.00'}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                          <FaRupeeSign className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Sales</p>
                          <p className="text-xl font-semibold">
                            ₹{stats.totalFinalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Original Value: ₹{stats.totalOriginalAmount.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
                          <FaCalendarAlt className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Validity</p>
                          <p className="text-xl font-semibold">
                            {new Date(selectedCoupon.endDate) > new Date()
                              ? 'Active'
                              : 'Expired'}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(selectedCoupon.startDate)} to{' '}
                        {formatDate(selectedCoupon.endDate)}
                      </p>
                    </div>
                  </div>

                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    Usage History
                  </h3>
                  {loading ? (
                    <div className="flex justify-center py-4">Loading...</div>
                  ) : usageData.length === 0 ? (
                    <div className="bg-white p-6 rounded-lg shadow text-center">
                      <p className="text-gray-500">
                        No usage data available for this coupon
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Item
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Used At
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {usageData.map((usage) => (
                              <tr key={usage._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {usage.userId.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {usage.userId.email}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {usage.orderId.itemId.title ||
                                      usage.orderId.itemId.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {usage.orderId.itemType === 'EXAM_PLAN'
                                      ? 'Exam Plan'
                                      : 'Note'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {usage.orderId.orderNumber}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {usage.orderId.status}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    ₹{usage.finalAmount.toFixed(2)}
                                  </div>
                                  <div className="text-sm text-green-600">
                                    -₹{usage.discountAmount.toFixed(2)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(usage.usedAt)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {pagination.pages > 1 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                          <div className="flex-1 flex justify-between sm:hidden">
                            <button
                              onClick={() =>
                                handlePageChange(pagination.page - 1)
                              }
                              disabled={pagination.page === 1}
                              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                                pagination.page === 1
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              Previous
                            </button>
                            <button
                              onClick={() =>
                                handlePageChange(pagination.page + 1)
                              }
                              disabled={pagination.page === pagination.pages}
                              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                                pagination.page === pagination.pages
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              Next
                            </button>
                          </div>
                          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm text-gray-700">
                                Showing{' '}
                                <span className="font-medium">
                                  {(pagination.page - 1) * pagination.limit + 1}
                                </span>{' '}
                                to{' '}
                                <span className="font-medium">
                                  {Math.min(
                                    pagination.page * pagination.limit,
                                    pagination.total,
                                  )}
                                </span>{' '}
                                of{' '}
                                <span className="font-medium">
                                  {pagination.total}
                                </span>{' '}
                                results
                              </p>
                            </div>
                            <div>
                              <nav
                                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                                aria-label="Pagination"
                              >
                                <button
                                  onClick={() =>
                                    handlePageChange(pagination.page - 1)
                                  }
                                  disabled={pagination.page === 1}
                                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                                    pagination.page === 1
                                      ? 'text-gray-300 cursor-not-allowed'
                                      : 'text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  <span className="sr-only">Previous</span>
                                  <span>Prev</span>
                                </button>
                                {Array.from(
                                  { length: Math.min(5, pagination.pages) },
                                  (_, i) => {
                                    let pageNum =
                                      pagination.pages <= 5
                                        ? i + 1
                                        : pagination.page <= 3
                                        ? i + 1
                                        : pagination.page >=
                                          pagination.pages - 2
                                        ? pagination.pages - 4 + i
                                        : pagination.page - 2 + i;
                                    return (
                                      <button
                                        key={pageNum}
                                        onClick={() =>
                                          handlePageChange(pageNum)
                                        }
                                        className={`relative inline-flex items-center px-4 py-2 border ${
                                          pagination.page === pageNum
                                            ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                        } text-sm font-medium`}
                                      >
                                        {pageNum}
                                      </button>
                                    );
                                  },
                                )}
                                <button
                                  onClick={() =>
                                    handlePageChange(pagination.page + 1)
                                  }
                                  disabled={
                                    pagination.page === pagination.pages
                                  }
                                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                                    pagination.page === pagination.pages
                                      ? 'text-gray-300 cursor-not-allowed'
                                      : 'text-gray-500 hover:bg-gray-50'
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;
