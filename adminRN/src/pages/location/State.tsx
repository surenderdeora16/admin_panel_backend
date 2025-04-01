import { useEffect, useState, useCallback } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  PencilIcon,
  EyeIcon,
  XMarkIcon,
  SwatchIcon,
  GlobeAmericasIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import AxiosHelper from '../../helper/AxiosHelper';

interface State {
  _id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

const StateDashboard = () => {
  const [states, setStates] = useState<State[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [orderBy, setOrderBy] = useState('name');
  const [orderDirection, setOrderDirection] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validation Schema
  const stateSchema = Yup.object().shape({
    name: Yup.string()
      .required('Name is required')
      .min(3, 'Minimum 3 characters')
      .max(50, 'Maximum 50 characters'),
    code: Yup.string()
      .required('Code is required')
      .length(2, 'Must be exactly 2 characters')
      .matches(/^[A-Z]+$/, 'Must be uppercase letters'),
  });

  const fetchStates = useCallback(
    debounce(async (params: any) => {
      try {
        setLoading(true);
        setError(null);
        const response = await AxiosHelper.getData('states-datatable', params);

        setStates(response.data.data);
        setPagination({
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
          totalItems: response.data.totalCount,
          limit: response.data.limit,
        });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load states');
        toast.error('Failed to load states');
      } finally {
        setLoading(false);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    fetchStates({
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
  ]);

  const handleSort = (column: string) => {
    if (orderBy === column) {
      setOrderDirection((prev) => (prev === 1 ? -1 : 1));
    } else {
      setOrderBy(column);
      setOrderDirection(1);
    }
  };

  const formik = useFormik({
    initialValues: { name: '', code: '' },
    validationSchema: stateSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        if (modalMode === 'add') {
          await AxiosHelper.postData('states', values);
          toast.success('State added successfully');
        } else {
          await AxiosHelper.putData(`states/${selectedState?._id}`, values);
          toast.success('State updated successfully');
        }
        fetchStates({});
        setShowModal(false);
        resetForm();
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || `Failed to ${modalMode} state`,
        );
      }
    },
  });

  // Reset form jab modal "add" mode mein khulta hai
  useEffect(() => {
    if (showModal && modalMode === 'add') {
      formik.resetForm();
    }
  }, [showModal, modalMode]);

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
        >
          <div className="h-full flex items-center px-6">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-48"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
            </div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
          </div>
        </div>
      ))}
    </motion.div>
  );

  const ModalContent = () => (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <div className="p-8 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {modalMode === 'add' ? 'Add State' : 'Update State'}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={formik.handleSubmit} className="p-8 space-y-6">
          <div className="relative">
            <input
              name="name"
              className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-0 peer"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.name}
            />
            <label className="absolute left-6 top-4 px-2 text-gray-400 dark:text-gray-500 peer-focus:-translate-y-7 peer-focus:text-blue-500 peer-focus:text-sm transition-all pointer-events-none">
              {formik.values.name ? '' : 'State Name'}
            </label>
            <div className="min-h-6 mt-2">
              {formik.touched.name && formik.errors.name && (
                <p className="text-sm text-red-500 flex items-center gap-2">
                  <SwatchIcon className="w-4 h-4" />
                  {formik.errors.name}
                </p>
              )}
            </div>
          </div>

          <div className="relative">
            <input
              name="code"
              className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-0 peer uppercase"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.code}
              maxLength={2}
            />
            <label className="absolute left-6 top-4 px-2 text-gray-400 dark:text-gray-500 peer-focus:-translate-y-7 peer-focus:text-blue-500 peer-focus:text-sm transition-all pointer-events-none">
              {formik.values.code ? '' : 'Code'}
            </label>
            <div className="min-h-6 mt-2">
              {formik.touched.code && formik.errors.code && (
                <p className="text-sm text-red-500 flex items-center gap-2">
                  <GlobeAmericasIcon className="w-4 h-4" />
                  {formik.errors.code}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setShowModal(false)}
              className="px-8 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow"
            >
              {modalMode === 'add'
                ? 'Add State'
                : 'Update State'}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-10">
      <div className="max-w-full mx-auto space-y-8">
        {/* Header Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              States
            </h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setModalMode('add');
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <PlusIcon className="w-6 h-6" />
            Add State
          </motion.button>
        </motion.div>

        {/* Data Grid Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl  drop-shadow-2xl overflow-hidden"
        >
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-[#192231]">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                {pagination?.totalItems} States
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-64 px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 pr-12"
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <MagnifyingGlassIcon className="w-5 h-5 absolute right-4 top-3 text-gray-400 dark:text-gray-500" />
                </div>
                <select
                  value={pagination.limit}
                  onChange={(e) =>
                    setPagination((prev) => ({
                      ...prev,
                      limit: Number(e.target.value),
                    }))
                  }
                  className="px-4 py-3 rounded-xl bg-whiter dark:bg-form-input border border-stroke dark:border-strokedark"
                >
                  {[10, 25, 50, 100].map((opt) => (
                    <option key={opt} value={opt} className="dark:bg-boxdark">
                      {opt} per page
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error ? (
            <div className="p-8 text-center text-red-500 dark:text-red-400 text-lg">
              ⚠️ {error}
            </div>
          ) : loading ? (
            <SkeletonLoader />
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-900">
                  <tr>
                    {['Name', 'Code', 'Actions'].map((header, idx) => (
                      <th
                        key={header}
                        className={`px-8 py-6 text-left text-sm font-semibold dark:bg-[#192231] text-gray-600 dark:text-gray-400 ${
                          idx < 2
                            ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800'
                            : ''
                        }`}
                        onClick={() =>
                          idx < 2 && handleSort(header.toLowerCase())
                        }
                      >
                        <div className="flex items-center gap-2">
                          {header}
                          {idx < 2 && (
                            <div className="flex flex-col">
                              <ArrowUpIcon
                                className={`w-4 h-4 mb-[-2px] ${
                                  orderBy === header.toLowerCase() &&
                                  orderDirection === 1
                                    ? 'text-blue-500'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                              <ArrowDownIcon
                                className={`w-4 h-4 ${
                                  orderBy === header.toLowerCase() &&
                                  orderDirection === -1
                                    ? 'text-blue-500'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {states?.map((state) => (
                    <tr
                      key={state._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                    >
                      <td className="px-8 py-6 font-medium text-gray-900 dark:text-white">
                        {state.name}
                      </td>
                      <td className="px-8 py-6">
                        <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm font-medium">
                          {state.code}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setModalMode('edit');
                              setSelectedState(state);
                              formik.setValues({
                                name: state.name,
                                code: state.code,
                              });
                              setShowModal(true);
                            }}
                            className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            <PencilIcon className="w-6 h-6" />
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
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
                      className="px-6 py-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                      className="px-6 py-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Next
                    </motion.button>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Universal Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <ModalContent />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StateDashboard;