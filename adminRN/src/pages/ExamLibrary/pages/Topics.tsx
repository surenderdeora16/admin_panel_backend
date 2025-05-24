'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Formik, Form as FormikForm, Field, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import Select from 'react-select';
import JoditEditor from 'jodit-react';
import { debounce } from 'lodash';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/solid';
import Status from '../../../helper/Status';
import AxiosHelper from '../../../helper/AxiosHelper';

// Interfaces
interface Option {
  id: string | boolean;
  name: string;
}

interface Topic {
  _id: string;
  name: string;
  description: string;
  subjectId: { _id: string; name: string } | string;
  chapterId: { _id: string; name: string } | string;
  sequence: number;
  status: boolean;
  questionCount: number;
}

interface FormField {
  name: keyof TopicFormValues | 'submit';
  label: string;
  type?: 'text' | 'number' | 'select2' | 'text-editer' | 'submit';
  options?: Option[];
  dependsOn?: keyof TopicFormValues;
  required?: boolean;
  col?: number;
  disabled?: boolean;
}

interface TopicFormValues {
  name: string;
  description: string;
  subjectId: string;
  chapterId: string;
  sequence: number;
  status: boolean;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

// Constants
const STATUS: Option[] = [
  { id: true, name: 'Active' },
  { id: false, name: 'Inactive' },
];

// Validation Schema
const TopicSchema = Yup.object().shape({
  name: Yup.string()
    .required('Topic name is required')
    .min(2, 'Topic name must be at least 2 characters')
    .max(100, 'Topic name cannot exceed 100 characters'),
  description: Yup.string().max(500, 'Description cannot exceed 500 characters'),
  subjectId: Yup.string().required('Subject is required'),
  chapterId: Yup.string().required('Chapter is required'),
  sequence: Yup.number()
    .min(0, 'Sequence must be a non-negative integer')
    .integer('Sequence must be an integer'),
  status: Yup.boolean(),
});

// Error Boundary
const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const errorHandler = (error: any) => {
      console.error('ErrorBoundary caught:', error);
      setHasError(true);
      toast.error('An unexpected error occurred. Please try again or contact support.');
    };
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-lg">
        An unexpected error occurred. Please refresh the page or contact support.
      </div>
    );
  }
  return <>{children}</>;
};

// Skeleton Loader
const SkeletonLoader = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 p-4 sm:p-6">
    {[...Array(10)].map((_, i) => (
      <div
        key={i}
        className="h-12 sm:h-16 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl animate-pulse"
      />
    ))}
  </motion.div>
);

