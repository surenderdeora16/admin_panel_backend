const { User, UserOTP } = require("../../models");
const { sendSms, generateOTP } = require("../../helpers");
const Storage = require('../../helpers/Storage');
const { getCookiesConfig } = require("../../helpers/formValidConfig");

exports.loginWithOtp = async (req, res) => {
    try {

        const { mobile, otp, device_token, device_id } = req.body;
        let user = await User.findOne({ mobile, deletedAt: null });
        if (!user) return res.json({
            'status': false,
            'message': "Unregistered mobile number! Please register to proceed..!!",
            'data': []
        });

        let otpRecord = await UserOTP.findOne({ phone_no: mobile, otp });
        if (!otpRecord) return res.json({
            'status': false,
            'message': "Invalid OTP..!!",
            'data': []
        });

        if (otpRecord.createdAt.getTime() + 600000 <= new Date().getTime()) {
            return res.json({
                'status': false,
                'message': "OTP expired..!!",
                'data': []
            });
        }

        if (!user.status)
            return res.json({
                'status': false,
                'message': "Your account is blocked..!!",
                'data': []
            });

        await UserOTP.find({ phone_no: mobile }).deleteOne();

        const token = user.getToken();
        if (device_token || device_id) {
            if (device_token) user.device_token = device_token;
            if (device_id) user.device_id = device_id;
            await user.save();
        }

        res.cookie('accessToken', token, getCookiesConfig());

        return res.json({
            'status': true,
            'message': "Login Successfully..!!",
            'data': { user, token }
        });
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}

exports.sendotp = async (req, res) => {
    try {
        const { mobile } = req.body;

        let otp = generateOTP(6);
        let result = await sendSms(mobile, otp)
        if (result) {
            await UserOTP.find({ phone_no: mobile }).deleteOne();
            await UserOTP.create({ phone_no: mobile, otp });
            return res.json({
                'status': true,
                'message': "OTP sent Successfully..!!",
                'data': ''
            });
        } else {
            return res.status(403).json({
                status: false,
                message: "OTP can't be sent, Please try after some time..!!",
                data: []
            });
        }
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}

exports.updateProfile = async (req, res) => {
    try {

        const { first_name, last_name, email, mobile } = req.body;
        req.user.first_name = first_name;
        req.user.last_name = last_name;
        req.user.email = email;
        req.user.mobile = mobile;
        if (req.file) req.user.image = req.file.filename
        await req.user.save();

        return res.json({
            status: true,
            message: "Profile Updated Successfully..!!",
            data: req.user.toJSON()
        });
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}

exports.changeProfileImage = async (req, res) => {
    try {

        if (req.file != undefined) {
            Storage.deleteFile(req.admin?.image)

            let admin = await Admin.findOneAndUpdate({ _id: req.admin_id, deletedAt: null }, { $set: { image: req.file.filename } }, { new: true });
            return res.successUpdate(admin);
        } else {
            return res.status(422).json({
                status: false,
                message: 'Please provide image file.',
                data: []
            });
        }
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}

exports.getProfile = async (req, res) => {
    try {
        return res.json({
            status: true,
            message: "Successfully..!!",
            data: req.user.toJSON()
        });
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}

exports.register = async (req, res) => {
    try {

        const { first_name, last_name, email, gender, mobile, otp } = req.body;
        let user = await User.findOne({ $or: [{ mobile }, { email }] });
        if (user) return res.json({
            'status': false,
            'message': "User already registered..!!",
            'data': []
        });

        let otpRecord = await UserOTP.findOne({ phone_no: mobile, otp });
        if (!otpRecord) return res.json({
            'status': false,
            'message': "Invalid OTP..!!",
            'data': []
        });

        if (otpRecord.createdAt.getTime() + 600000 <= new Date().getTime()) {
            return res.json({
                'status': false,
                'message': "OTP expired..!!",
                'data': []
            });
        }

        const record = await User.create({ first_name, last_name, email, mobile, gender });
        return res.success(record);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}

exports.logout = async (req, res) => {
    try {

        res.cookie('accessToken', '', getCookiesConfig());

        res.status(200).send({ status: true, message: 'Logout successful', data: [] });
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}