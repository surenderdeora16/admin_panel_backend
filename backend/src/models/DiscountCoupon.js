const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        trim: true
    },
    discount_amount: {
        type: Number,
        required: true,
        trim: true
    },
    min_cart_amount: {
        type: Number,
        required: true,
        trim: true
    },
    discount_amount_usd: {
        type: Number,
        required: true,
        trim: true
    },
    min_cart_amount_usd: {
        type: Number,
        required: true,
        trim: true
    },
    expaire_date: {
        type: Date,
        required: true,
    },
    max_uses: {
        type: Number,
        required: true,
    },
    used_count: {
        type: Number,
        required: true,
        default: 0,
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


module.exports = mongoose.model('DiscountCoupon', Schema);