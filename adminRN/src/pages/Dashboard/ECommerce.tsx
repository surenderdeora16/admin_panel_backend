"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  FaUsers,
  FaBookOpen,
  FaClipboardList,
  FaDollarSign,
  FaShoppingCart,
  FaChartLine,
  FaGraduationCap,
  FaFileAlt,
  FaDownload,
  FaCheckCircle,
  FaArrowUp,
  FaArrowDown,
  FaPercent,
  FaClock,
  FaAward,
  FaMoneyBillWave,
  FaUserCheck,
  FaDatabase,
  FaRocket,
  FaStar,
  FaHeart,
  FaThumbsUp,
  FaFire,
  FaLightbulb,
  FaMagic,
  FaGem,
  FaCrown,
  FaTrophy,
  FaMedal,
  FaGlobe,
  FaGift,
  FaLock,
  FaQuestionCircle,
} from "react-icons/fa"
import ChartOne from "../../components/Charts/ChartOne"
import ChartTwo from "../../components/Charts/ChartTwo"
import ChartThree from "../../components/Charts/ChartThree"
import AxiosHelper from "../../helper/AxiosHelper"
import { toast } from "react-toastify"
import { PiTrendUpBold } from "react-icons/pi"
import { TbTargetArrow } from "react-icons/tb"
import { IoShieldSharp } from "react-icons/io5"
import { RiRefreshFill } from "react-icons/ri"

interface DashboardOverview {
  totalUsers: number
  totalExamPlans: number
  totalTestSeries: number
  totalExams: number
  totalOrders: number
  totalRevenue: number
  totalNotes: number
  totalCoupons: number
  activeUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  ordersToday: number
  ordersThisWeek: number
  ordersThisMonth: number
  revenueToday: number
  revenueThisWeek: number
  revenueThisMonth: number
  avgOrderValue: number
  totalFreeNotes: number
  totalPaidNotes: number
  activeCoupons: number
  usedCoupons: number
  conversionRate: string
  userGrowthRate: string
  revenueGrowthRate: string
}

interface UserAnalytics {
  userRegistrationTrend: Array<{
    _id: { year: number; month: number; day: number }
    count: number
  }>
  monthlyUserGrowth: Array<{
    _id: { year: number; month: number }
    count: number
  }>
  demographics: {
    gender: Array<{ _id: string; count: number }>
    age: Array<{ _id: string; count: number }>
    location: Array<{ _id: string; count: number }>
    device: Array<{ _id: string; count: number }>
  }
  activityPattern: Array<{ _id: number; count: number }>
  retention: Array<{ _id: string; count: number }>
}

interface RevenueAnalytics {
  revenueTrend: Array<{
    _id: { year: number; month: number; day: number }
    revenue: number
    orders: number
    avgOrderValue: number
  }>
  monthlyRevenue: Array<{
    _id: { year: number; month: number }
    revenue: number
    orders: number
    avgOrderValue: number
  }>
  revenueByExamPlan: Array<{
    _id: string
    name: string
    revenue: number
    orders: number
    avgPrice: number
  }>
  paymentMethodAnalysis: Array<{
    _id: string
    count: number
    revenue: number
    avgAmount: number
  }>
  couponAnalysis: Array<{
    _id: string
    code: string
    usageCount: number
    totalDiscount: number
    avgDiscount: number
  }>
  revenueByStatus: Array<{
    _id: string
    count: number
    revenue: number
  }>
}

interface ExamAnalytics {
  examParticipation: Array<{
    _id: { year: number; month: number; day: number }
    totalExams: number
    completedExams: number
    avgScore: number
  }>
  monthlyExamTrends: Array<{
    _id: { year: number; month: number }
    totalExams: number
    completedExams: number
    avgScore: number
  }>
  performanceByTestSeries: Array<{
    _id: string
    name: string
    totalAttempts: number
    completedAttempts: number
    avgScore: number
    maxScore: number
    minScore: number
    completionRate: number
  }>
  scoreDistribution: Array<{ _id: string; count: number; avgScore: number }>
  examStatusDistribution: Array<{ _id: string; count: number; avgScore: number }>
  timeAnalysis: {
    avgTimeTaken: number
    minTimeTaken: number
    maxTimeTaken: number
    totalExams: number
  }
}

