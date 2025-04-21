// src/controllers/testSeriesController.js

const TestSeries = require("../models/TestSeries");
const Section = require("../models/Section");
const UserPurchase = require("../models/UserPurchase");
const mongoose = require("mongoose");

/**
 * @desc    Get all test series with pagination, filtering, and sorting
 * @route   GET /api/test-series
 * @access  Private (User)
 */
exports.getAllTestSeries = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      examPlanId = null, 
      sortBy = "createdAt", 
      sortOrder = "desc",
      isFree = null
    } = req.query;

    // Build query object
    const query = { status: true, deletedAt: null };

    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    // Add exam plan filter
    if (examPlanId) {
      query.examPlanId = mongoose.Types.ObjectId(examPlanId);
    }

    // Add free/paid filter
    if (isFree !== null) {
      query.isFree = isFree === "true";
    }

    // Count total records
    const total = await TestSeries.countDocuments(query);

    if (total === 0) {
      return res.status(200).json({
        status: true,
        message: "No record found",
        data: {
          count: 0,
          current_page: parseInt(page),
          totalPages: 0,
          pagination: [],
          limit: parseInt(limit),
          record: []
        }
      });
    }

    // Calculate pagination values
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalPages = Math.ceil(total / parseInt(limit));
    
    // Generate pagination array
    const pagination = [];
    for (let i = 1; i <= totalPages; i++) {
      pagination.push(i);
    }

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination and sorting
    const testSeries = await TestSeries.find(query)
      .populate({
        path: "examPlanId",
        select: "title batchId isFree price mrp validityDays",
        populate: {
          path: "batchId",
          select: "name"
        }
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOptions);

    // Get section counts and enhance test series data
    const enhancedTestSeries = await Promise.all(
      testSeries.map(async (series) => {
        const seriesObj = series.toObject();
        
        // Get section count
        const sectionCount = await Section.countDocuments({ 
          testSeriesId: series._id,
          status: true,
          deletedAt: null
        });
        seriesObj.sectionCount = sectionCount;
        
        // Get sections for this test series
        const sections = await Section.find({ 
          testSeriesId: series._id,
          status: true,
          deletedAt: null
        }).select("name sequence totalQuestions").sort({ sequence: 1 });
        
        seriesObj.sections = sections;
        
        // Check if user has purchased this test series (if it's not free)
        if (!series.isFree && req.user) {
          const userPurchase = await UserPurchase.findOne({
            userId: req.user._id,
            itemType: "EXAM_PLAN",
            itemId: series.examPlanId._id,
            status: "ACTIVE",
            expiryDate: { $gt: new Date() }
          });
          
          seriesObj.isPurchased = !!userPurchase;
          
          if (userPurchase) {
            seriesObj.expiryDate = userPurchase.expiryDate;
          }
        } else {
          seriesObj.isPurchased = series.isFree;
        }
        
        return seriesObj;
      })
    );

    // Return response
    return res.status(200).json({
      status: true,
      message: "Success",
      data: {
        count: total,
        current_page: parseInt(page),
        totalPages,
        pagination,
        limit: parseInt(limit),
        record: enhancedTestSeries
      }
    });
  } catch (error) {
    console.error("Error fetching test series:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: error.message
    });
  }
};

/**
 * @desc    Get test series by ID
 * @route   GET /api/test-series/:id
 * @access  Private (User)
 */
exports.getTestSeriesById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find test series
    const testSeries = await TestSeries.findOne({
      _id: id,
      status: true,
      deletedAt: null
    }).populate({
      path: "examPlanId",
      select: "title batchId isFree price mrp validityDays",
      populate: {
        path: "batchId",
        select: "name"
      }
    });

    if (!testSeries) {
      return res.status(404).json({
        status: false,
        message: "Test series not found",
        data: null
      });
    }

    // Get sections for this test series
    const sections = await Section.find({
      testSeriesId: testSeries._id,
      status: true,
      deletedAt: null
    }).sort({ sequence: 1 });

    // Check if user has purchased this test series (if it's not free)
    let isPurchased = testSeries.isFree;
    let expiryDate = null;

    if (!testSeries.isFree && req.user) {
      const userPurchase = await UserPurchase.findOne({
        userId: req.user._id,
        itemType: "EXAM_PLAN",
        itemId: testSeries.examPlanId._id,
        status: "ACTIVE",
        expiryDate: { $gt: new Date() }
      });
      
      isPurchased = !!userPurchase;
      
      if (userPurchase) {
        expiryDate = userPurchase.expiryDate;
      }
    }

    // Format response
    const result = testSeries.toObject();
    result.sections = sections;
    result.isPurchased = isPurchased;
    result.expiryDate = expiryDate;

    return res.status(200).json({
      status: true,
      message: "Success",
      data: result
    });
  } catch (error) {
    console.error("Error fetching test series:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: error.message
    });
  }
};