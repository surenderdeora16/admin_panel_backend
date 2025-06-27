const FILE_SIZE = 2000000;

// const SUPPORTED_FORMATS_IMAGE = [
//     'image/jpg',
//     'image/jpeg',
//     'image/gif',
//     'image/png'
// ];

const SUPPORTED_FORMATS_IMAGE = [
  'image/jpeg',      // .jpeg, .jpg
  'image/jpg',       // .jpg (optional, same as jpeg)
  'image/png',       // .png
  'image/gif',       // .gif
  'image/webp',      // .webp
  'image/avif',      // .avif (modern format with better compression)
  'image/apng',      // .apng (animated PNG)
  'image/svg+xml',   // .svg (vector format)
  'image/bmp',       // .bmp (bitmap)
  'image/x-icon',    // .ico (favicon files)
  'image/tiff',      // .tif, .tiff
  'image/heif',      // .heif (High Efficiency Image File Format)
  'image/heic'       // .heic (used by iPhones)
];


const SUPPORTED_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg'
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

const getCookiesConfig = (maxAge = 48 * 60 * 60 * 1000) => {
    return {
        httpOnly: true,
        secure: true,
        //   secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
        sameSite: 'None', // 'strict' | 'Lax' | 'None', // Prevent CSRF attacks
        maxAge,
    }
}

module.exports = { FILE_SIZE, SUPPORTED_IMAGE_EXTENSIONS, RETREAT_STATUS, getCookiesConfig, SUPPORTED_FORMATS_IMAGE, SUPPORTED_FORMATS_DOC, MAX_INPUT_AMOUNT, mobileRegExp, getFilePath }