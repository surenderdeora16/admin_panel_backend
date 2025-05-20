'use client';

import { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { STATUS } from '../../constant/constant';
import AxiosHelper from '../../helper/AxiosHelper';
import DataManager from '../../components/DataManager';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaArrowLeft,
  FaDownload,
  FaSearch,
  FaLock,
  FaBookOpen,
  FaSpinner,
  FaTag,
} from 'react-icons/fa';

// Custom hook to fetch subjects
const useSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await AxiosHelper.getData('/subjects', {
          limit: 100,
          pageNo: 1,
          orderBy: 'name',
          orderDirection: 'asc',
        });

        if (response?.data?.status) {
          const subjectOptions = response.data.data.record.map((subject) => ({
            id: subject._id,
            name: subject.name,
          }));
          setSubjects(subjectOptions);
        } else {
          throw new Error(
            response?.data?.message || 'Failed to fetch subjects',
          );
        }
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
        setError(error.message || 'Could not load subjects');
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  return { subjects, loading, error };
};

// Custom hook to fetch exam plans
const useExamPlans = () => {
  const [examPlans, setExamPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExamPlans = async () => {
      try {
        setLoading(true);
        const response = await AxiosHelper.getData('/exam-plans', {
          limit: 100,
          pageNo: 1,
          orderBy: 'title',
          orderDirection: 'asc',
        });

        if (response?.data?.status) {
          const examPlanOptions = response.data.data.record.map((plan) => ({
            id: plan._id,
            name: `${plan.title}${
              plan.batchId?.name ? ` (${plan.batchId.name})` : ''
            } - ₹${plan.price}`,
          }));
          setExamPlans(examPlanOptions);
        } else {
          throw new Error(
            response?.data?.message || 'Failed to fetch exam plans',
          );
        }
      } catch (error) {
        console.error('Failed to fetch exam plans:', error);
        setError(error.message || 'Could not load exam plans');
        setExamPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExamPlans();
  }, []);

  return { examPlans, loading, error };
};

// Admin Notes Management Component
const AdminNotes = () => {
  const { subjectId, examPlanId } = useParams();
  const navigate = useNavigate();
  const [modalType, setModalType] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [examPlanName, setExamPlanName] = useState('');

  const {
    subjects,
    loading: subjectsLoading,
    error: subjectsError,
  } = useSubjects();
  const {
    examPlans,
    loading: examPlansLoading,
    error: examPlansError,
  } = useExamPlans();

  // Fetch subject name if subjectId is provided
  useEffect(() => {
    if (subjectId) {
      const fetchSubjectName = async () => {
        try {
          const response = await AxiosHelper.getData(`/subjects/${subjectId}`);
          if (response?.data?.status) {
            setSubjectName(response.data.data.name);
          } else {
            toast.error(
              response?.data?.message || 'Failed to fetch subject details',
            );
          }
        } catch (error) {
          console.error('Error fetching subject:', error);
          toast.error('Failed to fetch subject details');
        }
      };
      fetchSubjectName();
    }
  }, [subjectId]);

  // Fetch exam plan name if examPlanId is provided
  useEffect(() => {
    if (examPlanId) {
      const fetchExamPlanName = async () => {
        try {
          const response = await AxiosHelper.getData(
            `/exam-plans/${examPlanId}`,
          );
          if (response?.data?.status) {
            setExamPlanName(response.data.data.title);
          } else {
            toast.error(
              response?.data?.message || 'Failed to fetch exam plan details',
            );
          }
        } catch (error) {
          console.error('Error fetching exam plan:', error);
          toast.error('Failed to fetch exam plan details');
        }
      };
      fetchExamPlanName();
    }
  }, [examPlanId]);

  // Determine title based on context
  let title = 'Notes Management';
  if (subjectId && examPlanId) {
    title = `${subjectName} - ${examPlanName} - Notes`;
  } else if (subjectId) {
    title = `${subjectName} - Notes`;
  } else if (examPlanId) {
    title = `${examPlanName} - Notes`;
  }

  const itemName = 'Note';

  // Set up API endpoints
  const endpoints = {
    list:
      subjectId && examPlanId
        ? `/subjects/${subjectId}/exam-plans/${examPlanId}/notes`
        : subjectId
        ? `/subjects/${subjectId}/notes`
        : examPlanId
        ? `/exam-plans/${examPlanId}/notes`
        : '/notes',
    create: '/notes',
    update: (id) => `/notes/${id}`,
    delete: (id) => `/notes/${id}`,
  };

  // Form validation schema
  const validationSchema = Yup.object().shape({
    title: Yup.string()
      .required('Title is required')
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title cannot exceed 200 characters'),
    description: Yup.string().max(
      1000,
      'Description cannot exceed 1000 characters',
    ),
    subjectId: Yup.string().required('Subject is required'),
    examPlanId: Yup.string().required('Exam Plan is required'),
    pdfFile: Yup.mixed().when('_', {
      is: () => modalType === 'add',
      then: () => Yup.mixed().required('PDF file is required'),
      otherwise: () => Yup.mixed(),
    }),
    thumbnailImage: Yup.mixed(),
    isFree: Yup.boolean(),
    sequence: Yup.number()
      .min(0, 'Sequence cannot be negative')
      .integer('Sequence must be a whole number'),
    status: Yup.boolean(),
  });

  // Form fields configuration
  const formFields = [
    {
      label: 'Title',
      name: 'title',
      type: 'text',
      col: 12,
      placeholder: 'Enter note title',
    },
    {
      label: 'Description',
      name: 'description',
      type: 'text-editer',
      col: 12,
      placeholder: 'Enter note description',
    },
    {
      label: 'Subject',
      name: 'subjectId',
      type: 'select2',
      options: [{ id: '', name: 'Select Subject' }, ...subjects],
      disabled: !!subjectId || subjectsLoading || !!subjectsError,
      col: 6,
    },
    {
      label: "Exam Plan",
      name: "examPlanId",
      type: "select2",
      options: [{ id: "", name: "Select Exam Plan" }, ...examPlans],
      disabled: !!examPlanId || examPlansLoading || !!examPlansError,
      col: 12,
    },
    {
      label: 'PDF File',
      name: 'pdfFile',
      type: 'file',
      accept: '.pdf',
      col: 12,
      helperText: 'Upload PDF file (max 10MB)',
    },
    {
      label: 'Thumbnail Image',
      name: 'thumbnailImage',
      type: 'image-file',
      col: 12,
      helperText: 'Upload thumbnail image (optional)',
    },
    {
      label: 'Is Free',
      name: 'isFree',
      type: 'check',
      col: 6,
      helperText: 'Free notes are accessible without exam plan purchase',
    },
    {
      label: 'Sequence',
      name: 'sequence',
      type: 'number',
      min: 0,
      col: 6,
      helperText: 'Display order (lower numbers appear first)',
    },
    {
      label: 'Status',
      name: 'status',
      type: 'select2',
      options: STATUS,
      col: 6,
    },
  ];

  // Table columns configuration
  const tableColumns = [
    { header: 'Title', accessor: 'title', sortable: true },
    ...(subjectId
      ? []
      : [
          {
            header: 'Subject',
            accessor: 'subjectId',
            render: (value) => value?.name || 'N/A',
          },
        ]),
    ...(examPlanId
      ? []
      : [
          {
            header: 'Exam Plan',
            accessor: 'examPlanId',
            render: (value) => value?.title || 'N/A',
          },
        ]),
    {
      header: 'Access Type',
      accessor: 'isFree',
      render: (value) => (value ? 'Free' : 'Paid (Requires Exam Plan)'),
    },
    { header: 'Sequence', accessor: 'sequence' },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (value ? 'Active' : 'Inactive'),
      sortable: true,
    },
  ];

  // Initial form values
  const initialFormValues = {
    title: '',
    description: '',
    subjectId: subjectId || '',
    examPlanId: examPlanId || '',
    pdfFile: null,
    thumbnailImage: null,
    isFree: false,
    sequence: 0,
    status: true,
  };

  // Custom render actions to add Preview button
  const renderActions = (item) => {
    return (
      <button
        onClick={() => window.open(`/api${item.pdfFile}`, '_blank')}
        className="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
      >
        Preview
      </button>
    );
  };

  // Handle loading states
  if (subjectsLoading || examPlansLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2">Loading resources...</span>
      </div>
    );
  }

  // Handle error states
  if (subjectsError || examPlansError) {
    return (
      <div
        className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">
          {subjectsError || examPlansError}. Please refresh the page or contact
          support.
        </span>
      </div>
    );
  }

  return (
    <DataManager
      title={title}
      itemName={itemName}
      setModalType={setModalType}
      endpoints={endpoints}
      validationSchema={validationSchema}
      formFields={formFields}
      tableColumns={tableColumns}
      initialFormValues={initialFormValues}
      showPagination={true}
      showAdd={true}
      showEdit={true}
      showDelete={true}
      multipartFormData={true}
      renderActions={renderActions}
      queryParams={
        subjectId && examPlanId
          ? { subjectId, examPlanId }
          : subjectId
          ? { subjectId }
          : examPlanId
          ? { examPlanId }
          : {}
      }
    />
  );
};

