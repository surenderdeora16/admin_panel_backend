const { encrypt } = require('../../helpers/utils');
const { DiscountCoupon, Booking, Retreat, OnlineProgramPrice } = require('../../models');

exports.createBooking = async (req, res) => {
    try {
        let data = req.getBody(['retreat_id', 'single_occupancy', 'double_occupancy', 'triple_occupancy', 'currency', 'discount_code', 'type']);

        const retreat = await Retreat.findOne({ _id: data.retreat_id, deletedAt: null });
        if (!retreat) throw new Error('Invalid Retreat.');

        if (retreat.maximum_bookings <= retreat.booked) {
            throw new Error('Sorry, All seats are booked.');
        }

        const currency = data.currency === 1 ? 1 : 2;
        const singleOccupancyPrice = retreat.prices?.find(p => p?.occupancy_type === 1 && p?.currency === currency)?.amount || 0;
        const doubleOccupancyPrice = retreat.prices?.find(p => p?.occupancy_type === 2 && p?.currency === currency)?.amount || 0;
        const tripleOccupancyPrice = retreat.prices?.find(p => p?.occupancy_type === 3 && p?.currency === currency)?.amount || 0;

        data.sub_total = (data.single_occupancy * singleOccupancyPrice) + (data.double_occupancy * doubleOccupancyPrice) + (data.triple_occupancy * tripleOccupancyPrice);

        data.sub_total = Math.round(data.sub_total * 100) / 100;
        data.tax = Math.round((data.sub_total * parseFloat(process.env.TAX_RATE || 0) / 100) * 100) / 100;
        data.discount = 0;

        if (data.discount_code) {
            const discount = await DiscountCoupon.findOne({ code: data.discount_code, deletedAt: null });
            if (!discount) throw new Error('Discount code not valid !!');

            const discount_amount = currency === 1 ? discount.discount_amount : discount.discount_amount_usd;
            const min_cart_amount = currency === 1 ? discount.min_cart_amount : discount.min_cart_amount_usd;

            if (discount.expaire_date < new Date()) throw new Error('Discount code has been expired.');

            if (data.sub_total < min_cart_amount) {
                throw new Error(`Minimum cart amount should be ${data.currency === 1 ? '₹' : '$'} ${min_cart_amount}`);
            }

            if (discount.max_uses <= discount.used_count) throw new Error('Discount code usage limit reached.');

            if (data.sub_total < discount_amount) throw new Error("Not able to apply this code on your cart.");

            if (!discount.status) throw new Error('Discount code is not available right now.');

            // Check if the user has already used this discount code
            const existingBooking = await Booking.findOne({ user_id: req.user._id, discount_id: discount._id });
            if (existingBooking) throw new Error('You have already used this discount code');

            data.discount_id = discount._id;
            data.discount = Math.round(discount_amount * 100) / 100;
        }

        data.user_id = req.user._id;
        data.total = Math.round((data.sub_total + data.tax - data.discount) * 100) / 100;
        data.status = 0;

        let result = await Booking.create(data);
        const dataObj = {
            tid: Math.ceil(Math.random() * 1000000000),
            merchant_id: process.env.MERCHANT_ID,
            order_id: result._id,
            currency: data.currency === 1 ? 'INR' : 'USD',
            amount: data.total,
            redirect_url: process.env.REDIRECT_URL_SUCCESS,
            cancel_url: process.env.REDIRECT_URL_ERROR,
            language: 'EN',
            billing_name: `${req.user.first_name} ${req.user.last_name}`,
            billing_tel: req.user.mobile,
            billing_email: req.user.email,
        }

        var dataString = ``;
        Object.keys(dataObj).forEach(function (key) { dataString += `${key}=${dataObj[key]}&` });

        const encRequest = encrypt(dataString, process.env.WORKING_KEY);
        if (encRequest) {
            return res.json({ status: true, message: 'Success', encRequest, accessCode: process.env.ACCESS_CODE, baseUrl: process.env.CCAVENUE_URL });
        } else {
            return res.status(500).json({ status: false, message: 'Failed to encrypt data' });
        }
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}

exports.createBooking2 = async (req, res) => {
    try {
        let data = req.getBody(['package_id', 'slot_id', 'currency', 'discount_code']);

        const program = await OnlineProgramPrice.findOne({ _id: data.package_id, deletedAt: null });
        if (!program) throw new Error('Invalid Online Program.');

        data.currency = data.currency === 1 ? 1 : 2;


        data.sub_total = data.currency === 1 ? program.group_inr : program.group_usd;
        data.discount = 0;
        data.tax = Math.round((data.sub_total * parseFloat(process.env.TAX_RATE || 0) / 100) * 100) / 100;

        if (data.discount_code) {
            const discount = await DiscountCoupon.findOne({ code: data.discount_code, deletedAt: null });
            if (!discount) throw new Error('Discount code not valid !!');

            const discount_amount = data.currency === 1 ? discount.discount_amount : discount.discount_amount_usd;
            const min_cart_amount = data.currency === 1 ? discount.min_cart_amount : discount.min_cart_amount_usd;

            if (discount.expaire_date < new Date()) throw new Error('Discount code has been expired.');

            if (data.sub_total < min_cart_amount) {
                throw new Error(`Minimum cart amount should be ${data.currency === 1 ? '₹' : '$'} ${min_cart_amount}`);
            }

            if (discount.max_uses <= discount.used_count) throw new Error('Discount code usage limit reached.');

            if (data.sub_total < discount_amount) throw new Error("Not able to apply this code on your cart.");

            if (!discount.status) throw new Error('Discount code is not available right now.');

            // Check if the user has already used this discount code
            const existingBooking = await Booking.findOne({ user_id: req.user._id, discount_id: discount._id });
            if (existingBooking) throw new Error('You have already used this discount code');

            data.discount_id = discount._id;
            data.discount = Math.round(discount_amount * 100) / 100;
        }

        data.user_id = req.user._id;
        data.total = Math.round((data.sub_total + data.tax - data.discount) * 100) / 100;
        data.status = 0;
        data.type = 2;

        let result = await Booking.create(data);
        const dataObj = {
            tid: Math.ceil(Math.random() * 1000000000),
            merchant_id: process.env.MERCHANT_ID,
            order_id: result._id,
            currency: data.currency === 1 ? 'INR' : 'USD',
            amount: data.total,
            redirect_url: process.env.REDIRECT_URL_SUCCESS,
            cancel_url: process.env.REDIRECT_URL_ERROR,
            language: 'EN',
            billing_name: `${req.user.first_name} ${req.user.last_name}`,
            billing_tel: req.user.mobile,
            billing_email: req.user.email,
        }

        var dataString = ``;
        Object.keys(dataObj).forEach(function (key) { dataString += `${key}=${dataObj[key]}&` });

        const encRequest = encrypt(dataString, process.env.WORKING_KEY);
        if (encRequest) {
            return res.json({ status: true, message: 'Success', encRequest, accessCode: process.env.ACCESS_CODE, baseUrl: process.env.CCAVENUE_URL });
        } else {
            return res.status(500).json({ status: false, message: 'Failed to encrypt data' });
        }
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}

exports.bookingHistoryList = async (req, res) => {
    try {
        var { pageNo, type } = req.query;

        pageNo = pageNo ? parseInt(pageNo) : 1;

        const limit = 10;
        var search = { deletedAt: null, user_id: req.user._id };
        if (type) search.type = parseInt(type);

        var results = await Booking
            .find(search)
            .select('id retreat_id single_occupancy double_occupancy triple_occupancy currency discount_code status sub_total discount tax total user_plan booking createdAt')
            .limit(limit)
            .skip((pageNo - 1) * limit)
            .sort({ ['createdAt']: -1 });

        const total_count = await Booking.countDocuments(search);
        if (results.length > 0) {
            return res.pagination(results, total_count, limit, pageNo);
        } else {
            return res.datatableNoRecords();
        }
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}
