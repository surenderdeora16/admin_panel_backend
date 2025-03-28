const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const Schema = new mongoose.Schema({
    name: {
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
    password: {
        type: String,
    },
    image: {
        type: String,
        default: "user/avatar.png",
        get: (value) => `${process.env.BASEURL}/uploads/admins/${value}`
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

Schema.methods.getToken = function () {
    return jwt.sign({ subject: this._id }, process.env.ENCRYPTION_KEY_ADMIN);
};

Schema.methods.checkPassword = function (password) {
    return bcrypt.compareSync(password, this.password)
};

module.exports = mongoose.model('Admin', Schema);