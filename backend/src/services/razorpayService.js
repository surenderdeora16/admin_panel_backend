const Razorpay = require("razorpay")
const crypto = require("crypto")
const Order = require("../models/Order")
const Payment = require("../models/Payment")
const UserPurchase = require("../models/UserPurchase")
const ExamPlan = require("../models/ExamPlan")
const TestSeries = require("../models/TestSeries")

// Initialize Razorpay with your key_id and key_secret
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// Generate a unique order number
const generateOrderNumber = () => {
  const timestamp = new Date().getTime()
  const random = Math.floor(Math.random() * 1000)
  return `ORD-${timestamp}-${random}`
}

// Create a Razorpay order
exports.createOrder = async (userId, itemType, itemId, amount, currency = "INR") => {
  try {
    // Validate item exists and get validity days
    let validityDays = 0
    let itemModel = ""

    if (itemType === "EXAM_PLAN") {
      const examPlan = await ExamPlan.findById(itemId)
      if (!examPlan) {
        throw new Error("Exam plan not found")
      }
      validityDays = examPlan.validityDays
      itemModel = "ExamPlan"
    } else if (itemType === "TEST_SERIES") {
      const testSeries = await TestSeries.findById(itemId)
      if (!testSeries) {
        throw new Error("Test series not found")
      }
      
      // Check if test series is free
      if (testSeries.isFree) {
        throw new Error("This test series is free and doesn't require payment")
      }
      
      // Get exam plan for validity days
      const examPlan = await ExamPlan.findById(testSeries.examPlanId)
      if (!examPlan) {
        throw new Error("Associated exam plan not found")
      }
      
      validityDays = examPlan.validityDays
      itemModel = "TestSeries"
    } else {
      throw new Error("Invalid item type")
    }

    // Create Razorpay order
    const orderOptions = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: generateOrderNumber(),
      notes: {
        userId: userId.toString(),
        itemType,
        itemId: itemId.toString(),
      },
    }

    const razorpayOrder = await razorpay.orders.create(orderOptions)

    // Create our internal order
    const order = new Order({
      userId,
      orderNumber: orderOptions.receipt,
      itemType,
      itemId,
      itemModel,
      amount,
      currency,
      razorpayOrderId: razorpayOrder.id,
      status: "CREATED",
      validUntil: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000), // Set validity based on item
      metadata: {
        razorpayOrder: razorpayOrder,
      },
    })

    // Add initial status to history
    order.addStatusHistory("CREATED", "Order created")

    await order.save()

    return {
      order,
      razorpayOrder,
    }
  } catch (error) {
    console.error("Error creating Razorpay order:", error)
    throw error
  }
}

// Verify Razorpay payment signature
exports.verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex")

  return generatedSignature === razorpaySignature
}

// Process payment verification and update order status
exports.processPayment = async (razorpayOrderId, razorpayPaymentId, razorpaySignature, userId) => {
  try {
    // Verify signature
    const isValidSignature = this.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)

    if (!isValidSignature) {
      throw new Error("Invalid payment signature")
    }

    // Get payment details from Razorpay
    const razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId)

    // Find our order
    const order = await Order.findOne({ razorpayOrderId })

    if (!order) {
      throw new Error("Order not found")
    }

    // Verify user
    if (order.userId.toString() !== userId.toString()) {
      throw new Error("Unauthorized access to order")
    }

    // Create payment record
    const payment = new Payment({
      orderId: order._id,
      userId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      amount: razorpayPayment.amount / 100, // Convert from paise to rupees
      currency: razorpayPayment.currency,
      status: razorpayPayment.status === "captured" ? "CAPTURED" : "AUTHORIZED",
      method: razorpayPayment.method,
      bank: razorpayPayment.bank,
      cardId: razorpayPayment.card_id,
      wallet: razorpayPayment.wallet,
      vpa: razorpayPayment.vpa,
      email: razorpayPayment.email,
      contact: razorpayPayment.contact,
      notes: razorpayPayment.notes,
      rawResponse: razorpayPayment,
    })

    // Add initial status to history
    payment.addStatusHistory(razorpayPayment.status === "captured" ? "CAPTURED" : "AUTHORIZED", "Payment processed")

    await payment.save()

    // Update order status
    order.paymentId = payment._id
    order.status = "PAID"
    order.addStatusHistory("PAID", "Payment successful")
    await order.save()

    // Create user purchase record
    const userPurchase = new UserPurchase({
      userId,
      itemType: order.itemType,
      itemId: order.itemId,
      itemModel: order.itemModel,
      orderId: order._id,
      paymentId: payment._id,
      expiryDate: order.validUntil,
      status: "ACTIVE",
    })

    // Add initial status to history
    userPurchase.addStatusHistory("ACTIVE", "Purchase activated")

    await userPurchase.save()

    return {
      success: true,
      order,
      payment,
      userPurchase,
    }
  } catch (error) {
    console.error("Error processing payment:", error)
    throw error
  }
}

