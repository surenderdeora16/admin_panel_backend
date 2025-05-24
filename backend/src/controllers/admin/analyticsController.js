const User = require("../../models/User")
const ExamPlan = require("../../models/ExamPlan")
const TestSeries = require("../../models/TestSeries")
const Exam = require("../../models/Exam")
const Order = require("../../models/Order")
const Note = require("../../models/Note")
const Coupon = require("../../models/Coupon")
const CouponUsage = require("../../models/CouponUsage")
const catchAsync = require("../../utils/catchAsync")
const mongoose = require("mongoose")

// Dashboard Overview - Total Data
exports.getDashboardOverview = catchAsync(async (req, res, next) => {
  try {
    const today = new Date()
    const startOfToday = new Date(today.setHours(0, 0, 0, 0))
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Get all basic counts
    const [
      totalUsers,
      totalExamPlans,
      totalTestSeries,
      totalExams,
      totalCompletedOrders,
      totalRevenue,
      totalNotes,
      totalCoupons,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      avgOrderValue,
      totalFreeNotes,
      totalPaidNotes,
      activeCoupons,
      usedCoupons,
    ] = await Promise.all([
      // Basic counts
      User.countDocuments({ role: "student" }),
      ExamPlan.countDocuments(),
      TestSeries.countDocuments(),
      Exam.countDocuments(),
      Order.countDocuments({ status: "completed" }),

      // Total revenue
      Order.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$finalAmount" } } },
      ]),

      // Notes and coupons
      Note.countDocuments(),
      Coupon.countDocuments(),

      // Active users (logged in last 30 days)
      User.countDocuments({
        role: "student",
        lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),

      // New users today
      User.countDocuments({
        role: "student",
        createdAt: { $gte: startOfToday },
      }),

      // New users this week
      User.countDocuments({
        role: "student",
        createdAt: { $gte: startOfWeek },
      }),

      // New users this month
      User.countDocuments({
        role: "student",
        createdAt: { $gte: startOfMonth },
      }),

      // Orders today
      Order.countDocuments({
        status: "completed",
        createdAt: { $gte: startOfToday },
      }),

      // Orders this week
      Order.countDocuments({
        status: "completed",
        createdAt: { $gte: startOfWeek },
      }),

      // Orders this month
      Order.countDocuments({
        status: "completed",
        createdAt: { $gte: startOfMonth },
      }),

      // Revenue today
      Order.aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: startOfToday },
          },
        },
        { $group: { _id: null, total: { $sum: "$finalAmount" } } },
      ]),

      // Revenue this week
      Order.aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: startOfWeek },
          },
        },
        { $group: { _id: null, total: { $sum: "$finalAmount" } } },
      ]),

      // Revenue this month
      Order.aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$finalAmount" } } },
      ]),

      // Average order value
      Order.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, avg: { $avg: "$finalAmount" } } }]),

      // Free notes
      Note.countDocuments({ isFree: true }),

      // Paid notes
      Note.countDocuments({ isFree: false }),

      // Active coupons
      Coupon.countDocuments({
        isActive: true,
        validFrom: { $lte: new Date() },
        validTo: { $gte: new Date() },
      }),

      // Used coupons
      CouponUsage.countDocuments(),
    ])

    const overview = {
      // Basic metrics
      totalUsers,
      totalExamPlans,
      totalTestSeries,
      totalExams,
      totalOrders: totalCompletedOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalNotes,
      totalCoupons,

      // User metrics
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,

      // Order metrics
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,

      // Revenue metrics
      revenueToday: revenueToday[0]?.total || 0,
      revenueThisWeek: revenueThisWeek[0]?.total || 0,
      revenueThisMonth: revenueThisMonth[0]?.total || 0,
      avgOrderValue: avgOrderValue[0]?.avg || 0,

      // Content metrics
      totalFreeNotes,
      totalPaidNotes,

      // Coupon metrics
      activeCoupons,
      usedCoupons,

      // Calculated metrics
      conversionRate: totalUsers > 0 ? ((totalCompletedOrders / totalUsers) * 100).toFixed(2) : 0,
      userGrowthRate: totalUsers > 0 ? ((newUsersThisMonth / totalUsers) * 100).toFixed(2) : 0,
      revenueGrowthRate:
        totalRevenue[0]?.total > 0 ? (((revenueThisMonth[0]?.total || 0) / totalRevenue[0].total) * 100).toFixed(2) : 0,
    }

    res.success(overview, "Dashboard overview retrieved successfully")
  } catch (error) {
    res.someThingWentWrong(error)
  }
})

