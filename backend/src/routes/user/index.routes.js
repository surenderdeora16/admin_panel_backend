const authController = require('../../controllers/user/authController');
const commonController = require('../../controllers/user/commonController');
const bookingController = require('../../controllers/user/bookingController');

const { showValidationErrors, authCheck } = require('../../middelwares')
const checkValid = require('../../middelwares/validator');
const router = require('express').Router();
const Storage = require('../../helpers/Storage');
const upload = new Storage.uploadTo({ dir: 'user', isImage: true });

// User Auth
router.post('/send-otp', checkValid('sendOtp'), showValidationErrors, authController.sendotp);
router.post('/register', checkValid('register'), showValidationErrors, authController.register);
router.post('/login-otp', checkValid('loginWithOtp'), showValidationErrors, authController.loginWithOtp);

// User Login Check
router.use(authCheck);

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