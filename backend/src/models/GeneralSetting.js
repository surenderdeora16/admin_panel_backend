const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    setting_type: {
        type: Number,
        required: true,
        trim: true
    },
    setting_name: {
        type: String,
        required: true,
        trim: true
    },
    field_label: {
        type: String,
        required: true,
        trim: true
    },
    field_name: {
        type: String,
        required: true,
        trim: true
    },
    field_type: {
        type: String,
        required: true,
        trim: true
    },
    field_value: {
        type: String,
        required: true,
        trim: true,
        get: function (value) {
            return ['favicon', 'logo', 'footer_logo'].includes(this.setting_name) ? `${process.env.BASEURL}/uploads/settings/${value}` : value
        }
    },
    is_require: {
        type: Boolean,
        required: true,
    },
}, {

    toObject: { getters: true },
    toJSON: { getters: true }
});


module.exports = mongoose.model('GeneralSettings', Schema);