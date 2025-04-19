const authController = require('../../controllers/user/authController');
const commonController = require('../../controllers/user/commonController');
const bookingController = require('../../controllers/user/bookingController');
const locationController = require('../../controllers/locationController');
const dashboardController = require('../../controllers/user/dashboardController');
const noteController = require("../../controllers/admin/noteController")
const testSeriesController = require("../../controllers/admin/testSeriesController")
const paymentController = require("../../controllers/paymentController")
const examPlanController = require("../../controllers/user/examPlanController")
const examPlanPaymentController = require("../../controllers/user/examPlanPaymentController")
const notePaymentController = require("../../controllers/user/notePaymentController")

// const { checkNotePurchase, checkExamPlanPurchase, checkTestSeriesAccess } = require("../../middelwares/checkPurchase")
const { checkExamPlanPurchase, checkTestSeriesAccess } = require("../../middelwares/checkPurchase")



const { showValidationErrors, authCheck } = require('../../middelwares')
const checkValid = require('../../middelwares/validator');
const router = require('express').Router();
const Storage = require('../../helpers/Storage');
const upload = new Storage.uploadTo({ dir: 'user', isImage: true });

// User Auth
router.post('/register', checkValid('register'), showValidationErrors, authController.register);
router.post('/login', checkValid('login'), showValidationErrors, authController.login);
router.post('/forgot-password', checkValid('forgotPassword'), showValidationErrors, authController.forgotPassword);
router.post('/verify-otp', checkValid('verifyOtp'), showValidationErrors, authController.verifyOtp);
router.post('/reset-password', checkValid('resetPassword'), showValidationErrors, authController.resetPassword);
router.post('/change-password', checkValid('changePassword'), showValidationErrors, authController.changePassword);


// location Routes 
router.get('/states', locationController.getStates);
router.get('/districts/:stateId', locationController.getDistricts);

// >>>>
router.post('/send-otp', checkValid('sendOtp'), showValidationErrors, authController.sendotp);
router.post('/login-otp', checkValid('loginWithOtp'), showValidationErrors, authController.loginWithOtp);

// User Login Check
router.use(authCheck);

// ..................... Dashboard Routes .................................
router.get('/dashboard', dashboardController.dashboard);



// Note Routes for users
router.get("/subjects/:subjectId/notes", noteController.getNotesBySubject)
// router.get("/notes/:noteId/download", checkNotePurchase, noteController.downloadNote)
router.get("/notes/:noteId/download", noteController.downloadNote)


// Exam Plan Payment Flow
// Create exam plan order
router.post("/exam-plans/:examPlanId/order",  examPlanPaymentController.createExamPlanOrder)

// Verify exam plan payment
router.post("/exam-plans/verify-payment",  examPlanPaymentController.verifyExamPlanPayment)

// Get user's purchased exam plans
router.get("/exam-plans/purchased",  examPlanPaymentController.getUserPurchasedExamPlans)

// Check if user has purchased an exam plan
router.get("/exam-plans/:examPlanId/check-purchase",  examPlanPaymentController.checkExamPlanPurchase)

// Get applicable coupons for an exam plan
router.get("/exam-plans/:examPlanId/coupons",  examPlanPaymentController.getExamPlanCoupons)

// Validate coupon for an exam plan
router.post("/exam-plans/:examPlanId/validate-coupon",  examPlanPaymentController.validateExamPlanCoupon)

// Exam Plan Routes for users
router.get("/exam-plans",  examPlanController.getUserExamPlans)
router.get("/exam-plans/:id",  examPlanController.getUserExamPlanById)




// Create note order
router.post("/notes/:noteId/order",  notePaymentController.createNoteOrder)

// Verify note payment
router.post("/notes/verify-payment",  notePaymentController.verifyNotePayment)

// Get user's purchased notes
router.get("/notes/purchased",  notePaymentController.getUserPurchasedNotes)

// Check if user has purchased a note
router.get("/notes/:noteId/check-purchase",  notePaymentController.checkNotePurchase)

// Get applicable coupons for a note
router.get("/notes/:noteId/coupons",  notePaymentController.getNoteCoupons)

// Validate coupon for a note
router.post("/notes/:noteId/validate-coupon",  notePaymentController.validateNoteCoupon)


































// Test Series Routes for users
// router.get("/exam-plans/:examPlanId/test-series",  testSeriesController.getTestSeriesWithPurchaseStatus)
// router.get("/test-series/:testSeriesId",  checkTestSeriesAccess, testSeriesController.getTestSeriesForUser)
router.get("/test-series/:testSeriesId/sections",  checkTestSeriesAccess, testSeriesController.getTestSeriesSections)
router.get("/test-series/:testSeriesId/sections/:sectionId/questions",  checkTestSeriesAccess, testSeriesController.getSectionQuestions)

// Payment Routes
router.post("/payments/create-order",  paymentController.createPaymentOrder)
router.post("/payments/verify",  paymentController.verifyPayment)
router.get("/payments/history",  paymentController.getUserPaymentHistory)
router.get("/payments/active-purchases",  paymentController.getUserActivePurchases)
router.get("/payments/:paymentId",  paymentController.getPaymentDetails)
router.get("/purchases/check/:itemType/:itemId",  paymentController.checkPurchaseStatus)


// ..................... User Protected Routes .................................
router.get('/logout', authController.logout);
router.get('/profile', authController.getProfile);
router.post('/update-profile', upload.single('image'), checkValid('updateProfileUser'), showValidationErrors, authController.updateProfile);
router.post('/change-profile-image', upload.single('image'), authController.changeProfileImage);

router.post('/check-discount-code', showValidationErrors, commonController.checkDiscountCode);

router.post('/booking', checkValid('booking'), showValidationErrors, bookingController.createBooking);
router.post('/booking-2', checkValid('booking-2'), showValidationErrors, bookingController.createBooking2);
router.get('/booking-history', bookingController.bookingHistoryList);


router.all('/user/*', function (req, res) {
    res.status(404).send({
        status: 404,
        message: 'API not found',
        data: [],
    });
});

module.exports = router;