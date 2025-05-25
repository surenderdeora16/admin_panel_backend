// src/controllers/examController.js
const Exam = require("../../models/Exam");
const ExamQuestion = require("../../models/ExamQuestion");
const TestSeries = require("../../models/TestSeries");
const Section = require("../../models/Section");
const TestSeriesQuestion = require("../../models/TestSeriesQuestion");
const Question = require("../../models/Question");
const UserPurchase = require("../../models/UserPurchase");
const mongoose = require("mongoose");
const language = require("../../languages/english");
const { scheduleExamAutoSubmit } = require("../../services/examService");
const User = require("../../models/User")
const { generateResultPDF, generateResultPDFAlternative } = require("../../services/pdfGenerationService")
const { calculatePercentile, getPerformanceInsights } = require("../../services/analyticsService")
const path = require("path")
const fs = require("fs")



/**
 * @desc    Start a new exam
 * @route   POST /api/exams/start/:testSeriesId
 * @access  Private (User)
 */
exports.startExam = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { testSeriesId } = req.params;
    const userId = req.user._id;

    // Check if test series exists
    const testSeries = await TestSeries.findOne({
      _id: testSeriesId,
      deletedAt: null,
    });
    if (!testSeries) {
      await session.abortTransaction();
      session.endSession();
      return res.noRecords("Test series not found");
    }

    // Check if test series is active
    if (!testSeries.status) {
      await session.abortTransaction();
      session.endSession();
      return res.noRecords("This test series is not available");
    }

    // Check if the test series is free or paid
    if (!testSeries.isFree) {
      // For paid test series, check if user has purchased the exam plan
      const examPlanId = testSeries.examPlanId;

      const userPurchase = await UserPurchase.findOne({
        userId,
        itemType: "EXAM_PLAN",
        itemId: examPlanId,
        status: "ACTIVE",
        expiryDate: { $gt: new Date() },
      });

      if (!userPurchase) {
        await session.abortTransaction();
        session.endSession();
        return res.noRecords(
          "You need to purchase this exam plan to access this test series"
        );
      }
    }
    // Check if user already has an ongoing exam for this test series
    const ongoingExam = await Exam.findOne({
      userId,
      testSeriesId,
      status: "STARTED",
    });

    if (ongoingExam) {
      await session.abortTransaction();
      session.endSession();
      return res.success(ongoingExam, "You have an ongoing exam. Resuming...");
    }
    // Get all sections for this test series
    const sections = await Section.find({
      testSeriesId,
      status: true,
    }).sort({ sequence: 1 });
    if (sections.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.noRecords("No sections found for this test series");
    }

    // Get all questions for this test series
    const testSeriesQuestions = await TestSeriesQuestion.find({
      testSeriesId,
      status: true,
    })
      .populate("questionId")
      .sort({ sequence: 1 });

    if (testSeriesQuestions.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.noRecords("No questions found for this test series");
    }
    // Calculate end time based on test series duration
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + testSeries.duration * 60000); // Convert minutes to milliseconds
    // Create a new exam
    const exam = new Exam({
      userId,
      testSeriesId,
      startTime,
      endTime, // Set the end time based on test series duration
      totalQuestions: testSeriesQuestions.length,
      maxScore: testSeriesQuestions.length * testSeries.correctMarks,
      sectionTimings: sections.map((section) => ({
        sectionId: section._id,
        startTime: null,
        endTime: null,
        totalTimeSpent: 0,
      })),
    });

    await exam.save({ session });

    // Create exam questions
    const examQuestions = [];
    for (let i = 0; i < testSeriesQuestions.length; i++) {
      const tsq = testSeriesQuestions[i];
      examQuestions.push({
        examId: exam._id,
        sectionId: tsq.sectionId,
        questionId: tsq.questionId._id,
        sequence: i + 1,
      });
    }

    await ExamQuestion.insertMany(examQuestions, { session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Schedule auto-submit for this exam
    scheduleExamAutoSubmit(exam._id, endTime);
    console.log(`Exam ${exam._id} auto-submit scheduled for ${endTime}`);
    return res.successInsert(exam, "Exam started successfully");
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error starting exam:", error);
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Get exam questions by section
 * @route   GET /api/exams/:examId/sections/:sectionId/questions
 * @access  Private (User)
 */
exports.getExamQuestionsBySection = async (req, res) => {
  try {
    const { examId, sectionId } = req.params;
    const userId = req.user._id;

    // Check if exam exists and belongs to the user
    const exam = await Exam.findOne({
      _id: examId,
      userId,
    });

    if (!exam) {
      return res.noRecords("Exam not found");
    }

    // Check if exam is still ongoing
    if (exam.status !== "STARTED") {
      return res.noRecords("Exam has already been completed");
    }

    // Check if exam time has expired
    if (new Date() > new Date(exam.endTime)) {
      return res.noRecords(
        "Exam time has expired. The exam will be auto-submitted."
      );
    }

    // Check if section exists
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.noRecords("Section not found");
    }

    // Update section timing if not already started
    const sectionTiming = exam.sectionTimings.find(
      (st) => st.sectionId.toString() === sectionId
    );

    if (sectionTiming && !sectionTiming.startTime) {
      sectionTiming.startTime = new Date();
      await exam.save();
    }

    // Get exam questions for this section
    const examQuestions = await ExamQuestion.find({
      examId,
      sectionId,
    })
      .populate({
        path: "questionId",
        select: "questionText option1 option2 option3 option4 option5",
      })
      .sort({ sequence: 1 });

    // Increment visit count for first question if not visited before
    if (examQuestions.length > 0 && examQuestions[0].visitCount === 0) {
      examQuestions[0].visitCount += 1;
      await examQuestions[0].save();
    }

    // Format questions to remove sensitive information
    const formattedQuestions = examQuestions.map((eq) => ({
      id: eq._id,
      sequence: eq.sequence,
      questionText: eq.questionId.questionText,
      options: {
        option1: eq.questionId.option1,
        option2: eq.questionId.option2,
        option3: eq.questionId.option3,
        option4: eq.questionId.option4,
        option5: eq.questionId.option5 || null,
      },
      userAnswer: eq.userAnswer,
      isMarkedForReview: eq.isMarkedForReview,
      status: eq.status,
      visitCount: eq.visitCount,
    }));

    // Get section stats
    const sectionStats = {
      totalQuestions: examQuestions.length,
      attempted: examQuestions.filter((eq) => eq.status === "ATTEMPTED").length,
      unattempted: examQuestions.filter((eq) => eq.status === "UNATTEMPTED")
        .length,
      skipped: examQuestions.filter((eq) => eq.status === "SKIPPED").length,
      markedForReview: examQuestions.filter((eq) => eq.isMarkedForReview)
        .length,
    };

    // Calculate remaining time
    const remainingTime = Math.max(
      0,
      new Date(exam.endTime).getTime() - new Date().getTime()
    );
    const remainingMinutes = Math.floor(remainingTime / 60000);
    const remainingSeconds = Math.floor((remainingTime % 60000) / 1000);

    return res.success({
      section: {
        id: section._id,
        name: section.name,
        sequence: section.sequence,
      },
      questions: formattedQuestions,
      stats: sectionStats,
      examTiming: {
        startTime: exam.startTime,
        endTime: exam.endTime,
        remainingTime: {
          milliseconds: remainingTime,
          formatted: `${remainingMinutes}:${remainingSeconds
            .toString()
            .padStart(2, "0")}`,
        },
      },
    });
  } catch (error) {
    console.error("Error getting exam questions:", error);
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Get a specific exam question
 * @route   GET /api/exams/questions/:examQuestionId
 * @access  Private (User)
 */
exports.getExamQuestion = async (req, res) => {
  try {
    const { examQuestionId } = req.params;
    const userId = req.user._id;

    // Get exam question
    const examQuestion = await ExamQuestion.findById(examQuestionId)
      .populate({
        path: "questionId",
        select: "questionText option1 option2 option3 option4 option5",
      })
      .populate({
        path: "examId",
        select: "userId status startTime endTime",
      });

    if (!examQuestion) {
      return res.noRecords("Question not found");
    }

    // Check if exam belongs to the user
    if (examQuestion.examId.userId.toString() !== userId.toString()) {
      return res.noRecords("Unauthorized access to this question");
    }

    // Check if exam is still ongoing
    if (examQuestion.examId.status !== "STARTED") {
      return res.noRecords("Exam has already been completed");
    }

    // Check if exam time has expired
    if (new Date() > new Date(examQuestion.examId.endTime)) {
      return res.noRecords(
        "Exam time has expired. The exam will be auto-submitted."
      );
    }

    // Increment visit count if not visited before
    if (examQuestion.visitCount === 0) {
      examQuestion.visitCount += 1;
      await examQuestion.save();
    }

    // Format question to remove sensitive information
    const formattedQuestion = {
      id: examQuestion._id,
      sequence: examQuestion.sequence,
      questionText: examQuestion.questionId.questionText,
      options: {
        option1: examQuestion.questionId.option1,
        option2: examQuestion.questionId.option2,
        option3: examQuestion.questionId.option3,
        option4: examQuestion.questionId.option4,
        option5: examQuestion.questionId.option5 || null,
      },
      userAnswer: examQuestion.userAnswer,
      isMarkedForReview: examQuestion.isMarkedForReview,
      status: examQuestion.status,
      visitCount: examQuestion.visitCount,
      examTiming: {
        startTime: examQuestion.examId.startTime,
        endTime: examQuestion.examId.endTime,
        remainingTime: Math.max(
          0,
          new Date(examQuestion.examId.endTime).getTime() - new Date().getTime()
        ),
      },
    };

    return res.success(formattedQuestion);
  } catch (error) {
    console.error("Error getting exam question:", error);
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Answer an exam question
 * @route   POST /api/exams/questions/:examQuestionId/answer
 * @access  Private (User)
 */
exports.answerExamQuestion = async (req, res) => {
  try {
    const { examQuestionId } = req.params;
    const { answer, timeSpent, isMarkedForReview } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (answer === undefined) {
      return res.noRecords("Answer is required");
    }

    // Get exam question
    const examQuestion = await ExamQuestion.findById(examQuestionId)
      .populate({
        path: "questionId",
        select: "rightAnswer",
      })
      .populate({
        path: "examId",
        select: "userId status endTime",
      });

    if (!examQuestion) {
      return res.noRecords("Question not found");
    }

    // Check if exam belongs to the user
    if (examQuestion.examId.userId.toString() !== userId.toString()) {
      return res.noRecords("Unauthorized access to this question");
    }

    // Check if exam is still ongoing
    if (examQuestion.examId.status !== "STARTED") {
      return res.noRecords("Exam has already been completed");
    }

    // Check if exam time has expired
    if (new Date() > new Date(examQuestion.examId.endTime)) {
      return res.noRecords(
        "Exam time has expired. The exam will be auto-submitted."
      );
    }

    // Update exam question
    examQuestion.userAnswer = answer;
    examQuestion.isCorrect = answer === examQuestion.questionId.rightAnswer;
    examQuestion.status = "ATTEMPTED";

    if (isMarkedForReview !== undefined) {
      examQuestion.isMarkedForReview = isMarkedForReview;
    }

    if (timeSpent) {
      examQuestion.timeSpent += Number.parseInt(timeSpent);
    }

    await examQuestion.save();

    return res.successUpdate({
      id: examQuestion._id,
      userAnswer: examQuestion.userAnswer,
      isMarkedForReview: examQuestion.isMarkedForReview,
      status: examQuestion.status,
    });
  } catch (error) {
    console.error("Error answering exam question:", error);
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Skip an exam question
 * @route   POST /api/exams/questions/:examQuestionId/skip
 * @access  Private (User)
 */
exports.skipExamQuestion = async (req, res) => {
  try {
    const { examQuestionId } = req.params;
    const { timeSpent, isMarkedForReview } = req.body;
    const userId = req.user._id;

    // Get exam question
    const examQuestion = await ExamQuestion.findById(examQuestionId).populate({
      path: "examId",
      select: "userId status endTime",
    });

    if (!examQuestion) {
      return res.noRecords("Question not found");
    }

    // Check if exam belongs to the user
    if (examQuestion.examId.userId.toString() !== userId.toString()) {
      return res.noRecords("Unauthorized access to this question");
    }

    // Check if exam is still ongoing
    if (examQuestion.examId.status !== "STARTED") {
      return res.noRecords("Exam has already been completed");
    }

    // Check if exam time has expired
    if (new Date() > new Date(examQuestion.examId.endTime)) {
      return res.noRecords(
        "Exam time has expired. The exam will be auto-submitted."
      );
    }

    // Update exam question
    examQuestion.status = "SKIPPED";

    if (isMarkedForReview !== undefined) {
      examQuestion.isMarkedForReview = isMarkedForReview;
    }

    if (timeSpent) {
      examQuestion.timeSpent += Number.parseInt(timeSpent);
    }

    await examQuestion.save();

    return res.successUpdate({
      id: examQuestion._id,
      isMarkedForReview: examQuestion.isMarkedForReview,
      status: examQuestion.status,
    });
  } catch (error) {
    console.error("Error skipping exam question:", error);
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Mark/unmark an exam question for review
 * @route   POST /api/exams/questions/:examQuestionId/mark-review
 * @access  Private (User)
 */
exports.markExamQuestionForReview = async (req, res) => {
  try {
    const { examQuestionId } = req.params;
    const { isMarkedForReview, timeSpent } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (isMarkedForReview === undefined) {
      return res.noRecords("isMarkedForReview is required");
    }

    // Get exam question
    const examQuestion = await ExamQuestion.findById(examQuestionId).populate({
      path: "examId",
      select: "userId status endTime",
    });

    if (!examQuestion) {
      return res.noRecords("Question not found");
    }

    // Check if exam belongs to the user
    if (examQuestion.examId.userId.toString() !== userId.toString()) {
      return res.noRecords("Unauthorized access to this question");
    }

    // Check if exam is still ongoing
    if (examQuestion.examId.status !== "STARTED") {
      return res.noRecords("Exam has already been completed");
    }

    // Check if exam time has expired
    if (new Date() > new Date(examQuestion.examId.endTime)) {
      return res.noRecords(
        "Exam time has expired. The exam will be auto-submitted."
      );
    }

    // Update exam question
    examQuestion.isMarkedForReview = isMarkedForReview;

    if (timeSpent) {
      examQuestion.timeSpent += Number.parseInt(timeSpent);
    }

    await examQuestion.save();

    return res.successUpdate({
      id: examQuestion._id,
      isMarkedForReview: examQuestion.isMarkedForReview,
    });
  } catch (error) {
    console.error("Error marking exam question for review:", error);
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Update section timing
 * @route   POST /api/exams/:examId/sections/:sectionId/timing
 * @access  Private (User)
 */
exports.updateSectionTiming = async (req, res) => {
  try {
    const { examId, sectionId } = req.params;
    const { timeSpent } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!timeSpent) {
      return res.noRecords("timeSpent is required");
    }

    // Check if exam exists and belongs to the user
    const exam = await Exam.findOne({
      _id: examId,
      userId,
    });

    if (!exam) {
      return res.noRecords("Exam not found");
    }

    // Check if exam is still ongoing
    if (exam.status !== "STARTED") {
      return res.noRecords("Exam has already been completed");
    }

    // Check if exam time has expired
    if (new Date() > new Date(exam.endTime)) {
      return res.noRecords(
        "Exam time has expired. The exam will be auto-submitted."
      );
    }

    // Update section timing
    const sectionTiming = exam.sectionTimings.find(
      (st) => st.sectionId.toString() === sectionId
    );

    if (!sectionTiming) {
      return res.noRecords("Section timing not found");
    }

    sectionTiming.totalTimeSpent += Number.parseInt(timeSpent);

    if (!sectionTiming.startTime) {
      sectionTiming.startTime = new Date();
    }

    sectionTiming.endTime = new Date();

    await exam.save();

    return res.successUpdate({
      sectionId,
      totalTimeSpent: sectionTiming.totalTimeSpent,
    });
  } catch (error) {
    console.error("Error updating section timing:", error);
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Submit exam
 * @route   POST /api/exams/:examId/submit
 * @access  Private (User)
 */
exports.submitExam = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { examId } = req.params;
    const userId = req.user._id;

    // Check if exam exists and belongs to the user
    const exam = await Exam.findOne({
      _id: examId,
      userId,
    });

    if (!exam) {
      await session.abortTransaction();
      session.endSession();
      return res.noRecords("Exam not found");
    }

    // Check if exam is still ongoing
    if (exam.status !== "STARTED") {
      await session.abortTransaction();
      session.endSession();
      return res.noRecords("Exam has already been completed");
    }

    // Get all exam questions
    const examQuestions = await ExamQuestion.find({
      examId,
    }).populate("questionId");

    // Calculate exam statistics
    const attemptedQuestions = examQuestions.filter(
      (eq) => eq.status === "ATTEMPTED"
    ).length;
    const correctAnswers = examQuestions.filter(
      (eq) => eq.isCorrect === true
    ).length;
    const wrongAnswers = examQuestions.filter(
      (eq) => eq.isCorrect === false
    ).length;
    const skippedQuestions = examQuestions.filter(
      (eq) => eq.status === "SKIPPED"
    ).length;
    const markedForReview = examQuestions.filter(
      (eq) => eq.isMarkedForReview
    ).length;

    // Get test series for scoring details
    const testSeries = await TestSeries.findById(exam.testSeriesId);

    // Calculate total score
    const totalScore =
      correctAnswers * testSeries.correctMarks -
      wrongAnswers * testSeries.negativeMarks;
    const maxScore = examQuestions.length * testSeries.correctMarks;
    const percentage = (totalScore / maxScore) * 100;

    // Update exam
    exam.endTime = new Date();
    exam.status = "COMPLETED";
    exam.attemptedQuestions = attemptedQuestions;
    exam.correctAnswers = correctAnswers;
    exam.wrongAnswers = wrongAnswers;
    exam.skippedQuestions = skippedQuestions;
    exam.markedForReview = markedForReview;
    exam.totalScore = totalScore;
    exam.maxScore = maxScore;
    exam.percentage = percentage;

    // Update section timings that don't have an end time
    exam.sectionTimings.forEach((st) => {
      if (st.startTime && !st.endTime) {
        st.endTime = new Date();
      }
    });

    await exam.save({ session });

    // Calculate rank (optional, can be done asynchronously later)
    const betterExams = await Exam.countDocuments({
      testSeriesId: exam.testSeriesId,
      status: "COMPLETED",
      totalScore: { $gt: totalScore },
    });

    exam.rank = betterExams + 1;
    await exam.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.successUpdate({
      id: exam._id,
      totalQuestions: exam.totalQuestions,
      attemptedQuestions: exam.attemptedQuestions,
      correctAnswers: exam.correctAnswers,
      wrongAnswers: exam.wrongAnswers,
      skippedQuestions: exam.skippedQuestions,
      markedForReview: exam.markedForReview,
      totalScore: exam.totalScore,
      maxScore: exam.maxScore,
      percentage: exam.percentage,
      rank: exam.rank,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error submitting exam:", error);
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Auto-submit exam (internal use)
 * @access  Private (System)
 */
exports.autoSubmitExam = async (examId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if exam exists
    const exam = await Exam.findById({ _id: examId });

    if (!exam) {
      await session.abortTransaction();
      session.endSession();
      console.error(`Auto-submit: Exam ${examId} not found`);
      return;
    }

    // Check if exam is still ongoing
    if (exam.status !== "STARTED") {
      await session.abortTransaction();
      session.endSession();
      console.log(`Auto-submit: Exam ${examId} has already been completed`);
      return;
    }

    console.log(`Auto-submitting exam ${examId} for user ${exam.userId}`);

    // Get all exam questions
    const examQuestions = await ExamQuestion.find({
      examId,
    }).populate("questionId");

    // Calculate exam statistics
    const attemptedQuestions = examQuestions.filter(
      (eq) => eq.status === "ATTEMPTED"
    ).length;
    const correctAnswers = examQuestions.filter(
      (eq) => eq.isCorrect === true
    ).length;
    const wrongAnswers = examQuestions.filter(
      (eq) => eq.isCorrect === false
    ).length;
    const skippedQuestions = examQuestions.filter(
      (eq) => eq.status === "SKIPPED"
    ).length;
    const markedForReview = examQuestions.filter(
      (eq) => eq.isMarkedForReview
    ).length;

    // Get test series for scoring details
    const testSeries = await TestSeries.findById(exam.testSeriesId);

    // Calculate total score
    const totalScore =
      correctAnswers * testSeries.correctMarks -
      wrongAnswers * testSeries.negativeMarks;
    const maxScore = examQuestions.length * testSeries.correctMarks;
    const percentage = (totalScore / maxScore) * 100;

    // Update exam
    exam.endTime = new Date();
    exam.status = "COMPLETED";
    exam.attemptedQuestions = attemptedQuestions;
    exam.correctAnswers = correctAnswers;
    exam.wrongAnswers = wrongAnswers;
    exam.skippedQuestions = skippedQuestions;
    exam.markedForReview = markedForReview;
    exam.totalScore = totalScore;
    exam.maxScore = maxScore;
    exam.percentage = percentage;

    // Update section timings that don't have an end time
    exam.sectionTimings.forEach((st) => {
      if (st.startTime && !st.endTime) {
        st.endTime = new Date();
      }
    });

    await exam.save({ session });

    // Calculate rank
    const betterExams = await Exam.countDocuments({
      testSeriesId: exam.testSeriesId,
      status: "COMPLETED",
      totalScore: { $gt: totalScore },
    });

    exam.rank = betterExams + 1;
    await exam.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`Auto-submit completed for exam ${examId}`);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(`Error auto-submitting exam ${examId}:`, error);
  }
};


/**
 * @desc    Get all exam questions structured by sections
 * @route   GET /api/exams/:examId/all-questions
 * @access  Private (User)
 */
exports.getAllExamQuestions = async (req, res) => {
  try {
    const { examId } = req.params
    const userId = req.user._id

    // Check if exam exists and belongs to the user
    const exam = await Exam.findOne({
      _id: examId,
      userId,
    }).populate({
      path: "testSeriesId",
      select: "title duration correctMarks negativeMarks passingPercentage instructions",
    })

    if (!exam) {
      return res.noRecords("Exam not found")
    }

    // Check if exam is still ongoing
    if (exam.status !== "STARTED") {
      return res.noRecords("Exam has already been completed")
    }

    // Check if exam time has expired
    if (new Date() > new Date(exam.endTime)) {
      return res.noRecords("Exam time has expired. The exam will be auto-submitted.")
    }

    // Get all sections for this test series
    const sections = await Section.find({
      testSeriesId: exam.testSeriesId._id,
      status: true,
    }).sort({ sequence: 1 })

    if (sections.length === 0) {
      return res.noRecords("No sections found for this exam")
    }

    // Get all exam questions
    const examQuestions = await ExamQuestion.find({
      examId,
    })
      .populate({
        path: "questionId",
        select: "questionText option1 option2 option3 option4 option5",
      })
      .populate({
        path: "sectionId",
        select: "name sequence",
      })
      .sort({ sequence: 1 })

    if (examQuestions.length === 0) {
      return res.noRecords("No questions found for this exam")
    }

    // Structure questions by sections
    const structuredSections = []

    for (const section of sections) {
      // Filter questions for this section
      const sectionQuestions = examQuestions.filter((eq) => eq.sectionId._id.toString() === section._id.toString())

      // Format questions to remove sensitive information
      const formattedQuestions = sectionQuestions.map((eq) => ({
        id: eq._id,
        sequence: eq.sequence,
        questionText: eq.questionId.questionText,
        options: {
          option1: eq.questionId.option1,
          option2: eq.questionId.option2,
          option3: eq.questionId.option3,
          option4: eq.questionId.option4,
          option5: eq.questionId.option5 || null,
        },
        userAnswer: eq.userAnswer,
        isMarkedForReview: eq.isMarkedForReview,
        status: eq.status,
        visitCount: eq.visitCount,
      }))

      // Get section stats
      const sectionStats = {
        totalQuestions: sectionQuestions.length,
        attempted: sectionQuestions.filter((eq) => eq.status === "ATTEMPTED").length,
        unattempted: sectionQuestions.filter((eq) => eq.status === "UNATTEMPTED").length,
        skipped: sectionQuestions.filter((eq) => eq.status === "SKIPPED").length,
        markedForReview: sectionQuestions.filter((eq) => eq.isMarkedForReview).length,
      }

      // Add section with its questions to the structured sections array
      structuredSections.push({
        id: section._id,
        name: section.name,
        sequence: section.sequence,
        questions: formattedQuestions,
        stats: sectionStats,
      })
    }

    // Calculate overall exam stats
    const overallStats = {
      totalQuestions: examQuestions.length,
      attempted: examQuestions.filter((eq) => eq.status === "ATTEMPTED").length,
      unattempted: examQuestions.filter((eq) => eq.status === "UNATTEMPTED").length,
      skipped: examQuestions.filter((eq) => eq.status === "SKIPPED").length,
      markedForReview: examQuestions.filter((eq) => eq.isMarkedForReview).length,
    }

    // Calculate remaining time
    const remainingTime = Math.max(0, new Date(exam.endTime).getTime() - new Date().getTime())
    const remainingMinutes = Math.floor(remainingTime / 60000)
    const remainingSeconds = Math.floor((remainingTime % 60000) / 1000)

    // Prepare response data
    const responseData = {
      exam: {
        id: exam._id,
        testSeries: {
          id: exam.testSeriesId._id,
          title: exam.testSeriesId.title,
          duration: exam.testSeriesId.duration,
          correctMarks: exam.testSeriesId.correctMarks,
          negativeMarks: exam.testSeriesId.negativeMarks,
          passingPercentage: exam.testSeriesId.passingPercentage,
          instructions: exam.testSeriesId.instructions,
        },
        startTime: exam.startTime,
        endTime: exam.endTime,
        status: exam.status,
        remainingTime: {
          milliseconds: remainingTime,
          formatted: `${remainingMinutes}:${remainingSeconds.toString().padStart(2, "0")}`,
        },
      },
      sections: structuredSections,
      stats: overallStats,
    }

    return res.success(responseData, "Exam questions retrieved successfully")
  } catch (error) {
    console.error("Error getting all exam questions:", error)
    return res.someThingWentWrong(error)
  }
}

/**
 * @desc    Answer an exam question (Batch update)
 * @route   POST /api/exams/:examId/answer-question
 * @access  Private (User)
 */
exports.answerExamQuestionBatch = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { examId } = req.params
    const { questionId, answer, timeSpent, isMarkedForReview } = req.body
    const userId = req.user._id

    // Validate required fields
    if (!questionId || answer === undefined) {
      await session.abortTransaction()
      session.endSession()
      return res.noRecords("Question ID and answer are required")
    }

    // Check if exam exists and belongs to the user
    const exam = await Exam.findOne({
      _id: examId,
      userId,
    })

    if (!exam) {
      await session.abortTransaction()
      session.endSession()
      return res.noRecords("Exam not found")
    }

    // Check if exam is still ongoing
    if (exam.status !== "STARTED") {
      await session.abortTransaction()
      session.endSession()
      return res.noRecords("Exam has already been completed")
    }

    // Check if exam time has expired
    if (new Date() > new Date(exam.endTime)) {
      await session.abortTransaction()
      session.endSession()
      return res.noRecords("Exam time has expired. The exam will be auto-submitted.")
    }

    // Get exam question
    const examQuestion = await ExamQuestion.findOne({
      examId,
      _id: questionId,
    }).populate({
      path: "questionId",
      select: "rightAnswer",
    })

    if (!examQuestion) {
      await session.abortTransaction()
      session.endSession()
      return res.noRecords("Question not found")
    }

    // Update exam question
    examQuestion.userAnswer = answer
    examQuestion.isCorrect = answer === examQuestion.questionId.rightAnswer
    examQuestion.status = "ATTEMPTED"

    if (isMarkedForReview !== undefined) {
      examQuestion.isMarkedForReview = isMarkedForReview
    }

    if (timeSpent) {
      examQuestion.timeSpent += Number.parseInt(timeSpent)
    }

    await examQuestion.save({ session })

    // Commit transaction
    await session.commitTransaction()
    session.endSession()

    return res.successUpdate({
      id: examQuestion._id,
      userAnswer: examQuestion.userAnswer,
      isMarkedForReview: examQuestion.isMarkedForReview,
      status: examQuestion.status,
    })
  } catch (error) {
    await session.abortTransaction()
    session.endSession()
    console.error("Error answering exam question:", error)
    return res.someThingWentWrong(error)
  }
}

/**
 * @desc    Update question status in batch (mark/skip/review)
 * @route   POST /api/exams/:examId/update-question-status
 * @access  Private (User)
 */
exports.updateQuestionStatusBatch = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { examId } = req.params
    const { questionId, status, isMarkedForReview, timeSpent } = req.body
    const userId = req.user._id

    // Validate required fields
    if (!questionId || !status) {
      await session.abortTransaction()
      session.endSession()
      return res.noRecords("Question ID and status are required")
    }

    // Validate status
    if (!["ATTEMPTED", "UNATTEMPTED", "SKIPPED"].includes(status)) {
      await session.abortTransaction()
      session.endSession()
      return res.noRecords("Invalid status. Must be ATTEMPTED, UNATTEMPTED, or SKIPPED")
    }

    // Check if exam exists and belongs to the user
    const exam = await Exam.findOne({
      _id: examId,
      userId,
    })

    if (!exam) {
      await session.abortTransaction()
      session.endSession()
      return res.noRecords("Exam not found")
    }

    // Check if exam is still ongoing
    if (exam.status !== "STARTED") {
      await session.abortTransaction()
      session.endSession()
      return res.noRecords("Exam has already been completed")
    }

    // Check if exam time has expired
    if (new Date() > new Date(exam.endTime)) {
      await session.abortTransaction()
      session.endSession()
      return res.noRecords("Exam time has expired. The exam will be auto-submitted.")
    }

    // Get exam question
    const examQuestion = await ExamQuestion.findOne({
      examId,
      _id: questionId,
    })

    if (!examQuestion) {
      await session.abortTransaction()
      session.endSession()
      return res.noRecords("Question not found")
    }

    // Update exam question
    examQuestion.status = status

    if (isMarkedForReview !== undefined) {
      examQuestion.isMarkedForReview = isMarkedForReview
    }

    if (timeSpent) {
      examQuestion.timeSpent += Number.parseInt(timeSpent)
    }

    await examQuestion.save({ session })

    // Commit transaction
    await session.commitTransaction()
    session.endSession()

    return res.successUpdate({
      id: examQuestion._id,
      status: examQuestion.status,
      isMarkedForReview: examQuestion.isMarkedForReview,
    })
  } catch (error) {
    await session.abortTransaction()
    session.endSession()
    console.error("Error updating question status:", error)
    return res.someThingWentWrong(error)
  }
}




/**
 * @desc    Get exam result
 * @route   GET /api/exams/:examId/result
 * @access  Private (User)
 */
exports.getExamResult = async (req, res) => {
  try {
    const { examId } = req.params
    const userId = req.user._id

    // Check if exam exists and belongs to the user
    const exam = await Exam.findOne({
      _id: examId,
      userId,
    }).populate("testSeriesId")

    if (!exam) {
      return res.noRecords("Exam not found")
    }

    // Check if exam is completed
    if (exam.status !== "COMPLETED") {
      return res.noRecords("Exam has not been completed yet")
    }

    // Get all sections
    const sections = await Section.find({
      testSeriesId: exam.testSeriesId,
    }).sort({ sequence: 1 })

    // Get section-wise statistics
    const sectionStats = []
    for (const section of sections) {
      const sectionQuestions = await ExamQuestion.find({
        examId,
        sectionId: section._id,
      })

      const sectionStat = {
        sectionId: section._id,
        name: section.name,
        totalQuestions: sectionQuestions.length,
        attempted: sectionQuestions.filter((eq) => eq.status === "ATTEMPTED").length,
        correct: sectionQuestions.filter((eq) => eq.isCorrect === true).length,
        wrong: sectionQuestions.filter((eq) => eq.isCorrect === false).length,
        skipped: sectionQuestions.filter((eq) => eq.status === "SKIPPED").length,
      }

      sectionStats.push(sectionStat)
    }

    // Calculate time statistics
    const totalDuration = (new Date(exam.endTime) - new Date(exam.startTime)) / 1000 // in seconds
    const sectionTimings = exam.sectionTimings.map((st) => {
      const section = sections.find((s) => s._id.toString() === st.sectionId.toString())
      return {
        sectionId: st.sectionId,
        name: section ? section.name : "Unknown",
        totalTimeSpent: st.totalTimeSpent,
      }
    })

    // Generate PDF for this exam result
    let pdfUrl = null
    let pdfGenerationError = null

    try {
      // Check if PDF already exists
      const timestamp = new Date(exam.endTime).getTime()
      const filename = `exam_result_${examId}_${timestamp}.pdf`
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "results")
      const filepath = path.join(uploadsDir, filename)

      // Ensure uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      // Check if PDF already exists
      if (!fs.existsSync(filepath)) {
        // Generate new PDF
        console.log("Generating new PDF for exam:", examId)

        // Get detailed data for PDF generation
        const examQuestions = await ExamQuestion.find({ examId })
          .populate({
            path: "questionId",
            select:
              "questionText option1 option2 option3 option4 option5 rightAnswer explanation subjectId chapterId topicId",
            populate: [
              { path: "subjectId", select: "name" },
              { path: "chapterId", select: "name" },
              { path: "topicId", select: "name" },
            ],
          })
          .populate({
            path: "sectionId",
            select: "name sequence",
          })
          .sort({ sequence: 1 })

        // Get user data
        const user = await User.findById(userId).select("name email mobile")

        // Build result data for PDF
        const resultData = await buildDetailedResultData(exam, examQuestions, sections, user)

        // Try primary PDF generation method (Puppeteer)
        let pdfBuffer = null
        try {
          pdfBuffer = await generateResultPDF(resultData)
        } catch (puppeteerError) {
          console.warn("Puppeteer PDF generation failed, trying alternative method:", puppeteerError.message)

          // Try alternative PDF generation method (html-pdf)
          try {
            pdfBuffer = await generateResultPDFAlternative(resultData)
          } catch (alternativeError) {
            console.error("Alternative PDF generation also failed:", alternativeError.message)
            throw new Error("Both PDF generation methods failed")
          }
        }

        if (pdfBuffer) {
          // Save PDF file
          fs.writeFileSync(filepath, pdfBuffer)
          pdfUrl = `${process.env.BASEURL}/uploads/results/${filename}`
          console.log("PDF generated successfully:", pdfUrl)
        } else {
          pdfGenerationError = "Failed to generate PDF buffer"
        }
      } else {
        // PDF already exists
        pdfUrl = `${process.env.BASEURL}/uploads/results/${filename}`
        console.log("Using existing PDF:", pdfUrl)
      }
    } catch (error) {
      console.error("Error generating PDF:", error)
      pdfGenerationError = error.message
    }

    // Format result
    const result = {
      examId: exam._id,
      testSeries: {
        id: exam?.testSeriesId?._id,
        title: exam.testSeriesId?.title,
      },
      startTime: exam.startTime,
      endTime: exam.endTime,
      totalDuration,
      totalQuestions: exam.totalQuestions,
      attemptedQuestions: exam.attemptedQuestions,
      correctAnswers: exam.correctAnswers,
      wrongAnswers: exam.wrongAnswers,
      skippedQuestions: exam.skippedQuestions,
      markedForReview: exam.markedForReview,
      totalScore: exam.totalScore,
      maxScore: exam.maxScore,
      percentage: exam.percentage,
      rank: exam.rank,
      sectionStats,
      sectionTimings,
      // PDF download link
      pdfReport: {
        url: pdfUrl,
        isAvailable: !!pdfUrl,
        error: pdfGenerationError,
        generatedAt: pdfUrl ? new Date().toISOString() : null,
      },
    }

    return res.success(result)
  } catch (error) {
    console.error("Error getting exam result:", error)
    return res.someThingWentWrong(error)
  }
}


/**
 * @desc    Get exam review
 * @route   GET /api/exams/:examId/review
 * @access  Private (User)
 */
exports.getExamReview = async (req, res) => {
  try {
    const { examId } = req.params
    const userId = req.user._id

    // Check if exam exists and belongs to the user
    const exam = await Exam.findOne({
      _id: examId,
      userId,
    })

    if (!exam) {
      return res.noRecords("Exam not found")
    }

    // Check if exam is completed
    if (exam.status !== "COMPLETED") {
      return res.noRecords("Exam has not been completed yet")
    }

    // Get all exam questions with answers
    const examQuestions = await ExamQuestion.find({
      examId,
    })
      .populate({
        path: "questionId",
        select: "questionText option1 option2 option3 option4 option5 rightAnswer explanation",
      })
      .populate({
        path: "sectionId",
        select: "name sequence",
      })
      .sort({ sequence: 1 })

    // Format questions with correct answers
    const reviewQuestions = examQuestions?.map((eq) => ({
      id: eq?._id,
      sequence: eq?.sequence,
      section: {
        id: eq?.sectionId?._id,
        name: eq.sectionId?.name,
        sequence: eq.sectionId?.sequence,
      },
      questionText: eq.questionId.questionText,
      options: {
        option1: eq.questionId.option1,
        option2: eq.questionId.option2,
        option3: eq.questionId.option3,
        option4: eq.questionId.option4,
        option5: eq.questionId.option5 || null,
      },
      userAnswer: eq.userAnswer,
      correctAnswer: eq.questionId.rightAnswer,
      isCorrect: eq.isCorrect,
      explanation: eq.questionId.explanation,
      status: eq.status,
      isMarkedForReview: eq.isMarkedForReview,
      timeSpent: eq.timeSpent,
    }))

    // Group questions by section
    const sectionMap = new Map()
    reviewQuestions?.forEach((q) => {
      if (!sectionMap.has(q?.section?.id?.toString())) {
        sectionMap.set(q.section?.id?.toString(), {
          section: q?.section,
          questions: [],
        })
      }
      sectionMap.get(q.section.id?.toString()).questions.push(q)
    })

    const sectionReviews = Array.from(sectionMap.values())

    // Generate or get existing PDF URL
    let pdfUrl = null
    let pdfGenerationError = null

    try {
      // Check if PDF already exists
      const timestamp = new Date(exam.endTime).getTime()
      const filename = `exam_result_${examId}_${timestamp}.pdf`
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "results")
      const filepath = path.join(uploadsDir, filename)

      // Ensure uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      // Check if PDF already exists
      if (!fs.existsSync(filepath)) {
        // Generate new PDF
        console.log("Generating new PDF for exam review:", examId)

        // Get sections
        const sections = await Section.find({
          testSeriesId: exam.testSeriesId,
        }).sort({ sequence: 1 })

        // Get user data
        const user = await User.findById(userId).select("name email mobile")

        // Build result data for PDF
        const resultData = await buildDetailedResultData(exam, examQuestions, sections, user)

        // Try primary PDF generation method (Puppeteer)
        let pdfBuffer = null
        try {
          pdfBuffer = await generateResultPDF(resultData)
        } catch (puppeteerError) {
          console.warn("Puppeteer PDF generation failed, trying alternative method:", puppeteerError.message)

          // Try alternative PDF generation method (html-pdf)
          try {
            pdfBuffer = await generateResultPDFAlternative(resultData)
          } catch (alternativeError) {
            console.error("Alternative PDF generation also failed:", alternativeError.message)
            throw new Error("Both PDF generation methods failed")
          }
        }

        if (pdfBuffer) {
          // Save PDF file
          fs.writeFileSync(filepath, pdfBuffer)
          pdfUrl = `${process.env.BASEURL}/uploads/results/${filename}`
          console.log("PDF generated successfully for review:", pdfUrl)
        } else {
          pdfGenerationError = "Failed to generate PDF buffer"
        }
      } else {
        // PDF already exists
        pdfUrl = `${process.env.BASEURL}/uploads/results/${filename}`
        console.log("Using existing PDF for review:", pdfUrl)
      }
    } catch (error) {
      console.error("Error generating PDF for review:", error)
      pdfGenerationError = error.message
    }

    return res.success({
      examId: exam._id,
      sections: sectionReviews,
      stats: {
        totalQuestions: exam.totalQuestions,
        attemptedQuestions: exam.attemptedQuestions,
        correctAnswers: exam.correctAnswers,
        wrongAnswers: exam.wrongAnswers,
        skippedQuestions: exam.skippedQuestions,
        markedForReview: exam.markedForReview,
      },
      // PDF download link
      pdfReport: {
        url: pdfUrl,
        isAvailable: !!pdfUrl,
        error: pdfGenerationError,
        generatedAt: pdfUrl ? new Date().toISOString() : null,
      },
    })
  } catch (error) {
    console.error("Error getting exam review:", error)
    return res.someThingWentWrong(error)
  }
}



async function buildDetailedResultData(exam, examQuestions, sections, user) {
  try {
    // Get test series with exam plan
    const testSeries = await TestSeries.findById(exam.testSeriesId).populate("examPlanId", "title")

    // Build section analysis
    const sectionAnalysis = []
    for (const section of sections) {
      const sectionQuestions = examQuestions.filter(
        (eq) => eq.sectionId && eq.sectionId._id && eq.sectionId._id.toString() === section._id.toString(),
      )

      const sectionStats = {
        sectionId: section._id,
        name: section.name || "Unknown Section",
        sequence: section.sequence || 0,
        totalQuestions: sectionQuestions.length,
        attempted: sectionQuestions.filter((eq) => eq.status === "ATTEMPTED").length,
        correct: sectionQuestions.filter((eq) => eq.isCorrect === true).length,
        wrong: sectionQuestions.filter((eq) => eq.isCorrect === false).length,
        skipped: sectionQuestions.filter((eq) => eq.status === "SKIPPED").length,
        markedForReview: sectionQuestions.filter((eq) => eq.isMarkedForReview).length,
        accuracy: 0,
        score: 0,
        maxScore: 0,
        timeSpent: sectionQuestions.reduce((total, eq) => total + (eq.timeSpent || 0), 0),
      }

      sectionStats.accuracy =
        sectionStats.attempted > 0
          ? Number.parseFloat(((sectionStats.correct / sectionStats.attempted) * 100).toFixed(2))
          : 0

      const correctMarks = testSeries?.correctMarks || 1
      const negativeMarks = testSeries?.negativeMarks || 0.25

      sectionStats.score = sectionStats.correct * correctMarks - sectionStats.wrong * negativeMarks
      sectionStats.maxScore = sectionStats.totalQuestions * correctMarks

      sectionAnalysis.push(sectionStats)
    }

    // Build subject analysis
    const subjectAnalysis = {}
    examQuestions.forEach((eq) => {
      if (!eq.questionId || !eq.questionId.subjectId || !eq.questionId.subjectId.name) {
        return
      }

      const subjectName = eq.questionId.subjectId.name
      if (!subjectAnalysis[subjectName]) {
        subjectAnalysis[subjectName] = {
          total: 0,
          attempted: 0,
          correct: 0,
          wrong: 0,
          skipped: 0,
          accuracy: 0,
          score: 0,
        }
      }

      subjectAnalysis[subjectName].total++
      if (eq.status === "ATTEMPTED") subjectAnalysis[subjectName].attempted++
      if (eq.isCorrect === true) subjectAnalysis[subjectName].correct++
      if (eq.isCorrect === false) subjectAnalysis[subjectName].wrong++
      if (eq.status === "SKIPPED") subjectAnalysis[subjectName].skipped++
    })

    // Calculate subject accuracies
    const correctMarks = testSeries?.correctMarks || 1
    const negativeMarks = testSeries?.negativeMarks || 0.25

    Object.keys(subjectAnalysis).forEach((subject) => {
      const data = subjectAnalysis[subject]
      data.accuracy = data.attempted > 0 ? Number.parseFloat(((data.correct / data.attempted) * 100).toFixed(2)) : 0
      data.score = data.correct * correctMarks - data.wrong * negativeMarks
    })

    // Get percentile
    let percentile = 0
    let totalAttempts = 0
    try {
      const allExams = await Exam.find({
        testSeriesId: exam.testSeriesId,
        status: "COMPLETED",
      }).sort({ totalScore: -1 })

      totalAttempts = allExams.length
      if (totalAttempts > 0) {
        percentile = calculatePercentile(
          exam.totalScore || 0,
          allExams.map((e) => e.totalScore || 0),
        )
      }
    } catch (error) {
      console.error("Error calculating percentile:", error)
    }

    // Get insights
    let insights = []
    try {
      const subjectAnalysisArray = Object.keys(subjectAnalysis).map((subject) => ({
        name: subject,
        ...subjectAnalysis[subject],
      }))

      insights = getPerformanceInsights(exam, sectionAnalysis, subjectAnalysisArray)
    } catch (error) {
      insights = [
        {
          title: "Performance Analysis",
          description: "Your performance data has been recorded successfully.",
        },
      ]
    }

    // Calculate time analysis
    const totalTimeSpent = examQuestions.reduce((total, eq) => total + (eq.timeSpent || 0), 0)
    const avgTimePerQuestion = examQuestions.length > 0 ? totalTimeSpent / examQuestions.length : 0
    const examDurationSeconds = (testSeries?.duration || 0) * 60
    const timeEfficiency =
      examDurationSeconds > 0 ? ((examDurationSeconds - totalTimeSpent) / examDurationSeconds) * 100 : 0

    // Return structured data for PDF generation
    return {
      exam: {
        id: exam._id,
        startTime: exam.startTime,
        endTime: exam.endTime,
        duration: testSeries?.duration || 0,
        totalTimeSpent: Math.floor(totalTimeSpent / 60),
        timeEfficiency: Number.parseFloat(timeEfficiency.toFixed(2)),
      },
      testSeries: {
        title: testSeries?.title || "Unknown Test",
        description: testSeries?.description || "",
        examPlan: testSeries?.examPlanId?.title || "Unknown Exam Plan",
        correctMarks: testSeries?.correctMarks || 1,
        negativeMarks: testSeries?.negativeMarks || 0.25,
        passingPercentage: testSeries?.passingPercentage || 33,
      },
      user: {
        name: user?.name || "Unknown User",
        email: user?.email || "",
        mobile: user?.mobile || "",
      },
      performance: {
        totalQuestions: exam.totalQuestions || 0,
        attemptedQuestions: exam.attemptedQuestions || 0,
        correctAnswers: exam.correctAnswers || 0,
        wrongAnswers: exam.wrongAnswers || 0,
        skippedQuestions: exam.skippedQuestions || 0,
        markedForReview: exam.markedForReview || 0,
        totalScore: exam.totalScore || 0,
        maxScore: exam.maxScore || 0,
        percentage: Number.parseFloat((exam.percentage || 0).toFixed(2)),
        rank: exam.rank || 0,
        percentile: Number.parseFloat(percentile.toFixed(2)),
        totalAttempts,
        accuracy:
          exam.attemptedQuestions > 0
            ? Number.parseFloat(((exam.correctAnswers / exam.attemptedQuestions) * 100).toFixed(2))
            : 0,
        avgTimePerQuestion: Math.floor(avgTimePerQuestion),
        isPassed: (exam.percentage || 0) >= (testSeries?.passingPercentage || 33),
      },
      sectionAnalysis,
      subjectAnalysis: Object.keys(subjectAnalysis).map((subject) => ({
        name: subject,
        ...subjectAnalysis[subject],
      })),
      insights,
      questionAnalysis: examQuestions.slice(0, 20).map((eq) => ({
        id: eq._id,
        sequence: eq.sequence || 0,
        questionText: eq.questionId?.questionText || "Question not available",
        userAnswer: eq.userAnswer || null,
        correctAnswer: eq.questionId?.rightAnswer || null,
        isCorrect: eq.isCorrect,
        isMarkedForReview: eq.isMarkedForReview || false,
        status: eq.status || "UNATTEMPTED",
        timeSpent: eq.timeSpent || 0,
        explanation: eq.questionId?.explanation || "",
        subject: eq.questionId?.subjectId?.name || "Unknown Subject",
        chapter: eq.questionId?.chapterId?.name || "Unknown Chapter",
        topic: eq.questionId?.topicId?.name || "Unknown Topic",
        section: eq.sectionId?.name || "Unknown Section",
      })),
    }
  } catch (error) {
    console.error("Error building detailed result data:", error)
    throw error
  }
}


/**
 * @desc    Get exam navigation
 * @route   GET /api/exams/:examId/navigation
 * @access  Private (User)
 */
exports.getExamNavigation = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user._id;

    // Check if exam exists and belongs to the user
    const exam = await Exam.findOne({
      _id: examId,
      userId,
    });

    if (!exam) {
      return res.noRecords("Exam not found");
    }

    // Get all sections
    const sections = await Section.find({
      testSeriesId: exam.testSeriesId,
    }).sort({ sequence: 1 });

    // Get all exam questions status
    const examQuestions = await ExamQuestion.find({
      examId,
    }).select("sectionId sequence status isMarkedForReview");

    // Group questions by section
    const sectionMap = new Map();
    sections.forEach((section) => {
      sectionMap.set(section._id.toString(), {
        id: section._id,
        name: section.name,
        sequence: section.sequence,
        questions: [],
      });
    });

    // Add questions to sections
    examQuestions.forEach((eq) => {
      const sectionId = eq.sectionId.toString();
      if (sectionMap.has(sectionId)) {
        sectionMap.get(sectionId).questions.push({
          id: eq._id,
          sequence: eq.sequence,
          status: eq.status,
          isMarkedForReview: eq.isMarkedForReview,
        });
      }
    });

    // Sort questions by sequence
    sectionMap.forEach((section) => {
      section.questions.sort((a, b) => a.sequence - b.sequence);

      // Add stats
      section.stats = {
        total: section.questions.length,
        attempted: section.questions.filter((q) => q.status === "ATTEMPTED")
          .length,
        unattempted: section.questions.filter((q) => q.status === "UNATTEMPTED")
          .length,
        skipped: section.questions.filter((q) => q.status === "SKIPPED").length,
        markedForReview: section.questions.filter((q) => q.isMarkedForReview)
          .length,
      };
    });

    const navigation = Array.from(sectionMap.values());

    return res.success({
      examId: exam._id,
      status: exam.status,
      sections: navigation,
    });
  } catch (error) {
    console.error("Error getting exam navigation:", error);
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Get user's exam history
 * @route   GET /api/exams/history
 * @access  Private (User)
 */
exports.getExamResultList = async (req, res) => {
  try {
    const { limit, pageNo } = req.query;
    const userId = req.user._id;

    // Count total records
    const total = await Exam.countDocuments({
      userId,
      status: "COMPLETED",
    });

    if (total === 0) {
      return res.datatableNoRecords();
    }

    // Get exams with pagination
    const exams = await Exam.find({
      userId,
      status: "COMPLETED",
    })
      .populate("testSeriesId", "title correctMarks")
      .sort({ endTime: -1 })
      .skip((pageNo - 1) * limit)
      .limit(Number(limit));

    // Format exams
    console.log("exams", exams)
    const formattedExams = exams.map((exam) => {
      const totalMarks =
        exam.testSeriesId && exam.testSeriesId.correctMarks
          ? exam.totalQuestions * exam.testSeriesId.correctMarks
          : exam.maxScore || 0;
      return {
        id: exam._id,
        testSeries: exam.testSeriesId
          ? {
              id: exam.testSeriesId._id,
              title: exam.testSeriesId.title,
            }
          : null,
        startTime: exam.startTime,
        endTime: exam.endTime,
        totalQuestions: exam.totalQuestions,
        attemptedQuestions: exam.attemptedQuestions,
        correctAnswers: exam.correctAnswers,
        wrongAnswers: exam.wrongAnswers,
        totalScore: exam.totalScore,
        maxScore: exam.maxScore,
        percentage: exam.percentage,
        rank: exam.rank,
        totalMarks: totalMarks,
      };
    });

    return res.pagination(formattedExams, total, limit, pageNo);
  } catch (error) {
    console.log("error", error)
    console.error("Error getting exam history:", error);
    return res.someThingWentWrong(error);
  }
};
