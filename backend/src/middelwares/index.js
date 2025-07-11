const { validationResult } = require('express-validator');
const authCheck = require("./authCheck");
const authCheckAdmin = require("./authCheckAdmin");
const licenseCheck = require("./licenseCheck");
const errorHandler = require("./errorHandler");
const customMethods = require("./customMethods");

const { REQUIRED_PARAMETER_MISING } = require('../languages/english');

const showValidationErrors = (req, res, next) => {
    // Fetch Express Validation Errors
    const errors = validationResult(req);

    // Append File validation Error
    if (req.fileError) { errors.errors.push(req.fileError) }

    // Format Express Validation Errors
    if (!errors.isEmpty()) {
        var errJson = errors.errors.filter((row) => row.path).reduce((acc, row) => {
            acc[row.path] = row.msg;
            return acc;
        }, {});

        // If there's only one error, return just its value
        const errorValues = Object.values(errJson);
        return res.status(422).json({
            status: false,
            message: errorValues?.length === 1 ? errorValues?.[0] : REQUIRED_PARAMETER_MISING || REQUIRED_PARAMETER_MISING,
            data: errJson
        });
    }

    next();
}

module.exports = { authCheck, authCheckAdmin, customMethods, licenseCheck, showValidationErrors, errorHandler };