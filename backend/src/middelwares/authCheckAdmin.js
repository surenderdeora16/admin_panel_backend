const jwt = require("jsonwebtoken");
const { Admin } = require("../models");
const { INVALID_ACCESS_TOKEN, INVALID_USER } = require("../languages/english");

module.exports = async (req, res, next) => {
    try {
        let token = req.cookies.accessToken;
        if (!token)
            return res.status(401).send({
                status: false,
                message: "No token provided.!!",
                data: []
            });

        var decoded = jwt.verify(token.replace('Bearer ', ''), process.env.ENCRYPTION_KEY_ADMIN);
        let admin = await Admin.findOne({ _id: decoded.subject, deletedAt: null });
        if (!admin) return res.status(401).json({
            'status': false,
            'message': INVALID_USER,
            'data': []
        });

        if (!admin.status)
            return res.status(401).json({
                'status': false,
                'message': "Admin account is blocked..!!",
                'data': []
            });

        req.admin = admin;
        req.admin_id = admin._id;
        next();
    } catch (error) {
        return res.status(401).send({
            status: false,
            message: INVALID_ACCESS_TOKEN,
            data: error.message
        });
    }
}