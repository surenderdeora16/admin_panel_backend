const authController = require('../../controllers/user/authController');
const commonController = require('../../controllers/user/commonController');
const bookingController = require('../../controllers/user/bookingController');
const locationController = require('../../controllers/locationController');
const AppController = require('../../controllers/user/AppController');
const noteController = require("../../controllers/admin/noteController")
const testSeriesController = require("../../controllers/admin/testSeriesController")
const paymentController = require("../../controllers/paymentController")
const examPlanController = require("../../controllers/user/examPlanController")
const examPlanPaymentController = require("../../controllers/user/examPlanPaymentController")
const notePaymentController = require("../../controllers/user/notePaymentController")
const examController = require("../../controllers/user/examController")
const userExamStatusController = require("../../controllers/user/userExamStatusController")
const dynamicContentController = require("../../controllers/user/dynamicContentController")


// const { checkNotePurchase, checkExamPlanPurchase, checkTestSeriesAccess } = require("../../middelwares/checkPurchase")
const { checkExamPlanPurchase, checkTestSeriesAccess, checkNoteAccess } = require("../../middelwares/checkPurchase")



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
router.get('/dashboard', AppController.dashboard);
router.get('/upcoming-govt-exam/:id', AppController.upComingExamPageDetail);
router.get('/payment-history', AppController.getUserPaymentHistory);


// NONTES 
// Get notes by subject with access status
router.get("/subjects/:subjectId/notes", noteController.getNotesBySubject)
// Get notes by exam plan with access status
router.get("/exam-plans/:examPlanId/notes", noteController.getNotesByExamPlan)
// Get subjects with notes count by exam plan
router.get("/exam-plans/:examPlanId/subjects-notes", noteController.getSubjectsWithNotesCountByExamPlan)
// Download note (checks access permission)
router.get("/notes/:noteId/download", checkNoteAccess, noteController.downloadNote)




router.get("/batches", AppController.getBatches)


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

// Get user's Payment history
router.get("/exam-plans/history",  examPlanPaymentController.getUserPurchasedExamPlans)


// Exam Plan Routes for users
router.get("/exam-plans",  examPlanController.getUserExamPlans)
router.get("/exam-plans/:id",  examPlanController.getUserExamPlanById)
router.get("/exam-plans-bybatch/:batchId",  examPlanController.getExamPlansByBatch)


// Test Series Routes for users
router.get("/test-series", examPlanController.getAllTestSeries);
// Get test series by ID (with authentication)
router.get("/test-series/:id", examPlanController.getTestSeriesById);



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







router.get("/exams/ongoing", userExamStatusController.checkOngoingExams)

// Get detailed information about a specific ongoing exam
router.get("/exams/ongoing/:examId", userExamStatusController.getOngoingExamDetails)



// Start a new exam
router.post("/exams/start/:testSeriesId",  examController.startExam);

// Get all exam questions structured by sections 
router.get("/exams/:examId/all-questions", examController.getAllExamQuestions)

// Answer an exam question
router.post("/exams/:examId/answer-question", examController.answerExamQuestionBatch)

// Update question status in batch 
router.post("/exams/:examId/update-question-status", examController.updateQuestionStatusBatch)


// Get exam questions by section
router.get("/exams/:examId/sections/:sectionId/questions",  examController.getExamQuestionsBySection);


// Get a specific exam question
router.get("/exams/questions/:examQuestionId",  examController.getExamQuestion);

// Answer an exam question
router.post("/exams/questions/:examQuestionId/answer",  examController.answerExamQuestion);

// Skip an exam question
router.post("/exams/questions/:examQuestionId/skip",  examController.skipExamQuestion);

// Mark/unmark an exam question for review
router.post("/exams/questions/:examQuestionId/mark-review",  examController.markExamQuestionForReview);

// Update section timing
router.post("/exams/:examId/sections/:sectionId/timing",  examController.updateSectionTiming);

// Submit exam
router.post("/exams/:examId/submit",  examController.submitExam);

// Get exam result
router.get("/exams/:examId/result",  examController.getExamResult);

// Get exam review
router.get("/exams/:examId/review",  examController.getExamReview);

// Get exam navigation
router.get("/exams/:examId/navigation",  examController.getExamNavigation);

// Get user's exam history
router.get("/exams/result-list",  examController.getExamResultList);



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

router.get("/policy", dynamicContentController.getAllPublicContent)
router.get("/policy/:type", dynamicContentController.getDynamicContentByType)

router.all('/user/*', function (req, res) {
    res.status(404).send({
        status: 404,
        message: 'API not found',
        data: [],
    });
});

module.exports = router;