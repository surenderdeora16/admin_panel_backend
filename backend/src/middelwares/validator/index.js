const { check } = require('express-validator');

module.exports = (method) => {
    switch (method) {
        case "register":
            {
                return [
                    check("first_name", "First Name Required..!!").exists().not().isEmpty().isLength({ min: 2, max: 50 }),
                    check("last_name", "Last Name Required..!!").exists().not().isEmpty().isLength({ min: 2, max: 50 }),
                    check("email", "Invalid Email..!!").not().isEmpty().isEmail().isLength({ min: 6, max: 50 }),
                    check("mobile", "Mobile Number Required.!!").exists().not().isEmpty().isLength({ min: 10, max: 10 }).withMessage("10 Digits Required.").isNumeric().withMessage("Mobile No Must Be Digits Only."),
                    check("gender", "Gender is required..!!").not().isEmpty(),
                    check("otp", "OTP Required!").exists().not().isEmpty(),
                ];
            }
            break;
        case "login":
            {
                return [
                    check("mobile", "Mobile Number Required!").exists().not().isEmpty(),
                    check("password", "Password Required!").exists().not().isEmpty(),
                ];
            }
            break;
        case "sendOtp":
            {
                return [
                    check("mobile", "Mobile Number Required!").exists().not().isEmpty(),
                ];
            }
            break;
        case "loginWithOtp":
            {
                return [
                    check("mobile", "Mobile Number Required!").exists().not().isEmpty(),
                    check("otp", "OTP Required!").exists().not().isEmpty(),
                ];
            }
            break;
        case "resetPassword":
            {
                return [
                    check("mobile", "Mobile Number Required!").exists().not().isEmpty(),
                    check("password", "Password Required!").exists().not().isEmpty(),
                    check("otp", "OTP Required!").exists().not().isEmpty(),
                ];
            }
            break;
        case "changePassword":
            {
                return [
                    check("password", "Password Required!").exists().not().isEmpty(),
                    check("new_password", "New Password Required!").exists().not().isEmpty(),
                ];
            }
            break;
        case "updateProfile":
            {
                return [
                    check("name", "First Name Required..!!").exists().not().isEmpty().isLength({ min: 2, max: 50 }),
                    check("email", "Invalid Email..!!").not().isEmpty().isEmail().isLength({ min: 6, max: 50 }),
                    check("mobile", "Mobile Number Required.!!").exists().not().isEmpty().isLength({ min: 10, max: 10 }).withMessage("10 Digits Required.").isNumeric().withMessage("Mobile No Must Be Digits Only."),
                ];
            }
            break;
        case "updateProfileUser":
            {
                return [
                    check("first_name", "First Name Required..!!").exists().not().isEmpty().isLength({ min: 2, max: 50 }),
                    check("last_name", "Last Name Required..!!").exists().not().isEmpty().isLength({ min: 2, max: 50 }),
                    check("email", "Invalid Email..!!").not().isEmpty().isEmail().isLength({ min: 6, max: 50 }),
                    check("mobile", "Mobile Number Required.!!").exists().not().isEmpty().isLength({ min: 10, max: 10 }).withMessage("10 Digits Required.").isNumeric().withMessage("Mobile No Must Be Digits Only."),
                ];
            }
            break;
        case "ContactUs":
            {
                return [
                    check("first_name", "First Name Required..!!").exists().not().isEmpty().isLength({ min: 2, max: 50 }),
                    check("last_name", "Last Name Required..!!").exists().not().isEmpty().isLength({ min: 2, max: 50 }),
                    check("email", "Invalid Email..!!").not().isEmpty().isEmail().isLength({ min: 6, max: 50 }),
                    check("mobile", "Mobile Number Required.!!").exists().not().isEmpty().isLength({ min: 10, max: 10 }).withMessage("10 Digits Required.").isNumeric().withMessage("Mobile No. Must Be Digits Only."),
                ];
            }
            break;

        case "retreat":
            {
                return [
                    check("name", "Name Required..!!").exists().not().isEmpty().isLength({ min: 2, max: 50 }),
                    check("short_description", "Short Description Required..!!").exists().not().isEmpty().isLength({ min: 10, max: 500 }),
                    check("location", "Location Required..!!").exists().not().isEmpty().isLength({ min: 2, max: 200 }),
                    check("access", "Access Required..!!").exists().not().isEmpty().isLength({ min: 2, max: 200 }),
                    check("check_in", "Check In Required..!!").exists().not().isEmpty(),
                    check("check_out", "Check out Required..!!").exists().not().isEmpty(),
                    check("status", "status In Required..!!").exists().not().isEmpty(),
                    check("details", "Details Required..!!").exists().not().isEmpty().isLength({ min: 10, max: 5000 }),
                    check('prices.*.amount', 'Amount is required').notEmpty().isFloat({ min: 0 }),
                ];
            }
            break;
        case "discountCouponAdd":
            {
                return [
                    check("name", "Name Required..!!").exists().not().isEmpty().isLength({ min: 2, max: 50 }),
                    check("code", "Code is required and should be alphanumeric between 5 and 20 characters.").exists().not().isEmpty().isLength({ min: 5, max: 20 }),
                    check("discount_amount", "Discount amount should be a positive number between 1 and 1000000.").exists().not().isEmpty().isFloat({ min: 1, max: 1000000 }),
                    check("min_cart_amount", "Minimum cart amount should be a positive number between 1 and 1000000.").exists().not().isEmpty().isFloat({ min: 1, max: 1000000 }),
                    check("discount_amount_usd", "Discount amount (USD) should be a positive number between 1 and 1000000.").exists().not().isEmpty().isFloat({ min: 1, max: 1000000 }),
                    check("min_cart_amount_usd", "Minimum cart amount (USD) should be a positive number between 1 and 1000000.").exists().not().isEmpty().isFloat({ min: 1, max: 1000000 }),
                    check("expaire_date", "Expiry date is required and should be a valid date.").exists().not().isEmpty().isISO8601(),
                    check("max_uses", "Maximum uses should be a positive number between 1 and 1000000.").exists().not().isEmpty().isInt({ min: 1, max: 1000000 }),
                    check("status", "Status is required and should be boolean.").exists().not().isEmpty().isBoolean(),
                ];
            }
            break;
        case "discountCouponEdit":
            {
                return [
                    check('id', 'Id Required..!!').exists().not().isEmpty(),
                    check("name", "Name Required..!!").exists().not().isEmpty().isLength({ min: 2, max: 50 }),
                    check("code", "Code is required and should be alphanumeric between 5 and 20 characters.").exists().not().isEmpty().isLength({ min: 5, max: 20 }),
                    check("discount_amount", "Discount amount should be a positive number between 1 and 1000000.").exists().not().isEmpty().isFloat({ min: 1, max: 1000000 }),
                    check("min_cart_amount", "Minimum cart amount should be a positive number between 1 and 1000000.").exists().not().isEmpty().isFloat({ min: 1, max: 1000000 }),
                    check("discount_amount_usd", "Discount amount (USD) should be a positive number between 1 and 1000000.").exists().not().isEmpty().isFloat({ min: 1, max: 1000000 }),
                    check("min_cart_amount_usd", "Minimum cart amount (USD) should be a positive number between 1 and 1000000.").exists().not().isEmpty().isFloat({ min: 1, max: 1000000 }),
                    check("expaire_date", "Expiry date required..!!").exists().not().isEmpty(),
                    check("max_uses", "Maximum uses should be a positive number between 1 and 1000000.").exists().not().isEmpty().isInt({ min: 1, max: 1000000 }),
                    check("status", "Status is required and should be boolean.").exists().not().isEmpty().isBoolean(),
                ];
            }
            break;


        case "booking":
            {
                return [
                    check("retreat_id", "Retreat_id Required..!!").exists().not().isEmpty(),
                    check("single_occupancy", "Single Occupancy Required..!!").exists().not().isEmpty(),
                    check("double_occupancy", "Double Occupancy Required..!!").exists().not().isEmpty(),
                    check("triple_occupancy", "Triple Occupancy Required..!!").exists().not().isEmpty(),
                    check("currency", "Currency Required..!!").exists().not().isEmpty(),
                    check("discount_code", "Discount Code Required..!!").exists().optional({ nullable: true, checkFalsy: false }),
                    check("type", "Booking Type Required..!!").exists().not().isEmpty(),
                ];
            }
            break;

        case "booking-2":
            {
                return [
                    check("package_id", "Package_id Required..!!").exists().not().isEmpty(),
                    check("slot_id", "Slot_id Required..!!").exists().not().isEmpty(),
                    check("currency", "Currency Required..!!").exists().not().isEmpty(),
                    check("discount_code", "Discount Code Required..!!").exists().optional({ nullable: true, checkFalsy: false }),
                ];
            }
            break;



    }


};