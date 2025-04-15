const authController = require('../../controllers/user/authController');
const commonController = require('../../controllers/user/commonController');
const bookingController = require('../../controllers/user/bookingController');
const locationController = require('../../controllers/locationController');

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