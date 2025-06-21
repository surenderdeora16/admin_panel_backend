// 'use client';

// import { useState, useEffect } from 'react';
// import * as Yup from 'yup';
// import { STATUS } from '../../constant/constant';
// import AxiosHelper from '../../helper/AxiosHelper';
// import DataManager from '../../components/DataManager';
// import { useParams, useNavigate } from 'react-router-dom';
// import { toast } from 'react-toastify';

// // Custom hook to fetch exam plans
// const useExamPlans = () => {
//   const [examPlans, setExamPlans] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchExamPlans = async () => {
//       try {
//         setLoading(true);
//         const response = await AxiosHelper.getData('/exam-plans', {
//           limit: 100,
//           pageNo: 1,
//           orderBy: 'title',
//           orderDirection: 'asc',
//         });

//         if (response?.data?.status) {
//           const examPlanOptions = response.data.data.record.map((plan) => ({
//             id: plan._id,
//             name: `${plan.title}${
//               plan.examPlanId?.name ? ` (${plan.examPlanId.name})` : ''
//             } - ₹${plan.price}`,
//           }));
//           setExamPlans(examPlanOptions);
//         } else {
//           throw new Error(
//             response?.data?.message || 'Failed to fetch exam plans',
//           );
//         }
//       } catch (error) {
//         console.error('Failed to fetch exam plans:', error);
//         setError(error.message || 'Could not load exam plans');
//         setExamPlans([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchExamPlans();
//   }, []);

//   return { examPlans, loading, error };
// };

// const Notes = () => {
//   const { examPlanId } = useParams();
//   const [modalType, setModalType] = useState('');
//   const [examPlanName, setExamPlanName] = useState('');
//   const [preExamPlanId, setPreExamPlanId] = useState<any>('');
//   const [initialFormValues, setInitialFormValues] = useState<any>('');

//   const {
//     examPlans,
//     loading: examPlansLoading,
//     error: examPlansError,
//   } = useExamPlans();

//   // Fetch exam plan name if examPlanId is provided
//   useEffect(() => {
//     if (examPlanId) {
//       const fetchExamPlanName = async () => {
//         try {
//           const response = await AxiosHelper.getData(
//             `/exam-plans/${examPlanId}`,
//           );
//           if (response?.data?.status) {
//             setExamPlanName(response.data.data.title);
//           } else {
//             toast.error(
//               response?.data?.message || 'Failed to fetch exam plan details',
//             );
//           }
//         } catch (error) {
//           console.error('Error fetching exam plan:', error);
//           toast.error('Failed to fetch exam plan details');
//         }
//       };
//       fetchExamPlanName();
//     }
//   }, [examPlanId]);

//   // Determine title based on context
//   const title = examPlanId ? `${examPlanName} - Notes` : 'Notes Management';
//   const itemName = 'Note';

//   // Set up API endpoints
//   const endpoints = {
//     list: examPlanId ? `/exam-plans/${examPlanId}/notes` : '/notes',
//     create: '/notes',
//     update: (id: any) => `/notes/${id}`,
//     delete: (id: any) => `/notes/${id}`,
//   };

//   // Form validation schema
//   const validationSchema = Yup.object().shape({
//     title: Yup.string()
//       .required('Title is required')
//       .min(3, 'Title must be at least 3 characters')
//       .max(200, 'Title cannot exceed 200 characters'),
//     examPlanId: Yup.string().required('Exam Plan is required'),
//     pdfFile: Yup.mixed().when('_', {
//       is: () => modalType === 'add',
//       then: () => Yup.mixed().required('PDF file is required'),
//       otherwise: () => Yup.mixed(),
//     }),
//     // thumbnailImage: Yup.mixed(),
//     isFree: Yup.boolean(),
//     sequence: Yup.number()
//       .min(0, 'Sequence cannot be negative')
//       .integer('Sequence must be a whole number'),
//     status: Yup.boolean(),
//   });

//   // Form fields configuration
//   const formFields = [
//     {
//       label: 'Title',
//       name: 'title',
//       type: 'text',
//       col: 12,
//       placeholder: 'Enter note title',
//     },
//     {
//       label: 'Description',
//       name: 'description',
//       type: 'text-editer',
//       col: 12,
//       placeholder: 'Enter note description',
//     },
//     {
//       label: 'Exam Plan',
//       name: 'examPlanId',
//       type: 'select2',
//       options: [{ id: '', name: 'Select Exam Plan' }, ...examPlans],
//       disabled: !!examPlanId || examPlansLoading || !!examPlansError,
//       col: 12,
//     },
//     {
//       label: 'PDF File',
//       name: 'pdfFile',
//       type: 'file',
//       accept: '.pdf',
//       col: 12,
//       helperText: 'Upload PDF file (max 10MB)',
//     },
//     // {
//     //   label: "Thumbnail Image",
//     //   name: "thumbnailImage",
//     //   type: "image-file",
//     //   col: 12,
//     //   helperText: "Upload thumbnail image (optional)",
//     // },
//     {
//       label: 'Is Free',
//       name: 'isFree',
//       type: 'check',
//       col: 6,
//       helperText: 'Free notes are accessible without exam plan purchase',
//     },
//     // {
//     //   label: "Sequence",
//     //   name: "sequence",
//     //   type: "number",
//     //   min: 0,
//     //   col: 6,
//     //   helperText: "Display order (lower numbers appear first)",
//     // },
//     {
//       label: 'Status',
//       name: 'status',
//       type: 'select2',
//       options: STATUS,
//       col: 6,
//     },
//   ];

