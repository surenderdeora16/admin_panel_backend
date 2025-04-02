import { useEffect, useState, useCallback } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import MyForm from '../../helper/MyForm';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/solid'; // Corrected import
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import AxiosHelper from '../../helper/AxiosHelper';

interface District {
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

const District = () => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [orderBy, setOrderBy] = useState<string>('name');
  const [orderDirection, setOrderDirection] = useState<number>(-1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedDistricts, setSelectedDistricts] = useState<District | null>(null);
  const [error, setError] = useState<string | null>(null);

  const districtSchema = Yup.object().shape({
    name: Yup.string()
      .required('Name is required')
      .min(3, 'Minimum 3 characters')
      .max(50, 'Maximum 50 characters'),
    code: Yup.string()
      .required('Code is required')
      .length(2, 'Must be exactly 2 characters')
      .matches(/^[A-Z]+$/, 'Must be uppercase letters'),
  });

  const fields = [
    { label: 'Name', name: 'name', type: 'text', col: 6 },
    { label: 'Code', name: 'code', type: 'text', col: 6 },
    {
      label: modalMode === 'add' ? 'Add District' : 'Update District',
      name: 'submit',
      type: 'submit',
    },
  ];

  const fetchDistricts = useCallback(
    debounce(async (params: any) => {
      try {
        setLoading(true);
        setError(null);
        const paramsData = {
          pageNo: params.pageNo,
          limit: params.limit,
          query: params.query,
          orderBy: params.orderBy,
          orderDirection: params.orderDirection,
        };
        const response = await AxiosHelper.getData('district-datatable', paramsData);

        if (!response?.data) throw new Error('No data received from server');

        setDistricts(response.data.data || []);
        setPagination({
          currentPage: response.data.currentPage || 1,
          totalPages: response.data.totalPages || 1,
          totalItems: response.data.totalCount || 0,
          limit: response.data.limit || 10,
        });
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || 'Failed to fetch districts';
        setError(errorMessage);
        toast.error(errorMessage);
        setDistricts([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    fetchDistricts({
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
    fetchDistricts,
  ]);

  const handleSort = (column: string) => {
    if (orderBy === column) {
      setOrderDirection((prev) => (prev === 1 ? -1 : 1));
    } else {
      setOrderBy(column);
      setOrderDirection(1);
    }
  };

  const handleFormSubmit = async (values: { name: string; code: string }) => {
    try {
      if (modalMode === 'add') {
        const response = await AxiosHelper.postData('districts', values);
        if (!response?.data?.status) {
          throw new Error(response?.data?.message || 'Failed to add district');
        }
        toast.success('District added successfully');
      } else if (modalMode === 'edit' && selectedDistricts) {
        const response = await AxiosHelper.putData(
          `districts/${selectedDistricts._id}`,
          values,
        );
        if (!response?.data?.status) {
          throw new Error(response?.data?.message || 'Failed to update district');
        }
        toast.success('District updated successfully');
      }
      fetchDistricts({
        pageNo: pagination.currentPage,
        limit: pagination.limit,
        query: searchQuery,
        orderBy,
        orderDirection,
      });
      setShowModal(false);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || `Failed to ${modalMode} district`;
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

  const ModalContent = () => {
    const initialValues =
      modalMode === 'add'
        ? { name: '', code: '' }
        : selectedDistricts
        ? { name: selectedDistricts.name || '', code: selectedDistricts.code || '' }
        : { name: '', code: '' };

    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-[97%] md:max-w-[50%] max-h-[90vh] bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-y-auto"
      >
        <div className="w-full">
          <div className="relative px-5 md:px-8 py-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-[26px] font-bold text-gray-900/85 dark:text-white">
                {modalMode === 'add' ? 'Add District' : 'Update District'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-5 md:p-8 space-y-6 overflow-hidden">
            <MyForm
              fields={fields}
              initialValues={initialValues}
              validSchema={districtSchema}
              onSubmit={handleFormSubmit}
              isReset={true}
            />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-10">
      <div className="max-w-full mx-auto space-y-8">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900/90 dark:text-white mb-2">
            Districts Management
            </h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setModalMode('add');
              setSelectedDistricts(null);
              setShowModal(true);
            }}
            className="bg-sky-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <PlusIcon className="w-6 h-6 relative right-1" />
            Add District
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl drop-shadow-2xl overflow-hidden"
        >
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-gray-200/70 dark:bg-[#212d3b]">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                {pagination.totalItems} Districts
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-64 px-6 py-3 rounded-xl bg-gray-50 placeholder:text-gray-700 text-gray-800 placeholder:dark:text-gray-400 dark:text-gray-50 dark:bg-form-input border border-gray-200 dark:border-gray-600 outline-none pr-12"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <MagnifyingGlassIcon className="w-5 h-5 absolute right-4 top-4 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="px-1.5 rounded-xl bg-white dark:bg-form-input border border-stroke dark:border-strokedark">
                  <select
                    value={pagination.limit}
                    onChange={(e) =>
                      setPagination((prev) => ({
                        ...prev,
                        limit: Number(e.target.value),
                        currentPage: 1,
                      }))
                    }
                    className="py-3 rounded-xl bg-white dark:bg-form-input outline-none"
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
          </div>

          {error ? (
            <div className="p-8 text-center text-red-500 dark:text-red-400 text-lg">
              ⚠️ {error}
            </div>
          ) : loading ? (
            <SkeletonLoader />
          ) : districts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-lg">
              No districts found.
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-200/70 dark:bg-gray-900">
                  <tr>
                    {['Name', 'Code', 'Actions'].map((header, idx) => (
                      <th
                        key={header}
                        className={`px-8 py-6 text-left text-sm font-semibold dark:bg-[#24303f] text-gray-600 dark:text-gray-400 ${
                          idx < 2
                            ? 'cursor-pointer hover:bg-gray-200/35 dark:hover:bg-[#24303ff4]'
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
                                    ? 'text-sky-500'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                              <ArrowDownIcon
                                className={`w-4 h-4 ${
                                  orderBy === header.toLowerCase() &&
                                  orderDirection === -1
                                    ? 'text-sky-500'
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
                  {districts.map((district) => (
                    <tr
                      key={district._id}
                      className="hover:bg-gray-100/50 dark:hover:bg-gray-900/10 transition-colors"
                    >
                      <td className="px-8 py-6 font-medium text-gray-900 dark:text-white">
                        {district.name}
                      </td>
                      <td className="px-8 py-6">
                        <span className="inline-flex items-center px-4 py-2 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-200 text-sm font-medium">
                          {district.code}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setModalMode('edit');
                              setSelectedDistricts(district);
                              setShowModal(true);
                            }}
                            className="text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 p-2 rounded-lg transition-colors"
                          >
                            Edit
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

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

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: '214748364' }}
            className=" fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <ModalContent />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default District;
