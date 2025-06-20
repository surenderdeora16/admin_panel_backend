'use client';

import type React from 'react';

import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import type * as Yup from 'yup';
import { toast } from 'react-toastify';
import MyForm from '../helper/MyForm';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import AxiosHelper from '../helper/AxiosHelper';

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

interface DataManagerProps {
  title: string;
  itemName: string;
  endpoints: {
    list: string | (() => Promise<any>);
    create?: string | ((data: any) => Promise<any>);
    update?: (id: string) => string | ((id: string, data: any) => Promise<any>);
    delete?: (id: string) => string | ((id: string) => Promise<any>);
  };
  validationSchema: Yup.ObjectSchema<any>;
  formFields?: any;
  multipartFormData?: any;
  uploadProgress?: any;
  setModalType?: any;
  tableColumns: Array<{
    header: string;
    accessor: string;
    sortable?: boolean;
    render?: (value: any, item: any) => React.ReactNode;
  }>;
  initialFormValues: Record<string, any>;
  showPagination?: boolean;
  showAdd?: boolean;
  handleRowClick?: any;
  onEditButton?: (editData: any) => void;
  showEdit?: boolean;
  showDelete?: boolean;
  renderActions?: (item: any) => React.ReactNode;
}

// Memoized Skeleton Loader
const SkeletonLoader = memo(({ count = 10 }: { count?: number }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="space-y-4 p-6"
  >
    {Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        className="h-16 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl animate-pulse"
      />
    ))}
  </motion.div>
));

// Utility function to format dates for HTML inputs
const formatDateForInput = (dateValue: any): string => {
  if (!dateValue) return '';

  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';

    // Return in YYYY-MM-DD format for HTML date inputs
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.warn('Date formatting error:', error);
    return '';
  }
};

// Utility function to format datetime for HTML inputs
const formatDateTimeForInput = (dateValue: any): string => {
  if (!dateValue) return '';

  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';

    // Return in YYYY-MM-DDTHH:mm format for HTML datetime-local inputs
    return date.toISOString().slice(0, -8);
  } catch (error) {
    console.warn('DateTime formatting error:', error);
    return '';
  }
};

// Transform API data to form-compatible format
const transformDataForForm = (
  data: any,
  formFields: any[],
  initialValues: any,
) => {
  if (!data) return initialValues;

  const transformed = { ...initialValues };

  formFields.forEach((field) => {
    const fieldName = field.name;
    const fieldType = field.type;
    const apiValue = data[fieldName];

    switch (fieldType) {
      case 'date':
        transformed[fieldName] = formatDateForInput(apiValue);
        break;

      case 'datetime-local':
        transformed[fieldName] = formatDateTimeForInput(apiValue);
        break;

      case 'select':
      case 'select2':
        if (apiValue && typeof apiValue === 'object') {
          // Handle populated references
          transformed[fieldName] = apiValue._id || apiValue.id || apiValue;
        } else {
          transformed[fieldName] = apiValue || '';
        }
        break;

      case 'select-multiple':
        if (Array.isArray(apiValue)) {
          transformed[fieldName] = apiValue.map((item) =>
            typeof item === 'object' ? item._id || item.id : item,
          );
        } else {
          transformed[fieldName] = [];
        }
        break;

      case 'check':
        // Handle boolean values
        transformed[fieldName] = Boolean(apiValue);
        break;

      case 'number':
        transformed[fieldName] = apiValue
          ? Number(apiValue)
          : field.defaultValue || 0;
        break;

      case 'file':
      case 'image-file':
      case 'multi-file':
        // Keep existing file references but don't set as form value
        if (apiValue) {
          transformed[`${fieldName}_existing`] = apiValue;
        }
        transformed[fieldName] = null; // Don't prefill file inputs
        break;

      case 'text-editer':
        transformed[fieldName] = apiValue || '';
        break;

      default:
        // Handle all other field types
        transformed[fieldName] =
          apiValue !== undefined ? apiValue : initialValues[fieldName] || '';
        break;
    }
  });

  return transformed;
};

