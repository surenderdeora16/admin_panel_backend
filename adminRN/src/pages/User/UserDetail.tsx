import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { toast } from "react-toastify"
import { FaArrowLeft } from "react-icons/fa"
import AxiosHelper from "../../helper/AxiosHelper"

const UserDetail = () => {
const { id } = useParams()
const [user, setUser] = useState(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  const fetchUserDetail = async () => {
    try {
      setLoading(true)
      const response = await AxiosHelper.getData(`users/${id}`)
      setUser(response.data.data)
    } catch (error) {
      console.error("Error fetching user detail:", error)
      setError("Failed to fetch user detail")
      toast.error("Failed to fetch user detail")
    } finally {
      setLoading(false)
    }
  }

  fetchUserDetail()
}, [id])

if (loading) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {/* <Loader size="large" /> */}
      Loading...
    </div>
  )
}

if (error) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-red-500">{error}</div>
    </div>
  )
}

return (
  <div className="container mx-auto p-4">
    <Link to="/users" className="flex items-center mb-4 text-blue-500 hover:text-blue-700">
      <FaArrowLeft className="mr-2" />
      Back to Users
    </Link>

    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">User Detail</h1>

      {user && (
        <>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-700">User Information</h2>
            <p>Name: {user.user.name}</p>
            <p>Email: {user.user.email}</p>
            {/* Add more user details here */}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-700">Purchases</h2>
            {user.purchases.length > 0 ? (
              <ul>
                {user.purchases.map((purchase) => (
                  <li key={purchase._id} className="mb-2">
                    {purchase.itemId.title || purchase.itemId.name} (
                    {purchase.itemType === "EXAM_PLAN" ? "Exam Plan" : "Note"}) - Order #
                    {purchase.orderId.orderNumber}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No purchases found</p>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-700">Payments</h2>
            {user.payments.length > 0 ? (
              <ul>
                {user.payments.map((payment) => (
                  <li key={payment._id} className="mb-2">
                    Order #{payment.orderId.orderNumber} - Status: {payment.status} - Amount: {payment.amount}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No payments found</p>
            )}
          </div>
        </>
      )}
    </div>
  </div>
)
}

export default UserDetail