// User Notes View Component
const UserNotes = () => {
  const { subjectId, examPlanId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subject, setSubject] = useState(null);
  const [examPlan, setExamPlan] = useState(null);
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Fetch data based on context (subject or exam plan)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (subjectId && examPlanId) {
          // Fetch notes for specific subject and exam plan
          await Promise.all([
            fetchSubjectDetails(subjectId),
            fetchExamPlanDetails(examPlanId),
            fetchNotesBySubjectAndExamPlan(subjectId, examPlanId),
          ]);
        } else if (subjectId) {
          // Fetch notes for specific subject
          await Promise.all([
            fetchSubjectDetails(subjectId),
            fetchNotesBySubject(subjectId),
          ]);
        } else if (examPlanId) {
          // Fetch notes for specific exam plan
          await Promise.all([
            fetchExamPlanDetails(examPlanId),
            fetchExamPlanData(examPlanId),
          ]);
        } else {
          // No context provided, redirect to subjects list
          // navigate('/subjects');
          return;
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load notes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subjectId, examPlanId, navigate]);

  // Fetch subject details
  const fetchSubjectDetails = async (id) => {
    try {
      const response = await AxiosHelper.getData(`/subjects/${id}`);
      if (response?.data?.status) {
        setSubject(response.data.data);
      } else {
        throw new Error(
          response?.data?.message || 'Failed to fetch subject details',
        );
      }
    } catch (error) {
      console.error('Error fetching subject:', error);
      throw new Error('Failed to fetch subject details');
    }
  };

  // Fetch exam plan details
  const fetchExamPlanDetails = async (id) => {
    try {
      const response = await AxiosHelper.getData(`/exam-plans/${id}`);
      if (response?.data?.status) {
        setExamPlan(response.data.data);
      } else {
        throw new Error(
          response?.data?.message || 'Failed to fetch exam plan details',
        );
      }
    } catch (error) {
      console.error('Error fetching exam plan:', error);
      throw new Error('Failed to fetch exam plan details');
    }
  };

  // Fetch notes by subject
  const fetchNotesBySubject = async (id) => {
    try {
      const response = await AxiosHelper.getData(`/user/notes/subjects/${id}`);
      if (response?.data?.status) {
        setNotes(response.data.data || []);
      } else {
        throw new Error(response?.data?.message || 'Failed to fetch notes');
      }
    } catch (error) {
      console.error('Error fetching notes by subject:', error);
      throw new Error('Failed to fetch notes');
    }
  };

  // Fetch notes by subject and exam plan
  const fetchNotesBySubjectAndExamPlan = async (subjectId, examPlanId) => {
    try {
      const response = await AxiosHelper.getData(
        `/user/notes/subjects/${subjectId}/exam-plans/${examPlanId}`,
      );
      if (response?.data?.status) {
        setNotes(response.data.data || []);
      } else {
        throw new Error(response?.data?.message || 'Failed to fetch notes');
      }
    } catch (error) {
      console.error('Error fetching notes by subject and exam plan:', error);
      throw new Error('Failed to fetch notes');
    }
  };

  // Fetch exam plan data with subjects and notes
  const fetchExamPlanData = async (id) => {
    try {
      const response = await AxiosHelper.getData(
        `/user/exam-plans/${id}/subjects-notes`,
      );
      if (response?.data?.status) {
        setExamPlan(response.data.data.examPlan);
        setSubjects(response.data.data.subjects || []);

        // Auto-select the first subject if exists
        if (
          response.data.data.subjects &&
          response.data.data.subjects.length > 0
        ) {
          setSelectedSubject(response.data.data.subjects[0]);
          // Fetch notes for the selected subject
          await fetchNotesBySubjectAndExamPlan(
            response.data.data.subjects[0].subjectId,
            id,
          );
        } else {
          setNotes([]);
        }
      } else {
        throw new Error(
          response?.data?.message || 'Failed to fetch exam plan data',
        );
      }
    } catch (error) {
      console.error('Error fetching exam plan data:', error);
      throw new Error('Failed to fetch exam plan data');
    }
  };

  // Handle subject selection change
  const handleSubjectChange = async (subject) => {
    try {
      setSelectedSubject(subject);
      setLoading(true);
      await fetchNotesBySubjectAndExamPlan(subject.subjectId, examPlanId);
    } catch (error) {
      console.error('Error fetching notes for subject:', error);
      toast.error('Failed to load notes for this subject');
    } finally {
      setLoading(false);
    }
  };

  // Filter notes based on search
  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(search.toLowerCase()),
  );

  // Handle download attempt
  const handleDownload = async (note) => {
    try {
      if (note.hasAccess) {
        window.open(`/api/user/notes/${note._id}/download`, '_blank');
      } else {
        // If no access, redirect to exam plan purchase page
        if (
          note.accessType === 'LOCKED' &&
          examPlan &&
          !examPlan.hasPurchased
        ) {
          toast.info(
            `You need to purchase the ${
              note.examPlanId.title || examPlan.title
            } exam plan to access this note`,
          );
          // Navigate to exam plan purchase page
          window.location.href = `/payments/exam-plan/${
            note.examPlanId._id || examPlan._id
          }`;
        } else {
          toast.error("You don't have access to this note");
        }
      }
    } catch (error) {
      console.error('Error handling note download:', error);
      toast.error('Failed to process your request');
    }
  };

  // Group notes by exam plan (for subject view)
  const groupedNotes =
    subjectId && !examPlanId && notes.length > 0
      ? notes.reduce((acc, note) => {
          const examPlanId = note.examPlanId._id;
          if (!acc[examPlanId]) {
            acc[examPlanId] = {
              examPlan: note.examPlanId,
              notes: [],
            };
          }
          acc[examPlanId].notes.push(note);
          return acc;
        }, {})
      : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-blue-500 h-12 w-12 mx-auto mb-4" />
          <p className="text-gray-600">Loading notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center p-8 max-w-md bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/subjects"
            className="inline-block bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
          >
            Go to Subjects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center">
            <Link to={subjectId ? '/subjects' : '/exam-plans'} className="mr-3">
              <FaArrowLeft />
            </Link>
            <div>
              <h1 className="text-xl font-bold">
                {subjectId ? subject?.name : examPlan?.title} - Notes
              </h1>
              {examPlan && (
                <div className="text-sm flex items-center mt-1">
                  {examPlan.hasPurchased ? (
                    <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs">
                      Purchased
                    </span>
                  ) : (
                    <span className="bg-yellow-500 text-white px-2 py-0.5 rounded text-xs">
                      Not Purchased
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4">
        {/* Subject Tabs (for exam plan view) */}
        {examPlanId && subjects && subjects.length > 0 && (
          <div className="mb-6 overflow-x-auto">
            <div className="flex space-x-2 pb-2">
              {subjects.map((subject) => (
                <button
                  key={subject.subjectId}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium ${
                    selectedSubject?.subjectId === subject.subjectId
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  } shadow-sm`}
                  onClick={() => handleSubjectChange(subject)}
                >
                  {subject.subjectName}
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {subject.accessibleNotes}/{subject.totalNotes}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Bar */}
        {notes.length > 0 && (
          <div className="bg-white rounded-full shadow-md flex items-center p-2 mb-6">
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 outline-none"
            />
            <button className="bg-blue-500 text-white p-2 rounded-full">
              <FaSearch />
            </button>
          </div>
        )}

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <FaBookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No Notes Available
            </h3>
            <p className="text-gray-500">
              {search
                ? 'No notes match your search criteria.'
                : selectedSubject
                ? `There are no notes available for ${selectedSubject.subjectName} in this exam plan.`
                : 'There are no notes available yet.'}
            </p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <FaSearch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No Results Found
            </h3>
            <p className="text-gray-500">
              No notes match your search query. Try a different search term.
            </p>
          </div>
        ) : subjectId && !examPlanId ? (
          // Group by exam plan for subject view
          Object.values(groupedNotes).map((group) => (
            <div key={group.examPlan._id} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {group.examPlan.title}
                </h2>
                <Link
                  to={`/exam-plans/${group.examPlan._id}/notes`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All Notes
                </Link>
              </div>

              <div className="space-y-4">
                {group.notes.map((note, index) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    index={index}
                    handleDownload={handleDownload}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Regular list for exam plan view or subject+exam plan view
          <div className="space-y-4">
            {filteredNotes.map((note, index) => (
              <NoteCard
                key={note._id}
                note={note}
                index={index}
                handleDownload={handleDownload}
              />
            ))}
          </div>
        )}
      </div>

      {/* Purchase CTA for non-purchased exam plans */}
      {examPlan && !examPlan.hasPurchased && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 border-t border-gray-200">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">
                Unlock all premium notes
              </h3>
              <p className="text-sm text-gray-500">
                Purchase this exam plan to access all materials
              </p>
            </div>
            <Link
              to={`/payments/exam-plan/${examPlanId}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Purchase Now
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

// Note Card Component (extracted for reuse)
const NoteCard = ({ note, index, handleDownload }) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${
        note.hasAccess
          ? note.accessType === 'FREE'
            ? 'border-green-400'
            : 'border-blue-400'
          : 'border-gray-300'
      }`}
    >
      <div className="flex p-5">
        <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold mr-4">
          {note.sequence > 0 ? note.sequence : index + 1}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-1 pr-20">
            {note.title}
          </h3>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <span className="flex items-center space-x-2">
              <FaTag className="text-gray-400" />
              <span>
                {note.accessType === 'FREE' && 'Free Access'}
                {note.accessType === 'PURCHASED' && 'Purchased Access'}
                {note.accessType === 'LOCKED' && 'Requires Purchase'}
              </span>
            </span>
          </div>
          {note.description && (
            <div
              className="text-sm text-gray-600 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: note.description }}
            ></div>
          )}
        </div>
        <div className="flex flex-col items-end justify-between ml-4">
          <div className="flex space-x-1">
            {note.accessType === 'FREE' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Free
              </span>
            )}
            {note.accessType === 'PURCHASED' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Premium
              </span>
            )}
            {note.accessType === 'LOCKED' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Locked
              </span>
            )}
          </div>
          <button
            onClick={() => handleDownload(note)}
            className={`flex items-center px-3 py-1.5 rounded text-sm mt-2 ${
              note.hasAccess
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-600 cursor-not-allowed'
            }`}
          >
            {note.hasAccess ? (
              <>
                <FaDownload className="mr-2" /> Download
              </>
            ) : (
              <>
                <FaLock className="mr-2" /> Locked
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Notes Component that renders either admin or user view
const Notes = () => {
  // const { role } = JSON.parse(localStorage.getItem("user") || '{"role":"user"}')

  return (
    <>
      <AdminNotes />
      {/* <UserNotes /> */}
    </>
  );
};

export default Notes;
