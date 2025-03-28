exports.arrayColumn = (array, column) => array.map(item => item[column]);
exports.parseBool = (data) => data.toLowerCase() == 'true';

exports.clean = (obj) => {
    for (var propName in obj) {
        if (obj[propName] === null || obj[propName] === undefined || obj[propName] === '') {
            delete obj[propName];
        }
    }
    return obj
}

exports.generateOTP = (limit = 6) => {

    var digits = '1234567890';
    var otp = ''
    for (i = 0; i < limit; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

exports.randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

exports.convertToSlug = text => {
    return text.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "") + '-' + Math.ceil(Math.random() * 100000);
}

exports.randomString = length => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}