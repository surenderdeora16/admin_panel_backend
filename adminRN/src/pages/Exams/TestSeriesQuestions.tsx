"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import AxiosHelper from "../../helper/AxiosHelper"
import { toast } from "react-toastify"
import { FaSearch, FaPlus, FaTrash, FaArrowLeft } from "react-icons/fa"

const TestSeriesQuestions = () => {
  const { testSeriesId } = useParams()
  const [loading, setLoading] = useState(true)
  const [testSeries, setTestSeries] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [chapters, setChapters] = useState([])
  const [topics, setTopics] = useState([])
  const [questions, setQuestions] = useState([])
  const [testSeriesQuestions, setTestSeriesQuestions] = useState([])
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedChapter, setSelectedChapter] = useState("")
  const [selectedTopic, setSelectedTopic] = useState("")
  const [search, setSearch] = useState("")
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [testSeriesQuestionsPage, setTestSeriesQuestionsPage] = useState(1)
  const [testSeriesQuestionsLimit] = useState(10)
  const [testSeriesQuestionsTotal, setTestSeriesQuestionsTotal] = useState(0)
  const [addingQuestions, setAddingQuestions] = useState(false)
  const [removingQuestion, setRemovingQuestion] = useState("")

  // Fetch test series details and subjects on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        console.log("Fetching test series details for ID:", testSeriesId)
        const testSeriesResponse = await AxiosHelper.getData(`/test-series/${testSeriesId}`)
        console.log("Test series response:", testSeriesResponse.data)
        if (testSeriesResponse.status === 200 && testSeriesResponse.data.status) {
          setTestSeries(testSeriesResponse.data.data)
        } else {
          toast.error("Failed to fetch test series details")
        }

        console.log("Fetching subjects")
        const subjectsResponse = await AxiosHelper.getData("/question-selection/subjects")
        console.log("Subjects response:", subjectsResponse.data)
        if (subjectsResponse.status === 200 && subjectsResponse.data.status) {
          setSubjects(subjectsResponse.data.data)
        } else {
          toast.error("Failed to fetch subjects")
        }
      } catch (error) {
        console.error("Error fetching initial data:", error)
        toast.error("Something went wrong while fetching initial data")
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [testSeriesId])

  // Fetch chapters when subject changes
  useEffect(() => {
    if (selectedSubject) {
      const fetchChapters = async () => {
        console.log("Fetching chapters for subject:", selectedSubject)
        try {
          const response = await AxiosHelper.getData(`/question-selection/subjects/${selectedSubject}/chapters`)
          console.log("Chapters response:", response.data)
          if (response.status === 200 && response.data.status) {
            setChapters(response.data.data)
          } else {
            setChapters([])
            toast.info("No chapters found for this subject")
          }
        } catch (error) {
          console.error("Error fetching chapters:", error)
          toast.error("Failed to fetch chapters")
          setChapters([])
        }
      }
      fetchChapters()
      setSelectedChapter("")
      setSelectedTopic("")
      setTopics([])
      setQuestions([])
    } else {
      setChapters([])
      setTopics([])
      setQuestions([])
    }
  }, [selectedSubject])

  // Fetch topics when chapter changes
  useEffect(() => {
    if (selectedChapter) {
      const fetchTopics = async () => {
        console.log("Fetching topics for chapter:", selectedChapter)
        try {
          const response = await AxiosHelper.getData(`/question-selection/chapters/${selectedChapter}/topics`)
          console.log("Topics response:", response.data)
          if (response.status === 200 && response.data.status) {
            setTopics(response.data.data)
          } else {
            setTopics([])
            toast.info("No topics found for this chapter")
          }
        } catch (error) {
          console.error("Error fetching topics:", error)
          toast.error("Failed to fetch topics")
          setTopics([])
        }
      }
      fetchTopics()
      setSelectedTopic("")
      setQuestions([])
    } else {
      setTopics([])
      setQuestions([])
    }
  }, [selectedChapter])

  // Fetch questions when topic changes or search is performed
  useEffect(() => {
    if (selectedTopic) {
      const fetchQuestions = async () => {
        console.log("Fetching questions for topic:", selectedTopic, "with search:", search)
        try {
          setLoading(true)
          const params = { pageNo: page, limit, query: search || undefined }
          const response = await AxiosHelper.getData(`/question-selection/topics/${selectedTopic}/questions`, params)
          console.log("Questions response:", response.data)
          if (response.status === 200 && response.data.status) {
            setQuestions(response.data.data.record)
            setTotal(response.data.data.count)
          } else if (response.status === 404) {
            setQuestions([])
            setTotal(0)
            toast.info("No questions found for this topic")
          } else {
            toast.error("Failed to fetch questions")
          }
        } catch (error) {
          console.error("Error fetching questions:", error)
          toast.error("Something went wrong while fetching questions")
        } finally {
          setLoading(false)
        }
      }
      fetchQuestions()
    } else {
      setQuestions([])
      setTotal(0)
    }
  }, [selectedTopic, page, search])

  // Fetch all questions in the test series
  const fetchTestSeriesQuestions = async () => {
    console.log("Fetching test series questions for page:", testSeriesQuestionsPage)
    try {
      setLoading(true)
      const response = await AxiosHelper.getData(`/test-series/${testSeriesId}/questions`, {
        pageNo: testSeriesQuestionsPage,
        limit: testSeriesQuestionsLimit,
      })
      console.log("Test series questions response:", response.data)
      if (response.status === 200 && response.data.status) {
        setTestSeriesQuestions(response.data.data.record)
        setTestSeriesQuestionsTotal(response.data.data.count)
      } else if (response.status === 404) {
        setTestSeriesQuestions([])
        setTestSeriesQuestionsTotal(0)
        toast.info("No questions found in this test series")
      } else {
        toast.error("Failed to fetch test series questions")
      }
    } catch (error) {
      console.error("Error fetching test series questions:", error)
      toast.error("Something went wrong while fetching test series questions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTestSeriesQuestions()
  }, [testSeriesQuestionsPage])

  // Handle search
  const handleSearch = () => {
    setPage(1)
  }

  // Handle question selection
  const handleQuestionSelection = (questionId) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    )
  }

  // Handle adding questions
  const handleAddQuestions = async () => {
    if (selectedQuestions.length === 0) {
      toast.error("Please select at least one question")
      return
    }
    try {
      setAddingQuestions(true)
      const response = await AxiosHelper.postData(`/test-series/${testSeriesId}/questions`, {
        questionIds: selectedQuestions,
      })
      console.log("Add questions response:", response.data)
      if (response.status === 201 && response.data.status) {
        toast.success(response.data.message || "Questions added successfully")
        setSelectedQuestions([])
        fetchTestSeriesQuestions()
      } else {
        toast.error("Failed to add questions")
      }
    } catch (error) {
      console.error("Error adding questions:", error)
      toast.error("Something went wrong while adding questions")
    } finally {
      setAddingQuestions(false)
    }
  }

  // Handle removing question
  const handleRemoveQuestion = async (questionId) => {
    try {
      setRemovingQuestion(questionId)
      const response = await AxiosHelper.deleteData(`/test-series/${testSeriesId}/questions`, {
        data: { questionIds: [questionId] },
      })
      console.log("Remove question response:", response.data)
      if (response.status === 200 && response.data.status) {
        toast.success(response.data.message || "Question removed successfully")
        fetchTestSeriesQuestions()
      } else {
        toast.error("Failed to remove question")
      }
    } catch (error) {
      console.error("Error removing question:", error)
      toast.error("Something went wrong while removing question")
    } finally {
      setRemovingQuestion("")
    }
  }

  if (loading && !testSeries) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-gray-500 mb-4">
          <Link to="/test-series" className="hover:text-purple-600 transition-colors">Test Series</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">Questions</span>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{testSeries?.title} - Questions</h1>
          <Link to="/test-series" className="text-purple-600 hover:text-purple-800 flex items-center gap-2">
            <FaArrowLeft /> Back to Test Series
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Question Bank */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">Question Bank</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <select
                value={selectedSubject}
                onChange={(e) => {
                  console.log("Selected subject changed to:", e.target.value)
                  setSelectedSubject(e.target.value)
                }}
                className="border p-2 rounded"
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>{subject.name}</option>
                ))}
              </select>
              <select
                value={selectedChapter}
                onChange={(e) => {
                  console.log("Selected chapter changed to:", e.target.value)
                  setSelectedChapter(e.target.value)
                }}
                className="border p-2 rounded"
                disabled={!selectedSubject}
              >
                <option value="">Select Chapter</option>
                {chapters.map((chapter) => (
                  <option key={chapter._id} value={chapter._id}>{chapter.name}</option>
                ))}
              </select>
              <select
                value={selectedTopic}
                onChange={(e) => {
                  console.log("Selected topic changed to:", e.target.value)
                  setSelectedTopic(e.target.value)
                }}
                className="border p-2 rounded"
                disabled={!selectedChapter}
              >
                <option value="">Select Topic</option>
                {topics.map((topic) => (
                  <option key={topic._id} value={topic._id}>{topic.name}</option>
                ))}
              </select>
            </div>
            <div className="flex mb-4">
              <input
                type="text"
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border p-2 rounded flex-1"
              />
              <button onClick={handleSearch} className="ml-2 bg-purple-600 text-white p-2 rounded">
                <FaSearch />
              </button>
            </div>
            <div className="overflow-y-auto max-h-96">
              {loading ? (
                <p>Loading questions...</p>
              ) : questions.length > 0 ? (
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.length === questions.length}
                          onChange={() => setSelectedQuestions(questions.map(q => q._id))}
                        />
                      </th>
                      <th className="px-4 py-2">Question</th>
                      <th className="px-4 py-2">Answer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((question) => (
                      <tr key={question._id}>
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selectedQuestions.includes(question._id)}
                            onChange={() => handleQuestionSelection(question._id)}
                          />
                        </td>
                        <td className="px-4 py-2">{question.questionText}</td>
                        <td className="px-4 py-2">{question[question.rightAnswer]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No questions found</p>
              )}
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="bg-gray-300 p-2 rounded"
              >
                Previous
              </button>
              <span>Page {page} of {Math.ceil(total / limit)}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * limit >= total}
                className="bg-gray-300 p-2 rounded"
              >
                Next
              </button>
            </div>
            <button
              onClick={handleAddQuestions}
              className="mt-4 bg-green-600 text-white p-2 rounded flex items-center gap-2"
              disabled={selectedQuestions.length === 0 || addingQuestions}
            >
              {addingQuestions ? "Adding..." : <><FaPlus /> Add Selected Questions ({selectedQuestions.length})</>}
            </button>
          </div>

          {/* Test Series Questions */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">Test Series Questions</h2>
            <div className="overflow-y-auto max-h-96">
              {loading ? (
                <p>Loading test series questions...</p>
              ) : testSeriesQuestions.length > 0 ? (
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Question</th>
                      <th className="px-4 py-2">Answer</th>
                      <th className="px-4 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testSeriesQuestions.map((item:any) => (
                      <tr key={item._id}>
                        <td className="px-4 py-2">{item.questionId.questionText}</td>
                        <td className="px-4 py-2">{item.questionId[item.questionId.rightAnswer]}</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleRemoveQuestion(item.questionId._id)}
                            className="text-red-600"
                            disabled={removingQuestion === item.questionId._id}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No questions in this test series</p>
              )}
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setTestSeriesQuestionsPage(testSeriesQuestionsPage - 1)}
                disabled={testSeriesQuestionsPage === 1}
                className="bg-gray-300 p-2 rounded"
              >
                Previous
              </button>
              <span>Page {testSeriesQuestionsPage} of {Math.ceil(testSeriesQuestionsTotal / testSeriesQuestionsLimit)}</span>
              <button
                onClick={() => setTestSeriesQuestionsPage(testSeriesQuestionsPage + 1)}
                disabled={testSeriesQuestionsPage * testSeriesQuestionsLimit >= testSeriesQuestionsTotal}
                className="bg-gray-300 p-2 rounded"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestSeriesQuestions