const { DiscountCoupon, Booking } = require('../../models');

exports.checkDiscountCode = async (req, res) => {
    try {
        const { discount_code, cart_amount, currency } = req.body;

        if (!discount_code) throw new Error('Please provide Discount coupon.');

        const discount = await DiscountCoupon.findOne({ code: discount_code, deletedAt: null });
        if (!discount) throw new Error('Discount code not valid !!');

        const discount_amount = currency === 1 ? discount.discount_amount : discount.discount_amount_usd;
        const min_cart_amount = currency === 1 ? discount.min_cart_amount : discount.min_cart_amount_usd;

        if (discount.expaire_date < new Date()) throw new Error('Discount code has expired');

        if (cart_amount < min_cart_amount) {
            throw new Error(`Minimum cart amount should be ${currency === 1 ? '₹' : '$'} ${min_cart_amount}`);
        }

        if (cart_amount < discount_amount) throw new Error("Not able to apply this code on your cart.");

        if (discount.max_uses <= discount.used_count) throw new Error('Discount code usage limit reached.');

        if (discount.status !== true) throw new Error('Discount code is not available right now');

        // Check if the user has already used this discount code
        const existingBooking = await Booking.findOne({ user_id: req.user._id, discount_id: discount._id, status: 1 });
        if (existingBooking) throw new Error('You have already used this discount code');

        return res.status(200).json({
            status: true,
            message: 'Congratulations! Enjoy your special discount.',
            data: {
                discount_amount: discount_amount,
                discount_code: discount.code,
            }
        });
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};