const DataManager = ({
  title,
  itemName,
  endpoints,
  validationSchema,
  formFields = [],
  multipartFormData,
  uploadProgress,
  setModalType,
  handleRowClick,
  tableColumns,
  onEditButton,
  initialFormValues,
  showPagination = true,
  showAdd = true,
  showEdit = true,
  showDelete = false,
  renderActions,
}: DataManagerProps) => {
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [orderBy, setOrderBy] = useState<string>('');
  const [orderDirection, setOrderDirection] = useState<number>(-1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<any>(false);
  const [deleteIndex, setDeleteIndex] = useState<any>(null);

  // Memoized form values for edit mode
  const modalFormValues = useMemo(() => {
    if (modalMode === 'edit' && selectedItem) {
      return transformDataForForm(selectedItem, formFields, initialFormValues);
    }
    return initialFormValues;
  }, [modalMode, selectedItem, formFields, initialFormValues]);

  // Optimized debounced fetchData function
  const fetchData = useCallback(
    debounce(async (params: any) => {
      try {
        setLoading(true);
        setError(null);
        const paramsData = {
          pageNo: params.pageNo,
          limit: params.limit,
          query: params.query,
          ...(params.orderBy && { orderBy: params.orderBy }),
          ...(params.orderBy && { orderDirection: params.orderDirection }),
        };

        let response;
        if (typeof endpoints.list === 'function') {
          response = await endpoints.list();
        } else {
          response = await AxiosHelper.getData(endpoints.list, paramsData);
        }

        if (response?.data?.data) {
          const records = response.data.data.record || [];
          setData(records);
          setPagination({
            currentPage: response.data.data.current_page || 1,
            totalPages: response.data.data.totalPages || 1,
            totalItems: response.data.data.count || 0,
            limit: response.data.data.limit || params.limit,
          });
        } else if (response?.status === 404) {
          setData([]);
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            limit: params.limit,
          });
          setError('No records found');
        }
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || `Failed to fetch ${itemName}`;
        setError(errorMessage);
        toast.error(errorMessage);
        setData([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [endpoints.list, itemName],
  );

  // Effect for data fetching
  useEffect(() => {
    fetchData({
      pageNo: pagination.currentPage,
      limit: pagination.limit,
      query: searchQuery,
      orderBy,
      orderDirection,
    });
  }, [
    pagination.currentPage,
    pagination.limit,
    orderBy,
    orderDirection,
    searchQuery,
    fetchData,
  ]);

  // Memoized sort handler
  const handleSort = useCallback(
    (accessor: string) => {
      if (orderBy === accessor) {
        setOrderDirection((prev) => (prev === 1 ? -1 : 1));
      } else {
        setOrderBy(accessor);
        setOrderDirection(1);
      }
    },
    [orderBy],
  );

  // Optimized form submit handler
   const handleFormSubmit = async (values: any) => {
    try {
      if (modalMode === 'add' && endpoints.create) {
        let response;
        if (typeof endpoints.create === 'function') {
          response = await endpoints.create(values);
        } else {
          response = await AxiosHelper.postData(
            endpoints.create,
            values,
            multipartFormData,
          );
        }
        if (!response?.data?.status) {
          throw new Error(
            response?.data?.message || `Failed to add ${itemName}`,
          );
        }
        toast.success(`${itemName} added successfully`);
      } else if (modalMode === 'edit' && selectedItem && endpoints.update) {
        let response;
        if (typeof endpoints.update === 'function') {
          response = await AxiosHelper.putData(
            endpoints.update(selectedItem._id),
            values,
            multipartFormData,
          );
        } else {
          response = await AxiosHelper.putData(
            endpoints.update(selectedItem._id),
            values,
            multipartFormData,
          );
        }
        if (!response?.data?.status) {
          throw new Error(
            response?.data?.message || `Failed to update ${itemName}`,
          );
        }
        toast.success(`${itemName} updated successfully`);
      }
      fetchData({
        pageNo: pagination.currentPage,
        limit: pagination.limit,
        query: searchQuery,
        orderBy,
        orderDirection,
      });
      setShowModal(false);
       onEditButton?.(null); 
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || `Failed to ${modalMode} ${itemName}`;
      toast.error(errorMessage);
    }
  };


  // Optimized delete handler
  const handleDelete = useCallback(
    async (id: string) => {
      if (!endpoints.delete) return;
      try {
        setDeleteLoading(true);
        setDeleteIndex(id);
        const response = await AxiosHelper.deleteData(endpoints.delete(id));
        if (!response?.data?.status) {
          throw new Error(
            response?.data?.message || `Failed to delete ${itemName}`,
          );
        }
        toast.success(`${itemName} deleted successfully`);
        fetchData({
          pageNo: pagination.currentPage,
          limit: pagination.limit,
          query: searchQuery,
          orderBy,
          orderDirection,
        });
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || `Failed to delete ${itemName}`;
        toast.error(errorMessage);
      } finally {
        setDeleteLoading(false);
        setDeleteIndex(null);
      }
    },
    [
      endpoints.delete,
      itemName,
      fetchData,
      pagination,
      searchQuery,
      orderBy,
      orderDirection,
    ],
  );

  // Memoized Modal Content
  const ModalContent = useMemo(() => {
    const fieldsWithSubmit = [
      ...formFields,
      {
        label: modalMode === 'add' ? `Add ${itemName}` : `Update ${itemName}`,
        name: 'submit',
        type: 'submit',
      },
    ];

    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-[80%] max-h-[90vh] bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-y-auto"
      >
        <div className="w-full">
          <div className="relative px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {modalMode === 'add' ? `Add ${itemName}` : `Update ${itemName}`}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedItem(null);
                  onEditButton?.(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="px-6 pt-4 pb-6">
            <MyForm
              key={`${modalMode}-${selectedItem?._id || 'new'}`} // Force re-render with proper key
              fields={fieldsWithSubmit}
              initialValues={modalFormValues}
              validSchema={validationSchema}
              onSubmit={handleFormSubmit}
            />
          </div>
        </div>
      </motion.div>
    );
  }, [
    modalMode,
    selectedItem,
    itemName,
    formFields,
    modalFormValues,
    validationSchema,
    handleFormSubmit,
    onEditButton,
  ]);

  // Memoized table actions
  const renderTableActions = useCallback(
    (item: any) => (
      <div className="flex items-center gap-4">
        {showEdit && endpoints.update && (
          <button
            className="cursor-pointer hover:bg-transparent text-sky-500 hover:!text-sky-700 font-medium p-2 rounded-lg "
            onClick={(e) => {
              e.stopPropagation();
              setModalMode('edit');
              setSelectedItem(item);
              onEditButton?.(item);
              setShowModal(true);
            }}
          >
            Edit
          </button>
        )}
        {showDelete && endpoints.delete && (
          <button
            className="cursor-pointer hover:bg-transparent text-red-500 hover:!text-red-700 font-medium p-2 rounded-lg disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item._id);
            }}
            disabled={deleteLoading && deleteIndex === item._id}
          >
            {deleteLoading && deleteIndex === item._id
              ? 'Deleting...'
              : 'Delete'}
          </button>
        )}
        {renderActions && renderActions(item)}
      </div>
    ),
    [
      showEdit,
      showDelete,
      endpoints,
      onEditButton,
      deleteLoading,
      deleteIndex,
      renderActions,
      handleDelete,
    ],
  );

  // Set modal type effect
  useEffect(() => {
    if (typeof setModalType === 'function') {
      setModalType(modalMode);
    }
  }, [modalMode, setModalType]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-10">
      <div className="max-w-full mx-auto space-y-8">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {showAdd && endpoints.create && (
            <button
              onClick={() => {
                setModalMode('add');
                setSelectedItem(null);
                onEditButton?.(null);
                setShowModal(true);
              }}
              className="cursor-pointer scale-100 hover:scale-105 duration-150  bg-sky-600 hover:bg-sky-800 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-transform"
            >
              <PlusIcon className="w-6 h-6" />
              Add {itemName}
            </button>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                {pagination.totalItems} {itemName}
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-64 px-6 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <MagnifyingGlassIcon className="w-5 h-5 absolute right-4 top-4 text-gray-400" />
                </div>
                {showPagination && (
                  <select
                    value={pagination.limit}
                    onChange={(e) =>
                      setPagination((prev) => ({
                        ...prev,
                        limit: Number(e.target.value),
                        currentPage: 1,
                      }))
                    }
                    className="py-3 px-4 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {[10, 25, 50, 100].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt} per page
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {error ? (
            <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/20 m-4 rounded-lg">
              {error}
            </div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {loading ? (
                <SkeletonLoader count={pagination.limit} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <MagnifyingGlassIcon className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-xl font-medium text-gray-600 dark:text-gray-400">
                    No {itemName} found
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 mt-2">
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : `Start by adding your first ${itemName}`}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-200 dark:bg-gray-900">
                    <tr>
                      <th className="px-8 py-6 text-nowrap text-left text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Sr No.
                      </th>
                      {tableColumns?.map((col, index) => (
                        <th
                          key={`${col.header}-${index}`}
                          className={`px-8 py-6 text-nowrap text-left text-sm font-semibold text-gray-600 dark:text-gray-400 ${
                            col.sortable
                              ? 'cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-800 transition-colors'
                              : ''
                          }`}
                          onClick={() =>
                            col.sortable && handleSort(col.accessor)
                          }
                        >
                          <div className="flex items-center gap-2">
                            {col.header}
                            {col.sortable && (
                              <div className="flex flex-col">
                                <ArrowUpIcon
                                  className={`w-4 h-4 ${
                                    orderBy === col.accessor &&
                                    orderDirection === 1
                                      ? 'text-sky-500'
                                      : 'text-gray-300'
                                  }`}
                                />
                                <ArrowDownIcon
                                  className={`w-4 h-4 ${
                                    orderBy === col.accessor &&
                                    orderDirection === -1
                                      ? 'text-sky-500'
                                      : 'text-gray-300'
                                  }`}
                                />
                              </div>
                            )}
                          </div>
                        </th>
                      ))}
                      {(showEdit || showDelete || renderActions) && (
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {loading ? (
                      <tr>
                        <td colSpan={tableColumns.length + 2}>
                          <SkeletonLoader count={pagination.limit} />
                        </td>
                      </tr>
                    ) : (
                      data.map((item, index) => (
                        <tr
                          key={`${item._id}-${index}`}
                          className="hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                          onClick={() => handleRowClick && handleRowClick(item)}
                        >
                          <td className="px-8 py-6 text-gray-900 dark:text-white font-medium">
                            {(pagination.currentPage - 1) * pagination.limit +
                              index +
                              1}
                          </td>
                          {tableColumns.map((col, colIndex) => (
                            <td
                              key={`${col.header}-${colIndex}-${item._id}`}
                              className="px-8 py-6 text-gray-900 dark:text-white"
                            >
                              {col.render
                                ? col.render(item[col.accessor], item)
                                : item[col.accessor] || '-'}
                            </td>
                          ))}
                          {(showEdit || showDelete || renderActions) && (
                            <td
                              className="px-8 py-6"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {renderTableActions(item)}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {showPagination && pagination.totalPages > 1 && (
                <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Showing{' '}
                      {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
                      {Math.min(
                        pagination.currentPage * pagination.limit,
                        pagination.totalItems,
                      )}{' '}
                      of {pagination.totalItems} results
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            currentPage: Math.max(1, prev.currentPage - 1),
                          }))
                        }
                        disabled={pagination.currentPage === 1}
                        className="px-6 py-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        Previous
                      </motion.button>

                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: Math.min(5, pagination.totalPages) },
                          (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <button
                                key={pageNum}
                                onClick={() =>
                                  setPagination((prev) => ({
                                    ...prev,
                                    currentPage: pageNum,
                                  }))
                                }
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                  pagination.currentPage === pageNum
                                    ? 'bg-sky-500 text-white'
                                    : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          },
                        )}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            currentPage: Math.min(
                              prev.totalPages,
                              prev.currentPage + 1,
                            ),
                          }))
                        }
                        disabled={
                          pagination.currentPage === pagination.totalPages
                        }
                        className="px-6 py-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        Next
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0, transition: { duration: 0.1 } }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            style={{ zIndex: 214748364 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowModal(false);
                setSelectedItem(null);
                onEditButton?.(null);
              }
            }}
          >
            {ModalContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

SkeletonLoader.displayName = 'SkeletonLoader';
export default memo(DataManager);
