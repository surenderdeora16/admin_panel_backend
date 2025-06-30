const cron = require("node-cron")
const Exam = require("../models/Exam")
const { autoSubmitExam } = require("../controllers/user/examController")
const razorpayService = require("../services/razorpayService")
const logger = require("./logger")


// Schedule task to run every day at midnight
const scheduleUpdateExpiredPurchases = async () => {
    try {
      console.log("Running scheduled task: Update expired purchases")
      const updatedCount = await razorpayService.updateExpiredPurchases()
      console.log(`Updated ${updatedCount} expired purchases`)
    } catch (error) {
      console.error("Error in scheduled task:", error)
    }
}


// Function to check and auto-submit expired exams
const checkAndSubmitExpiredExams = async () => {
  try {
    // Find all exams that are still in STARTED status but have passed their end time
    const expiredExams = await Exam.find({
      status: "STARTED",
      endTime: { $lt: new Date() },
    }).sort({ endTime: 1 })

    logger.info(`Found ${expiredExams.length} expired exams to auto-submit`)

    // Auto-submit each expired exam
    for (const exam of expiredExams) {
      try {
        await autoSubmitExam(exam?._id)
        logger.info(`Auto-submitted expired exam ${exam._id} for user ${exam.userId}`)
      } catch (error) {
        logger.error(`Error auto-submitting expired exam ${exam._id}:`, error)
      }
    }
  } catch (error) {
    logger.error("Error checking for expired exams:", error)
  }
}

// Schedule tasks
const initScheduledTasks = () => {
  // Check for expired exams every minute
  cron.schedule("* * * * *", checkAndSubmitExpiredExams)

  logger.info("Scheduled tasks initialized")
}



module.exports = {
  scheduleUpdateExpiredPurchases,
  initScheduledTasks,
  checkAndSubmitExpiredExams,
}
