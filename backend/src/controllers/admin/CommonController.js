const { ContactUs } = require("../../models");

exports.contactUsList = async (req, res) => {
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
                { last_name: new RegExp(query, 'i') },
                { mobile: new RegExp(query, 'i') },
                { email: new RegExp(query, 'i') },
                { message: new RegExp(query, 'i') },
            ];
        }

        var results = await ContactUs
            .find(search)
            .select('type first_name last_name mobile email message createdAt')
            .limit(limit)
            .skip((pageNo - 1) * limit)
            .sort({ [orderBy]: orderDirection })

        const total_count = await ContactUs.countDocuments(search);
        if (results.length > 0) {
            return res.pagination(results, total_count, limit, pageNo);
        } else {
            return res.datatableNoRecords();
        }
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}