// Main Topics Component
const Topics: React.FC = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
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
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedItem, setSelectedItem] = useState<Topic | null>(null);
  const [dependentOptions, setDependentOptions] = useState<Record<string, Option[]>>({
    subjectId: [],
    chapterId: [],
  });
  const [dependentLoading, setDependentLoading] = useState<Record<string, boolean>>({
    subjectId: false,
    chapterId: false,
  });
  const [dependentErrors, setDependentErrors] = useState<Record<string, string | null>>({
    subjectId: null,
    chapterId: null,
  });
  const optionCacheRef = useRef<Map<string, Option[]>>(new Map());
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deletedTopic, setDeletedTopic] = useState<{ topic: Topic; timeoutId: NodeJS.Timeout } | null>(null);
  const prevSubjectIdRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);

  // Fetch Subjects (Debounced)
  const fetchSubjects = useCallback(
    debounce(async () => {
      const cacheKey = 'subjectId';
      if (optionCacheRef.current.has(cacheKey)) {
        setDependentOptions((prev) => ({ ...prev, subjectId: optionCacheRef.current.get(cacheKey)! }));
        return;
      }

      try {
        setDependentLoading((prev) => ({ ...prev, subjectId: true }));
        setDependentErrors((prev) => ({ ...prev, subjectId: null }));
        const response = await AxiosHelper.getData('/subjects');
        if (!response?.data?.data?.record) {
          throw new Error('No subjects found');
        }
        const options: Option[] = response.data.data.record.map((subject: any) => ({
          id: subject._id,
          name: subject.name,
        }));
        optionCacheRef.current.set(cacheKey, options);
        setDependentOptions((prev) => ({ ...prev, subjectId: options }));
      } catch (error: any) {
        const status = error.response?.status;
        const message = error.response?.data?.message || 'Failed to load subjects';
        const errorMessage = status ? `${message} (Status: ${status})` : message;
        setDependentErrors((prev) => ({ ...prev, subjectId: `${errorMessage}. Retry?` }));
        toast.error(errorMessage);
        if (import.meta.env.VITE_LOG_ERRORS_IN_CONSOLE === 'true') {
          console.error('fetchSubjects error:', error);
        }
      } finally {
        setDependentLoading((prev) => ({ ...prev, subjectId: false }));
      }
    }, 300),
    [],
  );

  // Fetch Chapters
  const fetchChapters = useCallback(
    async (subjectId: string, callback: (options: Option[]) => void, retryCount = 0) => {
      if (!subjectId) {
        callback([]);
        return;
      }

      const cacheKey = `chapterId:${subjectId}`;
      if (optionCacheRef.current.has(cacheKey)) {
        callback(optionCacheRef.current.get(cacheKey)!);
        return;
      }

      try {
        setDependentLoading((prev) => ({ ...prev, chapterId: true }));
        setDependentErrors((prev) => ({ ...prev, chapterId: null }));
        const response = await AxiosHelper.getData(`/chapters/subject/${subjectId}`);
        if (!response?.data?.data) {
          throw new Error('No chapters found');
        }
        const options: Option[] = response.data.data.map((chapter: any) => ({
          id: chapter._id,
          name: chapter.name,
        }));
        optionCacheRef.current.set(cacheKey, options);
        callback(options);
      } catch (error: any) {
        if (retryCount < 2) {
          setTimeout(() => {
            fetchChapters(subjectId, callback, retryCount + 1);
          }, 1000 * (2 ** retryCount));
        } else {
          const status = error.response?.status;
          const message = error.response?.data?.message || 'Failed to load chapters';
          const errorMessage = status ? `${message} (Status: ${status})` : message;
          setDependentErrors((prev) => ({ ...prev, chapterId: `${errorMessage}. Retry?` }));
          toast.error(errorMessage);
          callback([]);
          if (import.meta.env.VITE_LOG_ERRORS_IN_CONSOLE === 'true') {
            console.error('fetchChapters error:', error);
          }
        }
      } finally {
        setDependentLoading((prev) => ({ ...prev, chapterId: false }));
      }
    },
    [],
  );

  // Debounced Fetch Chapters
  const debouncedFetchChapters = useMemo(
    () => debounce(fetchChapters, 300, { leading: false, trailing: true }),
    [fetchChapters],
  );

  // Fetch Topics
  const fetchTopics = useCallback(
    debounce(
      async (params: {
        pageNo: number;
        limit: number;
        query: string;
        orderBy: string;
        orderDirection: number;
      }) => {
        try {
          setLoading(true);
          setError(null);
          const response = await AxiosHelper.getData('/topics', {
            pageNo: params.pageNo,
            limit: params.limit,
            query: params.query,
            ...(params.orderBy && { orderBy: params.orderBy }),
            ...(params.orderBy && { orderDirection: params.orderDirection }),
          });
          if (response?.data?.data) {
            setTopics(response.data.data.record || []);
            setPagination({
              currentPage: response.data.data.current_page || 1,
              totalPages: response.data.data.totalPages || 1,
              totalItems: response.data.data.count || 0,
              limit: response.data.data.limit || params.limit,
            });
          } else {
            setTopics([]);
            setPagination({
              currentPage: 1,
              totalPages: 1,
              totalItems: 0,
              limit: params.limit,
            });
            setError('No topics found');
            toast.warn('No topics found for the given search criteria.');
          }
        } catch (error: any) {
          const status = error.response?.status;
          const message = error.response?.data?.message || 'Failed to fetch topics';
          const errorMessage = status ? `${message} (Status: ${status})` : message;
          setError(errorMessage);
          setTopics([]);
          toast.error(errorMessage);
          if (import.meta.env.VITE_LOG_ERRORS_IN_CONSOLE === 'true') {
            console.error('fetchTopics error:', error);
          }
        } finally {
          setLoading(false);
        }
      },
      300,
    ),
    [],
  );

  // Retry Failed Fetch
  const retryFetch = useCallback(
    (fieldName: string, parentValue: string) => {
      if (fieldName === 'subjectId') {
        fetchSubjects();
      } else if (fieldName === 'chapterId') {
        debouncedFetchChapters(parentValue, (options) => {
          setDependentOptions((prev) => ({ ...prev, chapterId: options }));
        });
      }
    },
    [fetchSubjects, debouncedFetchChapters],
  );

  // Handle Sort
  const handleSort = useCallback((accessor: string) => {
    if (orderBy === accessor) {
      setOrderDirection((prev) => (prev === 1 ? -1 : 1));
    } else {
      setOrderBy(accessor);
      setOrderDirection(1);
    }
  }, [orderBy]);

  // Handle Form Submit
  const handleSubmit = useCallback(
    async (values: TopicFormValues, { resetForm, setSubmitting }: FormikHelpers<TopicFormValues>) => {
      try {
        setSubmitting(true);
        if (modalMode === 'add') {
          const response = await AxiosHelper.postData('/topics', values);
          if (!response?.data?.status) {
            throw new Error(response?.data?.message || 'Failed to add topic');
          }
          toast.success('Topic added successfully!');
        } else if (selectedItem) {
          const response = await AxiosHelper.putData(`/topics/${selectedItem._id}`, values);
          if (!response?.data?.status) {
            throw new Error(response?.data?.message || 'Failed to update topic');
          }
          toast.success('Topic updated successfully!');
        }
        fetchTopics({
          pageNo: pagination.currentPage,
          limit: pagination.limit,
          query: searchQuery,
          orderBy,
          orderDirection,
        });
        setShowModal(false);
        setSelectedItem(null);
        resetForm();
        setDependentOptions((prev) => ({ ...prev, chapterId: [] }));
      } catch (error: any) {
        const status = error.response?.status;
        const message = error.response?.data?.message || `Failed to ${modalMode} topic`;
        const errorMessage = status ? `${message} (Status: ${status})` : message;
        toast.error(errorMessage);
        if (import.meta.env.VITE_LOG_ERRORS_IN_CONSOLE === 'true') {
          console.error('handleSubmit error:', error);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [modalMode, selectedItem, fetchTopics, pagination, searchQuery, orderBy, orderDirection],
  );

  // Handle Delete
  const handleDelete = useCallback(
    async (topic: Topic) => {
      if (deletedTopic) {
        clearTimeout(deletedTopic.timeoutId);
        setDeletedTopic(null);
      }

      try {
        setDeleteLoading(topic._id);
        const timeoutId = setTimeout(async () => {
          const response = await AxiosHelper.deleteData(`/topics/${topic._id}`);
          if (!response?.data?.status) {
            throw new Error(response?.data?.message || 'Failed to delete topic');
          }
          setDeletedTopic(null);
          toast.success('Topic deleted permanently!');
        }, 5000);

        setDeletedTopic({ topic, timeoutId });
        setTopics((prev) => prev.filter((t) => t._id !== topic._id));
        toast.info(
          <div className="flex items-center gap-4">
            <span>Topic "{topic.name}" deleted</span>
            <button
              onClick={() => {
                clearTimeout(timeoutId);
                setTopics((prev) => [...prev, topic].sort((a, b) => a.name.localeCompare(b.name)));
                setDeletedTopic(null);
                toast.dismiss();
                toast.success('Topic restored successfully!');
              }}
              className="bg-sky-600 px-3 py-1 rounded-md hover:bg-sky-700 text-white"
            >
              Undo
            </button>
          </div>,
          { autoClose: 5000 },
        );
      } catch (error: any) {
        setTopics((prev) => [...prev, topic].sort((a, b) => a.name.localeCompare(b.name)));
        setDeletedTopic(null);
        const status = error.response?.status;
        const message = error.response?.data?.message || 'Failed to delete topic';
        const errorMessage = status ? `${message} (Status: ${status})` : message;
        toast.error(errorMessage);
        if (import.meta.env.VITE_LOG_ERRORS_IN_CONSOLE === 'true') {
          console.error('handleDelete error:', error);
        }
      } finally {
        setDeleteLoading(null);
      }
    },
    [deletedTopic],
  );

  // Handle Edit
  const handleEdit = useCallback((item: Topic) => {
    setModalMode('edit');
    setSelectedItem(item);
    setShowModal(true);
  }, []);

  // Handle Add
  const handleAdd = useCallback(() => {
    setModalMode('add');
    setSelectedItem(null);
    setShowModal(true);
  }, []);

  // Form Fields
  const formFields: FormField[] = useMemo(() => {
    const fields: FormField[] = [
      {
        name: 'name',
        label: 'Topic Name',
        type: 'text',
        required: true,
        col: 12,
      },
      // {
      //   name: 'description',
      //   label: 'Description',
      //   type: 'text-editer',
      //   col: 12,
      // },
      {
        name: 'subjectId',
        label: 'Subject',
        type: 'select2',
        options: dependentOptions.subjectId.length
          ? [{ id: '', name: 'Select Subject' }, ...dependentOptions.subjectId]
          : [{ id: '', name: dependentLoading.subjectId ? 'Loading subjects...' : 'Select Subject' }],
        disabled: dependentLoading.subjectId || !!dependentErrors.subjectId,
        required: true,
        col: 6,
      },
      {
        name: 'chapterId',
        label: 'Chapter',
        type: 'select2',
        dependsOn: 'subjectId',
        options: dependentOptions.chapterId.length
          ? [{ id: '', name: 'Select Chapter' }, ...dependentOptions.chapterId]
          : [{ id: '', name: dependentLoading.chapterId ? 'Loading chapters...' : 'Select Subject first' }],
        disabled: dependentLoading.chapterId || !!dependentErrors.chapterId || !dependentOptions.subjectId.length,
        required: true,
        col: 6,
      },
      // {
      //   name: 'sequence',
      //   label: 'Sequence',
      //   type: 'number',
      //   col: 6,
      // },
      {
        name: 'status',
        label: 'Status',
        type: 'select2',
        options: STATUS,
        col: 6,
      },
      {
        name: 'submit',
        label: modalMode === 'add' ? 'Add Topic' : 'Update Topic',
        type: 'submit',
        col: 12,
      },
    ];
    return fields;
  }, [dependentOptions, dependentLoading, dependentErrors, modalMode]);

  // Initial Form Values
  const initialValues: TopicFormValues = useMemo(
    () =>
      selectedItem
        ? {
            name: selectedItem.name || '',
            description: selectedItem.description || '',
            subjectId: typeof selectedItem?.subjectId === 'string' ? selectedItem?.subjectId : selectedItem?.subjectId?._id || '',
            chapterId: typeof selectedItem?.chapterId === 'string' ? selectedItem?.chapterId : selectedItem?.chapterId._id || '',
            sequence: selectedItem.sequence || 0,
            status: selectedItem.status ?? true,
          }
        : {
            name: '',
            description: '',
            subjectId: '',
            chapterId: '',
            sequence: 0,
            status: true,
          },
    [selectedItem],
  );

  // Table Columns
  const tableColumns = useMemo(
    () => [
      {
        header: 'Subject',
        accessor: 'subjectId' as keyof Topic,
        render: (value: any) => (value?.name || '-'),
      },
      {
        header: 'Chapter',
        accessor: 'chapterId' as keyof Topic,
        render: (value: any) => (value?.name || '-'),
      },
      { header: 'Topic', accessor: 'name' as keyof Topic, sortable: true },
      { header: 'Questions', accessor: 'questionCount' as keyof Topic, sortable: true },
      // { header: 'Sequence', accessor: 'sequence' as keyof Topic, sortable: true },
      {
        header: 'Status',
        accessor: 'status' as keyof Topic,
        sortable: true,
        render: (value: boolean, item: Topic) => (
          <Status table="topics" status={value} data_id={item._id} />
        ),
      },
    ],
    [],
  );

  // Fetch Initial Data
  useEffect(() => {
    fetchSubjects();
    fetchTopics({
      pageNo: pagination.currentPage,
      limit: pagination.limit,
      query: searchQuery,
      orderBy,
      orderDirection,
    });

    return () => {
      fetchSubjects.cancel();
      debouncedFetchChapters.cancel();
      fetchTopics.cancel();
    };
  }, [fetchSubjects, fetchTopics, pagination.currentPage, pagination.limit, searchQuery, orderBy, orderDirection]);

  // Handle Dependent Field Updates
  const handleDependentUpdate = useCallback(
    (subjectId: string, setFieldValue?: (field: string, value: any) => void) => {
      if (!subjectId || subjectId === prevSubjectIdRef.current || isProcessingRef.current) {
        if (!subjectId) {
          setDependentOptions((prev) => ({ ...prev, chapterId: [] }));
          if (setFieldValue) {
            setFieldValue('chapterId', '');
          }
          isProcessingRef.current = false;
        }
        return;
      }

      prevSubjectIdRef.current = subjectId;
      isProcessingRef.current = true;

      setDependentOptions((prev) => ({ ...prev, chapterId: [] }));
      if (setFieldValue) {
        setFieldValue('chapterId', '');
      }

      debouncedFetchChapters(subjectId, (options) => {
        setDependentOptions((prev) => ({ ...prev, chapterId: options }));
        isProcessingRef.current = false;
      });
    },
    [debouncedFetchChapters],
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
        <div className="max-w-full mx-auto space-y-6">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Topics Management</h1>
            <div
              onClick={handleAdd}
              className="cursor-pointer scale-100 hover:scale-105 duration-150 bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base"
            >
              <PlusIcon className="w-5 h-5" />
              Add Topic
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-b border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-gray-900">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300">
                  {pagination.totalItems} Topic{pagination.totalItems !== 1 ? 's' : ''}
                </h3>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search"
                      className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm sm:text-base"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                  <select
                    value={pagination.limit}
                    onChange={(e) =>
                      setPagination((prev) => ({
                        ...prev,
                        limit: Number(e.target.value),
                        currentPage: 1,
                      }))
                    }
                    className="py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm sm:text-base w-full sm:w-auto"
                  >
                    {[10, 25, 50, 100].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt} per page
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {error ? (
              <div className="p-4 sm:p-6 text-center text-red-500 text-sm sm:text-base">{error}</div>
            ) : topics.length === 0 ? (
              <div className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base">
                {loading ? <SkeletonLoader /> : 'No topics found'}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-gray-200 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Sr No.
                        </th>
                        {tableColumns.map((col) => (
                          <th
                            key={col.header}
                            className={`px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 ${
                              col.sortable ? 'cursor-pointer hover:bg-gray-200' : ''
                            }`}
                            onClick={() => col.sortable && handleSort(col.accessor)}
                          >
                            <div className="flex items-center gap-2">
                              {col.header}
                              {col.sortable && (
                                <div className="flex flex-col">
                                  <ArrowUpIcon
                                    className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                      orderBy === col.accessor && orderDirection === 1 ? 'text-sky-500' : 'text-gray-300'
                                    }`}
                                  />
                                  <ArrowDownIcon
                                    className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                      orderBy === col.accessor && orderDirection === -1 ? 'text-sky-500' : 'text-gray-300'
                                    }`}
                                  />
                                </div>
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Actions
                        </th>
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
                        topics.map((item, index) => (
                          <tr key={item._id} className="hover:bg-gray-100 dark:hover:bg-gray-900">
                            <td className="px-4 sm:px-6 py-4 text-gray-900 dark:text-white text-xs sm:text-sm">
                              {index < 9 ? '0' : ''}{index + 1}
                            </td>
                            {tableColumns.map((col) => (
                              <td
                                key={col.header}
                                className="px-4 sm:px-6 py-4 text-gray-900 dark:text-white text-xs sm:text-sm"
                              >
                                {col.render ? col.render(item[col.accessor], item) : item[col.accessor]}
                              </td>
                            ))}
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                                <div
                                  className="cursor-pointer text-sky-500 hover:text-sky-700 font-medium p-2 rounded-lg text-xs sm:text-sm"
                                  onClick={() => handleEdit(item)}
                                >
                                  Edit
                                </div>
                                {/* {item.questionCount === 0 && (
                                  <button
                                    className="cursor-pointer text-red-500 hover:text-red-700 font-medium p-2 rounded-lg text-xs sm:text-sm"
                                    onClick={() => handleDelete(item)}
                                    disabled={deleteLoading === item._id}
                                  >
                                    {deleteLoading === item._id ? 'Deleting...' : 'Delete'}
                                  </button>
                                )} */}
                                <button
                                  onClick={() => {
                                    const subjectId =
                                      typeof item.subjectId === 'string' ? item.subjectId : item.subjectId._id;
                                    const chapterId =
                                      typeof item.chapterId === 'string' ? item.chapterId : item.chapterId._id;
                                    if (!subjectId || !chapterId) {
                                      toast.error('Invalid subject or chapter ID');
                                      return;
                                    }
                                    navigate(
                                      `/exam-library/topics/manage-questions/${subjectId}/${chapterId}/${item._id}`,
                                    );
                                  }}
                                  className="cursor-pointer bg-purple-600 text-white px-2 sm:px-3 py-1 rounded-lg hover:bg-purple-700 text-xs sm:text-sm"
                                >
                                  Manage Questions
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs sm:text-sm text-gray-500">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))
                        }
                        disabled={pagination.currentPage === 1}
                        className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 text-xs sm:text-sm"
                      >
                        Previous
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))
                        }
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 text-xs sm:text-sm"
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
              initial={{ opacity: 0, transition: { duration: 0.1 } }}
              animate={{ opacity: 1, transition: { duration: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              style={{ zIndex: 214748364 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-7xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                <div className="relative px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {modalMode === 'add' ? 'Add Topic' : 'Update Topic'}
                    </h2>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setSelectedItem(null);
                        setDependentOptions((prev) => ({ ...prev, chapterId: [] }));
                        prevSubjectIdRef.current = null;
                        isProcessingRef.current = false;
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100"
                    >
                      <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                </div>
                <div className="px-4 sm:px-6 py-4 sm:pb-6">
                  <Formik
                    initialValues={initialValues}
                    enableReinitialize
                    validationSchema={TopicSchema}
                    onSubmit={handleSubmit}
                  >
                    {({ values, errors, touched, isSubmitting, setFieldValue, resetForm }) => (
                      <FormikForm autoComplete="off" className="space-y-4">
                        {/* Reset chapterId on subjectId change */}
                        <Effect
                          subjectId={values.subjectId}
                          handleDependentUpdate={(subjectId) => handleDependentUpdate(subjectId, setFieldValue)}
                          isSubmitting={isSubmitting}
                          modalMode={modalMode}
                          selectedItem={selectedItem}
                        />
                        <div className="grid grid-cols-12 gap-x-4 gap-y-4">
                          {formFields.map((field) => {
                            const fieldError =
                              errors[field.name as keyof TopicFormValues] &&
                              touched[field.name as keyof TopicFormValues];

                            return (
                              <div
                                key={field.name}
                                className={`col-span-12 ${field.col ? `sm:col-span-${field.col}` : ''}`}
                              >
                                {field.type !== 'submit' && (
                                  <label
                                    htmlFor={field.name}
                                    className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-300 mb-1"
                                  >
                                    {field.label}
                                    {field.required && <span className="ml-1 text-rose-500">*</span>}
                                  </label>
                                )}

                                {field.dependsOn && dependentLoading[field.name] && (
                                  <div className="absolute right-2 top-8 sm:top-9 text-slate-500">
                                    <svg
                                      className="animate-spin h-4 w-4 sm:h-5 sm:w-5"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      aria-label="Loading"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      />
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      />
                                    </svg>
                                  </div>
                                )}

                                {field.dependsOn && dependentErrors[field.name] && (
                                  <div className="mt-1 text-xs sm:text-sm text-rose-600 flex items-center gap-1.5">
                                    <svg
                                      className="w-3 h-3 sm:w-4 sm:h-4"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                      aria-hidden="true"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    {dependentErrors[field.name]}
                                    <button
                                      type="button"
                                      className="ml-2 text-sky-600 hover:underline text-xs sm:text-sm"
                                      onClick={() => retryFetch(field.name, values[field.dependsOn!])}
                                      aria-label={`Retry loading ${field.label}`}
                                    >
                                      Retry
                                    </button>
                                  </div>
                                )}

                                {(() => {
                                  switch (field.type) {
                                    case 'text':
                                    case 'number':
                                      return (
                                        <Field
                                          id={field.name}
                                          name={field.name}
                                          type={field.type}
                                          className={`appearance-none block w-full px-3 sm:px-4 py-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white border ${
                                            fieldError
                                              ? 'border-rose-500 ring-1 ring-rose-500'
                                              : 'border-slate-300 hover:border-slate-400'
                                          } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm sm:text-base disabled:bg-slate-100 disabled:cursor-not-allowed`}
                                          placeholder={field.label}
                                          aria-required={field.required}
                                          disabled={isSubmitting}
                                        />
                                      );

                                    case 'select2':
                                      return (
                                        <Field
                                          id={field.name}
                                          name={field.name}
                                          options={field.options}
                                          component={Select2}
                                          error={fieldError}
                                          label={field.label}
                                          disabled={isSubmitting || field.disabled}
                                          aria-required={field.required}
                                        />
                                      );

                                    // case 'text-editer':
                                    //   return (
                                    //     <Field
                                    //       id={field.name}
                                    //       name={field.name}
                                    //       component={TextEditer}
                                    //       error={fieldError}
                                    //       placeholder={field.label}
                                    //       disabled={isSubmitting}
                                    //       aria-required={field.required}
                                    //     />
                                    //   );

                                    case 'submit':
                                      return (
                                        <div className="flex justify-end space-x-3">
                                          <button
                                            type="button"
                                            className="px-3 sm:px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-200 disabled:cursor-not-allowed text-sm sm:text-base"
                                            onClick={() => {
                                              setShowModal(false);
                                              setSelectedItem(null);
                                              resetForm();
                                              setDependentOptions((prev) => ({ ...prev, chapterId: [] }));
                                              prevSubjectIdRef.current = null;
                                              isProcessingRef.current = false;
                                            }}
                                            disabled={isSubmitting}
                                            aria-label="Cancel"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type="submit"
                                            className="px-3 sm:px-4 py-2 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-sm sm:text-base"
                                            disabled={
                                              isSubmitting ||
                                              Object.keys(dependentLoading).some((key) => dependentLoading[key])
                                            }
                                            aria-label={field.label}
                                          >
                                            {isSubmitting ? 'Saving...' : field.label}
                                          </button>
                                        </div>
                                      );

                                    default:
                                      return null;
                                  }
                                })()}

                                {fieldError && (
                                  <div className="mt-1 text-xs sm:text-sm text-rose-600 flex items-center gap-1.5">
                                    <svg
                                      className="w-3 h-3 sm:w-4 sm:h-4"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                      aria-hidden="true"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <ErrorMessage name={field.name} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </FormikForm>
                    )}
                  </Formik>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
};

// Effect Component for Dependent Updates
interface EffectProps {
  subjectId: string;
  handleDependentUpdate: (subjectId: string) => void;
  isSubmitting: boolean;
  modalMode: 'add' | 'edit';
  selectedItem: Topic | null;
}

const Effect: React.FC<EffectProps> = React.memo(
  ({ subjectId, handleDependentUpdate, isSubmitting, modalMode, selectedItem }) => {
    useEffect(() => {
      if (!isSubmitting) {
        handleDependentUpdate(subjectId);
      }
    }, [subjectId, handleDependentUpdate, isSubmitting]);

    // Prefill chapters for edit mode
    useEffect(() => {
      if (modalMode === 'edit' && selectedItem && subjectId) {
        handleDependentUpdate(subjectId);
      }
    }, [modalMode, selectedItem, subjectId, handleDependentUpdate]);

    return null;
  },
);

// Select2 Component
interface Select2Props {
  form: any;
  field: { name: string; value: string | boolean };
  options?: Option[];
  label?: string;
  disabled?: boolean;
  error?: boolean;
}

const Select2: React.FC<Select2Props> = React.memo(
  ({ form, field, options = [], label = '', disabled = false, error = false }) => {
    const [myValue, setMyValue] = useState<Option | null>(null);

    useEffect(() => {
      const selected = options.find((row: Option) => row.id === field.value) || null;
      setMyValue(selected);
    }, [field.value, options]);

    const customStyles = useMemo(
      () => ({
        control: (provided: any, state: any) => ({
          ...provided,
          borderColor: error ? '#F43F5E' : state.isFocused ? '#0EA5E9' : '#D1D5DB',
          boxShadow: error ? '0 0 0 1px #F43F5E' : state.isFocused ? '0 0 0 1px #0EA5E9' : 'none',
          '&:hover': { borderColor: error ? '#F43F5E' : state.isFocused ? '#0EA5E9' : '#9CA3AF' },
          borderRadius: '0.5rem',
          backgroundColor: disabled ? '#F3F4F6' : 'white',
          padding: '2px 4px',
          minHeight: '38px',
          fontSize: '0.875rem',
          lineHeight: '1.25rem',
        }),
        option: (provided: any, state: any) => ({
          ...provided,
          backgroundColor: state.isSelected ? '#0EA5E9' : state.isFocused ? '#E0F2FE' : null,
          color: state.isSelected ? 'white' : '#111827',
          '&:active': { backgroundColor: '#38BDF8' },
          padding: '8px 12px',
          fontSize: '0.875rem',
        }),
        menu: (provided: any) => ({
          ...provided,
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 9999,
          overflow: 'hidden',
        }),
        placeholder: (provided: any) => ({ ...provided, color: '#9CA3AF', fontSize: '0.875rem' }),
        indicatorSeparator: () => ({ display: 'none' }),
        dropdownIndicator: (provided: any) => ({ ...provided, color: '#6B7280', padding: '4px' }),
        singleValue: (provided: any) => ({
          ...provided,
          color: disabled ? '#9CA3AF' : '#111827',
          fontSize: '0.875rem',
        }),
      }),
      [error, disabled],
    );

    const handleChange = useCallback(
      (value: Option | null) => {
        setMyValue(value);
        form.setFieldValue(field.name, value?.id ?? '');
      },
      [form, field.name],
    );

    return (
      <Select
        closeMenuOnSelect
        options={options}
        isDisabled={disabled}
        placeholder={`Select ${label}`}
        styles={customStyles}
        getOptionLabel={(option: Option) => option.name}
        getOptionValue={(option: Option) => String(option.id)}
        value={myValue}
        onChange={handleChange}
        aria-label={label}
      />
    );
  },
);

// TextEditer Component
interface TextEditerProps {
  form: any;
  field: { name: string; value: string };
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
}

const TextEditer: React.FC<TextEditerProps> = React.memo(
  ({ form, field, disabled = false, error = false, placeholder = 'Start typing...' }) => {
    const editor = useRef<any>(null);
    const [content, setContent] = useState<string>(field?.value || '');

    const config = useMemo(
      () => ({
        readonly: disabled,
        height: '300',
        placeholder,
        toolbarAdaptive: false,
        buttons: ['bold', 'italic', 'underline', '|', 'ul', 'ol', '|', 'link', 'image'],
        statusbar: false,
        autoresize: true,
      }),
      [disabled, placeholder],
    );

    const handleChange = useCallback((newContent: string) => {
      setContent(newContent);
    }, []);

    const handleBlur = useCallback(
      (newContent: string) => {
        form.setFieldValue(field.name, newContent);
      },
      [form, field.name],
    );

    return (
      <div className={`text-black rounded-lg overflow-hidden ${error ? 'ring-2 ring-rose-500' : ''}`}>
        <JoditEditor
          ref={editor}
          value={content}
          config={config}
          tabIndex={1}
          onBlur={handleBlur}
          onChange={handleChange}
        />
      </div>
    );
  },
);

export default Topics;
