const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    otp: {
        type: String,
        required: true,
        trim: true
    },
    phone_no: {
        type: String,
        required: true,
        trim: true
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('UserOTP', Schema);