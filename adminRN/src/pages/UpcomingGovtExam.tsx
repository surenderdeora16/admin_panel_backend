import DataManager from '../components/DataManager';
import { STATUS } from '../constant/constant';
import * as Yup from 'yup';
import Status from '../helper/Status';
import { useState } from 'react';

const upcomingExamValidation = Yup.object().shape({
  title: Yup.string()
    .required('Exam title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: Yup.string().optional(),
  examDate: Yup.date().optional().typeError('Invalid date format. Use YYYY-MM-DD'),
  status: Yup.boolean().required('Status is required'),
  image: Yup.mixed().optional(),
});

const formFields = [
  { label: 'Exam Title', name: 'title', type: 'text', col: 12 },
  { label: 'Exam Description', name: 'description', type: 'text-editer', col: 12 },
  { label: 'Exam Date', name: 'examDate', type: 'date', col: 6 },
  { label: 'Status', name: 'status', type: 'select2', options: STATUS, col: 6 },
  { label: 'Image', name: 'image', type: 'image-file', col: 12 },
];

const tableColumns = [
  {
    header: 'Image',
    accessor: 'image',
    render: (value: any) => (
      <div className="w-[150px] h-[110px] overflow-hidden rounded-lg shadow-3">
        <img src={value} alt="" className="w-full h-full object-cover object-center" />
      </div>
    ),
  },
  { header: 'Exam Title', accessor: 'title', sortable: true },
  {
    header: 'Exam Description',
    accessor: 'description',
    render: (value: any) => (
      <div
        className="max-w-[400px] max-h-[135px] text-ellipsis overflow-hidden bg-white shadow-3 p-3 rounded-lg line-clamp-5"
        title={value.replace(/<[^>]*>?/gm, '')}
      >
        {value.replace(/<[^>]*>?/gm, '')}
      </div>
    ),
  },
  {
    header: 'Exam Date',
    accessor: 'examDate',
    sortable: true,
    render: (value: any) =>
      new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
  },
  {
    header: 'Status',
    accessor: 'status',
    render: (value: any, item: any) => (
      <Status table="upcominggovtexams" status={value} data_id={item._id} />
    ),
  },
];

const initialFormValues = {
  title: '',
  description: '',
  examDate: '',
  status: true,
  image: null,
};

const UpcomingGovtExam = () => {
    const [uploadProgress, setUploadProgress] = useState<any>(0);
  
  return (
    <DataManager
      title="Upcoming Government Exams"
      itemName="Exam"
      endpoints={{
        list: 'list-upcoming-govt-exam',
        create: 'create-upcoming-govt-exam',
        update: (id:any) => `update-upcoming-govt-exam/${id}`,
      }}
      multipartFormData={{
        onUploadProgress: (progressEvent: any) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      }}
      uploadProgress={uploadProgress}
      validationSchema={upcomingExamValidation}
      formFields={formFields}
      tableColumns={tableColumns}
      initialFormValues={initialFormValues}
      showPagination={true} 
      showAdd={true}         
      showEdit={true}        
      showDelete={false}     
    />
  );
};
export default UpcomingGovtExam;




// import { useEffect, useState, useCallback } from 'react';
// import * as Yup from 'yup';
// import { toast } from 'react-toastify';
// import MyForm from '../helper/MyForm';
// import {
//   ArrowUpIcon,
//   ArrowDownIcon,
//   XMarkIcon,
//   MagnifyingGlassIcon,
//   PlusIcon,
// } from '@heroicons/react/24/solid'; // Corrected import
// import { motion, AnimatePresence } from 'framer-motion';
// import { debounce, values } from 'lodash';
// import AxiosHelper from '../helper/AxiosHelper';
// import { STATUS } from '../constant/constant';
// import Status from '../helper/Status';

// interface Pagination {
//   currentPage: number;
//   totalPages: number;
//   totalItems: number;
//   limit: number;
// }

// const UpcomingGovtExam = () => {
//   const [upcomingGovtExam, setUpcomingGovtExam] = useState<any>([]);
//   const [pagination, setPagination] = useState<Pagination>({
//     currentPage: 1,
//     totalPages: 1,
//     totalItems: 0,
//     limit: 10,
//   });
//   const [orderBy, setOrderBy] = useState<string>('name');
//   const [orderDirection, setOrderDirection] = useState<number>(-1);
//   const [searchQuery, setSearchQuery] = useState<string>('');
//   const [loading, setLoading] = useState<boolean>(false);
//   const [showModal, setShowModal] = useState<boolean>(false);
//   const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
//   const [selectedGovtExam, setSelectedGovtExam] = useState<any>(null);
//   const [uploadProgress, setUploadProgress] = useState<any>(0);
//   const [error, setError] = useState<string | null>(null);
//   const upcomingExamValidation = Yup.object().shape({
//     title: Yup.string()
//       .required('Exam title is required')
//       .max(200, 'Title must be less than 200 characters'),
//     description: Yup.string().optional(),
//     examDate: Yup.date()
//       .optional()
//       .typeError('Invalid date format. Use YYYY-MM-DD'),
//     status: Yup.boolean().required('Status is required'),
//     image: Yup.mixed().optional(),
//   });

//   console.log('selectedGovtExam>>', selectedGovtExam);
//   const fields = [
//     { label: 'Exam Title', name: 'title', type: 'text', col: 12 },
//     {
//       label: 'Exam Description',
//       name: 'description',
//       type: 'text-editer',
//       col: 12,
//     },
//     {
//       label: 'Exam Date',
//       name: 'examDate',
//       // value: {modalMode === 'add' ? ``: `${selectedGovtExam?.examDate}},
//       // value: selectedGovtExam?.examDate,
//       type: 'date',
//       col: 6,
//     },
//     {
//       label: 'Status',
//       name: 'status',
//       type: 'select2',
//       options: STATUS,
//       col: 6,
//     },
//     { label: 'Image', name: 'image', type: 'image-file', col: 12 },
//     {
//       label: modalMode === 'add' ? 'Add Upcoming Exam' : 'Update Upcoming Exam',
//       name: 'submit',
//       type: 'submit',
//     },
//   ];

//   const fetchUpcomigExam = useCallback(
//     debounce(async (params: any) => {
//       try {
//         setLoading(true);
//         setError(null);
//         const paramsData = {
//           pageNo: params.pageNo,
//           limit: params.limit,
//           query: params.query,
//           orderBy: params.orderBy,
//           orderDirection: params.orderDirection,
//         };
//         const response = await AxiosHelper.getData(
//           'list-upcoming-govt-exam',
//           paramsData,
//         );

//         if (response?.data?.data) {
//           setUpcomingGovtExam(response?.data?.data?.record || []);
//           setPagination({
//             currentPage: response?.data?.data?.current_page || 1,
//             totalPages: response?.data?.data?.totalPages || 1,
//             totalItems: response?.data?.data?.count || 0,
//             limit: response?.data?.data?.limit || 10,
//           });
//         } else if (response?.status === 404) {
//           setUpcomingGovtExam([]);
//           setPagination({
//             currentPage: 1,
//             totalPages: 1,
//             totalItems: 0,
//             limit: params.limit,
//           });
//         }
//       } catch (err: any) {
//         if (err.response?.status !== 404) {
//           const errorMessage =
//             err.response?.data?.message ||
//             'Failed to fetch Upcoming Government Exam';
//           setError(errorMessage);
//           toast.error(errorMessage);
//         }
//         setUpcomingGovtExam([]);
//       } finally {
//         setLoading(false);
//       }
//     }, 300),
//     [],
//   );

//   useEffect(() => {
//     fetchUpcomigExam({
//       pageNo: pagination.currentPage,
//       limit: pagination.limit,
//       query: searchQuery,
//       orderBy,
//       orderDirection,
//     });
//   }, [
//     pagination.currentPage,
//     pagination.limit,
//     orderBy,
//     orderDirection,
//     searchQuery,
//     fetchUpcomigExam,
//   ]);

//   const handleSort = (column: string) => {
//     if (orderBy === column) {
//       setOrderDirection((prev) => (prev === 1 ? -1 : 1));
//     } else {
//       setOrderBy(column);
//       setOrderDirection(1);
//     }
//   };

//   const handleFormSubmit = async (values: { name: string; code: string }) => {
//     try {
//       if (modalMode === 'add') {
//         const response = await AxiosHelper.postData(
//           'create-upcoming-govt-exam',
//           values,
//           true,
//           {
//             onUploadProgress: (progressEvent: any) => {
//               const percentCompleted = Math.round(
//                 (progressEvent.loaded * 100) / progressEvent.total,
//               );
//               setUploadProgress(percentCompleted);
//             },
//           },
//         );
//         if (!response?.data?.status) {
//           setUploadProgress(0);
//           throw new Error(
//             response?.data?.message || 'Failed to add Upcoming Government Exam',
//           );
//         }
//         toast.success('Upcoming Exam added successfully');
//         setUploadProgress(0);
//       } else if (modalMode === 'edit' && selectedGovtExam) {
//         const response = await AxiosHelper.putData(
//           `update-upcoming-govt-exam/${selectedGovtExam._id}`,
//           values,
//           true,
//           {
//             onUploadProgress: (progressEvent: any) => {
//               const percentCompleted = Math.round(
//                 (progressEvent.loaded * 100) / progressEvent.total,
//               );
//               setUploadProgress(percentCompleted);
//             },
//           },
//         );
//         if (!response?.data?.status) {
//           setUploadProgress(0);
//           throw new Error(
//             response?.data?.message ||
//               'Failed to update Upcoming Government Exam',
//           );
//         }
//         toast.success('Upcoming Government Exam updated successfully');
//         setUploadProgress(0);
//       }
//       fetchUpcomigExam({
//         pageNo: pagination.currentPage,
//         limit: pagination.limit,
//         query: searchQuery,
//         orderBy,
//         orderDirection,
//       });
//       setShowModal(false);
//     } catch (err: any) {
//       const errorMessage =
//         err.response?.data?.message ||
//         `Failed to ${modalMode} Upcoming Government Exam`;
//       toast.error(errorMessage);
//     }
//   };

//   const SkeletonLoader = () => (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       className="space-y-4 p-6"
//     >
//       {[...Array(pagination.limit)].map((_, i) => (
//         <div
//           key={i}
//           className="h-16 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl animate-pulse"
//         >
//           <div className="h-full flex items-center px-6">
//             <div className="flex-1 space-y-2">
//               <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-48"></div>
//               <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
//             </div>
//             <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
//           </div>
//         </div>
//       ))}
//     </motion.div>
//   );

//   const ModalContent = () => {
//     const initialValues =
//       modalMode === 'add'
//         ? {
//             title: '',
//             description: '',
//             examDate: '',
//             status: true,
//             image: null,
//           }
//         : selectedGovtExam
//         ? {
//             title: selectedGovtExam.title || '',
//             description: selectedGovtExam.description || '',
//             examDate: selectedGovtExam.examDate || '',
//             status: selectedGovtExam.status || true,
//             image: selectedGovtExam?.image,
//           }
//         : {
//             title: '',
//             description: '',
//             examDate: '',
//             status: true,
//             image: null,
//           };

//     return (
//       <motion.div
//         initial={{ scale: 0.95, opacity: 0 }}
//         animate={{ scale: 1, opacity: 1 }}
//         exit={{ scale: 0.95, opacity: 0 }}
//         className="relative w-full max-w-[97%] md:max-w-[80%] max-h-[90vh] bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-y-auto"
//       >
//         <div className="w-full">
//           <div className="relative px-4 md:px-6 py-4 border-b border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
//             <div className="flex items-center justify-between">
//               <h2 className="text-[26px] font-bold text-gray-900/85 dark:text-white">
//                 {modalMode === 'add'
//                   ? 'Add Upcoming Government Exam'
//                   : 'Update Upcoming Government Exam'}
//               </h2>
//               <button
//                 onClick={() => setShowModal(false)}
//                 className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
//               >
//                 <XMarkIcon className="w-6 h-6" />
//               </button>
//             </div>
//           </div>

//           <div className="px-4 md:px-6 pt-4 pb-6 space-y-7 overflow-hidden">
//             <MyForm
//               fields={fields}
//               initialValues={initialValues}
//               validSchema={upcomingExamValidation}
//               onSubmit={handleFormSubmit}
//               isReset={true}
//             />
//           </div>
//         </div>
//       </motion.div>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-10">
//       <div className="max-w-full mx-auto space-y-8">
//         <motion.div
//           initial={{ y: -20, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           className="flex items-center justify-between"
//         >
//           <div>
//             <h1 className="text-4xl font-bold text-gray-900/90 dark:text-white mb-2">
//               Upcoming Government Exam
//             </h1>
//           </div>
//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={() => {
//               setModalMode('add');
//               setSelectedGovtExam(null);
//               setShowModal(true);
//             }}
//             className="bg-sky-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl"
//           >
//             <PlusIcon className="w-6 h-6 relative right-1" />
//             Add Upcoming Govt Exam
//           </motion.button>
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           className="bg-white dark:bg-gray-800 rounded-3xl drop-shadow-2xl overflow-hidden"
//         >
//           <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-gray-200/70 dark:bg-[#212d3b]">
//             <div className="flex items-center justify-between">
//               <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
//                 {pagination.totalItems} Upcoming Exam
//               </h3>
//               <div className="flex items-center gap-4">
//                 <div className="relative">
//                   <input
//                     type="text"
//                     placeholder="Search"
//                     className="w-64 px-6 py-3 rounded-xl bg-gray-50 placeholder:text-gray-700 text-gray-800 placeholder:dark:text-gray-400 dark:text-gray-50 dark:bg-form-input border border-gray-200 dark:border-gray-600 outline-none pr-12"
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                   />
//                   <MagnifyingGlassIcon className="w-5 h-5 absolute right-4 top-4 text-gray-400 dark:text-gray-500" />
//                 </div>
//                 <div className="px-1.5 rounded-xl bg-white dark:bg-form-input border border-stroke dark:border-strokedark">
//                   <select
//                     value={pagination.limit}
//                     onChange={(e) =>
//                       setPagination((prev) => ({
//                         ...prev,
//                         limit: Number(e.target.value),
//                         currentPage: 1,
//                       }))
//                     }
//                     className="py-3 rounded-xl bg-white dark:bg-form-input outline-none"
//                   >
//                     {[10, 25, 50, 100].map((opt) => (
//                       <option key={opt} value={opt} className="dark:bg-boxdark">
//                         {opt} per page
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {error ? (
//             <div className="p-8 text-center text-red-500 dark:text-red-400 text-lg">
//               ⚠️ {error}
//             </div>
//           ) : upcomingGovtExam.length === 0 ? (
//             <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-lg">
//               {loading ? (
//                 <SkeletonLoader />
//               ) : (
//                 <div>
//                   {' '}
//                   No record found{' '}
//                   {searchQuery ? (
//                     <>
//                       for "<b>{searchQuery}</b>"
//                     </>
//                   ) : (
//                     ``
//                   )}
//                 </div>
//               )}
//             </div>
//           ) : (
//             <>
//               <table className="w-full">
//                 <thead className="bg-gray-200/70 dark:bg-gray-900">
//                   <tr>
//                     {[
//                       'Sr No.',
//                       'Image',
//                       'Exam Title',
//                       'Exam Description',
//                       'Exam Date',
//                       'Status',
//                       'Actions',
//                     ].map((header, idx) => (
//                       <th
//                         key={header}
//                         className={`px-8 py-6 text-nowrap text-left text-sm font-semibold dark:bg-[#24303f] text-gray-600 dark:text-gray-400 ${
//                           (header === 'Exam Title' || header === 'Exam Date') &&
//                           'cursor-pointer hover:bg-gray-200/35 dark:hover:bg-[#24303ff4]'
//                         }`}
//                         onClick={() =>
//                           (header === 'Exam Title' || header === 'Exam Date') &&
//                           handleSort(
//                             header == 'Exam Title' ? 'title' : 'examDate',
//                           )
//                         }
//                       >
//                         <div className="flex items-center gap-2">
//                           {header}
//                           {(header === 'Exam Title' ||
//                             header === 'Exam Date') && (
//                             <div className="flex flex-col">
//                               <ArrowUpIcon
//                                 className={`w-4 h-4 mb-[-2px] ${
//                                   orderBy ===
//                                     (header === 'Exam Title'
//                                       ? 'title'
//                                       : 'examDate') && orderDirection === 1
//                                     ? 'text-sky-500'
//                                     : 'text-gray-300 dark:text-gray-600'
//                                 }`}
//                               />
//                               <ArrowDownIcon
//                                 className={`w-4 h-4 ${
//                                   orderBy ===
//                                     (header === 'Exam Title'
//                                       ? 'title'
//                                       : 'examDate') && orderDirection === -1
//                                     ? 'text-sky-500'
//                                     : 'text-gray-300 dark:text-gray-600'
//                                 }`}
//                               />
//                             </div>
//                           )}
//                         </div>
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
//                   {loading ? (
//                     <tr>
//                       <td colSpan={5}>
//                         <SkeletonLoader />
//                       </td>
//                     </tr>
//                   ) : (
//                     upcomingGovtExam.map((exam: any, index: number) => (
//                       <tr
//                         key={exam._id}
//                         className="hover:bg-gray-100/50 dark:hover:bg-gray-900/10 transition-colors"
//                       >
//                         <td className="px-8 py-6 font-medium text-gray-900 dark:text-white">
//                           {index < 9 ? '0' : ''}
//                           {index + 1}
//                         </td>
//                         <td className="px-8 py-6 font-medium text-gray-900 dark:text-white">
//                           <div className="w-[150px] h-[110px] overflow-hidden rounded-lg shadow-3">
//                             <img
//                               src={exam?.image}
//                               alt={exam?.title}
//                               className="w-full h-full object-cover object-center"
//                             />
//                           </div>
//                         </td>
//                         <td className="px-8 py-6 font-medium text-gray-900 dark:text-white">
//                           <div className="max-w-[300px] line-clamp-4 text-ellipsis overflow-hidden ">
//                             {exam.title}
//                           </div>
//                         </td>
//                         <td className="px-8 py-6 font-medium text-gray-900 dark:text-white">
//                           <div
//                             className="max-w-[400px] max-h-[135px] overflow-hidden bg-white shadow-3 p-3 rounded-lg
//                line-clamp-5 [display:-webkit-box] [-webkit-box-orient:vertical] 
//                [-webkit-line-clamp:5]  break-words"
//                             title={exam.description.replace(/<[^>]*>?/gm, '')}
//                           >
//                             {exam.description.replace(/<[^>]*>?/gm, '')}
//                           </div>
//                         </td>
//                         <td className="px-8 py-6 text-nowrap font-medium text-gray-900 dark:text-white">
//                           {new Date(exam.examDate).toLocaleDateString('en-US', {
//                             year: 'numeric',
//                             month: 'long',
//                             day: 'numeric',
//                           })}
//                         </td>
//                         <td className="px-8 py-6 font-medium text-gray-900 dark:text-white">
//                           <Status
//                             table="upcominggovtexams"
//                             status={exam?.status}
//                             data_id={exam?._id}
//                           />
//                         </td>
//                         <td className="px-8 py-6">
//                           <div className="flex items-center gap-4">
//                             <motion.button
//                               whileHover={{ scale: 1.1 }}
//                               whileTap={{ scale: 0.9 }}
//                               onClick={() => {
//                                 setModalMode('edit');
//                                 setSelectedGovtExam(exam);
//                                 setShowModal(true);
//                               }}
//                               className="text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 p-2 rounded-lg transition-colors"
//                             >
//                               Edit
//                             </motion.button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>

//               <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-700">
//                 <div className="flex items-center justify-between">
//                   <div className="text-sm text-gray-500 dark:text-gray-400">
//                     Page {pagination.currentPage} of {pagination.totalPages}
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <motion.button
//                       whileHover={{ scale: 1.05 }}
//                       whileTap={{ scale: 0.95 }}
//                       onClick={() =>
//                         setPagination((prev) => ({
//                           ...prev,
//                           currentPage: prev.currentPage - 1,
//                         }))
//                       }
//                       disabled={pagination.currentPage === 1}
//                       className="px-6 py-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
//                     >
//                       Previous
//                     </motion.button>
//                     <motion.button
//                       whileHover={{ scale: 1.05 }}
//                       whileTap={{ scale: 0.95 }}
//                       onClick={() =>
//                         setPagination((prev) => ({
//                           ...prev,
//                           currentPage: prev.currentPage + 1,
//                         }))
//                       }
//                       disabled={
//                         pagination.currentPage === pagination.totalPages
//                       }
//                       className="px-6 py-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
//                     >
//                       Next
//                     </motion.button>
//                   </div>
//                 </div>
//               </div>
//             </>
//           )}
//         </motion.div>
//       </div>

//       <AnimatePresence>
//         {showModal && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             style={{ zIndex: '214748364' }}
//             className=" fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
//           >
//             <ModalContent />
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default UpcomingGovtExam;
