const { User, UserOTP } = require("../../models");
const jwt = require("jsonwebtoken");
const { sendSms, generateOTP } = require("../../helpers");
const { calculateExpiryTime } = require("../../helpers/string");
const Storage = require("../../helpers/Storage");
const { getCookiesConfig } = require("../../helpers/formValidConfig");

exports.register = async (req, res) => {
  try {
    const { name, email, mobile, confirmPassword, state, district } = req.body;

    const existingUser = await User.findOne({
      $or: [{ mobile }, { email }],
    });

    if (existingUser) {
      const conflictField = existingUser.mobile === mobile ? "mobile" : "email";
      return res.status(409).json({
        status: false,
        message: `${conflictField} already registered`,
      });
    }

    const user = await User.create({
      name,
      email,
      mobile,
      password: confirmPassword,
      state,
      district,
    });

    const token = user.getToken();

    res.cookie("accessToken", token, getCookiesConfig());

    const record = { token, name, email, mobile };

    return res.success(
      record,
      "Registration successful! Welcome to our platform."
    );
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    return res.someThingWentWrong(error);
  }
};

exports.login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    // Find user with password
    const user = await User.findOne({ mobile }).select("+password");

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Invalid credentials",
      });
    }

    // Compare passwords
    const isMatch = await user.checkPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT
    const token = user.getToken();

    // Set secure cookie
    res.cookie("accessToken", token, getCookiesConfig());

    const record = { token, mobile, name: user.name, email: user.email };
    return res.success(record, "Login successful! Welcome back.");
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    return res.someThingWentWrong(error);
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { mobile } = req.body;
    const user = await User.findOne({ mobile });

    if (!user)
      return res.noRecords(
        "We couldn't find an account associated with this mobile number. Please check and try again."
      );

    // OTP Generate और Save
    let otp = generateOTP(6);
    const expiryTime = calculateExpiryTime(10);

    await UserOTP.create({
      mobile,
      otp,
      expiresAt: expiryTime,
    });

    // await sendSms(mobile, otp)

    return res.json({
      status: true,
      message: {
        text: "OTP sent successfully to your mobile number. Please check and enter the OTP to reset your password.",
        otp: otp,
      },
      expiresAt: expiryTime,
    });
  } catch (error) {
    // logger.error("Forgot password error:", error)
    if (error.message === "Failed to send SMS. Please try again later.") {
      return res
        .status(400)
        .json({
          status: false,
          message: "Unable to send OTP at the moment. Please try again later.",
        });
    }
    return res.someThingWentWrong(error);
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    const otpRecord = await UserOTP.findOne({ mobile, isUsed: false }).sort({
      createdAt: -1,
    });

    console.log("otpRecord", otpRecord);
    if (!otpRecord) {
      return res
        .status(400)
        .json({
          status: false,
          message: "No active OTP found. Please request a new OTP.",
        });
    }

    if (otpRecord.isExpired()) {
      return res
        .status(400)
        .json({
          status: false,
          message: "OTP has expired. Please request a new OTP.",
        });
    }

    if (otpRecord.otp !== otp) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid OTP. Please try again." });
    }

    // Mark OTP as used
    await otpRecord.markAsUsed();

    // Reset Token Generate
    const resetToken = jwt.sign({ mobile }, process.env.ENCRYPTION_KEY, {
      expiresIn: "10m",
    });

    res.cookie("resetToken", resetToken, {
      ...getCookiesConfig(10 * 60 * 1000),
      path: "/api-v1/user/reset-password",
    });

    return res.success([], "OTP verified successfully.");
  } catch (error) {
    // logger.error("OTP verification error:", error)
    return res.someThingWentWrong(error);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const resetToken = req.cookies.resetToken;

    // Check if reset token exists
    if (!resetToken) {
      return res.status(401).json({
        status: false,
        message:
          "Password reset session expired or invalid. Please request a new OTP.",
      });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.ENCRYPTION_KEY);
    } catch (error) {
      // Clear invalid cookie
      res.clearCookie("resetToken");

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          status: false,
          message:
            "Password reset session has expired. Please request a new OTP.",
        });
      }

      return res.status(401).json({
        status: false,
        message: "Invalid password reset session. Please request a new OTP.",
      });
    }

    // Check if token has required data
    if (!decoded || !decoded.mobile) {
      res.clearCookie("resetToken");
      return res.status(401).json({
        status: false,
        message: "Invalid password reset session. Please request a new OTP.",
      });
    }

    const user = await User.findOne({ mobile: decoded.mobile });

    if (!user) {
      res.clearCookie("resetToken");
      return res.noRecords("User not found. Please contact support.");
    }

    user.password = newPassword;
    await user.save();

    // Cookie Clear
    res.clearCookie("resetToken");

    return res.success(
      [],
      "Password has been reset successfully. You can now login with your new password."
    );
  } catch (error) {
    logger.error("Password reset error:", error);
    return res.someThingWentWrong(error);
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req?.user?._id).select("+password");

    if (!user) {
      return res.noRecords("User not found. Please contact support.");
    }

    const isMatch = await user.checkPassword(oldPassword);
    if (!isMatch)
      return res
        .status(401)
        .json({
          status: false,
          message: "Old password is incorrect. Please try again.",
        });

    user.password = newPassword;
    await user.save();

    return res.success([], "Password changed successfully");
  } catch (error) {
    // logger.error("Change password error:", error)
    res.someThingWentWrong(error);
  }
};

exports.loginWithOtp = async (req, res) => {
  try {
    const { mobile, otp, device_token, device_id } = req.body;
    let user = await User.findOne({ mobile, deletedAt: null });
    if (!user)
      return res.json({
        status: false,
        message: "Unregistered mobile number! Please register to proceed..!!",
        data: [],
      });

    let otpRecord = await UserOTP.findOne({ phone_no: mobile, otp });
    if (!otpRecord)
      return res.json({
        status: false,
        message: "Invalid OTP..!!",
        data: [],
      });

    if (otpRecord.createdAt.getTime() + 600000 <= new Date().getTime()) {
      return res.json({
        status: false,
        message: "OTP expired..!!",
        data: [],
      });
    }

    if (!user.status)
      return res.json({
        status: false,
        message: "Your account is blocked..!!",
        data: [],
      });

    await UserOTP.find({ phone_no: mobile }).deleteOne();

    const token = user.getToken();
    if (device_token || device_id) {
      if (device_token) user.device_token = device_token;
      if (device_id) user.device_id = device_id;
      await user.save();
    }

    res.cookie("accessToken", token, getCookiesConfig());

    return res.json({
      status: true,
      message: "Login Successfully..!!",
      data: { user, token },
    });
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.sendotp = async (req, res) => {
  try {
    const { mobile } = req.body;

    let otp = generateOTP(6);
    let result = await sendSms(mobile, otp);
    if (result) {
      await UserOTP.find({ phone_no: mobile }).deleteOne();
      await UserOTP.create({ phone_no: mobile, otp });
      return res.json({
        status: true,
        message: "OTP sent Successfully..!!",
        data: "",
      });
    } else {
      return res.status(403).json({
        status: false,
        message: "OTP can't be sent, Please try after some time..!!",
        data: [],
      });
    }
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, email, mobile } = req.body;
    req.user.first_name = first_name;
    req.user.last_name = last_name;
    req.user.email = email;
    req.user.mobile = mobile;
    if (req.file) req.user.image = req.file.filename;
    await req.user.save();

    return res.json({
      status: true,
      message: "Profile Updated Successfully..!!",
      data: req.user.toJSON(),
    });
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.changeProfileImage = async (req, res) => {
  try {
    if (req.file != undefined) {
      Storage.deleteFile(req.admin?.image);

      let admin = await Admin.findOneAndUpdate(
        { _id: req.admin_id, deletedAt: null },
        { $set: { image: req.file.filename } },
        { new: true }
      );
      return res.successUpdate(admin);
    } else {
      return res.status(422).json({
        status: false,
        message: "Please provide image file.",
        data: [],
      });
    }
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.getProfile = async (req, res) => {
  try {
    return res.json({
      status: true,
      message: "Successfully..!!",
      data: req.user.toJSON(),
    });
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.logout = async (req, res) => {
  try {
    // res.cookie('accessToken', '', getCookiesConfig());
    res.clearCookie("accessToken");

    return res.success([], "Logged out successfully.");
  } catch (error) {
    logger.error("Logout error:", error);
    return res.someThingWentWrong(error);
  }
};
