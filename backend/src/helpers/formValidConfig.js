const FILE_SIZE = 2000000;

const SUPPORTED_FORMATS_IMAGE = [
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'image/png'
];

const MAX_INPUT_AMOUNT = 10000000;

const SUPPORTED_FORMATS_DOC = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/pdf',
    'application/vnd.rar'
];

const RETREAT_STATUS = [
    { id: 1, name: "Sold Out" },
    { id: 2, name: "Past" },
    { id: 3, name: "Book Now" }
]

const mobileRegExp = /^(?:(?:\+|0{0,2})91(\s*|[-])?|[0]?)?([6789]\d{2}([ -]?)\d{3}([ -]?)\d{4})$/;

const getFilePath = (value, path, returnType = true) => {
    if (['', null].includes(value)) {
        return returnType ? `${process.env.BASEURL}uploads/avatar.png` : null
    } else {
        return `${process.env.BASEURL}uploads/${path}/${value}`;
    }
}

const getCookiesConfig = () => {
    return {
        httpOnly: true,
        secure: true,
        //   secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
        sameSite: 'None', // 'strict' | 'Lax' | 'None', // Prevent CSRF attacks
        maxAge: 24 * 60 * 60 * 1000, // 1 day
    }
}

module.exports = { FILE_SIZE, RETREAT_STATUS, getCookiesConfig, SUPPORTED_FORMATS_IMAGE, SUPPORTED_FORMATS_DOC, MAX_INPUT_AMOUNT, mobileRegExp, getFilePath }