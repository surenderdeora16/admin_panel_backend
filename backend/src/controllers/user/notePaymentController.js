const razorpayService = require("../../services/razorpayService")
const couponService = require("../../services/couponService")
const Order = require("../../models/Order")
const Payment = require("../../models/Payment")
const UserPurchase = require("../../models/UserPurchase")
const Note = require("../../models/Note")
const AppError = require("../../utils/appError")
const catchAsync = require("../../utils/catchAsync")
const logger = require("../../utils/logger")

/**
 * @desc    Create a payment order for a note
 * @route   POST /api/notes/:noteId/order
 * @access  Private (User)
 */
exports.createNoteOrder = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { couponCode } = req.body;

    // Validate note ID
    if (!noteId) {
      return res.noRecords("Note ID is required");
    }

    // Create order
    const { order, razorpayOrder } = await razorpayService.createNoteOrder(
      req.user._id,
      noteId,
      couponCode
    );

    // Return order details
    return res.successInsert({
      orderId: order._id,
      orderNumber: order.orderNumber,
      originalAmount: order.originalAmount,
      discountAmount: order.discountAmount,
      finalAmount: order.finalAmount,
      couponCode: order.couponCode,
      currency: order.currency,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      prefill: {
        name: req.user.name,
        email: req.user.email,
        contact: req.user.phone,
      },
      notes: {
        userId: req.user._id.toString(),
        itemType: "NOTE",
        itemId: noteId,
      },
    }, "Note order created successfully");
  } catch (error) {
    console.error(`Error creating note order: ${error.message}`, { error });
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Verify payment for a note
 * @route   POST /api/notes/verify-payment
 * @access  Private (User)
 */
exports.verifyNotePayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Validate required fields
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.noRecords("All payment details are required");
    }

    // Process payment
    const result = await razorpayService.processPayment(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      req.user._id
    );

    // Verify that this is a note order
    const order = result.order;
    if (order.itemType !== "NOTE") {
      return res.noRecords("Invalid order type");
    }

    // Return success response
    return res.success({
      orderId: result.order._id,
      orderNumber: result.order.orderNumber,
      paymentId: result.payment._id,
      purchaseId: result.userPurchase._id,
      noteId: result.order.itemId,
      expiryDate: result.userPurchase.expiryDate,
      originalAmount: result.order.originalAmount,
      discountAmount: result.order.discountAmount,
      finalAmount: result.order.finalAmount,
      couponCode: result.order.couponCode,
    }, "Note payment verified successfully");
  } catch (error) {
    console.error(`Error verifying note payment: ${error.message}`, { error });
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Get user's purchased notes
 * @route   GET /api/notes/purchased
 * @access  Private (User)
 */
exports.getUserPurchasedNotes = async (req, res) => {
  try {
    // Get user's active purchases for notes
    const purchases = await UserPurchase.find({
      userId: req.user._id,
      itemType: "NOTE",
      status: "ACTIVE",
      expiryDate: { $gt: new Date() },
    })
      .populate({
        path: "itemId",
        select: "title description thumbnailImage pdfFile price mrp validityDays subjectId",
        populate: {
          path: "subjectId",
          select: "name",
        },
      })
      .populate({
        path: "orderId",
        select: "orderNumber originalAmount discountAmount finalAmount couponCode",
      });

    // Return purchases
    return res.success(purchases);
  } catch (error) {
    console.error(`Error getting user purchased notes: ${error.message}`, { error });
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Check if user has purchased a note
 * @route   GET /api/notes/:noteId/check-purchase
 * @access  Private (User)
 */
exports.checkNotePurchase = async (req, res) => {
  try {
    const { noteId } = req.params;

    // Validate note ID
    if (!noteId) {
      return res.noRecords("Note ID is required");
    }

    // Get note details
    const note = await Note.findById(noteId);

    if (!note) {
      return res.noRecords("Note not found");
    }

    // If note is free, user has access
    if (note.isFree) {
      return res.success({
        hasPurchased: true,
        isFree: true,
        note: {
          id: note._id,
          title: note.title,
          isFree: note.isFree,
          price: note.price,
          mrp: note.mrp,
          validityDays: note.validityDays,
        },
      });
    }

    // Check if user has an active purchase
    const purchase = await UserPurchase.findOne({
      userId: req.user._id,
      itemType: "NOTE",
      itemId: noteId,
      status: "ACTIVE",
      expiryDate: { $gt: new Date() },
    });

    // Calculate remaining validity days if purchased
    let remainingDays = 0;
    if (purchase) {
      const now = new Date();
      const expiryDate = new Date(purchase.expiryDate);
      remainingDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    }

    // Return purchase status
    return res.success({
      hasPurchased: !!purchase,
      isFree: false,
      purchase: purchase
        ? {
            id: purchase._id,
            purchaseDate: purchase.purchaseDate,
            expiryDate: purchase.expiryDate,
            remainingDays,
          }
        : null,
      note: {
        id: note._id,
        title: note.title,
        isFree: note.isFree,
        price: note.price,
        mrp: note.mrp,
        validityDays: note.validityDays,
      },
    });
  } catch (error) {
    console.error(`Error checking note purchase: ${error.message}`, { error });
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Get applicable coupons for a note
 * @route   GET /api/notes/:noteId/coupons
 * @access  Private (User)
 */
exports.getNoteCoupons = async (req, res) => {
  try {
    const { noteId } = req.params;

    // Validate note ID
    if (!noteId) {
      return res.noRecords("Note ID is required");
    }

    // Get note details
    const note = await Note.findById(noteId);

    if (!note) {
      return res.noRecords("Note not found");
    }

    // If note is free, no coupons needed
    if (note.isFree) {
      return res.success([], "This note is free and doesn't require coupons");
    }

    // Get applicable coupons
    const coupons = await couponService.getApplicableCoupons(
      req.user._id,
      "NOTE",
      noteId,
      note.price
    );

    // Return coupons
    return res.success(coupons);
  } catch (error) {
    console.error(`Error getting note coupons: ${error.message}`, { error });
    return res.someThingWentWrong(error);
  }
};

/**
 * @desc    Validate coupon for a note
 * @route   POST /api/notes/:noteId/validate-coupon
 * @access  Private (User)
 */
exports.validateNoteCoupon = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { couponCode } = req.body;

    // Validate required fields
    if (!noteId) {
      return res.noRecords("Note ID is required");
    }

    if (!couponCode) {
      return res.noRecords("Coupon code is required");
    }

    // Get note details
    const note = await Note.findById(noteId);

    if (!note) {
      return res.noRecords("Note not found");
    }

    // If note is free, no coupons needed
    if (note.isFree) {
      return res.noRecords("This note is free and doesn't require coupons");
    }

    // Validate coupon
    const couponData = await couponService.validateCoupon(
      couponCode,
      req.user._id,
      "NOTE",
      noteId,
      note.price
    );

    // Return coupon validation result
    return res.success({
      couponCode: couponData.coupon.code,
      discountType: couponData.coupon.discountType,
      discountValue: couponData.coupon.discountValue,
      originalAmount: couponData.originalAmount,
      discountAmount: couponData.discountAmount,
      finalAmount: couponData.finalAmount,
    }, "Coupon validated successfully");
  } catch (error) {
    console.error(`Error validating note coupon: ${error.message}`, { error });
    return res.someThingWentWrong(error);
  }
};