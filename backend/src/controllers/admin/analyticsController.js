const User = require("../../models/User");
const ExamPlan = require("../../models/ExamPlan");
const TestSeries = require("../../models/TestSeries");
const Exam = require("../../models/Exam");
const Order = require("../../models/Order");
const Note = require("../../models/Note");
const Coupon = require("../../models/Coupon");
const CouponUsage = require("../../models/CouponUsage");
const Payment = require("../../models/Payment");
const UserPurchase = require("../../models/UserPurchase");
const Question = require("../../models/Question");
const Subject = require("../../models/Subject");
const Chapter = require("../../models/Chapter");
const Topic = require("../../models/Topic");
const Section = require("../../models/Section");
const TestSeriesQuestion = require("../../models/TestSeriesQuestion");
const ExamQuestion = require("../../models/ExamQuestion");
const Batch = require("../../models/Batch");
const catchAsync = require("../../utils/catchAsync");
const mongoose = require("mongoose");

// Dashboard Overview - Complete Analytics
exports.getDashboardOverview = catchAsync(async (req, res, next) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(
      today.setDate(today.getDate() - today.getDay())
    );
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Parallel execution for better performance
    const [
      // Basic Counts
      totalUsers,
      totalAdmins,
      totalExamPlans,
      totalTestSeries,
      totalExams,
      totalQuestions,
      totalNotes,
      totalCoupons,
      totalBatches,
      totalSubjects,
      totalChapters,
      totalTopics,
      totalSections,

      // Order & Payment Analytics
      totalOrders,
      completedOrders,
      pendingOrders,
      failedOrders,
      totalRevenue,
      totalPayments,
      successfulPayments,

      // User Analytics
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      newUsersThisYear,

      // Order Analytics by Time
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,
      ordersThisYear,

      // Revenue Analytics by Time
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      revenueThisYear,

      // Content Analytics
      freeNotes,
      paidNotes,
      freeTestSeries,
      paidTestSeries,
      activeCoupons,
      expiredCoupons,
      usedCoupons,

      // Exam Analytics
      completedExams,
      ongoingExams,
      abandonedExams,

      // Purchase Analytics
      activePurchases,
      expiredPurchases,

      // Average calculations
      avgOrderValue,
      avgExamScore,
      avgTestSeriesDuration,
    ] = await Promise.all([
      // Basic Counts
      User.countDocuments({ deletedAt: null }),
      User.countDocuments({ role: "admin", deletedAt: null }),
      ExamPlan.countDocuments(),
      TestSeries.countDocuments(),
      Exam.countDocuments(),
      Question.countDocuments(),
      Note.countDocuments(),
      Coupon.countDocuments(),
      Batch.countDocuments(),
      Subject.countDocuments(),
      Chapter.countDocuments(),
      Topic.countDocuments(),
      Section.countDocuments(),

      // Order & Payment Analytics
      Order.countDocuments(),
      Order.countDocuments({ status: "PAID" }),
      Order.countDocuments({ status: "PENDING" }),
      Order.countDocuments({ status: "FAILED" }),
      Order.aggregate([
        { $match: { status: "PAID" } },
        { $group: { _id: null, total: { $sum: "$finalAmount" } } },
      ]),
      Payment.countDocuments(),
      Payment.countDocuments({ status: "CAPTURED" }),

      // User Analytics
      User.countDocuments({
        deletedAt: null,
        updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      User.countDocuments({
        deletedAt: null,
        createdAt: { $gte: startOfToday },
      }),
      User.countDocuments({
        deletedAt: null,
        createdAt: { $gte: startOfWeek },
      }),
      User.countDocuments({
        deletedAt: null,
        createdAt: { $gte: startOfMonth },
      }),
      User.countDocuments({
        deletedAt: null,
        createdAt: { $gte: startOfYear },
      }),

      // Order Analytics by Time
      Order.countDocuments({
        status: "PAID",
        createdAt: { $gte: startOfToday },
      }),
      Order.countDocuments({
        status: "PAID",
        createdAt: { $gte: startOfWeek },
      }),
      Order.countDocuments({
        status: "PAID",
        createdAt: { $gte: startOfMonth },
      }),
      Order.countDocuments({
        status: "PAID",
        createdAt: { $gte: startOfYear },
      }),

      // Revenue Analytics by Time
      Order.aggregate([
        {
          $match: {
            status: "PAID",
            createdAt: { $gte: startOfToday },
          },
        },
        { $group: { _id: null, total: { $sum: "$finalAmount" } } },
      ]),
      Order.aggregate([
        {
          $match: {
            status: "PAID",
            createdAt: { $gte: startOfWeek },
          },
        },
        { $group: { _id: null, total: { $sum: "$finalAmount" } } },
      ]),
      Order.aggregate([
        {
          $match: {
            status: "PAID",
            createdAt: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$finalAmount" } } },
      ]),
      Order.aggregate([
        {
          $match: {
            status: "PAID",
            createdAt: { $gte: startOfYear },
          },
        },
        { $group: { _id: null, total: { $sum: "$finalAmount" } } },
      ]),

      // Content Analytics
      Note.countDocuments({ isFree: true }),
      Note.countDocuments({ isFree: false }),
      TestSeries.countDocuments({ isFree: true }),
      TestSeries.countDocuments({ isFree: false }),
      Coupon.countDocuments({
        isActive: true,
        endDate: { $gte: new Date() },
      }),
      Coupon.countDocuments({
        $or: [{ isActive: false }, { endDate: { $lt: new Date() } }],
      }),
      CouponUsage.countDocuments(),

      // Exam Analytics
      Exam.countDocuments({ status: "COMPLETED" }),
      Exam.countDocuments({ status: "STARTED" }),
      Exam.countDocuments({ status: "ABANDONED" }),

      // Purchase Analytics
      UserPurchase.countDocuments({ status: "ACTIVE" }),
      UserPurchase.countDocuments({ status: "EXPIRED" }),

      // Average calculations
      Order.aggregate([
        { $match: { status: "PAID" } },
        { $group: { _id: null, avg: { $avg: "$finalAmount" } } },
      ]),
      Exam.aggregate([
        { $match: { status: "COMPLETED", totalScore: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: "$percentage" } } },
      ]),
      TestSeries.aggregate([
        { $group: { _id: null, avg: { $avg: "$duration" } } },
      ]),
    ]);

    // Calculate derived metrics
    const conversionRate =
      totalUsers > 0 ? ((completedOrders / totalUsers) * 100).toFixed(2) : 0;
    const userGrowthRate =
      totalUsers > 0 ? ((newUsersThisMonth / totalUsers) * 100).toFixed(2) : 0;
    const revenueGrowthRate =
      totalRevenue[0]?.total > 0
        ? (
            ((revenueThisMonth[0]?.total || 0) / totalRevenue[0].total) *
            100
          ).toFixed(2)
        : 0;
    const examCompletionRate =
      totalExams > 0 ? ((completedExams / totalExams) * 100).toFixed(2) : 0;
    const paymentSuccessRate =
      totalPayments > 0
        ? ((successfulPayments / totalPayments) * 100).toFixed(2)
        : 0;

    const overview = {
      // Basic Metrics
      totalUsers,
      totalAdmins,
      totalExamPlans,
      totalTestSeries,
      totalExams,
      totalQuestions,
      totalNotes,
      totalCoupons,
      totalBatches,
      totalSubjects,
      totalChapters,
      totalTopics,
      totalSections,

      // Financial Metrics
      totalOrders,
      completedOrders,
      pendingOrders,
      failedOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalPayments,
      successfulPayments,

      // User Metrics
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      newUsersThisYear,

      // Time-based Order Metrics
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,
      ordersThisYear,

      // Time-based Revenue Metrics
      revenueToday: revenueToday[0]?.total || 0,
      revenueThisWeek: revenueThisWeek[0]?.total || 0,
      revenueThisMonth: revenueThisMonth[0]?.total || 0,
      revenueThisYear: revenueThisYear[0]?.total || 0,

      // Content Metrics
      freeNotes,
      paidNotes,
      freeTestSeries,
      paidTestSeries,
      activeCoupons,
      expiredCoupons,
      usedCoupons,

      // Exam Metrics
      completedExams,
      ongoingExams,
      abandonedExams,

      // Purchase Metrics
      activePurchases,
      expiredPurchases,

      // Average Metrics
      avgOrderValue: avgOrderValue[0]?.avg || 0,
      avgExamScore: avgExamScore[0]?.avg || 0,
      avgTestSeriesDuration: avgTestSeriesDuration[0]?.avg || 0,

      // Calculated Metrics
      conversionRate: Number.parseFloat(conversionRate),
      userGrowthRate: Number.parseFloat(userGrowthRate),
      revenueGrowthRate: Number.parseFloat(revenueGrowthRate),
      examCompletionRate: Number.parseFloat(examCompletionRate),
      paymentSuccessRate: Number.parseFloat(paymentSuccessRate),
    };

    res.success(overview, "Dashboard overview retrieved successfully");
  } catch (error) {
    console.error("Dashboard Overview Error:", error);
    res.someThingWentWrong(error);
  }
});

// User Analytics with Charts Data
exports.getUserAnalytics = catchAsync(async (req, res, next) => {
  try {
    // User registration trends (last 30 days)
    const userRegistrationTrend = await User.aggregate([
      {
        $match: {
          deletedAt: null,
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
    ]);

    // Monthly user growth (last 12 months)
    const monthlyUserGrowth = await User.aggregate([
      {
        $match: {
          deletedAt: null,
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
    ]);

    // User demographics
    const [stateDistribution, deviceDistribution, userActivityPattern] =
      await Promise.all([
        User.aggregate([
          { $match: { deletedAt: null, state: { $exists: true } } },
          {
            $lookup: {
              from: "states",
              localField: "state",
              foreignField: "_id",
              as: "stateInfo",
            },
          },
          { $unwind: "$stateInfo" },
          { $group: { _id: "$stateInfo.name", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        User.aggregate([
          {
            $match: {
              deletedAt: null,
              device_id: { $exists: true, $ne: null },
            },
          },
          {
            $group: {
              _id: {
                $cond: {
                  if: {
                    $regexMatch: { input: "$device_id", regex: /android/i },
                  },
                  then: "Android",
                  else: {
                    $cond: {
                      if: {
                        $regexMatch: {
                          input: "$device_id",
                          regex: /ios|iphone/i,
                        },
                      },
                      then: "iOS",
                      else: "Web",
                    },
                  },
                },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
        ]),
        User.aggregate([
          { $match: { deletedAt: null, updatedAt: { $exists: true } } },
          {
            $group: {
              _id: { $hour: "$updatedAt" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    // User retention analysis
    const retentionAnalysis = await User.aggregate([
      { $match: { deletedAt: null } },
      {
        $addFields: {
          daysSinceRegistration: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), "$createdAt"] },
                24 * 60 * 60 * 1000,
              ],
            },
          },
          daysSinceLastActivity: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), "$updatedAt"] },
                24 * 60 * 60 * 1000,
              ],
            },
          },
        },
      },
      {
        $bucket: {
          groupBy: "$daysSinceLastActivity",
          boundaries: [0, 1, 7, 30, 90, 365, 10000],
          default: "Inactive",
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    const analytics = {
      userRegistrationTrend,
      monthlyUserGrowth,
      demographics: {
        state: stateDistribution,
        device: deviceDistribution,
      },
      activityPattern: userActivityPattern,
      retention: retentionAnalysis,
    };

    res.success(analytics, "User analytics retrieved successfully");
  } catch (error) {
    console.error("User Analytics Error:", error);
    res.someThingWentWrong(error);
  }
});

// Revenue Analytics with Charts Data
exports.getRevenueAnalytics = catchAsync(async (req, res, next) => {
  try {
    // Daily revenue trend (last 30 days)
    const dailyRevenueTrend = await Order.aggregate([
      {
        $match: {
          status: "PAID",
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
    ]);

    // Monthly revenue (last 12 months)
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          status: "PAID",
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
    ]);

    // Revenue by exam plan
    const revenueByExamPlan = await Order.aggregate([
      {
        $match: {
          status: "PAID",
          itemType: "EXAM_PLAN",
        },
      },
      {
        $lookup: {
          from: "examplans",
          localField: "itemId",
          foreignField: "_id",
          as: "examPlan",
        },
      },
      { $unwind: "$examPlan" },
      {
        $group: {
          _id: "$examPlan._id",
          name: { $first: "$examPlan.title" },
          revenue: { $sum: "$finalAmount" },
          orders: { $sum: 1 },
          avgPrice: { $avg: "$finalAmount" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    // Payment method analysis
    const paymentMethodAnalysis = await Payment.aggregate([
      { $match: { status: "CAPTURED" } },
      {
        $group: {
          _id: "$method",
          count: { $sum: 1 },
          revenue: { $sum: "$amount" },
          avgAmount: { $avg: "$amount" },
        },
      },
      { $sort: { revenue: -1 } },
      {
        $project: {
          name: "$_id",
          count: 1,
          revenue: 1,
          avgAmount: 1,
          _id: 0,
        },
      },
    ]);

    // Order status distribution
    const orderStatusDistribution = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$finalAmount" },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          name: "$_id",
          count: 1,
          revenue: 1,
          _id: 0,
        },
      },
    ]);

    // Coupon usage analysis
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
      {
        $project: {
          name: "$code",
          usageCount: 1,
          totalDiscount: 1,
          avgDiscount: 1,
          _id: 0,
        },
      },
    ]);

    const analytics = {
      dailyRevenueTrend,
      monthlyRevenue,
      revenueByExamPlan,
      paymentMethodAnalysis,
      orderStatusDistribution,
      couponAnalysis,
    };

    res.success(analytics, "Revenue analytics retrieved successfully");
  } catch (error) {
    console.error("Revenue Analytics Error:", error);
    res.someThingWentWrong(error);
  }
});

// Exam Analytics with Performance Data
exports.getExamAnalytics = catchAsync(async (req, res, next) => {
  try {
    // Daily exam participation (last 30 days)
    const dailyExamParticipation = await Exam.aggregate([
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
            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
          },
          avgScore: { $avg: "$percentage" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);

    // Performance by test series
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
          name: { $first: "$testSeries.title" },
          totalAttempts: { $sum: 1 },
          completedAttempts: {
            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
          },
          avgScore: { $avg: "$percentage" },
          maxScore: { $max: "$percentage" },
          minScore: { $min: "$percentage" },
        },
      },
      {
        $addFields: {
          completionRate: {
            $multiply: [
              { $divide: ["$completedAttempts", "$totalAttempts"] },
              100,
            ],
          },
        },
      },
      { $sort: { totalAttempts: -1 } },
      { $limit: 10 },
    ]);

    // Score distribution
    const scoreDistribution = await Exam.aggregate([
      { $match: { status: "COMPLETED", percentage: { $exists: true } } },
      {
        $bucket: {
          groupBy: "$percentage",
          boundaries: [0, 20, 40, 60, 80, 100],
          default: "100+",
          output: {
            count: { $sum: 1 },
            avgScore: { $avg: "$percentage" },
          },
        },
      },
    ]);

    // Exam status distribution
    const examStatusDistribution = await Exam.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgScore: { $avg: "$percentage" },
        },
      },
      { $sort: { count: -1 } },
    ]);

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
            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
          },
          avgScore: { $avg: "$percentage" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const analytics = {
      dailyExamParticipation,
      monthlyExamTrends,
      performanceByTestSeries,
      scoreDistribution,
      examStatusDistribution,
    };

    res.success(analytics, "Exam analytics retrieved successfully");
  } catch (error) {
    console.error("Exam Analytics Error:", error);
    res.someThingWentWrong(error);
  }
});

// Content Analytics
exports.getContentAnalytics = catchAsync(async (req, res, next) => {
  try {
    // Most popular exam plans
    const popularExamPlans = await Order.aggregate([
      { $match: { status: "PAID", itemType: "EXAM_PLAN" } },
      {
        $lookup: {
          from: "examplans",
          localField: "itemId",
          foreignField: "_id",
          as: "examPlan",
        },
      },
      { $unwind: "$examPlan" },
      {
        $group: {
          _id: "$examPlan._id",
          name: { $first: "$examPlan.title" },
          price: { $first: "$examPlan.price" },
          purchases: { $sum: 1 },
          revenue: { $sum: "$finalAmount" },
        },
      },
      { $sort: { purchases: -1 } },
      { $limit: 10 },
    ]);

    // Test series engagement
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
          avgScore: { $avg: "$exams.percentage" },
          completedExams: {
            $size: {
              $filter: {
                input: "$exams",
                cond: { $eq: ["$$this.status", "COMPLETED"] },
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
              then: {
                $multiply: [
                  { $divide: ["$completedExams", "$totalAttempts"] },
                  100,
                ],
              },
              else: 0,
            },
          },
        },
      },
      {
        $project: {
          title: 1,
          totalQuestions: 1,
          totalAttempts: 1,
          completedExams: 1,
          avgScore: 1,
          completionRate: 1,
          isFree: 1,
        },
      },
      { $sort: { totalAttempts: -1 } },
      { $limit: 10 },
    ]);

    // Notes analytics
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
          examPlanName: { $first: "$examPlan.title" },
          totalNotes: { $sum: 1 },
          freeNotes: { $sum: { $cond: ["$isFree", 1, 0] } },
          paidNotes: { $sum: { $cond: ["$isFree", 0, 1] } },
        },
      },
      { $sort: { totalNotes: -1 } },
      { $limit: 10 },
    ]);

    // Subject-wise question distribution
    const subjectQuestionDistribution = await Question.aggregate([
      {
        $lookup: {
          from: "subjects",
          localField: "subjectId",
          foreignField: "_id",
          as: "subject",
        },
      },
      { $unwind: "$subject" },
      {
        $group: {
          _id: "$subject._id",
          name: { $first: "$subject.name" },
          questionCount: { $sum: 1 },
        },
      },
      { $sort: { questionCount: -1 } },
    ]);

    const analytics = {
      popularExamPlans,
      testSeriesEngagement,
      notesAnalytics,
      subjectQuestionDistribution,
    };

    res.success(analytics, "Content analytics retrieved successfully");
  } catch (error) {
    console.error("Content Analytics Error:", error);
    res.someThingWentWrong(error);
  }
});

module.exports = exports;