//   // Table columns configuration
//   const tableColumns = [
//     { header: 'Title', accessor: 'title', sortable: true },
//     ...(examPlanId
//       ? []
//       : [
//           {
//             header: 'Exam Plan',
//             accessor: 'examPlanId',
//             render: (value) => value?.title || 'N/A',
//           },
//         ]),
//     {
//       header: 'Access Type',
//       accessor: 'isFree',
//       render: (value) => (value ? 'Free' : 'Paid (Requires Exam Plan)'),
//     },
//     // { header: "Sequence", accessor: "sequence" },
//     {
//       header: 'Status',
//       accessor: 'status',
//       render: (value) => (value ? 'Active' : 'Inactive'),
//       sortable: true,
//     },
//   ];

//   useEffect(() => {
//     if (preExamPlanId) {
//       console.log('preExamPlanId++++++', preExamPlanId);
//       setPreExamPlanId(preExamPlanId?.examPlanId?._id);
//     }
//   }, [preExamPlanId]);

//   console.log('examPlanId>>>>', examPlanId);
//   // Initial form values
//   const initialFormValues = {
//     title: '',
//     description: '',
//     examPlanId: preExamPlanId || '',
//     pdfFile: null,
//     thumbnailImage: null,
//     isFree: false,
//     sequence: 0,
//     status: true,
//   };

//   // Custom render actions to add Preview button
//   const renderActions = (item) => {
//     return (
//       <button
//         onClick={() => window.open(`/api${item.pdfFile}`, '_blank')}
//         className="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
//       >
//         Preview
//       </button>
//     );
//   };

//   // Handle loading states
//   if (examPlansLoading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
//         <span className="ml-2">Loading resources...</span>
//       </div>
//     );
//   }

//   // Handle error states
//   if (examPlansError) {
//     return (
//       <div
//         className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
//         role="alert"
//       >
//         <strong className="font-bold">Error: </strong>
//         <span className="block sm:inline">
//           {examPlansError}. Please refresh the page or contact support.
//         </span>
//       </div>
//     );
//   }

//   return (
//     <DataManager
//       title={title}
//       itemName={itemName}
//       setModalType={setModalType}
//       endpoints={endpoints}
//       validationSchema={validationSchema}
//       formFields={formFields}
//       tableColumns={tableColumns}
//       initialFormValues={initialFormValues}
//       showPagination={true}
//       showAdd={true}
//       showEdit={true}
//       showDelete={true}
//       multipartFormData={true}
//       onEditButton={(value) => {
//         console.log('value>>>>>>> insice', value);
//         setPreExamPlanId(value);
//       }}
//       // renderActions={renderActions}
//       // queryParams={examPlanId ? { examPlanId } : {}}
//     />
//   );
// };

// export default Notes;

'use client';

import { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { STATUS } from '../../constant/constant';
import AxiosHelper from '../../helper/AxiosHelper';
import DataManager from '../../components/DataManager';
import { useParams, useNavigate } from 'react-router-dom';
import Status from '../../helper/Status';

// Custom hook to fetch examplan
const useExamPlan = () => {
  const [examplan, setExamplan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExamPlan = async () => {
      try {
        setLoading(true);
        const response = await AxiosHelper.getData('/exam-plans', {
          limit: 200,
          pageNo: 1,
          orderBy: 'title',
          orderDirection: 'asc',
        });
        const examPlanOptions = response.data.data.record.map((plan: any) => ({
          id: plan._id,
          name: plan.title,
        }));
        setExamplan(examPlanOptions);
      } catch (error) {
        console.error('Failed to fetch examplan:', error);
        setError('Could not load examplan');
        setExamplan([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExamPlan();
  }, []);

  return { examplan, loading, error };
};

const Notes = () => {
  const { examPlanId } = useParams();
  const navigate = useNavigate();
  const [modalType, setModalType] = useState<'add' | 'edit' | ''>('');
  const [examPlanName, setExamPlanName] = useState('');
  const [preExamPlanId, setPreExamPlanId] = useState<any>('');
  const [editData, setEditData] = useState<any>();

  const {
    examplan,
    loading: examplanLoading,
    error: examplanError,
  } = useExamPlan();

  useEffect(() => {
    if (examPlanId) {
      const fetchExamplanName = async () => {
        try {
          const response = await AxiosHelper.getData(
            `/exam-plans/${examPlanId}`,
          );
          if (response?.data?.status) {
            setExamPlanName(response.data.data.title);
          }
        } catch (error) {
          console.error('Error fetching batch:', error);
        }
      };
      fetchExamplanName();
    }
  }, [examPlanId]);

  const title = examPlanId ? `${examPlanName} - Notes` : 'Notes Management';
  const itemName = 'Notes';

  const endpoints = {
    list: examPlanId ? `/exam-plans/${examPlanId}/notes` : '/notes',
    create: '/notes',
    update: (id: string) => `/notes/${id}`,
    delete: (id: string) => `/notes/${id}`,
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string()
      .required('Title is required')
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title cannot exceed 200 characters'),
    // examPlanId: Yup.string().required("notes is required"),
    // price: Yup.number()
    //   .min(0, "Price cannot be negative")
    //   .when("isFree", {
    //     is: false,
    //     then: Yup.number().required("Price is required"),
    //   }),
    // mrp: Yup.number()
    //   .min(0, "MRP cannot be negative")
    //   .when("isFree", {
    //     is: false,
    //     then: Yup.number().required("MRP is required"),
    //   }),
    // validityDays: Yup.number()
    //   .required("Validity days is required")
    //   .min(1, "Validity must be at least 1 day")
    //   .integer("Validity days must be a whole number"),
    // image: Yup.mixed(),
    // sequence: Yup.number().min(0, "Sequence cannot be negative").integer("Sequence must be a whole number"),
    // status: Yup.boolean(),
  });

  const formFields = [
    {
      label: 'Title',
      name: 'title',
      type: 'text',
      col: 12,
    },
    // {
    //   label: 'Description',
    //   name: 'description',
    //   type: 'text-editer',
    //   col: 12,
    // },
    {
      label: 'Exam Plan',
      name: 'examPlanId',
      type: 'select2',
      options: [{ id: '', name: 'Select Exam plan' }, ...examplan],
      disabled: !!examPlanId || examplanLoading || !!examplanError,
      col: 12,
    },
    {
      label: 'PDF File',
      name: 'pdfFile',
      type: 'file',
      accept: '.pdf',
      col: 12,
    },
    // {
    //     //   label: "Thumbnail Image",
    //     //   name: "thumbnailImage",
    //     //   type: "image-file",
    //     //   col: 12,
    //     //   helperText: "Upload thumbnail image (optional)",
    //     // },
    {
      label: 'Is Free',
      name: 'isFree',
      type: 'check',
      col: 6,
    },

    // {
    //   label: 'Status',
    //   name: 'status',
    //   type: 'select2',
    //   options: STATUS,
    //   col: 6,
    // },
  ];

  const tableColumns = [
    { header: 'Title', accessor: 'title', sortable: true },
    ...(examPlanId
      ? []
      : [
          {
            header: 'Exam Plan',
            accessor: 'examPlanId',
            render: (value: any) => value?.title || 'N/A',
          },
        ]),
    {
      header: 'Access Type',
      accessor: 'isFree',
      render: (value: any) => (value ? 'Free' : 'Paid (Requires Exam Plan)'),
    },
    // { header: "Sequence", accessor: "sequence" },
    {
      header: 'Status',
      accessor: 'status',
      render: (value: any, item: any) => (
        <Status table="notes" status={value} data_id={item._id} />
      ),
    },
  ];

  useEffect(() => {
    if (preExamPlanId) {
      console.log('preExamPlanId++++++', preExamPlanId);
      setPreExamPlanId(preExamPlanId?.examPlanId?._id);
    }
  }, [preExamPlanId]);

  const initialFormValues = {
    title: '',
    description: '',
    examPlanId: preExamPlanId || '',
    pdfFile: null,
    thumbnailImage: null,
    isFree: editData?.isFree,
    sequence: 0,
    // status: editData?.status || '',
  };

  // // Custom render actions to add View Test Series button
  // const renderActions = (item: any) => {
  //   return (
  //     <button
  //       onClick={() => navigate(`/test-series/${item._id}`)}
  //       className="cursor-pointer bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700"
  //     >
  //       View Test Series
  //     </button>
  //   );
  // };

  if (examplanLoading) return <div>Loading notes...</div>;
  // if (examplanError) return <div>{examplanError}</div>;

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
      onEditButton={(value) => {
        console.log('value>>>>>>> insice', value);
        setEditData(value);
        setPreExamPlanId(value);
      }}
      // renderActions={renderActions}
    />
  );
};

export default Notes;
