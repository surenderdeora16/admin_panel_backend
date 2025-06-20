'use client';

import type React from 'react';

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import AxiosHelper from '../../helper/AxiosHelper';
import { toast } from 'react-toastify';
import Select from 'react-select';
import {
  FiSearch,
  FiPlus,
  FiTrash2,
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiFilter,
  FiBookOpen,
  FiLayers,
  FiTag,
  FiCheck,
} from 'react-icons/fi';

// TypeScript interfaces
interface Question {
  _id: string;
  questionText: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  option5?: string;
  rightAnswer: string;
}

interface SectionQuestion {
  _id: string;
  questionId: Question;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

interface Taxonomy {
  subjects: any[];
  chapters: any[];
  topics: any[];
  selectedSubject: string | null;
  selectedChapter: string | null;
  selectedTopic: string | null;
  searchQuery: string;
}

interface ProcessingState {
  adding: boolean;
  removingId: string;
}

interface SelectOption {
  value: string;
  label: string;
}

const SectionQuestions = () => {
  const { testSeriesId, sectionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [testSeries, setTestSeries] = useState<any>(null);
  const [section, setSection] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sectionQuestions, setSectionQuestions] = useState<SectionQuestion[]>(
    [],
  );
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 100,
    total: 0,
  });
  const [sectionQPagination, setSectionQPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [taxonomy, setTaxonomy] = useState<Taxonomy>({
    subjects: [],
    chapters: [],
    topics: [],
    selectedSubject: null,
    selectedChapter: null,
    selectedTopic: null,
    searchQuery: '',
  });
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [processing, setProcessing] = useState<ProcessingState>({
    adding: false,
    removingId: '',
  });
  const [filtersVisible, setFiltersVisible] = useState(true);

  // Convert arrays to react-select options
  const subjectOptions: SelectOption[] = taxonomy.subjects.map((subject) => ({
    value: subject._id,
    label: subject.name,
  }));

  const chapterOptions: SelectOption[] = taxonomy.chapters.map((chapter) => ({
    value: chapter._id,
    label: chapter.name,
  }));

  const topicOptions: SelectOption[] = taxonomy.topics.map((topic) => ({
    value: topic._id,
    label: `${topic.name} (${topic.questionCount})`,
  }));

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      const [testSeriesRes, sectionsRes, subjectsRes] = await Promise.all([
        AxiosHelper.getData(`/test-series/${testSeriesId}`),
        AxiosHelper.getData(`/test-series/${testSeriesId}/sections`),
        AxiosHelper.getData('/question-selection/subjects'),
      ]);

      if (testSeriesRes.data?.status) setTestSeries(testSeriesRes.data.data);
      if (sectionsRes.data?.status) {
        const sectionData = Array.isArray(sectionsRes.data.data.record)
          ? sectionsRes.data.data.record.find((s: any) => s._id === sectionId)
          : sectionsRes.data.data.subjects?.find(
              (s: any) => s._id === sectionId,
            );
        if (sectionData) setSection(sectionData);
      }
      if (subjectsRes.data?.status)
        setTaxonomy((prev) => ({
          ...prev,
          subjects: subjectsRes.data.data.subjects,
        }));
    } catch (error) {
      toast.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  }, [testSeriesId, sectionId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Fetch chapters when subject changes
  useEffect(() => {
    const fetchChapters = async () => {
      if (!taxonomy.selectedSubject) return;
      try {
        const res = await AxiosHelper.getData(
          `/question-selection/subjects/${taxonomy.selectedSubject}/chapters`,
        );
        if (res.data?.status)
          setTaxonomy((prev) => ({
            ...prev,
            chapters: res.data.data,
            selectedChapter: null,
            topics: [],
            selectedTopic: null,
          }));
      } catch (error) {
        toast.error('Failed to load chapters');
      }
    };
    fetchChapters();
  }, [taxonomy.selectedSubject]);

  // Fetch topics when chapter changes
  useEffect(() => {
    const fetchTopics = async () => {
      if (!taxonomy.selectedChapter) return;
      try {
        const res = await AxiosHelper.getData(
          `/question-selection/chapters/${taxonomy.selectedChapter}/topics`,
        );
        if (res.data?.status)
          setTaxonomy((prev) => ({
            ...prev,
            topics: res.data.data,
            selectedTopic: null,
          }));
      } catch (error) {
        toast.error('Failed to load topics');
      }
    };
    fetchTopics();
  }, [taxonomy.selectedChapter]);

  // Fetch questions with debounced search
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!taxonomy.selectedTopic) return;
      try {
        setLoading(true);
        const res = await AxiosHelper.getData(
          `/question-selection/topics/${taxonomy.selectedTopic}/questions`,
          {
            pageNo: pagination.page,
            limit: pagination.limit,
            query: taxonomy.searchQuery,
          },
        );
        if (res.data?.status) {
          setQuestions(res.data.data.record);
          setPagination((prev) => ({ ...prev, total: res.data.data.count }));
        }
      } catch (error) {
        toast.error('Failed to load questions');
      } finally {
        setLoading(false);
      }
    };
    const debounceTimer = setTimeout(fetchQuestions, 500);
    return () => clearTimeout(debounceTimer);
  }, [
    taxonomy.selectedTopic,
    pagination.page,
    pagination.limit,
    taxonomy.searchQuery,
  ]);

  // Fetch section questions
  const fetchSectionQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await AxiosHelper.getData(
        `/test-series/${testSeriesId}/sections/${sectionId}/questions`,
        {
          page: sectionQPagination.page,
          limit: sectionQPagination.limit,
        },
      );
      if (res.data?.status) {
        setSectionQuestions(res.data.data.record);
        setSectionQPagination((prev) => ({
          ...prev,
          total: res.data.data.count,
        }));
      }
    } catch (error) {
      toast.error('Failed to load section questions');
    } finally {
      setLoading(false);
    }
  }, [
    testSeriesId,
    sectionId,
    sectionQPagination.page,
    sectionQPagination.limit,
  ]);

  useEffect(() => {
    fetchSectionQuestions();
  }, [fetchSectionQuestions]);

  // Question selection handlers
  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId],
    );
  };

  const handleSelectAll = () => {
    setSelectedQuestions((prev) =>
      prev.length === questions.length ? [] : questions.map((q) => q._id),
    );
  };

  // API operations
  const handleAddQuestions = async () => {
    if (!selectedQuestions.length) return;
    try {
      setProcessing((prev) => ({ ...prev, adding: true }));
      const res = await AxiosHelper.postData(
        `/test-series/${testSeriesId}/sections/${sectionId}/questions`,
        {
          questionIds: selectedQuestions,
        },
      );
      if (res.data?.status) {
        toast.success(`Added ${res.data.data.addedCount} questions`);
        setSelectedQuestions([]);
        fetchSectionQuestions();
      }
    } catch (error) {
      toast.error('Failed to add questions');
    } finally {
      setProcessing((prev) => ({ ...prev, adding: false }));
    }
  };
  const handleRemoveQuestion = async (questionId: string) => {
    try {
      console.log("questionId>", questionId)
      setProcessing((prev) => ({ ...prev, removingId: questionId }));
      const res = await AxiosHelper.deleteData(
        `/test-series/${testSeriesId}/sections/${sectionId}/questions`,
        {
          data: { questionIds: [questionId] },
        },
      );
      if (res.data?.status) {
        toast.success(
          res.data.data?.message ||
            `${res.data.data?.removedCount || 1} question removed from section successfully`,
        );
        fetchSectionQuestions();
      } else {
        toast.error(res.data?.message || 'No questions found in the section');
      }
    } catch (error) {
      toast.error('Failed to remove question');
    } finally {
      setProcessing((prev) => ({ ...prev, removingId: '' }));
    }
  };

  if (loading && !testSeries && !section) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-rose-500"></div>
          <p className="text-slate-600 font-medium">Loading data...</p>
        </div>
      </div>
    );
  }

  // Custom styles for React Select
  const customSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderColor: state.isFocused ? '#f43f5e' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 1px #f43f5e' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#f43f5e' : '#9ca3af',
      },
      borderRadius: '0.5rem',
      padding: '2px',
      backgroundColor: 'white',
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#fecdd3'
        : state.isFocused
        ? '#fee2e2'
        : 'white',
      color: state.isSelected ? '#9f1239' : '#1f2937',
      padding: '10px 12px',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#fecdd3',
      },
    }),
    menu: (base: any) => ({
      ...base,
      borderRadius: '0.5rem',
      boxShadow:
        '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      zIndex: 10,
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: '#fee2e2',
      borderRadius: '0.25rem',
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: '#9f1239',
      fontWeight: 500,
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: '#e11d48',
      '&:hover': {
        backgroundColor: '#fecdd3',
        color: '#be123c',
      },
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: '2px 8px',
    }),
    input: (base: any) => ({
      ...base,
      margin: 0,
      padding: 0,
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: '#9ca3af',
      '&:hover': {
        color: '#6b7280',
      },
    }),
    clearIndicator: (base: any) => ({
      ...base,
      color: '#9ca3af',
      '&:hover': {
        color: '#6b7280',
      },
    }),
    noOptionsMessage: (base: any) => ({
      ...base,
      padding: '10px 12px',
      color: '#6b7280',
    }),
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-full mx-auto">
        {/* Header and Breadcrumb */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Link
              to="/test-series"
              className="hover:text-rose-600 transition-colors"
            >
              Test Series
            </Link>
            <span className="text-slate-300">/</span>
            <Link
              to={`/test-series/${testSeriesId}/sections`}
              className="hover:text-rose-600 transition-colors"
            >
              Sections
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 font-medium">Questions</span>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
                <span>{testSeries?.title}</span>
                <span className="text-slate-400">•</span>
                <span className="text-rose-600">{section?.name}</span>
              </h1>
              <p className="text-slate-500 mt-1">
                Manage questions for this section
              </p>
            </div>
            <Link
              to={`/test-series/${testSeriesId}/sections`}
              className="flex items-center gap-2 text-rose-600 hover:text-rose-700 transition-colors px-4 py-2 rounded-lg border border-rose-200 hover:border-rose-300 bg-white shadow-sm"
            >
              <FiArrowLeft className="text-lg" />
              <span>Back to Sections</span>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Question Bank */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-rose-50 to-rose-100 border-b border-rose-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Question Bank
                  </h2>
                  <p className="text-slate-600 mt-1">
                    Select questions to add to this section
                  </p>
                </div>
                <button
                  onClick={() => setFiltersVisible(!filtersVisible)}
                  className="p-2 rounded-lg bg-white text-slate-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                  aria-label={filtersVisible ? 'Hide filters' : 'Show filters'}
                >
                  <FiFilter className="text-lg" />
                </button>
              </div>
            </div>

            {/* Filters */}
            {filtersVisible && (
              <div className="p-5 space-y-5 border-b border-slate-200 bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <ReactSelectInput
                    label="Subject"
                    placeholder="Search subjects..."
                    value={
                      taxonomy.selectedSubject
                        ? subjectOptions.find(
                            (option) =>
                              option.value === taxonomy.selectedSubject,
                          ) || null
                        : null
                    }
                    onChange={(option: SelectOption | null) =>
                      setTaxonomy((prev) => ({
                        ...prev,
                        selectedSubject: option?.value || null,
                      }))
                    }
                    options={subjectOptions}
                    icon={<FiBookOpen className="text-slate-400" />}
                    styles={customSelectStyles}
                  />
                  <ReactSelectInput
                    label="Chapter"
                    placeholder="Search chapters..."
                    value={
                      taxonomy.selectedChapter
                        ? chapterOptions.find(
                            (option) =>
                              option.value === taxonomy.selectedChapter,
                          ) || null
                        : null
                    }
                    onChange={(option: SelectOption | null) =>
                      setTaxonomy((prev) => ({
                        ...prev,
                        selectedChapter: option?.value || null,
                      }))
                    }
                    options={chapterOptions}
                    isDisabled={!taxonomy.selectedSubject}
                    icon={<FiLayers className="text-slate-400" />}
                    styles={customSelectStyles}
                  />
                  <ReactSelectInput
                    label="Topic"
                    placeholder="Search topics..."
                    value={
                      taxonomy.selectedTopic
                        ? topicOptions.find(
                            (option) => option.value === taxonomy.selectedTopic,
                          ) || null
                        : null
                    }
                    onChange={(option: SelectOption | null) =>
                      setTaxonomy((prev) => ({
                        ...prev,
                        selectedTopic: option?.value || null,
                      }))
                    }
                    options={topicOptions}
                    isDisabled={!taxonomy.selectedChapter}
                    icon={<FiTag className="text-slate-400" />}
                    styles={customSelectStyles}
                  />
                </div>
                <SearchInput
                  value={taxonomy.searchQuery}
                  onChange={(e) =>
                    setTaxonomy((prev) => ({
                      ...prev,
                      searchQuery: e.target.value,
                    }))
                  }
                  onSearch={() =>
                    setPagination((prev) => ({ ...prev, page: 1 }))
                  }
                />
              </div>
            )}

            {/* Questions Table */}
            <QuestionTable
              questions={questions}
              selected={selectedQuestions}
              onSelect={handleQuestionSelect}
              onSelectAll={handleSelectAll}
              loading={loading && taxonomy.selectedTopic !== null}
            />

            {/* Pagination & Actions */}
            {questions.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <PaginationControls
                  {...pagination}
                  onPrev={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                  onNext={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                />
                <button
                  onClick={handleAddQuestions}
                  disabled={!selectedQuestions.length || processing.adding}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white transition-all ${
                    !selectedQuestions.length || processing.adding
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow'
                  }`}
                >
                  {processing.adding ? (
                    <>
                      <Spinner /> Adding...
                    </>
                  ) : (
                    <>
                      <FiPlus className="text-lg" /> Add Selected (
                      {selectedQuestions.length})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Section Questions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200">
              <h2 className="text-xl font-bold text-slate-800">
                Section Questions
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <FiGrid className="text-emerald-600" />
                <p className="text-slate-600">
                  Current questions:{' '}
                  <span className="font-semibold text-emerald-700">
                    {sectionQPagination.total}
                  </span>
                </p>
              </div>
            </div>

            {/* Section Questions Table */}
            <SectionQuestionsTable
              questions={sectionQuestions}
              page={sectionQPagination.page}
              limit={sectionQPagination.limit}
              onRemove={handleRemoveQuestion}
              removingId={processing.removingId}
              loading={loading}
            />

            {/* Pagination */}
            {sectionQuestions.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-slate-600">
                  Showing{' '}
                  {(sectionQPagination.page - 1) * sectionQPagination.limit + 1}{' '}
                  to{' '}
                  {Math.min(
                    sectionQPagination.page * sectionQPagination.limit,
                    sectionQPagination.total,
                  )}{' '}
                  of {sectionQPagination.total}
                </div>
                <PaginationControls
                  {...sectionQPagination}
                  onPrev={() =>
                    setSectionQPagination((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                  onNext={() =>
                    setSectionQPagination((prev) => ({
                      ...prev,
                      page: prev.page + 1,
                    }))
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Components
interface ReactSelectInputProps {
  label: string;
  placeholder: string;
  value: SelectOption | null;
  onChange: (option: SelectOption | null) => void;
  options: SelectOption[];
  isDisabled?: boolean;
  icon?: React.ReactNode;
  styles: any;
}

const ReactSelectInput: React.FC<ReactSelectInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  options,
  isDisabled = false,
  icon,
  styles,
}) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          {icon}
        </div>
      )}
      <Select
        value={value}
        onChange={onChange}
        options={options}
        isDisabled={isDisabled}
        placeholder={placeholder}
        styles={{
          ...styles,
          control: (base: any, state: any) => ({
            ...styles.control(base, state),
            paddingLeft: icon ? '28px' : '8px',
          }),
        }}
        menuPortalTarget={document.body}
        isClearable
        isSearchable
        classNamePrefix="react-select"
        noOptionsMessage={() => 'No options found'}
      />
    </div>
  </div>
);

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onSearch,
}) => (
  <div className="relative">
    <input
      type="text"
      placeholder="Search questions by text or keywords..."
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2.5 pl-11 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-slate-800"
      onKeyPress={(e) => e.key === 'Enter' && onSearch()}
    />
    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg" />
  </div>
);

interface QuestionTableProps {
  questions: Question[];
  selected: string[];
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  loading: boolean;
}

const QuestionTable: React.FC<QuestionTableProps> = ({
  questions,
  selected,
  onSelect,
  onSelectAll,
  loading,
}) => (
  <div className="overflow-y-auto max-h-[500px]">
    {loading ? (
      <div className="p-10 text-center">
        <Spinner size="lg" />
        <p className="mt-3 text-slate-500">Loading questions...</p>
      </div>
    ) : questions.length === 0 ? (
      <div className="p-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-3">
          <FiSearch className="w-6 h-6" />
        </div>
        <p className="text-slate-500 text-lg">No questions found</p>
        <p className="text-slate-400 text-sm mt-1">
          Try adjusting your filters or search query
        </p>
      </div>
    ) : (
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50 sticky top-0 z-10">
          <tr>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={
                    selected.length === questions.length && questions.length > 0
                  }
                  onChange={onSelectAll}
                  className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-slate-300 rounded"
                />
                <span className="ml-2">Select All</span>
              </div>
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Question
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Options
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Answer
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {questions.map((question) => {
            const isSelected = selected.includes(question._id);
            return (
              <tr
                key={question._id}
                className={`transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-rose-50 hover:bg-rose-100'
                    : 'hover:bg-slate-50'
                }`}
                onClick={() => onSelect(question._id)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div
                      className={`w-5 h-5 flex items-center justify-center rounded border ${
                        isSelected
                          ? 'bg-rose-500 border-rose-500 text-white'
                          : 'border-slate-300 bg-white text-transparent'
                      }`}
                    >
                      <FiCheck
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-800 font-medium line-clamp-2">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: question.questionText,
                      }}
                    />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4, 5].map((opt) => {
                      const optionKey = `option${opt}` as keyof Question;
                      const optionValue = question[optionKey];
                      if (!optionValue) return null;

                      return (
                        <span
                          key={opt}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700"
                          title={optionValue}
                        >
                          <span
                            dangerouslySetInnerHTML={{
                              __html: `${opt}. ${
                                optionValue.length > 15
                                  ? `${optionValue.substring(0, 15)}...`
                                  : optionValue
                              }`,
                            }}
                          />
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div
                    className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md inline-block"
                    dangerouslySetInnerHTML={{
                      __html: question[
                        question.rightAnswer as keyof Question
                      ] as string,
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    )}
  </div>
);

interface SectionQuestionsTableProps {
  questions: SectionQuestion[];
  page: number;
  limit: number;
  onRemove: (id: string) => void;
  removingId: string;
  loading: boolean;
}

const SectionQuestionsTable: React.FC<SectionQuestionsTableProps> = ({
  questions,
  page,
  limit,
  onRemove,
  removingId,
  loading,
}) => (
  <div className="overflow-y-auto max-h-[600px]">
    {loading ? (
      <div className="p-10 text-center">
        <Spinner size="lg" />
        <p className="mt-3 text-slate-500">Loading questions...</p>
      </div>
    ) : questions.length === 0 ? (
      <div className="p-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-3">
          <FiGrid className="w-6 h-6" />
        </div>
        <p className="text-slate-500 text-lg">No questions in this section</p>
        <p className="text-slate-400 text-sm mt-1">
          Use the Question Bank to add questions
        </p>
      </div>
    ) : (
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50 sticky top-0 z-10">
          <tr>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              #
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Question
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Answer
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {questions.map((item, index) => (
            <tr key={item._id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 text-rose-600 font-medium">
                  {(page - 1) * limit + index + 1}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-slate-800 font-medium mb-1.5 line-clamp-2">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: item.questionId.questionText,
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {[1, 2, 3, 4, 5].map((opt) => {
                    const optionKey = `option${opt}` as keyof Question;
                    const optionValue = item.questionId[optionKey];
                    if (!optionValue) return null;

                    return (
                      <span
                        key={opt}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700"
                        title={optionValue}
                      >
                        <span
                          dangerouslySetInnerHTML={{
                            __html: `${opt}. ${
                              optionValue.length > 15
                                ? `${optionValue.substring(0, 15)}...`
                                : optionValue
                            }`,
                          }}
                        />
                      </span>
                    );
                  })}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md inline-block">
                    <span
                    dangerouslySetInnerHTML={{
                      __html:
                      item.questionId[
                        item.questionId.rightAnswer as keyof Question
                      ] as string,
                    }}
                    />
                </div>
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item?.questionId?._id);
                  }}
                  disabled={removingId === item.questionId._id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    removingId === item.questionId._id
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                  }`}
                >
                  {removingId === item.questionId._id ? (
                    <Spinner />
                  ) : (
                    <FiTrash2 />
                  )}
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

interface PaginationControlsProps extends Pagination {
  onPrev: () => void;
  onNext: () => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  page,
  total,
  limit,
  onPrev,
  onNext,
}) => {
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        disabled={page === 1}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          page === 1
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        <FiChevronLeft />
        Previous
      </button>
      <div className="text-sm font-medium text-slate-700 px-2">
        Page {page} of {totalPages || 1}
      </div>
      <button
        onClick={onNext}
        disabled={page * limit >= total}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          page * limit >= total
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        Next
        <FiChevronRight />
      </button>
    </div>
  );
};

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-5 w-5 border-2',
    lg: 'h-8 w-8 border-3',
  };

  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} border-t-transparent border-slate-300 border-t-slate-600`}
    ></div>
  );
};

export default SectionQuestions;
