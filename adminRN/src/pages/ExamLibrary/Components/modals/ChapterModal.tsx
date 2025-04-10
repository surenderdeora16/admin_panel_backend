// src/components/modals/ChapterModal.jsx
import { useState, useEffect } from 'react';
import Modal from './Modal';
import AxiosHelper from '../../../../helper/AxiosHelper';

const ChapterModal = ({ isOpen, onClose, chapter, onSave }) => {
  const [formData, setFormData] = useState({ name: '', subjectId: '' });
  const [subjects, setSubjects] = useState([]);
  const [errors, setErrors] = useState({});
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data } = await AxiosHelper.getData('subjects');
        setSubjects(data?.data?.record);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (chapter) {
      setFormData({
        name: chapter.name,
        subjectId: chapter.subjectId?._id || chapter.subjectId,
      });
    } else {
      setFormData({ name: '', subjectId: '' });
    }
    setErrors({});
  }, [chapter, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.subjectId) newErrors.subjectId = 'Subject is required';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      return setErrors(validationErrors);
    }
    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={chapter ? 'Edit Chapter' : 'Create Chapter'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <select
            value={formData.subjectId}
            onChange={(e) =>
              setFormData({ ...formData, subjectId: e.target.value })
            }
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.subjectId ? 'border-red-500' : 'border-gray-300'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            disabled={loadingSubjects}
          >
            <option value="">Select Subject</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </select>
          {errors.subjectId && (
            <p className="mt-1 text-sm text-red-600">{errors.subjectId}</p>
          )}
          {loadingSubjects && (
            <p className="mt-1 text-sm text-gray-500">Loading subjects...</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chapter Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg border"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
};
export default ChapterModal;
