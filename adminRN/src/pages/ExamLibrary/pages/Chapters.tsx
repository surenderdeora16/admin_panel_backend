import { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { STATUS } from '../../../constant/constant';
import AxiosHelper from '../../../helper/AxiosHelper';
import DataManager from '../../../components/DataManager';
import Status from '../../../helper/Status';

// Custom hook to fetch subjects
const useSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await AxiosHelper.getData('/subjects');
        const subjectOptions = response?.data?.data?.record?.map(
          (subject: any) => ({
            id: subject._id,
            name: subject.name,
          }),
        );
        setSubjects(subjectOptions);
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
        setError('Could not load subjects');
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []); // Empty dependency array means it runs once on mount

  return { subjects, loading, error };
};

const Chapters = () => {
  const [modalType, setModalType] = useState<any>('');
  const { subjects, loading, error } = useSubjects();
  const [selectedSubject, setSelectedSubject] = useState<any>(null);

  const title = 'Chapters Management';
  const itemName = 'Chapter';

  const endpoints = {
    list: '/chapters',
    create: '/chapters',
    update: (id: any) => `/chapters/${id}`,
    delete: (id:any) => `/chapters/${id}`, // DELETE endpoint
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required('Chapter name is required')
      .min(2, 'Chapter name should be at least 2 characters')
      .max(100, 'Chapter name cannot exceed 100 characters'),
    subjectId: Yup.mixed().required('Subject is required'),
    sequence: Yup.number()
      .min(0, 'Sequence must be a non-negative integer')
      .integer('Sequence must be an integer'),
    status: Yup.boolean(),
  });

  const formFields = [
    {
      label: 'Chapter Name',
      name: 'name',
      type: 'text',
      col: 12,
    },
    {
      label: 'Description',
      name: 'description',
      type: 'text-editer',
      col: 12,
    },
    {
      label: 'Subject',
      name: 'subjectId',
      type: 'select',
      options:
        modalType === 'add'
          ? [
              { id: '', name: 'Select Subject' },
              ...subjects.sort((a: any, b: any) =>
                a.id === selectedSubject?._id
                  ? -1
                  : b.id === selectedSubject?._id
                  ? 1
                  : 0,
              ),
            ]
          : subjects.sort((a: any, b: any) =>
              a.id === selectedSubject?._id
                ? -1
                : b.id === selectedSubject?._id
                ? 1
                : 0,
            ),
      disabled: loading || !!error,
    },
    // {
    //   label: 'Sequence',
    //   name: 'sequence',
    //   type: 'number',
    //   col: 6,
    // },
    // {
    //   label: 'Status',
    //   name: 'status',
    //   type: 'select',
    //   options: STATUS,
    //   col: 6,
    // },
  ];

  const tableColumns = [
    {
      header: 'Subject',
      accessor: 'subjectId',
      render: (value: any) => value?.name || '-',
    },
    { header: 'Chapter', accessor: 'name', sortable: true },
    { header: 'Topics', accessor: 'topicCount' },
    { header: 'Questions', accessor: 'questionCount' },
    { header: 'Sequence', accessor: 'sequence', sortable: true },
    {
      header: 'Status',
      accessor: 'status',
      render: (value: any, item: any) => (
        <Status table="chapters" status={value} data_id={item._id} />
      ),
      sortable: true,
    },
  ];

  const handleRowClick = (row: any) => {
    console.log('row', row);
    setSelectedSubject(row.subjectId); // Set selected subject when a row is clicked
  };

  const initialFormValues = {
    name: '',
    description: '',
    subjectId: modalType === 'add' ? '' : '',
    sequence: 0,
    status: true,
  };

  const canDelete = (item: any) => item.topicCount === 0;

  // Optional: Show a loading or error message
  if (loading) return <div>Loading subjects...</div>;
  if (error) return <div>{error}</div>;

  return (
    <DataManager
      title={title}
      itemName={itemName}
      setModalType={setModalType}
      endpoints={endpoints}
      validationSchema={validationSchema}
      handleRowClick={handleRowClick}
      formFields={formFields}
      tableColumns={tableColumns}
      initialFormValues={initialFormValues}
      showPagination={true}
      showAdd={true}
      showEdit={true}
      showDelete={true}
      canDelete={canDelete}
      multipartFormData={false}
    />
  );
};

export default Chapters;
