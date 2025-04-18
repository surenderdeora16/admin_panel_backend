const cron = require("node-cron")
const razorpayService = require("../services/razorpayService")

// Schedule task to run every day at midnight
const scheduleUpdateExpiredPurchases = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("Running scheduled task: Update expired purchases")
      const updatedCount = await razorpayService.updateExpiredPurchases()
      console.log(`Updated ${updatedCount} expired purchases`)
    } catch (error) {
      console.error("Error in scheduled task:", error)
    }
  })
}

module.exports = {
  scheduleUpdateExpiredPurchases,
}
