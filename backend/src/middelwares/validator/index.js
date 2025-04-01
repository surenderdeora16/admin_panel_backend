const { check } = require("express-validator");

module.exports = (method) => {
  switch (method) {
    case "register":
      {
        return [
          check("name")
            .exists()
            .withMessage("Please provide your name")
            .notEmpty()
            .withMessage("Name cannot be empty")
            .isLength({ min: 2, max: 50 })
            .withMessage("Name should be between 2 and 50 characters"),

          check("email")
            .exists()
            .withMessage("Please provide an email address")
            .notEmpty()
            .withMessage("Email cannot be empty")
            .isEmail()
            .withMessage(
              "Please enter a valid email address (e.g., example@domain.com)"
            )
            .normalizeEmail()
            .isLength({ max: 100 })
            .withMessage("Email should not exceed 100 characters"),

          check("mobile")
            .exists()
            .withMessage("Please provide your mobile number")
            .notEmpty()
            .withMessage("Mobile number cannot be empty")
            .isMobilePhone("en-IN")
            .withMessage("Please enter a valid 10-digit Indian mobile number")
            .isLength({ min: 10, max: 10 })
            .withMessage("Mobile number must be exactly 10 digits"),

          check("password")
            .exists()
            .withMessage("Please create a password")
            .notEmpty()
            .withMessage("Password cannot be empty")
            .isLength({ min: 8 })
            .withMessage("Password must be at least 8 characters long"),

          check("confirmPassword")
            .exists()
            .withMessage("Please confirm your password")
            .notEmpty()
            .withMessage("Password confirmation cannot be empty")
            .custom((value, { req }) => value === req.body.password)
            .withMessage("Passwords do not match"),

          check("state")
            .exists()
            .withMessage("Please select your state")
            .notEmpty()
            .withMessage("State cannot be empty")
            .isMongoId().withMessage('Invalid State ID'),

          check("district")
            .exists()
            .withMessage("Please select your district")
            .notEmpty()
            .withMessage("District cannot be empty")
            .isMongoId().withMessage('Invalid District ID'),
        ];
      }
      break;
    case "login":
      {
        return [
          check("mobile")
            .exists()
            .withMessage("Please enter your mobile number")
            .notEmpty()
            .withMessage("Mobile number cannot be empty")
            .isMobilePhone("en-IN")
            .withMessage("Please enter a valid 10-digit Indian mobile number"),

          check("password")
            .exists()
            .withMessage("Please enter your password")
            .notEmpty()
            .withMessage("Password cannot be empty"),
        ];
      }
      break;
    case "forgotPassword":
      {
        return [
          check("mobile")
            .exists()
            .withMessage("Please enter your mobile number")
            .notEmpty()
            .withMessage("Mobile number cannot be empty")
            .isMobilePhone("en-IN")
            .withMessage("Please enter a valid 10-digit Indian mobile number"),
        ];
      }
      break;
    case "verifyOtp":
      return [
        check("mobile")
          .exists()
          .withMessage("Please enter your mobile number")
          .notEmpty()
          .withMessage("Mobile number cannot be empty")
          .isMobilePhone("en-IN")
          .withMessage("Please enter a valid 10-digit Indian mobile number"),

        check("otp")
          .exists()
          .withMessage("Please enter the OTP")
          .notEmpty()
          .withMessage("OTP cannot be empty")
          .isLength({ min: 6, max: 6 })
          .withMessage("OTP must be exactly 6 digits")
          .isNumeric()
          .withMessage("OTP must contain only numbers"),
      ];
      break;

    case "resetPassword":
      return [
        check("newPassword")
          .exists()
          .withMessage("Please enter a new password")
          .notEmpty()
          .withMessage("New password cannot be empty")
          .isLength({ min: 8 })
          .withMessage("New password must be at least 8 characters long"),

        check("confirmPassword")
          .exists()
          .withMessage("Please confirm your new password")
          .notEmpty()
          .withMessage("Password confirmation cannot be empty")
          .custom((value, { req }) => value === req.body.newPassword)
          .withMessage("Passwords do not match"),
      ];
      break;

    case "changePassword":
      return [
        check("oldPassword")
          .exists()
          .withMessage("Please enter your current password")
          .notEmpty()
          .withMessage("Current password cannot be empty"),

        check("newPassword")
          .exists()
          .withMessage("Please enter a new password")
          .notEmpty()
          .withMessage("New password cannot be empty")
          .isLength({ min: 8 })
          .withMessage("New password must be at least 8 characters long"),

        check("confirmPassword")
          .exists()
          .withMessage("Please confirm your new password")
          .notEmpty()
          .withMessage("Password confirmation cannot be empty")
          .custom((value, { req }) => {
            return value === req.body.newPassword;
          })
          .withMessage("Passwords do not match"),
      ];
      break;
    // admin
    case "addState":
      return [
        check("name")
          .exists()
          .withMessage("State name is required")
          .notEmpty()
          .withMessage("State name cannot be empty"),
        check("code")
          .exists()
          .withMessage("State code is required")
          .notEmpty()
          .withMessage("State code cannot be empty")
      ];
    case "addDistrict":
      return [
        check("name")
          .exists()
          .withMessage("District name is required")
          .notEmpty()
          .withMessage("District name cannot be empty"),
        check("stateId")
          .exists()
          .withMessage("State ID is required")
          .notEmpty()
          .withMessage("State ID cannot be empty")
          .isMongoId()
          .withMessage("Invalid State ID"),
        check("code")
          .exists()
          .withMessage("District code is required")
          .notEmpty()
          .withMessage("District code cannot be empty")
      ];
    case "editState":
      return [
        check("name")
          .optional()
          .notEmpty()
          .withMessage("State name cannot be empty"),
        check("code")
          .optional()
          .notEmpty()
          .withMessage("State code cannot be empty")
      ];
    case "editDistrict":
      return [
        check("name")
          .optional()
          .notEmpty()
          .withMessage("District name cannot be empty"),
        check("stateId")
          .optional()
          .notEmpty()
          .withMessage("State ID cannot be empty")
          .isMongoId()
          .withMessage("Invalid State ID"),
        check("code")
          .optional()
          .notEmpty()
          .withMessage("District code cannot be empty")
      ];
    //
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
          check("new_password", "New Password Required!")
            .exists()
            .not()
            .isEmpty(),
        ];
      }
      break;
    case "updateProfile":
      {
        return [
          check("name", "First Name Required..!!")
            .exists()
            .not()
            .isEmpty()
            .isLength({ min: 2, max: 50 }),
          check("email", "Invalid Email..!!")
            .not()
            .isEmpty()
            .isEmail()
            .isLength({ min: 6, max: 50 }),
          check("mobile", "Mobile Number Required.!!")
            .exists()
            .not()
            .isEmpty()
            .isLength({ min: 10, max: 10 })
            .withMessage("10 Digits Required.")
            .isNumeric()
            .withMessage("Mobile No Must Be Digits Only."),
        ];
      }
      break;
    case "updateProfileUser":
      {
        return [
          check("first_name", "First Name Required..!!")
            .exists()
            .not()
            .isEmpty()
            .isLength({ min: 2, max: 50 }),
          check("last_name", "Last Name Required..!!")
            .exists()
            .not()
            .isEmpty()
            .isLength({ min: 2, max: 50 }),
          check("email", "Invalid Email..!!")
            .not()
            .isEmpty()
            .isEmail()
            .isLength({ min: 6, max: 50 }),
          check("mobile", "Mobile Number Required.!!")
            .exists()
            .not()
            .isEmpty()
            .isLength({ min: 10, max: 10 })
            .withMessage("10 Digits Required.")
            .isNumeric()
            .withMessage("Mobile No Must Be Digits Only."),
        ];
      }
      break;
    case "ContactUs":
      {
        return [
          check("first_name", "First Name Required..!!")
            .exists()
            .not()
            .isEmpty()
            .isLength({ min: 2, max: 50 }),
          check("last_name", "Last Name Required..!!")
            .exists()
            .not()
            .isEmpty()
            .isLength({ min: 2, max: 50 }),
          check("email", "Invalid Email..!!")
            .not()
            .isEmpty()
            .isEmail()
            .isLength({ min: 6, max: 50 }),
          check("mobile", "Mobile Number Required.!!")
            .exists()
            .not()
            .isEmpty()
            .isLength({ min: 10, max: 10 })
            .withMessage("10 Digits Required.")
            .isNumeric()
            .withMessage("Mobile No. Must Be Digits Only."),
        ];
      }
      break;

    case "retreat":
      {
        return [
          check("name", "Name Required..!!")
            .exists()
            .not()
            .isEmpty()
            .isLength({ min: 2, max: 50 }),
          check("short_description", "Short Description Required..!!")
            .exists()
            .not()
            .isEmpty()
            .isLength({ min: 10, max: 500 }),
          check("location", "Location Required..!!")
            .exists()
            .not()
            .isEmpty()
            .isLength({ min: 2, max: 200 }),
          check("access", "Access Required..!!")
            .exists()
            .not()
            .isEmpty()
            .isLength({ min: 2, max: 200 }),
          check("check_in", "Check In Required..!!").exists().not().isEmpty(),
          check("check_out", "Check out Required..!!").exists().not().isEmpty(),
          check("status", "status In Required..!!").exists().not().isEmpty(),
          check("details", "Details Required..!!")
            .exists()
            .not()
            .isEmpty()
            .isLength({ min: 10, max: 5000 }),
          check("prices.*.amount", "Amount is required")
            .notEmpty()
            .isFloat({ min: 0 }),
        ];
      }
      break;
    case "discountCouponAdd":
      {
        return [
          check("name", "Name Required..!!")
            .exists()
            .not()
            .isEmpty()
            .isLength({ min: 2, max: 50 }),
          check(
            "code",
            "Code is required and should be alphanumeric between 5 and 20 characters."
          )
            .exists()
            .not()
            .isEmpty()
            .isLength({ min: 5, max: 20 }),
          check(
            "discount_amount",
            "Discount amount should be a positive number between 1 and 1000000."
          )
            .exists()
            .not()
            .isEmpty()
            .isFloat({ min: 1, max: 1000000 }),
          check(
            "min_cart_amount",
            "Minimum cart amount should be a positive number between 1 and 1000000."
          )
            .exists()
            .not()
            .isEmpty()
            .isFloat({ min: 1, max: 1000000 }),
          check(
            "discount_amount_usd",
            "Discount amount (USD) should be a positive number between 1 and 1000000."
          )
            .exists()
            .not()
            .isEmpty()
            .isFloat({ min: 1, max: 1000000 }),
          check(
            "min_cart_amount_usd",
            "Minimum cart amount (USD) should be a positive number between 1 and 1000000."
          )
            .exists()
            .not()
            .isEmpty()
            .isFloat({ min: 1, max: 1000000 }),
          check(
            "expaire_date",
            "Expiry date is required and should be a valid date."
          )
            .exists()
            .not()
            .isEmpty()
            .isISO8601(),
          check(
            "max_uses",
            "Maximum uses should be a positive number between 1 and 1000000."
          )
            .exists()
            .not()
            .isEmpty()
            .isInt({ min: 1, max: 1000000 }),
          check("status", "Status is required and should be boolean.")
            .exists()
            .not()
            .isEmpty()
            .isBoolean(),
        ];
      }
      break;
    case "discountCouponEdit":
      {
        return [
          check("id", "Id Required..!!").exists().not().isEmpty(),
          check("name", "Name Required..!!")
            .exists()
            .not()
            .isEmpty()
            .isLength({ min: 2, max: 50 }),
          check(
            "code",
            "Code is required and should be alphanumeric between 5 and 20 characters."
          )
            .exists()
            .not()
            .isEmpty()
            .isLength({ min: 5, max: 20 }),
          check(
            "discount_amount",
            "Discount amount should be a positive number between 1 and 1000000."
          )
            .exists()
            .not()
            .isEmpty()
            .isFloat({ min: 1, max: 1000000 }),
          check(
            "min_cart_amount",
            "Minimum cart amount should be a positive number between 1 and 1000000."
          )
            .exists()
            .not()
            .isEmpty()
            .isFloat({ min: 1, max: 1000000 }),
          check(
            "discount_amount_usd",
            "Discount amount (USD) should be a positive number between 1 and 1000000."
          )
            .exists()
            .not()
            .isEmpty()
            .isFloat({ min: 1, max: 1000000 }),
          check(
            "min_cart_amount_usd",
            "Minimum cart amount (USD) should be a positive number between 1 and 1000000."
          )
            .exists()
            .not()
            .isEmpty()
            .isFloat({ min: 1, max: 1000000 }),
          check("expaire_date", "Expiry date required..!!")
            .exists()
            .not()
            .isEmpty(),
          check(
            "max_uses",
            "Maximum uses should be a positive number between 1 and 1000000."
          )
            .exists()
            .not()
            .isEmpty()
            .isInt({ min: 1, max: 1000000 }),
          check("status", "Status is required and should be boolean.")
            .exists()
            .not()
            .isEmpty()
            .isBoolean(),
        ];
      }
      break;

    case "booking":
      {
        return [
          check("retreat_id", "Retreat_id Required..!!")
            .exists()
            .not()
            .isEmpty(),
          check("single_occupancy", "Single Occupancy Required..!!")
            .exists()
            .not()
            .isEmpty(),
          check("double_occupancy", "Double Occupancy Required..!!")
            .exists()
            .not()
            .isEmpty(),
          check("triple_occupancy", "Triple Occupancy Required..!!")
            .exists()
            .not()
            .isEmpty(),
          check("currency", "Currency Required..!!").exists().not().isEmpty(),
          check("discount_code", "Discount Code Required..!!")
            .exists()
            .optional({ nullable: true, checkFalsy: false }),
          check("type", "Booking Type Required..!!").exists().not().isEmpty(),
        ];
      }
      break;

    case "booking-2":
      {
        return [
          check("package_id", "Package_id Required..!!")
            .exists()
            .not()
            .isEmpty(),
          check("slot_id", "Slot_id Required..!!").exists().not().isEmpty(),
          check("currency", "Currency Required..!!").exists().not().isEmpty(),
          check("discount_code", "Discount Code Required..!!")
            .exists()
            .optional({ nullable: true, checkFalsy: false }),
        ];
      }
      break;
  }
};
