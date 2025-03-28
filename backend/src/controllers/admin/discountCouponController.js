const { DiscountCoupon } = require('../../models');

exports.create = async (req, res) => {
    try {

        let data = req.getBody(['name', 'code', 'discount_amount', 'min_cart_amount', 'discount_amount_usd', 'min_cart_amount_usd', 'expaire_date', 'max_uses', 'status']);
        let result = await DiscountCoupon.create(data);

        return res.successInsert(result);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}

exports.update = async (req, res) => {
    try {

        let record = await DiscountCoupon.findById(req.query.id);
        if (!record) return res.noRecords();

        let data = req.getBody(['name', 'code', 'discount_amount', 'min_cart_amount', 'discount_amount_usd', 'min_cart_amount_usd', 'expaire_date', 'max_uses', 'status']);
        const result = await record.updateOne(data);
        return res.successUpdate(result);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}

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
                { name: new RegExp(query, 'i') },
                { code: new RegExp(query, 'i') },
            ];
        }

        var results = await DiscountCoupon
            .find(search)
            .select('name code discount_amount min_cart_amount discount_amount_usd expaire_date min_cart_amount_usd max_uses used_count status createdAt')
            .limit(limit)
            .skip((pageNo - 1) * limit)
            .sort({ [orderBy]: orderDirection })

        const total_count = await DiscountCoupon.countDocuments(search);
        if (results.length > 0) {
            return res.pagination(results, total_count, limit, pageNo);
        } else {
            return res.datatableNoRecords();
        }
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}