// Check if a payment has failed and update status
exports.checkPaymentStatus = async (orderId) => {
  try {
    const order = await Order.findById(orderId)

    if (!order) {
      throw new Error("Order not found")
    }

    // If order is still in CREATED or PENDING status after 30 minutes, mark as EXPIRED
    if (["CREATED", "PENDING"].includes(order.status)) {
      const orderCreationTime = new Date(order.createdAt).getTime()
      const currentTime = new Date().getTime()
      const timeDifference = currentTime - orderCreationTime

      // If more than 30 minutes have passed
      if (timeDifference > 30 * 60 * 1000) {
        order.status = "EXPIRED"
        order.addStatusHistory("EXPIRED", "Order expired due to payment timeout")
        await order.save()
      }
    }

    return order
  } catch (error) {
    console.error("Error checking payment status:", error)
    throw error
  }
}

// Get payment details from Razorpay
exports.getPaymentDetails = async (paymentId) => {
  try {
    return await razorpay.payments.fetch(paymentId)
  } catch (error) {
    console.error("Error fetching payment details:", error)
    throw error
  }
}

// Check if user has active purchase for an item
exports.checkUserPurchase = async (userId, itemType, itemId) => {
  try {
    // If it's a test series, check if it's free
    if (itemType === "TEST_SERIES") {
      const testSeries = await TestSeries.findById(itemId)
      if (testSeries && testSeries.isFree) {
        return true // Free test series, no purchase needed
      }
      
      // If not free, check if user has purchased the associated exam plan
      const examPlan = await ExamPlan.findById(testSeries.examPlanId)
      if (!examPlan) {
        throw new Error("Associated exam plan not found")
      }
      
      // Check if user has purchased the exam plan
      const examPlanPurchase = await UserPurchase.findOne({
        userId,
        itemType: "EXAM_PLAN",
        itemId: examPlan._id,
        status: "ACTIVE",
        expiryDate: { $gt: new Date() },
      })
      
      if (examPlanPurchase) {
        return true // User has purchased the exam plan, can access the test series
      }
    }
    
    // For exam plans or direct test series purchase
    const purchase = await UserPurchase.findOne({
      userId,
      itemType,
      itemId,
      status: "ACTIVE",
      expiryDate: { $gt: new Date() },
    })

    return !!purchase
  } catch (error) {
    console.error("Error checking user purchase:", error)
    throw error
  }
}

// Get user's active purchases
exports.getUserActivePurchases = async (userId) => {
  try {
    return await UserPurchase.find({
      userId,
      status: "ACTIVE",
      expiryDate: { $gt: new Date() },
    }).populate({
      path: "itemId",
      select: "title name description",
    })
  } catch (error) {
    console.error("Error getting user active purchases:", error)
    throw error
  }
}

// Update expired purchases
exports.updateExpiredPurchases = async () => {
  try {
    const expiredPurchases = await UserPurchase.find({
      status: "ACTIVE",
      expiryDate: { $lt: new Date() },
    })

    for (const purchase of expiredPurchases) {
      purchase.status = "EXPIRED"
      purchase.addStatusHistory("EXPIRED", "Purchase expired")
      await purchase.save()
    }

    return expiredPurchases.length
  } catch (error) {
    console.error("Error updating expired purchases:", error)
    throw error
  }
}
