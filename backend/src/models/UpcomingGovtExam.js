const mongoose = require('mongoose');

const UpcomingGovtExam = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Exam title is required'],
        unique: true
    },
    description: {
        type: String,
        default: ""
    },
    image: {
        type: String,
        default: "default-banner.png",
        set: (value) => {
            if (!value.startsWith(`${process.env.BASEURL}/uploads/upcoming_govt_exam/`)) {
                return `${process.env.BASEURL}/uploads/upcoming_govt_exam/${value}`;
            }
            return value;
        },
        get: (value) => value 
    },
    examDate: {
        type: Date,
        default: null
    },
    status: {
        type: Boolean,
        default: true
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });


UpcomingGovtExam.methods.softDelete = function() {
    this.deletedAt = new Date();
    return this.save();
};

module.exports = mongoose.model('UpcomingGovtExam', UpcomingGovtExam);