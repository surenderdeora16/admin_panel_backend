const axios = require("axios");

module.exports = async (number, otp) => {
    try {

        let APIKey = process.env.TEXT_LOCAL_KEY;
        let sender = process.env.TEXT_LOCAL_SENDER;

        let message = (`Namaste! ${otp} is your OTP for secure logging into Param Life Wellness web portal. Please do not share OTP with anyone.`);
        const { data } = await axios.get("http://cloud.smsindiahub.in/vendorsms/pushsms.aspx", { params: { APIKey, sid: sender, msisdn: number, fl: 0, gwid: 2, msg: message } });
        if (data && data.ErrorCode == '000') {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
}