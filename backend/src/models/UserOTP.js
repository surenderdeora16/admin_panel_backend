const mongoose = require('mongoose');
const { calculateExpiryTime } = require("../helpers/string")

const UserOTPSchema = new mongoose.Schema({
    otp: {
        type: String,
        required: true,
        trim: true
    },
    mobile: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    isUsed: {
        type: Boolean,
        default: false,
    },
    expiresAt: {
        type: Date,
        default: () => calculateExpiryTime(10),
        index: { expires: '10m' }
    }
}, {
    timestamps: true,
});

// Index for faster lookups
UserOTPSchema.index({ mobile: 1, createdAt: -1 })

// Method to check if OTP is expired
UserOTPSchema.methods.isExpired = function () {
    return Date.now() > this.expiresAt
}

// Method to check if OTP is valid
UserOTPSchema.methods.isValid = function (inputOtp) {
    return !this.isUsed && !this.isExpired() && this.otp === inputOtp
}

// Method to mark OTP as used
UserOTPSchema.methods.markAsUsed = async function () {
    this.isUsed = true
    return this.save()
}


module.exports = mongoose.model('UserOTP', UserOTPSchema);