interface ContentAnalytics {
  popularExamPlans: Array<{
    _id: string
    name: string
    price: number
    purchases: number
    revenue: number
    avgRating: number
  }>
  testSeriesEngagement: Array<{
    _id: string
    name: string
    totalQuestions: number
    totalAttempts: number
    completedExams: number
    avgScore: number
    completionRate: number
    engagementRate: number
  }>
  notesAnalytics: Array<{
    _id: string
    examPlanName: string
    totalNotes: number
    freeNotes: number
    paidNotes: number
    avgFileSize: number
  }>
  contentSummary: {
    totalExamPlans: number
    totalTestSeries: number
    totalNotes: number
    totalFreeNotes: number
    totalPaidNotes: number
    totalQuestions: number
  }
}

const ECommerce: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null)
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null)
  const [examAnalytics, setExamAnalytics] = useState<ExamAnalytics | null>(null)
  const [contentAnalytics, setContentAnalytics] = useState<ContentAnalytics | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    fetchDashboardData()
    // Auto refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const [overviewRes, userRes, revenueRes, examRes, contentRes] = await Promise.all([
        AxiosHelper.getData("analytics/overview"),
        AxiosHelper.getData("analytics/users"),
        AxiosHelper.getData("analytics/revenue"),
        AxiosHelper.getData("analytics/exams"),
        AxiosHelper.getData("analytics/content"),
      ])

      if (overviewRes?.data?.status) {
        setOverview(overviewRes.data.data)
      }

      if (userRes?.data?.status) {
        setUserAnalytics(userRes.data.data)
      }

      if (revenueRes?.data?.status) {
        setRevenueAnalytics(revenueRes.data.data)
      }

      if (examRes?.data?.status) {
        setExamAnalytics(examRes.data.data)
      }

      if (contentRes?.data?.status) {
        setContentAnalytics(contentRes.data.data)
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
    toast.success("Dashboard refreshed successfully")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return new Intl.NumberFormat("en-IN").format(num)
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getGrowthColor = (rate: number) => {
    if (rate > 0) return "text-green-500"
    if (rate < 0) return "text-red-500"
    return "text-gray-500"
  }

  const getGrowthIcon = (rate: number) => {
    if (rate > 0) return <FaArrowUp className="w-3 h-3" />
    if (rate < 0) return <FaArrowDown className="w-3 h-3" />
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-primary mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Loading Analytics</h3>
          <p className="text-gray-500 dark:text-gray-400">Fetching your dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Enhanced Header Section */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <FaChartLine className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Last updated: {lastUpdated.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <FaCheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">System Healthy</span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <RiRefreshFill className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              <FaDownload className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent"></div>
          <div className="relative p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FaUsers className="h-8 w-8" />
              </div>
              <div className="text-right">
                <div
                  className={`flex items-center gap-1 ${getGrowthColor(Number.parseFloat(overview?.userGrowthRate || "0"))}`}
                >
                  {getGrowthIcon(Number.parseFloat(overview?.userGrowthRate || "0"))}
                  <span className="text-sm font-medium text-white/80">{overview?.userGrowthRate}% this month</span>
                </div>
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-2">{formatNumber(overview?.totalUsers || 0)}</h3>
            <p className="text-blue-100 mb-3">Total Users</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-200">Active: {formatNumber(overview?.activeUsers || 0)}</span>
              <span className="text-blue-200">Today: +{overview?.newUsersToday || 0}</span>
            </div>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-transparent"></div>
          <div className="relative p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FaDollarSign className="h-8 w-8" />
              </div>
              <div className="text-right">
                <div
                  className={`flex items-center gap-1 ${getGrowthColor(Number.parseFloat(overview?.revenueGrowthRate || "0"))}`}
                >
                  {getGrowthIcon(Number.parseFloat(overview?.revenueGrowthRate || "0"))}
                  <span className="text-sm font-medium text-white/80">{overview?.revenueGrowthRate}% this month</span>
                </div>
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-2">{formatCurrency(overview?.totalRevenue || 0)}</h3>
            <p className="text-green-100 mb-3">Total Revenue</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-200">Avg Order: {formatCurrency(overview?.avgOrderValue || 0)}</span>
              <span className="text-green-200">Today: {formatCurrency(overview?.revenueToday || 0)}</span>
            </div>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-transparent"></div>
          <div className="relative p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FaShoppingCart className="h-8 w-8" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <PiTrendUpBold className="w-3 h-3 text-white/80" />
                  <span className="text-sm font-medium text-white/80">{overview?.ordersThisMonth || 0} this month</span>
                </div>
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-2">{formatNumber(overview?.totalOrders || 0)}</h3>
            <p className="text-purple-100 mb-3">Total Orders</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-200">This Week: {overview?.ordersThisWeek || 0}</span>
              <span className="text-purple-200">Today: {overview?.ordersToday || 0}</span>
            </div>
          </div>
        </div>

        {/* Conversion Rate Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-transparent"></div>
          <div className="relative p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FaPercent className="h-8 w-8" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <TbTargetArrow className="w-3 h-3 text-white/80" />
                  <span className="text-sm font-medium text-white/80">Conversion</span>
                </div>
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-2">{overview?.conversionRate || 0}%</h3>
            <p className="text-orange-100 mb-3">Conversion Rate</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-orange-200">Target: 5%</span>
              <span className="text-orange-200">
                {Number.parseFloat(overview?.conversionRate || "0") >= 5 ? "✅ Good" : "⚠️ Low"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
              <FaBookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <FaRocket className="h-5 w-5 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {formatNumber(overview?.totalExamPlans || 0)}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Exam Plans</p>
          <div className="mt-3 text-xs text-gray-500">Active learning programs</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl">
              <FaClipboardList className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <FaFire className="h-5 w-5 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {formatNumber(overview?.totalTestSeries || 0)}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Test Series</p>
          <div className="mt-3 text-xs text-gray-500">Practice assessments</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl">
              <FaGraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <FaTrophy className="h-5 w-5 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {formatNumber(overview?.totalExams || 0)}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Exams Conducted</p>
          <div className="mt-3 text-xs text-gray-500">Total assessments</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-xl">
              <FaFileAlt className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <FaGem className="h-5 w-5 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {formatNumber(overview?.totalNotes || 0)}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Study Notes</p>
          <div className="mt-3 text-xs text-gray-500">
            Free: {overview?.totalFreeNotes || 0} | Paid: {overview?.totalPaidNotes || 0}
          </div>
        </div>
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Revenue Chart */}
        {revenueAnalytics?.monthlyRevenue && revenueAnalytics.monthlyRevenue.length > 0 && (
          <div className="col-span-12 xl:col-span-8">
            <ChartOne
              data={revenueAnalytics.monthlyRevenue.map((item) => ({
                _id: { year: item._id.year, month: item._id.month, day: 1 },
                revenue: item.revenue,
                orders: item.orders,
                avgOrderValue: item.avgOrderValue,
              }))}
              title="Monthly Revenue Trends"
              subtitle="Revenue and order analysis over time"
            />
          </div>
        )}

        {/* User Growth Chart */}
        {userAnalytics?.monthlyUserGrowth && userAnalytics.monthlyUserGrowth.length > 0 && (
          <div className="col-span-12 xl:col-span-4">
            <ChartTwo
              data={userAnalytics.monthlyUserGrowth.map((item) => ({
                _id: { year: item._id.year, month: item._id.month, day: 1 },
                count: item.count,
              }))}
              title="User Growth"
              subtitle="Monthly user registrations"
            />
          </div>
        )}

        {/* Score Distribution Chart */}
        {examAnalytics?.scoreDistribution && examAnalytics.scoreDistribution.length > 0 && (
          <div className="col-span-12 xl:col-span-6">
            <ChartThree
              data={examAnalytics.scoreDistribution}
              title="Score Distribution"
              subtitle="Student performance analysis"
            />
          </div>
        )}

        {/* Top Performing Exam Plans */}
        {revenueAnalytics?.revenueByExamPlan && revenueAnalytics.revenueByExamPlan.length > 0 && (
          <div className="col-span-12 xl:col-span-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Top Performing Exam Plans</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Revenue leaders</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <FaCrown className="h-6 w-6 text-white" />
                </div>
              </div>

              <div className="space-y-4">
                {revenueAnalytics.revenueByExamPlan.slice(0, 5).map((plan, index) => (
                  <div
                    key={plan._id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0
                            ? "bg-yellow-500"
                            : index === 1
                              ? "bg-gray-400"
                              : index === 2
                                ? "bg-orange-500"
                                : "bg-blue-500"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{plan.orders} purchases</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(plan.revenue)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Avg: {formatCurrency(plan.avgPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {/* User Demographics */}
        {userAnalytics?.demographics && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">User Demographics</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">User distribution analysis</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl">
                <FaUsers className="h-6 w-6 text-white" />
              </div>
            </div>

            <div className="space-y-6">
              {/* Gender Distribution */}
              {userAnalytics.demographics.gender && userAnalytics.demographics.gender.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <FaHeart className="h-4 w-4 text-pink-500" />
                    Gender Distribution
                  </h5>
                  <div className="space-y-2">
                    {userAnalytics.demographics.gender.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item._id || "Not specified"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {formatNumber(item.count)}
                          </span>
                          <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-pink-500 h-2 rounded-full"
                              style={{
                                width: `${(item.count / (overview?.totalUsers || 1)) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Locations */}
              {userAnalytics.demographics.location && userAnalytics.demographics.location.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <FaGlobe className="h-4 w-4 text-blue-500" />
                    Top Locations
                  </h5>
                  <div className="space-y-2">
                    {userAnalytics.demographics.location.slice(0, 5).map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item._id}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {formatNumber(item.count)}
                          </span>
                          <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${(item.count / (overview?.totalUsers || 1)) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Exam Performance Metrics */}
        {examAnalytics?.performanceByTestSeries && examAnalytics.performanceByTestSeries.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Test Series Performance</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Top performing test series</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                <FaAward className="h-6 w-6 text-white" />
              </div>
            </div>

            <div className="space-y-4">
              {examAnalytics.performanceByTestSeries.slice(0, 5).map((series, index) => (
                <div
                  key={series._id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-gray-900 dark:text-white">{series.name}</h5>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {series.avgScore?.toFixed(1)}% avg
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Attempts: </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatNumber(series.totalAttempts)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Completion: </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {series.completionRate?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${series.completionRate || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Methods Analysis */}
        {revenueAnalytics?.paymentMethodAnalysis && revenueAnalytics.paymentMethodAnalysis.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Payment Methods</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Revenue by payment type</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl">
                <FaMoneyBillWave className="h-6 w-6 text-white" />
              </div>
            </div>

            <div className="space-y-4">
              {revenueAnalytics.paymentMethodAnalysis.map((method) => (
                <div
                  key={method._id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                >
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white capitalize">
                      {method._id || "Unknown"}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatNumber(method.count)} transactions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600 dark:text-purple-400">{formatCurrency(method.revenue)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg: {formatCurrency(method.avgAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced System Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FaClock className="h-6 w-6" />
            </div>
            <FaLightbulb className="h-5 w-5 text-white/60" />
          </div>
          <h3 className="text-2xl font-bold mb-2">
            {examAnalytics?.timeAnalysis?.avgTimeTaken ? formatTime(examAnalytics.timeAnalysis.avgTimeTaken) : "N/A"}
          </h3>
          <p className="text-cyan-100 mb-3">Avg. Exam Time</p>
          <div className="text-sm text-cyan-200">
            Total Exams: {formatNumber(examAnalytics?.timeAnalysis?.totalExams || 0)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FaUserCheck className="h-6 w-6" />
            </div>
            <FaThumbsUp className="h-5 w-5 text-white/60" />
          </div>
          <h3 className="text-2xl font-bold mb-2">
            {examAnalytics?.examStatusDistribution?.find((status) => status._id === "completed")
              ? `${Math.round(
                  ((examAnalytics.examStatusDistribution.find((status) => status._id === "completed")?.count || 0) /
                    (examAnalytics.examStatusDistribution.reduce((acc, curr) => acc + curr.count, 0) || 1)) *
                    100,
                )}%`
              : "N/A"}
          </h3>
          <p className="text-emerald-100 mb-3">Completion Rate</p>
          <div className="text-sm text-emerald-200">
            Completed:{" "}
            {formatNumber(
              examAnalytics?.examStatusDistribution?.find((status) => status._id === "completed")?.count || 0,
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FaStar className="h-6 w-6" />
            </div>
            <FaMagic className="h-5 w-5 text-white/60" />
          </div>
          <h3 className="text-2xl font-bold mb-2">
            {examAnalytics?.examStatusDistribution?.find((status) => status._id === "completed")?.avgScore
              ? `${Math.round(examAnalytics.examStatusDistribution.find((status) => status._id === "completed")?.avgScore || 0)}%`
              : "N/A"}
          </h3>
          <p className="text-amber-100 mb-3">Avg. Score</p>
          <div className="text-sm text-amber-200">Performance metric</div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <IoShieldSharp className="h-6 w-6" />
            </div>
            <FaMedal className="h-5 w-5 text-white/60" />
          </div>
          <h3 className="text-2xl font-bold mb-2">
            {revenueAnalytics?.revenueByStatus?.find((status) => status._id === "completed")
              ? `${Math.round(
                  ((revenueAnalytics.revenueByStatus.find((status) => status._id === "completed")?.count || 0) /
                    (revenueAnalytics.revenueByStatus.reduce((acc, curr) => acc + curr.count, 0) || 1)) *
                    100,
                )}%`
              : "N/A"}
          </h3>
          <p className="text-rose-100 mb-3">Payment Success</p>
          <div className="text-sm text-rose-200">Success Rate</div>
        </div>
      </div>

      {/* Content Analytics Summary */}
      {contentAnalytics?.contentSummary && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Content Overview</h4>
              <p className="text-gray-600 dark:text-gray-400">Complete content analytics summary</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
              <FaDatabase className="h-8 w-8 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="p-3 bg-blue-500 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <FaBookOpen className="h-6 w-6 text-white" />
              </div>
              <h5 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {formatNumber(contentAnalytics.contentSummary.totalExamPlans)}
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Exam Plans</p>
            </div>

            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="p-3 bg-green-500 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <FaClipboardList className="h-6 w-6 text-white" />
              </div>
              <h5 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {formatNumber(contentAnalytics.contentSummary.totalTestSeries)}
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Test Series</p>
            </div>

            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <div className="p-3 bg-purple-500 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <FaFileAlt className="h-6 w-6 text-white" />
              </div>
              <h5 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {formatNumber(contentAnalytics.contentSummary.totalNotes)}
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Study Notes</p>
            </div>

            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
              <div className="p-3 bg-yellow-500 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <FaGift className="h-6 w-6 text-white" />
              </div>
              <h5 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                {formatNumber(contentAnalytics.contentSummary.totalFreeNotes)}
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Free Notes</p>
            </div>

            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <div className="p-3 bg-red-500 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <FaLock className="h-6 w-6 text-white" />
              </div>
              <h5 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                {formatNumber(contentAnalytics.contentSummary.totalPaidNotes)}
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Paid Notes</p>
            </div>

            <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <div className="p-3 bg-indigo-500 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <FaQuestionCircle className="h-6 w-6 text-white" />
              </div>
              <h5 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                {formatNumber(contentAnalytics.contentSummary.totalQuestions)}
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Questions</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <FaRocket className="h-6 w-6 text-white" />
            </div>
            <div>
              <h5 className="font-bold text-gray-900 dark:text-white">LMS Analytics Dashboard</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Powered by advanced analytics • Real-time data • Auto-refresh enabled
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Live</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last sync: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ECommerce
