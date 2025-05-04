import { useEffect, useState, useCallback } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import MyForm from '../helper/MyForm';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
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
  formFields: Array<{
    label: string;
    name: string;
    type: string;
    col?: number;
    options?: Array<{ label: string; value: any }>;
    dependsOn?: string;
    fetchOptions?: (
      parentValue: any,
    ) => Promise<Array<{ label: string; value: any }>>;
  }>;
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
  handleRowClick?:any;
  showEdit?: boolean;
  showDelete?: boolean;
  renderActions?: (item: any) => React.ReactNode;
}

const DataManager = ({
  title,
  itemName,
  endpoints,
  validationSchema,
  formFields,
  multipartFormData,
  uploadProgress,
  setModalType,
  handleRowClick,
  tableColumns,
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

  const [dependentOptions, setDependentOptions] = useState<
    Record<string, Array<{ label: string; value: any }>>
  >({});
  const [formValues, setFormValues] =
    useState<Record<string, any>>(initialFormValues);
  const [optionsCache, setOptionsCache] = useState<
    Record<string, Array<{ label: string; value: any }>>
  >({});

  // Debounced fetchData function to prevent multiple API calls
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
          setData(response.data.data.record || []);
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

  // Fetch dependent options with caching
  useEffect(() => {
    const fetchDependentOptions = async () => {
      const newOptions: Record<string, Array<{ label: string; value: any }>> = {
        ...dependentOptions,
      };
      for (const field of formFields) {
        if (field.dependsOn && field.fetchOptions) {
          const parentValue = formValues[field.dependsOn];
          if (parentValue) {
            const cacheKey = `${field.name}_${parentValue}`;
            if (optionsCache[cacheKey]) {
              newOptions[field.name] = optionsCache[cacheKey];
            } else {
              try {
                const options = await field.fetchOptions(parentValue);
                newOptions[field.name] = options;
                setOptionsCache((prev) => ({ ...prev, [cacheKey]: options }));
              } catch (err) {
                console.error(
                  `Failed to fetch options for ${field.name}:`,
                  err,
                );
                newOptions[field.name] = [];
                toast.error(`Failed to load options for ${field.label}`);
              }
            }
          } else {
            newOptions[field.name] = [];
          }
        }
      }
      setDependentOptions(newOptions);
    };

    fetchDependentOptions();
  }, [formValues, formFields, optionsCache]);

  const handleSort = (accessor: string) => {
    if (orderBy === accessor) {
      setOrderDirection((prev) => (prev === 1 ? -1 : 1));
    } else {
      setOrderBy(accessor);
      setOrderDirection(1);
    }
  };

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
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || `Failed to ${modalMode} ${itemName}`;
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!endpoints.delete) return;
    try {
      setDeleteLoading(true);
      const response = await AxiosHelper.deleteData(endpoints.delete(id));
      if (!response?.data?.status) {
        setDeleteLoading(false);
        throw new Error(
          response?.data?.message || `Failed to delete ${itemName}`,
        );
      }
      toast.success(`${itemName} deleted successfully`);
      setDeleteLoading(false);
      fetchData({
        pageNo: pagination.currentPage,
        limit: pagination.limit,
        query: searchQuery,
        orderBy,
        orderDirection,
      });
    } catch (err: any) {
      setDeleteLoading(false);
      const errorMessage =
        err.response?.data?.message || `Failed to delete ${itemName}`;
      toast.error(errorMessage);
    }
  };

  const SkeletonLoader = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 p-6"
    >
      {[...Array(pagination.limit)].map((_, i) => (
        <div
          key={i}
          className="h-16 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl animate-pulse"
        />
      ))}
    </motion.div>
  );

  const ModalContent = () => {
    const fieldsWithSubmit = [
      ...formFields,
      {
        label: modalMode === 'add' ? `Add ${itemName}` : `Update ${itemName}`,
        name: 'submit',
        type: 'submit',
      },
    ];

    const initialValues =
      modalMode === 'add'
        ? initialFormValues
        : selectedItem || initialFormValues;

        
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
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="px-6 pt-4 pb-6">
            <MyForm
              fields={fieldsWithSubmit}
              initialValues={initialValues}
              validSchema={validationSchema}
              onSubmit={handleFormSubmit}
              dependentOptions={dependentOptions}
              onValueChange={(values) => setFormValues(values)}
            />
          </div>
        </div>
      </motion.div>
    );
  };

  const renderTableActions = (item: any) => (
    <div className="flex items-center gap-4">
      {showEdit && endpoints.update && (
        <div
          className="cursor-pointer text-sky-500 hover:text-sky-700 font-medium p-2 rounded-lg"
          onClick={() => {
            setModalMode('edit');
            setSelectedItem(item);
            setShowModal(true);
          }}
        >
          Edit
        </div>
      )}
      {showDelete && endpoints.delete && (
        <button
          className="cursor-pointer text-red-500 hover:text-red-700 font-medium p-2 rounded-lg"
          onClick={() => {
            handleDelete(item?._id);
            setDeleteIndex(item._id);
          }}
          disabled={deleteLoading}
        >
          {deleteLoading && deleteIndex == item?._id ? 'Deleting..' : 'Delete'}
        </button>
      )}
      {renderActions && renderActions(item)}
    </div>
  );

  useEffect(() => {
    if (typeof setModalType === 'function') {
      setModalType(modalMode);
    }
  }, [modalMode]);

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
            <div
              onClick={() => {
                setModalMode('add');
                setSelectedItem(null);
                setShowModal(true);
              }}
              className="cursor-pointer scale-100 hover:scale-105 duration-150 bg-sky-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2"
            >
              <PlusIcon className="w-6 h-6" />
              Add {itemName}
            </div>
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
                    className="w-64 px-6 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
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
                    className="py-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
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
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {loading ? <SkeletonLoader /> : `No ${itemName} found`}
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-200 dark:bg-gray-900">
                  <tr>
                    <th className="px-8 py-6 text-nowrap text-left text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Sr No.
                    </th>
                    {tableColumns?.map((col) => {
                      return(
                      <th
                        key={col.header}
                        className={`px-8 py-6 text-nowrap text-left text-sm font-semibold text-gray-600 dark:text-gray-400 ${
                          col.sortable ? 'cursor-pointer hover:bg-gray-200' : ''
                        }`}
                        onClick={() => col.sortable && handleSort(col?.accessor)}
                      >
                        <div className="flex items-center gap-2">
                          {col.header}
                          {col.sortable && (
                            <div className="flex flex-col">
                              <ArrowUpIcon
                                className={`w-4 h-4 ${
                                  orderBy === col?.accessor &&
                                  orderDirection === 1
                                    ? 'text-sky-500'
                                    : 'text-gray-300'
                                }`}
                              />
                              <ArrowDownIcon
                                className={`w-4 h-4 ${
                                  orderBy === col?.accessor &&
                                  orderDirection === -1
                                    ? 'text-sky-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      </th>
                    )})}
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
                        <SkeletonLoader />
                      </td>
                    </tr>
                  ) : (
                    data?.map((item, index) => (
                      <tr
                        key={item._id}
                        className="hover:bg-gray-100 dark:hover:bg-gray-900"
                        onClick={() => handleRowClick && handleRowClick(item)}
                      >
                        <td className="px-8 py-6 text-gray-900 dark:text-white">
                          {index < 9 ? '0' : ''}
                          {index + 1}
                        </td>
                        {tableColumns.map((col) => (
                          <td
                            key={col.header}
                            className="px-8 py-6 text-gray-900 dark:text-white"
                          >
                            {col.render
                              ? col.render(item[col?.accessor], item)
                              : item[col?.accessor]}
                          </td>
                        ))}
                        {(showEdit || showDelete || renderActions) && (
                          <td className="px-8 py-6">
                            {renderTableActions(item)}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {showPagination && (
                <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            currentPage: prev.currentPage - 1,
                          }))
                        }
                        disabled={pagination.currentPage === 1}
                        className="px-6 py-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50"
                      >
                        Previous
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            currentPage: prev.currentPage + 1,
                          }))
                        }
                        disabled={
                          pagination.currentPage === pagination.totalPages
                        }
                        className="px-6 py-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50"
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
            style={{ zIndex: '214748364' }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
            >
            <ModalContent />
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DataManager;