// User Analytics - Total Data
exports.getUserAnalytics = catchAsync(async (req, res, next) => {
  try {
    // User registration trends (last 30 days for trend)
    const userRegistrationTrend = await User.aggregate([
      {
        $match: {
          role: "student",
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ])

    // User demographics - All time
    const [genderDistribution, ageDistribution, locationDistribution, deviceDistribution] = await Promise.all([
      User.aggregate([
        { $match: { role: "student" } },
        { $group: { _id: "$gender", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.aggregate([
        { $match: { role: "student", dateOfBirth: { $exists: true, $ne: null } } },
        {
          $addFields: {
            age: {
              $floor: {
                $divide: [{ $subtract: [new Date(), "$dateOfBirth"] }, 365.25 * 24 * 60 * 60 * 1000],
              },
            },
          },
        },
        {
          $bucket: {
            groupBy: "$age",
            boundaries: [0, 18, 25, 35, 45, 60, 100],
            default: "60+",
            output: { count: { $sum: 1 } },
          },
        },
      ]),
      User.aggregate([
        { $match: { role: "student", "address.state": { $exists: true, $ne: null } } },
        { $group: { _id: "$address.state", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      User.aggregate([
        { $match: { role: "student", deviceInfo: { $exists: true } } },
        { $group: { _id: "$deviceInfo.type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ])

    // User activity patterns - All time
    const userActivityPattern = await User.aggregate([
      { $match: { role: "student", lastLogin: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: { $hour: "$lastLogin" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // User retention analysis - All time
    const retentionAnalysis = await User.aggregate([
      { $match: { role: "student" } },
      {
        $addFields: {
          daysSinceRegistration: {
            $floor: {
              $divide: [{ $subtract: [new Date(), "$createdAt"] }, 24 * 60 * 60 * 1000],
            },
          },
          daysSinceLastLogin: {
            $cond: {
              if: { $ne: ["$lastLogin", null] },
              then: {
                $floor: {
                  $divide: [{ $subtract: [new Date(), "$lastLogin"] }, 24 * 60 * 60 * 1000],
                },
              },
              else: 9999,
            },
          },
        },
      },
      {
        $bucket: {
          groupBy: "$daysSinceLastLogin",
          boundaries: [0, 1, 7, 30, 90, 365, 9999],
          default: "Never logged in",
          output: { count: { $sum: 1 } },
        },
      },
    ])

    // Monthly user growth
    const monthlyUserGrowth = await User.aggregate([
      {
        $match: {
          role: "student",
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ])

    const analytics = {
      userRegistrationTrend,
      monthlyUserGrowth,
      demographics: {
        gender: genderDistribution,
        age: ageDistribution,
        location: locationDistribution,
        device: deviceDistribution,
      },
      activityPattern: userActivityPattern,
      retention: retentionAnalysis,
    }

    res.success(analytics, "User analytics retrieved successfully")
  } catch (error) {
    res.someThingWentWrong(error)
  }
})

// Revenue Analytics - Total Data
exports.getRevenueAnalytics = catchAsync(async (req, res, next) => {
  try {
    // Revenue trends (last 30 days for trend)
    const revenueTrend = await Order.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          revenue: { $sum: "$finalAmount" },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: "$finalAmount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ])

    // Revenue by exam plan - All time
    const revenueByExamPlan = await Order.aggregate([
      {
        $match: {
          status: "completed",
          examPlanId: { $exists: true, $ne: null },
        },
      },
      {
        $lookup: {
          from: "examplans",
          localField: "examPlanId",
          foreignField: "_id",
          as: "examPlan",
        },
      },
      { $unwind: "$examPlan" },
      {
        $group: {
          _id: "$examPlan._id",
          name: { $first: "$examPlan.name" },
          revenue: { $sum: "$finalAmount" },
          orders: { $sum: 1 },
          avgPrice: { $avg: "$finalAmount" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ])

    // Payment method analysis - All time
    const paymentMethodAnalysis = await Order.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          revenue: { $sum: "$finalAmount" },
          avgAmount: { $avg: "$finalAmount" },
        },
      },
      { $sort: { revenue: -1 } },
    ])

    // Coupon usage analysis - All time
    const couponAnalysis = await CouponUsage.aggregate([
      {
        $lookup: {
          from: "coupons",
          localField: "couponId",
          foreignField: "_id",
          as: "coupon",
        },
      },
      { $unwind: "$coupon" },
      {
        $group: {
          _id: "$coupon._id",
          code: { $first: "$coupon.code" },
          usageCount: { $sum: 1 },
          totalDiscount: { $sum: "$discountAmount" },
          avgDiscount: { $avg: "$discountAmount" },
        },
      },
      { $sort: { usageCount: -1 } },
      { $limit: 10 },
    ])

    // Monthly revenue - Last 12 months
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$finalAmount" },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: "$finalAmount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ])

    // Revenue by order status
    const revenueByStatus = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$finalAmount" },
        },
      },
      { $sort: { revenue: -1 } },
    ])

    const analytics = {
      revenueTrend,
      monthlyRevenue,
      revenueByExamPlan,
      paymentMethodAnalysis,
      couponAnalysis,
      revenueByStatus,
    }

    res.success(analytics, "Revenue analytics retrieved successfully")
  } catch (error) {
    res.someThingWentWrong(error)
  }
})

// Exam Analytics - Total Data
exports.getExamAnalytics = catchAsync(async (req, res, next) => {
  try {
    // Exam participation trends (last 30 days for trend)
    const examParticipation = await Exam.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          totalExams: { $sum: 1 },
          completedExams: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          avgScore: { $avg: "$score" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ])

    // Performance by test series - All time
    const performanceByTestSeries = await Exam.aggregate([
      {
        $lookup: {
          from: "testseries",
          localField: "testSeriesId",
          foreignField: "_id",
          as: "testSeries",
        },
      },
      { $unwind: "$testSeries" },
      {
        $group: {
          _id: "$testSeries._id",
          name: { $first: "$testSeries.name" },
          totalAttempts: { $sum: 1 },
          completedAttempts: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          avgScore: { $avg: "$score" },
          maxScore: { $max: "$score" },
          minScore: { $min: "$score" },
        },
      },
      {
        $addFields: {
          completionRate: {
            $multiply: [{ $divide: ["$completedAttempts", "$totalAttempts"] }, 100],
          },
        },
      },
      { $sort: { totalAttempts: -1 } },
      { $limit: 10 },
    ])

    // Score distribution - All time
    const scoreDistribution = await Exam.aggregate([
      { $match: { status: "completed", score: { $exists: true, $ne: null } } },
      {
        $bucket: {
          groupBy: "$score",
          boundaries: [0, 20, 40, 60, 80, 100],
          default: "100+",
          output: {
            count: { $sum: 1 },
            avgScore: { $avg: "$score" },
          },
        },
      },
    ])

    // Time analysis - All time
    const timeAnalysis = await Exam.aggregate([
      { $match: { status: "completed", timeTaken: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: null,
          avgTimeTaken: { $avg: "$timeTaken" },
          minTimeTaken: { $min: "$timeTaken" },
          maxTimeTaken: { $max: "$timeTaken" },
          totalExams: { $sum: 1 },
        },
      },
    ])

    // Exam status distribution
    const examStatusDistribution = await Exam.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgScore: { $avg: "$score" },
        },
      },
      { $sort: { count: -1 } },
    ])

    // Monthly exam trends
    const monthlyExamTrends = await Exam.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalExams: { $sum: 1 },
          completedExams: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          avgScore: { $avg: "$score" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ])

    const analytics = {
      examParticipation,
      monthlyExamTrends,
      performanceByTestSeries,
      scoreDistribution,
      examStatusDistribution,
      timeAnalysis: timeAnalysis[0] || {
        avgTimeTaken: 0,
        minTimeTaken: 0,
        maxTimeTaken: 0,
        totalExams: 0,
      },
    }

    res.success(analytics, "Exam analytics retrieved successfully")
  } catch (error) {
    res.someThingWentWrong(error)
  }
})

// Content Analytics - Total Data
exports.getContentAnalytics = catchAsync(async (req, res, next) => {
  try {
    // Most popular exam plans - All time
    const popularExamPlans = await Order.aggregate([
      { $match: { status: "completed", examPlanId: { $exists: true, $ne: null } } },
      {
        $lookup: {
          from: "examplans",
          localField: "examPlanId",
          foreignField: "_id",
          as: "examPlan",
        },
      },
      { $unwind: "$examPlan" },
      {
        $group: {
          _id: "$examPlan._id",
          name: { $first: "$examPlan.name" },
          price: { $first: "$examPlan.price" },
          purchases: { $sum: 1 },
          revenue: { $sum: "$finalAmount" },
          avgRating: { $avg: "$examPlan.rating" },
        },
      },
      { $sort: { purchases: -1 } },
      { $limit: 10 },
    ])

    // Test series engagement - All time
    const testSeriesEngagement = await TestSeries.aggregate([
      {
        $lookup: {
          from: "exams",
          localField: "_id",
          foreignField: "testSeriesId",
          as: "exams",
        },
      },
      {
        $lookup: {
          from: "testseriesquestions",
          localField: "_id",
          foreignField: "testSeriesId",
          as: "questions",
        },
      },
      {
        $addFields: {
          totalAttempts: { $size: "$exams" },
          totalQuestions: { $size: "$questions" },
          avgScore: { $avg: "$exams.score" },
          completedExams: {
            $size: {
              $filter: {
                input: "$exams",
                cond: { $eq: ["$$this.status", "completed"] },
              },
            },
          },
        },
      },
      {
        $addFields: {
          completionRate: {
            $cond: {
              if: { $gt: ["$totalAttempts", 0] },
              then: { $multiply: [{ $divide: ["$completedExams", "$totalAttempts"] }, 100] },
              else: 0,
            },
          },
          engagementRate: {
            $cond: {
              if: { $gt: ["$totalQuestions", 0] },
              then: { $multiply: [{ $divide: ["$totalAttempts", "$totalQuestions"] }, 100] },
              else: 0,
            },
          },
        },
      },
      {
        $project: {
          name: 1,
          totalQuestions: 1,
          totalAttempts: 1,
          completedExams: 1,
          avgScore: 1,
          completionRate: 1,
          engagementRate: 1,
        },
      },
      { $sort: { totalAttempts: -1 } },
      { $limit: 10 },
    ])

    // Notes analytics - All time
    const notesAnalytics = await Note.aggregate([
      {
        $lookup: {
          from: "examplans",
          localField: "examPlanId",
          foreignField: "_id",
          as: "examPlan",
        },
      },
      { $unwind: "$examPlan" },
      {
        $group: {
          _id: "$examPlan._id",
          examPlanName: { $first: "$examPlan.name" },
          totalNotes: { $sum: 1 },
          freeNotes: { $sum: { $cond: ["$isFree", 1, 0] } },
          paidNotes: { $sum: { $cond: ["$isFree", 0, 1] } },
          avgFileSize: { $avg: "$fileSize" },
        },
      },
      { $sort: { totalNotes: -1 } },
      { $limit: 10 },
    ])

    // Content summary
    const contentSummary = await Promise.all([
      ExamPlan.countDocuments(),
      TestSeries.countDocuments(),
      Note.countDocuments(),
      Note.countDocuments({ isFree: true }),
      Note.countDocuments({ isFree: false }),
      TestSeries.aggregate([
        {
          $lookup: {
            from: "testseriesquestions",
            localField: "_id",
            foreignField: "testSeriesId",
            as: "questions",
          },
        },
        {
          $group: {
            _id: null,
            totalQuestions: { $sum: { $size: "$questions" } },
          },
        },
      ]),
    ])

    const analytics = {
      popularExamPlans,
      testSeriesEngagement,
      notesAnalytics,
      contentSummary: {
        totalExamPlans: contentSummary[0],
        totalTestSeries: contentSummary[1],
        totalNotes: contentSummary[2],
        totalFreeNotes: contentSummary[3],
        totalPaidNotes: contentSummary[4],
        totalQuestions: contentSummary[5][0]?.totalQuestions || 0,
      },
    }

    res.success(analytics, "Content analytics retrieved successfully")
  } catch (error) {
    res.someThingWentWrong(error)
  }
})

module.exports = exports
