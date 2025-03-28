const User = require("./User");
const Admin = require("./Admin");
const UserOTP = require("./UserOTP");
const GeneralSetting = require("./GeneralSetting");
const DiscountCoupon = require("./DiscountCoupon");

const mongoose = require('mongoose');

const connection = mongoose.connection;
const db = mongoose.connection.db;
const createFromHexString = mongoose.Types.ObjectId.createFromHexString;


module.exports = { User, Admin, UserOTP, GeneralSetting, DiscountCoupon, mongoose, connection, createFromHexString, db };