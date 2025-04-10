import DataManager from '../../../components/DataManager';
import { STATUS } from '../../../constant/constant';
import * as Yup from 'yup';
import Status from '../../../helper/Status';

// Validation Schemas based on backend
const subjectValidation = Yup.object().shape({
  name: Yup.string()
    .required('Subject name is required')
    .min(2, 'Subject name should be at least 2 characters')
    .max(100, 'Subject name cannot exceed 100 characters'),
  description: Yup.string()
    .optional()
    .max(500, 'Description cannot exceed 500 characters'),
  status: Yup.boolean().required('Status is required'),
});

// Form Fields
const formFields = [
  { label: 'Subject Name', name: 'name', type: 'text', col: 12 },
  { label: 'Description', name: 'description', type: 'text-editer', col: 12 },
  {
    label: 'Status',
    name: 'status',
    type: 'select',
    options: STATUS,
    col: 12,
  },
];

// Table Columns
const tableColumns = [
  { header: 'Subject Name', accessor: 'name', sortable: true },
  {
    header: 'Description',
    accessor: 'description',
    render: (value: string) => (
      <div className="max-w-[400px] max-h-[135px] overflow-hidden bg-white shadow-3 p-3 rounded-lg line-clamp-5 text-ellipsis" title={value}>
        <span dangerouslySetInnerHTML={{ __html: value || '-' }} />
      </div>
    ),
  },
  {
    header: 'Status',
    accessor: 'status',
    render: (value: any, item: any) => (
      <Status table="subjects" status={value} data_id={item._id} />
    ),
  },
  {
    header: 'Chapter Count',
    accessor: 'chapterCount',
    render: (value: number) => value || 0,
  },
];

// Initial Form Values
const initialFormValues = {
  name: '',
  description: '',
  status: true,
};

// SubjectsManager Component
const SubjectsManager = () => {
  return (
    <DataManager
      title="Subjects Manager"
      itemName="Subject"
      endpoints={{
        list: '/subjects', // GET endpoint with pagination and search
        create: '/subjects', // POST endpoint
        update: (id) => `/subjects/${id}`, // PUT endpoint
        delete: (id) => `delete-record/subjects/${id}`, // DELETE endpoint
      }}
      validationSchema={subjectValidation} // Default create schema
      formFields={formFields}
      tableColumns={tableColumns}
      initialFormValues={initialFormValues}
      showPagination={true} // Show pagination
      showAdd={true} // Show Add button
      showEdit={true} // Show Edit button
      showDelete={true} // Show Delete button
    //   renderActions={(item) => (
    //     // Custom actions if needed
    //     <span
    //       className="text-blue-500 cursor-pointer"
    //       onClick={() => console.log('View', item._id)}
    //     >
    //       View Details
    //     </span>
    //   )}
    />
  );
};

export default SubjectsManager;

// // src/pages/Subjects.tsx
// import React, { useState, useEffect } from 'react';
// import { Subject } from '../types';
// import DataTable from '../components/DataTable';
// import Modal from '../components/Modal';
// import { Input, TextArea } from '../components/FormComponents';
// import AxiosHelper from '../../../helper/AxiosHelper';

// const Subjects: React.FC = () => {
//   const [subjects, setSubjects] = useState<Subject[]>([]);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedSubject, setSelectedSubject] = useState<Partial<Subject>>({});

//   useEffect(() => {
//     fetchSubjects();
//   }, []);

//   const fetchSubjects = async () => {
//     const response = await AxiosHelper.getData('subjects');
//     setSubjects(response.data.data.record);
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       if (selectedSubject._id) {
//         await AxiosHelper.putData(`subjects/${selectedSubject._id}`, selectedSubject);
//       } else {
//         await AxiosHelper.postData('subjects', selectedSubject);
//       }
//       fetchSubjects();
//       setIsModalOpen(false);
//       setSelectedSubject({});
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   const handleDelete = async (subject: Subject) => {
//     if (window.confirm('Are you sure you want to delete this subject?')) {
//       await AxiosHelper.deleteData(`/subjects/${subject._id}`);
//       fetchSubjects();
//     }
//   };

//   const columns = [
//     { key: 'name', header: 'Name' },
//     { key: 'code', header: 'Code' },
//     { key: 'description', header: 'Description' },
//     { key: 'chapterCount', header: 'Chapters' },
//     { key: 'status', header: 'Status', render: (item: Subject) => (item.status ? 'Active' : 'Inactive') },
//   ];

//   return (
//     <div className='p-10'>
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold">Subjects</h1>
//         <button
//           onClick={() => {
//             setSelectedSubject({});
//             setIsModalOpen(true);
//           }}
//           className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//         >
//           Add Subject
//         </button>
//       </div>

//       <DataTable
//         data={subjects}
//         columns={columns}
//         onEdit={(subject) => {
//           setSelectedSubject(subject);
//           setIsModalOpen(true);
//         }}
//         onDelete={handleDelete}
//       />

//       <Modal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title={selectedSubject._id ? 'Edit Subject' : 'Add Subject'}
//       >
//         <form onSubmit={handleSubmit}>
//           <Input
//             label="Name"
//             value={selectedSubject.name || ''}
//             onChange={(e) => setSelectedSubject({ ...selectedSubject, name: e.target.value })}
//             required
//           />
//           <Input
//             label="Code"
//             value={selectedSubject.code || ''}
//             onChange={(e) => setSelectedSubject({ ...selectedSubject, code: e.target.value })}
//             required
//           />
//           // src/pages/Subjects.tsx (continued)
//           <TextArea
//             label="Description"
//             value={selectedSubject.description || ''}
//             onChange={(e) => setSelectedSubject({ ...selectedSubject, description: e.target.value })}
//           />
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
//             <input
//               type="checkbox"
//               checked={selectedSubject.status !== undefined ? selectedSubject.status : true}
//               onChange={(e) => setSelectedSubject({ ...selectedSubject, status: e.target.checked })}
//               className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//             />
//           </div>
//           <div className="flex justify-end space-x-2">
//             <button
//               type="button"
//               onClick={() => setIsModalOpen(false)}
//               className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//               {selectedSubject._id ? 'Update' : 'Create'}
//             </button>
//           </div>
//         </form>
//       </Modal>
//     </div>
//   );
// };

// export default Subjects;
