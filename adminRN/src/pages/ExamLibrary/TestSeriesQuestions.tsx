"use client"

import { useState, useEffect } from "react"
import AxiosHelper from '../../helper/AxiosHelper';
import { toast } from "react-toastify"
import { useParams } from "react-router-dom"

const TestSeriesQuestions = () => {
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [testSeries, setTestSeries] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [chapters, setChapters] = useState([])
  const [topics, setTopics] = useState([])
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedChapter, setSelectedChapter] = useState("")
  const [selectedTopic, setSelectedTopic] = useState("")
  const [questions, setQuestions] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [testSeriesQuestions, setTestSeriesQuestions] = useState([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)

  // Fetch test series details
  const fetchTestSeries = async () => {
    try {
      const res = await AxiosHelper.getData(`/api/test-series/${id}`)
      setTestSeries(res.data.data)
    } catch (error) {
      console.error("Error fetching test series:", error)
      toast.error("Failed to fetch test series")
    }
  }

  // Fetch subjects, chapters, and topics
  const fetchSubjectsChaptersTopics = async () => {
    try {
      const res = await AxiosHelper.getData("/api/test-series/subjects-chapters-topics")
      setSubjects(res.data.data.subjects)
      setChapters(res.data.data.chapters)
      setTopics(res.data.data.topics)
    } catch (error) {
      console.error("Error fetching subjects, chapters, and topics:", error)
      toast.error("Failed to fetch subjects, chapters, and topics")
    }
  }

  // Fetch questions by topic
  const fetchQuestionsByTopic = async () => {
    if (!selectedTopic) return

    try {
      setLoading(true)
      const res = await AxiosHelper.getData(`/api/questions/topic/${selectedTopic}`)
      setQuestions(res.data.data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching questions:", error)
      toast.error("Failed to fetch questions")
      setLoading(false)
    }
  }

  // Fetch test series questions
  const fetchTestSeriesQuestions = async () => {
    try {
      setLoading(true)
      const res = await AxiosHelper.getData(`/api/test-series/${id}/questions?page=${page}&limit=${limit}`)
      setTestSeriesQuestions(res.data.data)
      setTotal(res.data.pagination.total)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching test series questions:", error)
      toast.error("Failed to fetch test series questions")
      setLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchTestSeries()
    fetchSubjectsChaptersTopics()
    fetchTestSeriesQuestions()
  }, [id, page, limit])

  // Fetch questions when topic changes
  useEffect(() => {
    if (selectedTopic) {
      fetchQuestionsByTopic()
    } else {
      setQuestions([])
    }
  }, [selectedTopic])

  // Handle subject change
  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value)
    setSelectedChapter("")
    setSelectedTopic("")
    setQuestions([])
    setSelectedQuestions([])
  }

  // Handle chapter change
  const handleChapterChange = (e) => {
    setSelectedChapter(e.target.value)
    setSelectedTopic("")
    setQuestions([])
    setSelectedQuestions([])
  }

  // Handle topic change
  const handleTopicChange = (e) => {
    setSelectedTopic(e.target.value)
    setSelectedQuestions([])
  }

  // Handle question selection
  const handleQuestionSelection = (questionId) => {
    if (selectedQuestions.includes(questionId)) {
      setSelectedQuestions(selectedQuestions.filter((id) => id !== questionId))
    } else {
      setSelectedQuestions([...selectedQuestions, questionId])
    }
  }

  // Handle add questions to test series
  const handleAddQuestions = async () => {
    if (selectedQuestions.length === 0) {
      toast.error("Please select at least one question")
      return
    }

    try {
      setLoading(true)
      await AxiosHelper.postData(`/api/test-series/${id}/questions`, {
        questionIds: selectedQuestions,
      })
      toast.success("Questions added to test series successfully")
      setSelectedQuestions([])
      fetchTestSeriesQuestions()
      setLoading(false)
    } catch (error) {
      console.error("Error adding questions to test series:", error)
      toast.error("Failed to add questions to test series")
      setLoading(false)
    }
  }

  // Handle remove questions from test series
  const handleRemoveQuestions = async (questionIds) => {
    if (!Array.isArray(questionIds)) {
      questionIds = [questionIds]
    }

    if (questionIds.length === 0) {
      toast.error("Please select at least one question to remove")
      return
    }

    if (!window.confirm("Are you sure you want to remove the selected questions from this test series?")) {
      return
    }

    try {
      setLoading(true)
      await AxiosHelper.deleteData(`/api/test-series/${id}/questions?questionIds=${questionIds.join(",")}`)
      toast.success("Questions removed from test series successfully")
      fetchTestSeriesQuestions()
      setLoading(false)
    } catch (error) {
      console.error("Error removing questions from test series:", error)
      toast.error("Failed to remove questions from test series")
      setLoading(false)
    }
  }

  // Filter chapters by selected subject
  const filteredChapters = selectedSubject ? chapters.filter((chapter) => chapter.subjectId === selectedSubject) : []

  // Filter topics by selected chapter
  const filteredTopics = selectedChapter ? topics.filter((topic) => topic.chapterId === selectedChapter) : []

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Questions for Test Series: {testSeries?.title || "Loading..."}</h1>

      {/* Select Subject, Chapter, Topic */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block mb-1">Subject*</label>
            <select
              value={selectedSubject}
              onChange={handleSubjectChange}
              className="border p-2 rounded w-full"
              required
            >
              <option value="">--Choose--</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">Chapter*</label>
            <select
              value={selectedChapter}
              onChange={handleChapterChange}
              className="border p-2 rounded w-full"
              disabled={!selectedSubject}
              required
            >
              <option value="">--Choose--</option>
              {filteredChapters.map((chapter) => (
                <option key={chapter._id} value={chapter._id}>
                  {chapter.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">Topic*</label>
            <select
              value={selectedTopic}
              onChange={handleTopicChange}
              className="border p-2 rounded w-full"
              disabled={!selectedChapter}
              required
            >
              <option value="">--Choose--</option>
              {filteredTopics.map((topic) => (
                <option key={topic._id} value={topic._id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Questions List */}
        {selectedTopic && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Available Questions</h3>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : questions.length === 0 ? (
              <div className="text-center py-4">No questions found for this topic</div>
            ) : (
              <>
                <div className="overflow-y-auto max-h-60 border rounded">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="w-10 py-2 px-4 border-b text-left">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedQuestions(questions.map((q) => q._id))
                              } else {
                                setSelectedQuestions([])
                              }
                            }}
                            checked={selectedQuestions.length === questions.length && questions.length > 0}
                          />
                        </th>
                        <th className="py-2 px-4 border-b text-left">No.</th>
                        <th className="py-2 px-4 border-b text-left">Question Text</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((question, index) => (
                        <tr key={question._id} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b">
                            <input
                              type="checkbox"
                              checked={selectedQuestions.includes(question._id)}
                              onChange={() => handleQuestionSelection(question._id)}
                            />
                          </td>
                          <td className="py-2 px-4 border-b">{index + 1}</td>
                          <td className="py-2 px-4 border-b">{question.questionText}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-right">
                  <button
                    onClick={handleAddQuestions}
                    disabled={selectedQuestions.length === 0 || loading}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
                  >
                    {loading ? "Adding..." : `Add Selected Questions (${selectedQuestions.length})`}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Test Series Questions */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-semibold mb-4">Test Series Questions</h2>

        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : testSeriesQuestions.length === 0 ? (
          <div className="text-center py-4">No questions added to this test series yet</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 border-b text-left">No.</th>
                    <th className="py-2 px-4 border-b text-left">Question Text</th>
                    <th className="py-2 px-4 border-b text-left">Options</th>
                    <th className="py-2 px-4 border-b text-left">Right Answer</th>
                    <th className="py-2 px-4 border-b text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {testSeriesQuestions.map((item, index) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{(page - 1) * limit + index + 1}</td>
                      <td className="py-2 px-4 border-b">{item.questionId.questionText}</td>
                      <td className="py-2 px-4 border-b">
                        <ul className="list-disc list-inside">
                          <li>{item.questionId.option1}</li>
                          <li>{item.questionId.option2}</li>
                          <li>{item.questionId.option3}</li>
                          <li>{item.questionId.option4}</li>
                          {item.questionId.option5 && <li>{item.questionId.option5}</li>}
                        </ul>
                      </td>
                      <td className="py-2 px-4 border-b">{item.questionId[item.questionId.rightAnswer]}</td>
                      <td className="py-2 px-4 border-b">
                        <button
                          onClick={() => handleRemoveQuestions(item.questionId._id)}
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <div>
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * limit >= total}
                  className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default TestSeriesQuestions
