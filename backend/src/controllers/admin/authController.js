const { Admin, UserOTP } = require("../../models");
const bcrypt = require('bcrypt');
const { sendSms, generateOTP } = require("../../helpers");
const Storage = require('../../helpers/Storage');
const { getCookiesConfig } = require("../../helpers/formValidConfig");


// exports.login = async (req, res) => {
//     try {
//         // Static user data
//         const staticUser = {
//             name: "Surender ADMIN",
//             email: "surender@gmail.com",
//             mobile: "9879879870",
//             password: "123456789",
//             image: "user/avatar.png",
//             status: true,
//             deletedAt: null
//         };

//         // let existingUser = await Admin.findOne({ mobile: staticUser.mobile, deletedAt: null });
//         // if (existingUser) {
//         //     return res.status(400).json({
//         //         status: false,
//         //         message: "User already exists with this mobile number..!!",
//         //         data: []
//         //     });
//         // }

//         // Hash the password
//         staticUser.password = bcrypt.hashSync(staticUser.password, 10);

//         // Create new user
//         let newUser = await Admin.create(staticUser);
        
//         return res.json({
//             status: true,
//             message: "Registration Successful..!!",
//             data: { user: newUser }
//         });
//     } catch (error) {
//         return res.someThingWentWrong(error);
//     }
// };

exports.login = async (req, res) => {
    try {
        const { mobile, password, device_token, device_id } = req.body;
      
        //    const name = "Surender ADMIN"
        //    const email = "surender@gmail.com"
        //    const mobile = "9879879870"
        //    const password = "123456789"
        //    const image = "user/avatar.png",
        //    const status = true,
        //    const deletedAt = null
    

        let user = await Admin.findOne({ mobile, deletedAt: null });
        if (user && user.checkPassword(password)) {
            if (!user.status)
                return res.json({
                    'status': false,
                    'message': "Your account is blocked..!!",
                    'data': []
                });

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
                'data': { user }
            });
        } else {
            return res.status(401).json({
                'status': false,
                'message': "Invalid Login Credentials..!!",
                'data': []
            });
        }
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}

exports.loginWithOtp = async (req, res) => {
    try {

        const { mobile, otp, device_token, device_id } = req.body;
        let user = await Admin.findOne({ mobile, deletedAt: null });
        if (!user)
            return res.json({
                'status': false,
                'message': "Invalid Mobile Number..!!",
                'data': []
            });

        let otpRecord = await UserOTP.findOne({ phone_no: mobile, otp });
        if (!otpRecord)
            return res.json({
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
            'data': { user }
        });
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

exports.sendotp = async (req, res) => {
    try {

        const { mobile } = req.body;
        let user = await Admin.findOne({ mobile, deletedAt: null });
        if (!user)
            return res.json({
                'status': false,
                'message': "Invalid Mobile Number..!!",
                'data': []
            });


        let otp = generateOTP(6);
        let result = await sendSms(user.mobile, otp)
        if (result) {
            await UserOTP.find({ phone_no: mobile }).deleteOne();
            await UserOTP.create({ phone_no: mobile, otp });
            return res.json({
                'status': true,
                'message': "OTP sent Successfully..!!",
                'data': []
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

exports.resetPassword = async (req, res) => {
    try {

        const { mobile, password, otp } = req.body;
        let user = await Admin.findOne({ mobile, deletedAt: null });
        if (!user)
            return res.json({
                'status': false,
                'message': "Invalid Mobile Number..!!",
                'data': []
            });

        let otpRecord = await UserOTP.findOne({ phone_no: mobile, otp });
        if (!otpRecord)
            return res.json({
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

        user.password = bcrypt.hashSync(password, 10);
        await user.save();
        await UserOTP.find({ phone_no: mobile }).deleteOne();
        return res.json({
            'status': true,
            'message': "Password Updated Successfully..!!"
        });
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}

exports.changePassword = async (req, res) => {
    try {

        const { password, new_password } = req.body;
        if (!bcrypt.compareSync(password, req.admin.password))
            return res.json({
                'status': false,
                'message': "Invalid Old Password..!!",
                'data': []
            });

        if (bcrypt.compareSync(new_password, req.admin.password))
            return res.json({
                'status': false,
                'message': "New Password can't be same as Old Password..!!",
                'data': []
            });

        if (!req.admin.status)
            return res.json({
                'status': false,
                'message': "Your account is blocked..!!",
                'data': []
            });

        await req.admin.updateOne({ password: bcrypt.hashSync(new_password, 10) });
      
        return res.json({
            status: true,
            message: "Password Changed Successfully..!!",
            data: []
        });
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}

exports.updateProfile = async (req, res) => {
    try {

        const { name, email, mobile } = req.body;
        req.admin.name = name;
        req.admin.email = email;
        req.admin.mobile = mobile;
        if (req.file) req.admin.image = req.file.filename
        await req.admin.save();

        return res.json({
            status: true,
            message: "Profile Updated Successfully..!!",
            data: req.admin.toJSON()
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
            data: req.admin.toJSON()
        });
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}