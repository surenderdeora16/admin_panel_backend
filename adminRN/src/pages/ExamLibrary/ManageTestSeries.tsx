"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import AxiosHelper from '../../helper/AxiosHelper';


const ManageTestSeries = () => {
  const [testSeries, setTestSeries] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState("")

  // Fetch test series
  const fetchTestSeries = async () => {
    try {
      setLoading(true)
      const params = {
        page,
        limit,
        search: search || undefined,
        examId: selectedExam || undefined,
      }

      const res = await AxiosHelper.getData("test-series", params )
      setTestSeries(res.data.data)
      setTotal(res.data.pagination.total)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching test series:", error)
      toast.error("Failed to fetch test series")
      setLoading(false)
    }
  }

  // Fetch exams
  const fetchExams = async () => {
    try {
      const res = await AxiosHelper.getData("exams")
      setExams(res.data.data)
    } catch (error) {
      console.error("Error fetching exams:", error)
      toast.error("Failed to fetch exams")
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchTestSeries()
    fetchExams()
  }, [page, limit, selectedExam])

  // Handle search
  const handleSearch = () => {
    setPage(1)
    fetchTestSeries()
  }

  // Handle delete test series
  const handleDeleteTestSeries = async (id) => {
    if (!window.confirm("Are you sure you want to delete this test series?")) {
      return
    }

    try {
      await AxiosHelper.deleteData(`/api/test-series/${id}`)
      toast.success("Test series deleted successfully")
      fetchTestSeries()
    } catch (error) {
      console.error("Error deleting test series:", error)
      toast.error("Failed to delete test series")
    }
  }

  // Handle toggle active status
  const handleToggleActive = async (id, currentStatus) => {
    try {
      await AxiosHelper.putData(`/api/test-series/${id}`, {
        isActive: !currentStatus,
      })
      toast.success(`Test series ${currentStatus ? "deactivated" : "activated"} successfully`)
      fetchTestSeries()
    } catch (error) {
      console.error("Error updating test series:", error)
      toast.error("Failed to update test series")
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Test Series</h1>
        <button
          onClick={() => (window.location.href = "/admin/test-series/create")}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Create Test Series
        </button>
      </div>

      {/* Filter Test Series */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Filter Test Series</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block mb-1">Exam</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="border p-2 rounded w-full"
            >
              <option value="">All Exams</option>
              {exams.map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">Search</label>
            <div className="flex">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border p-2 rounded-l w-full"
                placeholder="Search test series..."
              />
              <button
                onClick={handleSearch}
                className="bg-purple-600 text-white px-4 py-2 rounded-r hover:bg-purple-700"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Test Series List */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-semibold mb-4">Test Series List</h2>

        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : testSeries.length === 0 ? (
          <div className="text-center py-4">No test series found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 border-b text-left">ID</th>
                    <th className="py-2 px-4 border-b text-left">Exam</th>
                    <th className="py-2 px-4 border-b text-left">Test Series Title</th>
                    <th className="py-2 px-4 border-b text-left">Duration (min)</th>
                    <th className="py-2 px-4 border-b text-left">Negative Marks</th>
                    <th className="py-2 px-4 border-b text-left">No. of Questions</th>
                    <th className="py-2 px-4 border-b text-left">Is Free?</th>
                    <th className="py-2 px-4 border-b text-left">Is Active</th>
                    <th className="py-2 px-4 border-b text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {testSeries.map((series:any) => (
                    <tr key={series._id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{series._id}</td>
                      <td className="py-2 px-4 border-b">{series.examId?.name || "N/A"}</td>
                      <td className="py-2 px-4 border-b">{series.title}</td>
                      <td className="py-2 px-4 border-b">{series.duration}</td>
                      <td className="py-2 px-4 border-b">{series.negativeMarks}</td>
                      <td className="py-2 px-4 border-b">{series.totalQuestions}</td>
                      <td className="py-2 px-4 border-b">{series.isFree ? "Yes" : "No"}</td>
                      <td className="py-2 px-4 border-b">
                        <span
                          className={`px-2 py-1 rounded text-white ${series.isActive ? "bg-green-500" : "bg-red-500"}`}
                        >
                          {series.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => (window.location.href = `/admin/test-series/manage-questions/${series._id}`)}
                            className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                            title="Manage Questions"
                          >
                            Manage Questions
                          </button>
                          <button
                            onClick={() => (window.location.href = `/admin/test-series/edit/${series._id}`)}
                            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleActive(series._id, series.isActive)}
                            className={`${
                              series.isActive ? "bg-orange-500 hover:bg-orange-600" : "bg-green-500 hover:bg-green-600"
                            } text-white px-2 py-1 rounded`}
                            title={series.isActive ? "Deactivate" : "Activate"}
                          >
                            {series.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleDeleteTestSeries(series._id)}
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                            title="Delete"
                          >
                            Delete
                          </button>
                        </div>
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

export default ManageTestSeries
