const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    url: {
        type: String,
        default: "default-banner.png",
        set: (value) => {
            if (!value.startsWith(`${process.env.BASEURL}/uploads/main_banner/`)) {
                return `${process.env.BASEURL}/uploads/main_banner/${value}`;
            }
            return value;
        },
        get: (value) => value 
    },
    order: {
        type: Number,
        default: 0,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    deletedAt: {
        type: Date,
        default: null
    }
});

const bannerSchema = new mongoose.Schema({
    images: [imageSchema],
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Compound indexes for performance
bannerSchema.index({ createdAt: -1 });
bannerSchema.index({ 'images.order': 1, 'images.isActive': 1 });
bannerSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Banner', bannerSchema);