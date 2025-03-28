const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { INVALID_ACCESS_TOKEN, INVALID_USER } = require("../languages/english");

module.exports = async (req, res, next) => {
    try {
        let token = req.cookies.accessToken;
        if (!token) return res.status(401).send({
            status: false,
            message: "No token provided.!!",
            data: []
        });

        var decoded = jwt.verify(token.replace('Bearer ', ''), process.env.ENCRYPTION_KEY);
        let user = await User.findOne({ _id: decoded.subject, deletedAt: null });
        if (!user) return res.json({
            'status': false,
            'message': INVALID_USER,
            'data': []
        });

        if (!user.status) return res.json({
            'status': false,
            'message': "User account is blocked..!!",
            'data': []
        });     

        req.user = user
        req.user_id = decoded.subject;
        next();
    } catch (error) {
        return res.status(401).send({
            status: false,
            message: INVALID_ACCESS_TOKEN,
            data: error.message
        });
    }
}