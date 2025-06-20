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

  // status: Yup.boolean().required('Status is required'),
});

// Form Fields
const formFields = [
  { label: 'Subject Name', name: 'name', type: 'text', col: 12 },
  { label: 'Description', name: 'description', type: 'text-editer', col: 12 },
  
  // {
  //   label: 'Status',
  //   name: 'status',
  //   type: 'select',
  //   options: STATUS,
  //   col: 12,
  // },
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
  // status: '',
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
        delete: (id) => `/subjects/${id}`, // DELETE endpoint
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
