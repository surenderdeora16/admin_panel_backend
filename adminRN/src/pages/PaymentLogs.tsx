"use client"

import { useState, useEffect } from "react"
import * as Yup from "yup"
import DataManager from "../components/DataManager"
import AxiosHelper from "../helper/AxiosHelper"
import { motion } from "framer-motion"
import { ArrowTrendingUpIcon, BanknotesIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline"

const Payments = () => {
  const [stats, setStats] = useState<{
    totalRevenue: number
    totalPayments: number
    successfulPayments: number
    failedPayments: number
    revenueByItemType: Array<{ _id: string; totalAmount: number; count: number }>
  } | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await AxiosHelper.getData("payments/statistics")
        setStats(response.data.data)
      } catch (error) {
        console.error("Error loading payment statistics:", error)
      }
    }
    loadStats()
  }, [])

  const StatCard = ({ icon: Icon, title, value, color }: any) => (
    <motion.div
      whileHover={{ y: -5 }}
      className={`p-6 rounded-2xl bg-gradient-to-br ${color} shadow-lg`}
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white/10 rounded-xl">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="space-y-8 p-10">
      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={BanknotesIcon}
          title="Total Revenue"
          value={`₹${stats?.totalRevenue?.toLocaleString() || 0}`}
          color="from-purple-600 to-purple-400"
        />
        <StatCard
          icon={ArrowTrendingUpIcon}
          title="Total Payments"
          value={stats?.totalPayments?.toLocaleString() || 0}
          color="from-blue-600 to-blue-400"
        />
        <StatCard
          icon={CheckCircleIcon}
          title="Successful Payments"
          value={stats?.successfulPayments?.toLocaleString() || 0}
          color="from-green-600 to-green-400"
        />
        <StatCard
          icon={XCircleIcon}
          title="Failed Payments"
          value={stats?.failedPayments?.toLocaleString() || 0}
          color="from-red-600 to-red-400"
        />
      </div>

      {/* Revenue Breakdown */}
      {stats?.revenueByItemType?.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.revenueByItemType.map((item) => (
              <div
                key={item._id}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium capitalize">{item._id}</span>
                  <span className="text-purple-600 font-semibold">
                    ₹{item.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {item.count} transactions
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Payments List */}
      <DataManager
        title="Payments Management"
        itemName="Payment"
        endpoints={{
          list: "/payments"
        }}
        validationSchema={Yup.object()} // Dummy schema
        formFields={[]} // Dummy fields
        tableColumns={[
          {
            header: "Order Number",
            accessor: "orderId.orderNumber",
            sortable: true,
            render: (value, item) => (
                <div className="flex items-center gap-3">
                    <p className="text-base font-medium text-gray-500">{item.orderId?.orderNumber}</p>
                </div>
              )
          },
          {
            header: "User",
            accessor: "userId.name",
            sortable: true,
            render: (value, item) => (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white">
                  {item.userId?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{value}</p>
                  <p className="text-gray-500">{item.userId?.email}</p>
                </div>
              </div>
            )
          },
          {
            header: "Amount",
            accessor: "amount",
            sortable: true,
            render: (value) => (
              <span className="font-mono">₹{value.toLocaleString()}</span>
            )
          },
          {
            header: "Status",
            accessor: "status",
            sortable: true,
            render: (value) => (
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  value === "CAPTURED"
                    ? "bg-green-100 text-green-800"
                    : value === "FAILED"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {value.charAt(0) + value.slice(1).toLowerCase()}
              </span>
            )
          },
          {
            header: "Payment Method",
            accessor: "method",
            render: (value) => (
              <div className="capitalize">
                {value?.replace(/_/g, ' ').toLowerCase()}
              </div>
            )
          },
          {
            header: "Date",
            accessor: "createdAt",
            sortable: true,
            render: (value) => new Date(value).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })
          }
        ]}
        initialFormValues={{}}
        showPagination={true}
        showAdd={false}
        showEdit={false}
        showDelete={false}
      />
    </div>
  )
}

export default Payments