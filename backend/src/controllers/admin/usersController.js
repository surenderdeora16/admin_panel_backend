const { User } = require("../../models")

exports.list = async (req, res) => {
    try {

        var { limit, pageNo, query, orderBy, orderDirection } = req.query

        limit = limit ? parseInt(limit) : 10;
        pageNo = pageNo ? parseInt(pageNo) : 1;
        query = query || null;
        orderBy = orderBy || 'createdAt';
        orderDirection = orderDirection ? parseInt(orderDirection) : -1;

        var search = { deletedAt: null }
        if (query) {
            search.$or = [
                { first_name: new RegExp(query, 'i') },
                { email: new RegExp(query, 'i') },
            ];
        }

        var results = await User
            .find(search)
            .select('first_name last_name email mobile image status device_token device_id createdAt')
            .limit(limit)
            .skip((pageNo - 1) * limit)
            .sort({ [orderBy]: orderDirection })

        const total_count = await User.countDocuments(search);
        if (results.length > 0) {
            return res.pagination(results, total_count, limit, pageNo);
        } else {
            return res.datatableNoRecords();
        }
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}
