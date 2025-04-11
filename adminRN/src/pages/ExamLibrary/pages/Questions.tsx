'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import * as Yup from 'yup';

// React Icons
import {
  FiSearch,
  FiPlus,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiFilter,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiArrowLeft,
} from 'react-icons/fi';
import {
  BiBook,
  BiLayer,
  BiBookContent,
  BiExport,
  BiImport,
  BiRefresh,
} from 'react-icons/bi';
import { HiOutlineDocumentDuplicate } from 'react-icons/hi';
import {
  RiLoader4Line,
  RiQuestionLine,
  RiFileExcel2Line,
  RiDashboardLine,
  RiSettings4Line,
  RiEyeLine,
} from 'react-icons/ri';
import { BsThreeDotsVertical, BsListCheck } from 'react-icons/bs';
import { TbFileUpload } from 'react-icons/tb';
import { MdOutlineQuiz } from 'react-icons/md';

import AxiosHelper from '../../../helper/AxiosHelper';
import MyForm from '../../../helper/MyForm';
import { QUESTION_FORMAT } from '../../../constant/questionFormat';

const Questions = () => {
  const { subjectId, chapterId, topicId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [subject, setSubject] = useState<any>(null);
  const [chapter, setChapter] = useState<any>(null);
  const [topic, setTopic] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [showOptionsFor, setShowOptionsFor] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showPreview, setShowPreview] = useState<string | null>(null);

  // Validation schema for creating a question
  const questionValidationSchema = Yup.object().shape({
    questionText: Yup.string().required('Question text is required'),
    option1: Yup.string().required('Option 1 is required'),
    option2: Yup.string().required('Option 2 is required'),
    option3: Yup.string().required('Option 3 is required'),
    option4: Yup.string().required('Option 4 is required'),
    option5: Yup.string(),
    rightAnswer: Yup.string()
      .required('Right answer is required')
      .oneOf(
        ['option1', 'option2', 'option3', 'option4', 'option5'],
        'Invalid right answer',
      ),
    explanation: Yup.string(),
  });

  // Initial form values for creating a question
  const initialFormValues = {
    questionText: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    option5: '',
    rightAnswer: '',
    explanation: '',
  };

  // Form fields for creating a question
  const formFields = [
    {
      label: 'Question Text',
      name: 'questionText',
      type: 'textarea',
      col: 12,
    },
    {
      label: 'Option 1',
      name: 'option1',
      type: 'text',
      col: 6,
    },
    {
      label: 'Option 2',
      name: 'option2',
      type: 'text',
      col: 6,
    },
    {
      label: 'Option 3',
      name: 'option3',
      type: 'text',
      col: 6,
    },
    {
      label: 'Option 4',
      name: 'option4',
      type: 'text',
      col: 6,
    },
    {
      label: 'Option 5 (Optional)',
      name: 'option5',
      type: 'text',
      col: 6,
    },
    {
      label: 'Right Answer',
      name: 'rightAnswer',
      type: 'select',
      options: [
        { id: '', name: 'Select Right Answer' },
        { id: 'option1', name: 'Option 1' },
        { id: 'option2', name: 'Option 2' },
        { id: 'option3', name: 'Option 3' },
        { id: 'option4', name: 'Option 4' },
        { id: 'option5', name: 'Option 5' },
      ],
      col: 6,
    },
    {
      label: 'Explanation (Optional)',
      name: 'explanation',
      type: 'textarea',
      col: 12,
    },
    {
      label: 'Create Question',
      name: 'submit',
      type: 'submit',
    },
  ];

  // Fetch subject, chapter, and topic details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);

        // Fetch subject details
        if (subjectId) {
          const subjectResponse = await AxiosHelper.getData(
            `/subjects/${subjectId}`,
          );
          if (subjectResponse?.data?.status) {
            setSubject(subjectResponse.data.data);
          }
        }

        // Fetch chapter details
        if (chapterId) {
          const chapterResponse = await AxiosHelper.getData(
            `/chapters/${chapterId}`,
          );
          if (chapterResponse?.data?.status) {
            setChapter(chapterResponse.data.data);
          }
        }

        // Fetch topic details
        if (topicId) {
          const topicResponse = await AxiosHelper.getData(`/topics/${topicId}`);
          if (topicResponse?.data?.status) {
            setTopic(topicResponse.data.data);
          }
        }

        // Fetch questions for this topic
        await fetchQuestions();

        setLoading(false);
      } catch (error) {
        console.error('Error fetching details:', error);
        toast.error('Failed to fetch details');
        setLoading(false);
      }
    };

    fetchDetails();
  }, [subjectId, chapterId, topicId]);

  // Fetch questions
  const fetchQuestions = async () => {
    try {
      if (!topicId) return;

      const params = {
        page,
        limit,
        search: search || undefined,
        topicId,
        sortField: sortField || undefined,
        sortDirection: sortDirection || undefined,
      };

      const response = await AxiosHelper.getData('/questions', params);

      if (response?.data?.status) {
        setQuestions(response.data.data.record || []);
        setTotal(response.data.data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to fetch questions');
    }
  };

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploadLoading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('subjectId', subjectId || '');
      formData.append('chapterId', chapterId || '');
      formData.append('topicId', topicId || '');

      const response = await AxiosHelper.postData(
        'questions/upload-excel',
        formData,
        true,
      );

      if (response?.data?.status) {
        toast.success('Questions uploaded successfully');
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById(
          'fileInput',
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Refresh questions list
        fetchQuestions();
      } else {
        throw new Error(
          response?.data?.message || 'Failed to upload questions',
        );
      }
    } catch (error: any) {
      console.error('Error uploading questions:', error);
      toast.error(error.message || 'Failed to upload questions');
    } finally {
      setUploadLoading(false);
    }
  };

  // Handle download sample
  const handleDownloadSample = async () => {
    try {
      const response = await AxiosHelper.getData(
        'questions/sample-excel',
        {},
        { responseType: 'blob' },
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sample_questions_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading sample:', error);
      toast.error('Failed to download sample template');
    }
  };

  // Handle search
  const handleSearch = () => {
    setPage(1);
    fetchQuestions();
  };

  // Handle delete question
  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const response = await AxiosHelper.deleteData(`/questions/${id}`);

      if (response?.data?.status) {
        toast.success('Question deleted successfully');
        fetchQuestions();
      } else {
        throw new Error(response?.data?.message || 'Failed to delete question');
      }
    } catch (error: any) {
      console.error('Error deleting question:', error);
      toast.error(error.message || 'Failed to delete question');
    }
  };

  // Handle create question form submission
  const handleCreateQuestion = async (values: any) => {
    try {
      setCreateLoading(true);

      const questionData = {
        ...values,
        subjectId,
        chapterId,
        topicId,
      };

      const response = await AxiosHelper.postData('/questions', questionData);

      if (response?.data?.status) {
        toast.success('Question created successfully');
        setShowCreateModal(false);
        fetchQuestions();
      } else {
        throw new Error(response?.data?.message || 'Failed to create question');
      }
    } catch (error: any) {
      console.error('Error creating question:', error);
      toast.error(error.message || 'Failed to create question');
    } finally {
      setCreateLoading(false);
    }
  };

  // Get the display value for the right answer
  const getRightAnswerDisplay = (question: any) => {
    if (!question || !question.rightAnswer) return 'N/A';

    // Map option1 -> 1, option2 -> 2, etc.
    const displayValue =
      QUESTION_FORMAT.RIGHT_ANSWER_REVERSE_MAP[question.rightAnswer];

    // Return the actual option value
    return question[question.rightAnswer] || 'N/A';
  };

  // Handle key press for search
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    fetchQuestions();
  };

  // Handle duplicate question
  const handleDuplicateQuestion = async (question: any) => {
    try {
      const duplicateData = {
        ...question,
        _id: undefined,
        subjectId,
        chapterId,
        topicId,
      };

      const response = await AxiosHelper.postData('/questions', duplicateData);

      if (response?.data?.status) {
        toast.success('Question duplicated successfully');
        fetchQuestions();
      } else {
        throw new Error(
          response?.data?.message || 'Failed to duplicate question',
        );
      }
    } catch (error: any) {
      console.error('Error duplicating question:', error);
      toast.error(error.message || 'Failed to duplicate question');
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchQuestions();
    toast.info('Questions refreshed');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Top Navigation Bar */}
      {/* <div className="sticky top-0 z-30 bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/topics')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-400 focus:outline-none transition"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Back to Topics
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-400 focus:outline-none transition"
                onMouseEnter={() => setShowTooltip('refresh')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <BiRefresh className="h-5 w-5" />
                <span className="sr-only">Refresh</span>
                {showTooltip === 'refresh' && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg whitespace-nowrap">
                    Refresh Questions
                  </div>
                )}
              </button>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-400 focus:outline-none transition"
                onMouseEnter={() => setShowTooltip('dashboard')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <RiDashboardLine className="h-5 w-5" />
                <span className="sr-only">Dashboard</span>
                {showTooltip === 'dashboard' && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg whitespace-nowrap">
                    Go to Dashboard
                  </div>
                )}
              </button>
              <button
                onClick={() => navigate('/admin/settings')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-400 focus:outline-none transition"
                onMouseEnter={() => setShowTooltip('settings')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <RiSettings4Line className="h-5 w-5" />
                <span className="sr-only">Settings</span>
                {showTooltip === 'settings' && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg whitespace-nowrap">
                    Settings
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div> */}

      <div className="max-w-full mx-auto p-10">
        <div className="space-y-8">
          {/* Header with breadcrumb */}
          <div className="space-y-4">
            {/* <nav className="flex" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <a
                    href="/admin"
                    className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400"
                  >
                    <RiDashboardLine className="mr-2 w-4 h-4" />
                    Dashboard
                  </a>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-slate-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <a
                      href="/admin/topics"
                      className="ml-1 text-sm font-medium text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 md:ml-2"
                    >
                      Topics
                    </a>
                  </div>
                </li>
                <li aria-current="page">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-slate-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span className="ml-1 text-sm font-medium text-slate-700 dark:text-slate-300 md:ml-2">
                      Manage Questions
                    </span>
                  </div>
                </li>
              </ol>
            </nav> */}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center">
                <MdOutlineQuiz className="mr-3 h-8 w-8 text-purple-600 dark:text-purple-400" />
                Manage Questions
              </h1>

              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md focus:ring-4 focus:ring-purple-500 focus:ring-opacity-30 transition-all duration-300 ease-in-out"
              >
                <FiPlus className="mr-2 h-4 w-4" />
                Create Question
              </button>
            </div>

            {/* Subject, Chapter, Topic info */}
            {!loading && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <BiBook className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          Subject
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        {subject?.name || 'Loading...'}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                          <BiLayer className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          Chapter
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        {chapter?.name || 'Loading...'}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
                          <BiBookContent className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          Topic
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        {topic?.name || 'Loading...'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 px-6 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                      <FiInfo className="mr-2 h-4 w-4" />
                      <span>
                        Total Questions:{' '}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {total}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs px-2.5 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full font-medium">
                        Active
                      </span>
                      <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-medium">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Upload Questions Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <RiFileExcel2Line className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Upload Questions
                </h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Upload Excel file with questions for this topic. Make sure to
                follow the correct format.
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="relative">
                    <div className="group relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 transition-all hover:border-purple-400 dark:hover:border-purple-500 focus-within:border-purple-400 dark:focus-within:border-purple-500">
                      <input
                        id="fileInput"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center text-center">
                        <TbFileUpload className="h-10 w-10 text-slate-400 dark:text-slate-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 mb-2" />
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                          {file
                            ? file.name
                            : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Excel files only (.xlsx, .xls)
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <FiInfo className="h-4 w-4 text-slate-400" />
                    <span>
                      Format: {QUESTION_FORMAT.HEADERS.RIGHT_ANSWER} should be
                      one of: 1, 2, 3, 4, 5
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleUpload}
                      disabled={!file || uploadLoading}
                      className={`inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 ${
                        !file || uploadLoading
                          ? 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 dark:focus:ring-offset-slate-800'
                      }`}
                    >
                      {uploadLoading ? (
                        <>
                          <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <BiImport className="mr-2 h-4 w-4" />
                          Upload Questions
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownloadSample}
                      className="inline-flex items-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-all duration-300"
                    >
                      <BiExport className="mr-2 h-4 w-4" />
                      Download Sample Format
                    </button>
                  </div>
                </div>

                <div className="hidden md:block border-l border-slate-200 dark:border-slate-700 pl-6">
                  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                      <FiInfo className="mr-2 h-4 w-4 text-slate-500" />
                      Upload Instructions
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      <li className="flex items-start">
                        <FiCheckCircle className="mr-2 h-4 w-4 text-emerald-500 mt-0.5" />
                        <span>
                          Prepare your Excel file with the correct column
                          headers
                        </span>
                      </li>
                      <li className="flex items-start">
                        <FiCheckCircle className="mr-2 h-4 w-4 text-emerald-500 mt-0.5" />
                        <span>
                          Each row should represent one question with options
                        </span>
                      </li>
                      <li className="flex items-start">
                        <FiCheckCircle className="mr-2 h-4 w-4 text-emerald-500 mt-0.5" />
                        <span>
                          Right answer should be indicated as 1, 2, 3, 4, or 5
                        </span>
                      </li>
                      <li className="flex items-start">
                        <FiAlertCircle className="mr-2 h-4 w-4 text-amber-500 mt-0.5" />
                        <span>Maximum file size: 5MB</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <BsListCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Questions List
                  </h2>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search questions..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div className="relative w-full sm:w-auto">
                    <select
                      value={limit.toString()}
                      onChange={(e) => setLimit(Number(e.target.value))}
                      className="block w-full sm:w-auto appearance-none bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg py-2 px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      {[10, 25, 50, 100].map((value) => (
                        <option key={value} value={value.toString()}>
                          {value} per page
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                      <svg
                        className="fill-current h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>

                  <button
                    onClick={handleSearch}
                    className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-colors"
                  >
                    <FiFilter className="mr-2 h-4 w-4" />
                    Filter
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <RiLoader4Line className="h-10 w-10 text-purple-600 dark:text-purple-400 animate-spin mb-4" />
                <p className="text-slate-500 dark:text-slate-400">
                  Loading questions...
                </p>
              </div>
            ) : questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <RiQuestionLine className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
                  No questions found
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
                  There are no questions for this topic yet. Create a new
                  question or upload questions using Excel.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-6 inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-slate-800 transition-colors"
                >
                  <FiPlus className="mr-2 h-4 w-4" />
                  Create First Question
                </button>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-800/75 backdrop-blur-sm">
                      <tr>
                        {/* Number Column */}
                        <th
                          scope="col"
                          className="pl-6 pr-3 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                          onClick={() => handleSort('number')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>#</span>
                            {sortField === 'number' && (
                              <span className="text-purple-600 dark:text-purple-400">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>

                        {/* Question Text Column */}
                        <th
                          scope="col"
                          className="px-4 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                          onClick={() => handleSort('questionText')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Question</span>
                            {sortField === 'questionText' && (
                              <span className="text-purple-600 dark:text-purple-400">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>

                        {/* Options Columns */}
                        {[1, 2, 3, 4, 5].map((num) => (
                          <th
                            key={num}
                            scope="col"
                            className="px-4 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide bg-slate-50/50 dark:bg-slate-800/50"
                          >
                            <span className="flex items-center">
                              Option {num}
                              <span className="ml-1 text-xs text-emerald-600 dark:text-emerald-400">
                                {num === 1 && '*'}
                              </span>
                            </span>
                          </th>
                        ))}

                        {/* Right Answer Column */}
                        <th
                          scope="col"
                          className="px-4 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                          onClick={() => handleSort('rightAnswer')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Correct</span>
                            {sortField === 'rightAnswer' && (
                              <span className="text-purple-600 dark:text-purple-400">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>

                        {/* Actions Column */}
                        <th
                          scope="col"
                          className="pr-6 pl-3 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {questions.map((question, index) => (
                        <tr
                          key={question._id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors duration-150"
                        >
                          {/* Number Cell */}
                          <td className="pl-6 pr-3 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                            <span className="inline-block w-6 text-right">
                              {(page - 1) * limit + index + 1}
                            </span>
                          </td>

                          {/* Question Cell */}
                          <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300 max-w-[280px] break-words leading-relaxed">
                            <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                              {question.questionText}
                            </div>
                            {question.description && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {question.description}
                              </div>
                            )}
                          </td>

                          {/* Option Cells */}
                          {[1, 2, 3, 4, 5].map((num) => {
                            const optionKey = `option${num}`;
                            const isCorrect =
                              question.rightAnswer === optionKey;

                            return (
                              <td
                                key={optionKey}
                                className={`px-4 py-4 text-sm ${
                                  isCorrect
                                    ? 'bg-emerald-50/50 dark:bg-emerald-900/20 font-medium text-emerald-700 dark:text-emerald-300'
                                    : 'text-slate-600 dark:text-slate-400'
                                } ${!question[optionKey] ? 'opacity-50' : ''}`}
                              >
                                <div className="flex items-center">
                                  <span
                                    className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                      isCorrect
                                        ? 'bg-emerald-500 dark:bg-emerald-400'
                                        : 'bg-slate-300 dark:bg-slate-600'
                                    }`}
                                  />
                                  {question[optionKey] || (
                                    <span className="italic text-slate-400 dark:text-slate-500">
                                      Empty
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}

                          {/* Correct Answer Cell */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              {question.rightAnswer.replace(
                                'option',
                                'Option ',
                              )}
                            </div>
                          </td>

                          {/* Actions Cell */}
                          <td className="pr-6 pl-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                className="inline-flex justify-center items-center w-8 h-8 rounded-md border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                                onClick={() =>
                                  setShowOptionsFor(
                                    showOptionsFor === question._id
                                      ? null
                                      : question._id,
                                  )
                                }
                              >
                                <BsThreeDotsVertical className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                              </button>

                              {showOptionsFor === question._id && (
                                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white dark:bg-slate-700 ring-1 ring-slate-900/5 dark:ring-slate-300/10 focus:outline-none z-10 transition-all duration-150 scale-95 hover:scale-100">
                                  <div className="py-1.5">
                                    {/* Preview Button */}
                                    <button
                                      onClick={() => {
                                        setShowPreview(question._id);
                                        setShowOptionsFor(null);
                                      }}
                                      className="flex w-full items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600/50"
                                    >
                                      <RiEyeLine className="mr-3 h-4 w-4" />
                                      Preview Question
                                    </button>

                                    {/* Duplicate Button */}
                                    <button
                                      onClick={() => {
                                        handleDuplicateQuestion(question);
                                        setShowOptionsFor(null);
                                      }}
                                      className="flex w-full items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600/50"
                                    >
                                      <HiOutlineDocumentDuplicate className="mr-3 h-4 w-4" />
                                      Duplicate
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                      onClick={() => {
                                        handleDeleteQuestion(question._id);
                                        setShowOptionsFor(null);
                                      }}
                                      className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                      <FiTrash2 className="mr-3 h-4 w-4" />
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="bg-slate-50 dark:bg-slate-700/30 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Showing{' '}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {(page - 1) * limit + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {Math.min(page * limit, total)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {total}
                      </span>{' '}
                      results
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-slate-800 ${
                          page === 1
                            ? 'border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 cursor-not-allowed'
                            : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600'
                        }`}
                      >
                        <FiChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </button>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md">
                        Page {page} of {Math.ceil(total / limit)}
                      </div>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page * limit >= total}
                        className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-slate-800 ${
                          page * limit >= total
                            ? 'border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 cursor-not-allowed'
                            : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600'
                        }`}
                      >
                        Next
                        <FiChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create Question Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: '214748364' }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-[90%] md:max-w-[80%] w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 z-10 flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center">
                  <FiPlus className="mr-3 h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Create New Question
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <MyForm
                  fields={formFields}
                  initialValues={initialFormValues}
                  validSchema={questionValidationSchema}
                  onSubmit={handleCreateQuestion}
                  isReset={true}
                  disabled={createLoading}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: '214748364' }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-[90%] md:max-w-[600px] w-full"
            >
              {questions
                ?.filter((q) => q._id === showPreview)
                .map((question) => (
                  <div key={question._id}>
                    <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center">
                        <RiQuestionLine className="mr-3 h-5 w-5 text-purple-600 dark:text-purple-400" />
                        Question Preview
                      </h2>
                      <button
                        onClick={() => setShowPreview(null)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-colors"
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg mb-6">
                        <p className="text-slate-900 dark:text-white font-medium">
                          {question.questionText}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Options:
                        </h3>
                        <div
                          className={`p-3 rounded-lg border ${
                            question.rightAnswer === 'option1'
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                              : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                                question.rightAnswer === 'option1'
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              1
                            </div>
                            <span
                              className={`${
                                question.rightAnswer === 'option1'
                                  ? 'text-emerald-800 dark:text-emerald-400 font-medium'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {question.option1}
                            </span>
                            {question.rightAnswer === 'option1' && (
                              <span className="ml-auto text-emerald-600 dark:text-emerald-400 flex items-center">
                                <FiCheckCircle className="h-4 w-4 mr-1" />
                                Correct
                              </span>
                            )}
                          </div>
                        </div>

                        <div
                          className={`p-3 rounded-lg border ${
                            question.rightAnswer === 'option2'
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                              : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                                question.rightAnswer === 'option2'
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              2
                            </div>
                            <span
                              className={`${
                                question.rightAnswer === 'option2'
                                  ? 'text-emerald-800 dark:text-emerald-400 font-medium'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {question.option2}
                            </span>
                            {question.rightAnswer === 'option2' && (
                              <span className="ml-auto text-emerald-600 dark:text-emerald-400 flex items-center">
                                <FiCheckCircle className="h-4 w-4 mr-1" />
                                Correct
                              </span>
                            )}
                          </div>
                        </div>

                        <div
                          className={`p-3 rounded-lg border ${
                            question.rightAnswer === 'option3'
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                              : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                                question.rightAnswer === 'option3'
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              3
                            </div>
                            <span
                              className={`${
                                question.rightAnswer === 'option3'
                                  ? 'text-emerald-800 dark:text-emerald-400 font-medium'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {question.option3}
                            </span>
                            {question.rightAnswer === 'option3' && (
                              <span className="ml-auto text-emerald-600 dark:text-emerald-400 flex items-center">
                                <FiCheckCircle className="h-4 w-4 mr-1" />
                                Correct
                              </span>
                            )}
                          </div>
                        </div>

                        <div
                          className={`p-3 rounded-lg border ${
                            question.rightAnswer === 'option4'
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                              : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                                question.rightAnswer === 'option4'
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              4
                            </div>
                            <span
                              className={`${
                                question.rightAnswer === 'option4'
                                  ? 'text-emerald-800 dark:text-emerald-400 font-medium'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {question.option4}
                            </span>
                            {question.rightAnswer === 'option4' && (
                              <span className="ml-auto text-emerald-600 dark:text-emerald-400 flex items-center">
                                <FiCheckCircle className="h-4 w-4 mr-1" />
                                Correct
                              </span>
                            )}
                          </div>
                        </div>

                        {question.option5 && (
                          <div
                            className={`p-3 rounded-lg border ${
                              question.rightAnswer === 'option5'
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                                  question.rightAnswer === 'option5'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                5
                              </div>
                              <span
                                className={`${
                                  question.rightAnswer === 'option5'
                                    ? 'text-emerald-800 dark:text-emerald-400 font-medium'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {question.option5}
                              </span>
                              {question.rightAnswer === 'option5' && (
                                <span className="ml-auto text-emerald-600 dark:text-emerald-400 flex items-center">
                                  <FiCheckCircle className="h-4 w-4 mr-1" />
                                  Correct
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {question.explanation && (
                        <div className="mt-6">
                          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Explanation:
                          </h3>
                          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300">
                            {question.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                      <button
                        onClick={() => setShowPreview(null)}
                        className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Questions;
