const authController = require('../../controllers/admin/authController')
const generalSettingsController = require('../../controllers/admin/generalSettingsController')
const discountCouponController = require('../../controllers/admin/discountCouponController');
const usersController = require('../../controllers/admin/usersController');
const CommonController = require('../../controllers/admin/CommonController');

const { showValidationErrors, authCheckAdmin } = require('../../middelwares');
const checkValid = require('../../middelwares/validator');
const router = require('express').Router()
const Storage = require('../../helpers/Storage');
const upload = new Storage.uploadTo({ dir: 'admins', isImage: true });
const uploadSettings = new Storage.uploadTo({ dir: 'settings', isImage: true });
const retreatSettings = new Storage.uploadTo({ dir: 'retreat' });

// User Auth
router.post('/login', checkValid('login'), showValidationErrors, authController.login);
router.post('/send-otp', checkValid('sendOtp'), showValidationErrors, authController.sendotp);
router.post('/login-otp', checkValid('loginWithOtp'), showValidationErrors, authController.loginWithOtp);
router.post('/reset-password', checkValid('resetPassword'), showValidationErrors, authController.resetPassword);


// Protected Routes..
router.use(authCheckAdmin);

// Admin Protected Routes
router.get('/logout', authController.logout);
router.post('/change-password', checkValid('changePassword'), showValidationErrors, authController.changePassword);
router.get('/profile', authController.getProfile);
router.post('/update-profile', upload.single('image'), checkValid('updateProfile'), showValidationErrors, authController.updateProfile);
router.post('/change-profile-image', upload.single('image'), authController.changeProfileImage);

router.get('/settings-list/:type', generalSettingsController.listGeneralSetting);

router.delete('/toggle-status/:table/:id', generalSettingsController.toggleStatus);
router.delete('/delete-record/:table/:id', generalSettingsController.commonDelete);
router.put('/update-settings', uploadSettings.fields([{ name: 'favicon', maxCount: 1 }, { name: 'logo', maxCount: 1 }, { name: 'footer_logo', maxCount: 1 }]), generalSettingsController.updateGeneralSetting)


router.post('/discount-coupon', checkValid('discountCouponAdd'), showValidationErrors, discountCouponController.create)
router.put('/discount-coupon', checkValid('discountCouponEdit'), showValidationErrors, discountCouponController.update)
router.get('/discount-coupons-datatable', discountCouponController.list)

router.get('/users-datatable', usersController.list);
router.get('/contact-us-datatable', CommonController.contactUsList)


router.all('/admin/*', function (req, res) {
    res.status(404).send({
        status: 404,
        message: 'API not found',
        data: [],
    });
});

module.exports = router;