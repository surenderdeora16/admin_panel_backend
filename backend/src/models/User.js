const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const UserSchema  = new mongoose.Schema({
    first_name: {
        type: String,
        required: true,
        trim: true
    },
    last_name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        minlength: 10,
        maxlength: 10
    },
    gender: {
        type: Number,
        required: true,
    },
    image: {
        type: String,
        default: "user/avatar.png",
        get: (value) => `${process.env.BASEURL}/uploads/user/${value}`
    },
    device_token: {
        type: String,
        default: null
    },
    device_id: {
        type: String,
        default: null
    },
    status: {
        type: Boolean,
        default: true
    },
    deletedAt: {
        type: Date,
        default: null
    },
}, {
    timestamps: true,
    toObject: { getters: true },
    toJSON: { getters: true }
});

// Indexes for performance
UserSchema.index({ mobile: 1 });
UserSchema.index({ email: 1 });

// JWT Token Generation
UserSchema.methods.getToken = function () {
    return jwt.sign({ subject: this._id }, process.env.ENCRYPTION_KEY, { expiresIn: "2d" });
};

// Password Verification
UserSchema.methods.checkPassword = function (password) {
    return bcrypt.compareSync(password, this.password)
};

module.exports = mongoose.model('User', UserSchema);