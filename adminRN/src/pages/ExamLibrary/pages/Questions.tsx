import React, { useState, useEffect } from 'react';
import { Question, Topic } from '../types';
import DataManager from '../../../components/DataManager';
import Modal from '../Components/Modal';
import { Input, TextArea, Select } from '../Components/FormComponents';
import AxiosHelper from '../../../helper/AxiosHelper';
import { DIFFICULTY_LEVELS, QUESTION_TYPES } from '../../../constant/constant';

const Questions: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Partial<Question>>({
    options: [],
    marks: { correct: 1, negative: 0 }
  });

  useEffect(() => {
    fetchQuestions();
    fetchTopics();
  }, []);

  const fetchQuestions = async () => {
    const response = await AxiosHelper.getData('questions');
    setQuestions(response.data.data.record);
  };

  const fetchTopics = async () => {
    const response = await AxiosHelper.getData('topics');
    setTopics(response.data.data.record);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedQuestion._id) {
        await AxiosHelper.putData(`/questions/${selectedQuestion._id}`, selectedQuestion);
      } else {
        await AxiosHelper.postData('/questions', selectedQuestion);
      }
      fetchQuestions();
      setIsModalOpen(false);
      setSelectedQuestion({ options: [], marks: { correct: 1, negative: 0 } });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (question: Question) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      await AxiosHelper.deleteData(`/questions/${question._id}`);
      fetchQuestions();
    }
  };

  const handleOptionChange = (index: number, field: string, value: string | boolean) => {
    const newOptions = [...(selectedQuestion.options || [])];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setSelectedQuestion({ ...selectedQuestion, options: newOptions });
  };

  const addOption = () => {
    setSelectedQuestion({
      ...selectedQuestion,
      options: [...(selectedQuestion.options || []), { optionText: '', isCorrect: false }]
    });
  };

  const columns = [
    { key: 'questionText', header: 'Question' },
    { key: 'questionType', header: 'Type' },
    { key: 'topicId', header: 'Topic', render: (item: Question) => 
      typeof item.topicId === 'string' ? item.topicId : item.topicId.name },
    { key: 'difficultyLevel', header: 'Difficulty' },
    { key: 'status', header: 'Status', render: (item: Question) => (item.status ? 'Active' : 'Inactive') },
  ];

  return (
    <div className='p-10'>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Questions</h1>
        <button
          onClick={() => {
            setSelectedQuestion({ options: [], marks: { correct: 1, negative: 0 } });
            setIsModalOpen(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Question
        </button>
      </div>

      <DataTable
        data={questions}
        columns={columns}
        onEdit={(question) => {
          setSelectedQuestion(question);
          setIsModalOpen(true);
        }}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedQuestion._id ? 'Edit Question' : 'Add Question'}
      >
        <form onSubmit={handleSubmit}>
          <TextArea
            label="Question Text"
            value={selectedQuestion.questionText || ''}
            onChange={(e) => setSelectedQuestion({ ...selectedQuestion, questionText: e.target.value })}
            required
          />
          <Select
            label="Question Type"
            value={selectedQuestion.questionType || ''}
            onChange={(e) => setSelectedQuestion({ ...selectedQuestion, questionType: e.target.value as any })}
            options={QUESTION_TYPES}
            required
          />
          <Select
            label="Topic"
            value={typeof selectedQuestion.topicId === 'string' ? selectedQuestion.topicId : selectedQuestion.topicId?._id || ''}
            onChange={(e) => setSelectedQuestion({ ...selectedQuestion, topicId: e.target.value })}
            options={topics.map(t => ({ value: t._id, label: t.name }))}
            required
          />
          <Select
            label="Difficulty Level"
            value={selectedQuestion.difficultyLevel || ''}
            onChange={(e) => setSelectedQuestion({ ...selectedQuestion, difficultyLevel: e.target.value as any })}
            options={DIFFICULTY_LEVELS}
          />
          
          {(selectedQuestion.questionType === 'MULTIPLE_CHOICE' || selectedQuestion.questionType === 'TRUE_FALSE') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
              {(selectedQuestion.options || []).map((option, index) => (
                <div key={index} className="flex space-x-2 mb-2">
                  <Input
                    value={option.optionText}
                    onChange={(e) => handleOptionChange(index, 'optionText', e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  <input
                    type="checkbox"
                    checked={option.isCorrect}
                    onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                className="text-blue-600 hover:text-blue-800"
              >
                Add Option
              </button>
            </div>
          )}

          {(selectedQuestion.questionType === 'FILL_IN_BLANK' || selectedQuestion.questionType === 'DESCRIPTIVE') && (
            <Input
              label="Correct Answer"
              value={selectedQuestion.correctAnswer || ''}
              onChange={(e) => setSelectedQuestion({ ...selectedQuestion, correctAnswer: e.target.value })}
            />
          )}

          <TextArea
            label="Explanation"
            value={selectedQuestion.explanation || ''}
            onChange={(e) => setSelectedQuestion({ ...selectedQuestion, explanation: e.target.value })}
          />
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input
              label="Correct Marks"
              type="number"
              value={selectedQuestion.marks?.correct?.toString() || '1'}
              onChange={(e) => setSelectedQuestion({
                ...selectedQuestion,
                marks: { ...selectedQuestion.marks, correct: parseFloat(e.target.value) }
              })}
            />
            <Input
              label="Negative Marks"
              type="number"
              value={selectedQuestion.marks?.negative?.toString() || '0'}
              onChange={(e) => setSelectedQuestion({
                ...selectedQuestion,
                marks: { ...selectedQuestion.marks, negative: parseFloat(e.target.value) }
              })}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <input
              type="checkbox"
              checked={selectedQuestion.status !== undefined ? selectedQuestion.status : true}
              onChange={(e) => setSelectedQuestion({ ...selectedQuestion, status: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {selectedQuestion._id ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Questions;