const multer = require('multer');
const errorMessages = require('../languages/english');

module.exports = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(422).json({
            status: false,
            message: errorMessages.REQUIRED_PARAMETER_MISING,
            data: { [err.field]: errorMessages[err.code] || "Error" }
        })
    }

    if (err instanceof Error) {
        // if (errData = JSON.parse(err.message))
        return res.status(422).json({
            status: false,
            message: errorMessages.SOMETHING_WENT_WRONG,
            // data: { [errData.field]: errData.message }
            data: err.message
        })
    }

    next(err);
}