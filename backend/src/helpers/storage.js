const multer = require('multer')
const fs = require('fs');
const path = require('path');
const { SUPPORTED_FORMATS_IMAGE, SUPPORTED_FORMATS_DOC } = require('./formValidConfig');

exports.uploadTo = class {

    constructor({ dir = 'admins', isImage = false, isDoc = false, fileSize = 2 }) {

        const maxAllowSize = fileSize * Math.pow(1024, 2);

        const fileFilter = (req, file, cb) => {

            // Check uploaded file not exceed permitted size.
            const reqSize = parseInt(req.headers["content-length"]);

            if (reqSize && reqSize > maxAllowSize) {
                req.fileValidationError = { [file.fieldname]: 'Uploaded file is too large to upload..!!' };
                return cb(null, false, new Error('Uploaded file is too large to upload..!!'));
            }

            // Check uploaded file is image.
            if (isImage && !SUPPORTED_FORMATS_IMAGE.includes(file.mimetype)) {
                req.fileValidationError = { [file.fieldname]: 'Please select only Image Only..!!' };
                return cb(null, false, new Error('Please select only Image Only..!!'));
            }

            // Check uploaded file is Document.
            if (isDoc && !SUPPORTED_FORMATS_DOC.includes(file.mimetype)) {
                req.fileValidationError = { [file.fieldname]: 'Please select document file Only..!!' };
                return cb(null, false, new Error('Please select document file Only..!!'));
            }

            cb(null, true);
        }

        const storage = multer.diskStorage({
            destination: function (req, file, cb) {
                let pathToSave = `public/uploads/${dir}`;
                fs.mkdirSync(pathToSave, { recursive: true })
                return cb(null, pathToSave)
            },
            filename: function (req, file, cb) {
                const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`
                cb(null, file.fieldname + '-' + uniqueSuffix)
            },
        });

        this.upload = multer({ storage, fileFilter, limits: { fileSize: maxAllowSize } });
    }

    single(fieldName = 'image') {
        return this.upload.single(fieldName);
    }

    array(fieldName = 'image', maxCount = 5) {
        return this.upload.array(fieldName, maxCount);
    }

    fields(fieldsArray) {
        return this.upload.fields(fieldsArray);
    }
};

exports.deleteFile = (deleteFile) => {
    try {
        if (deleteFile === null || deleteFile == undefined) return true;

        deleteFile = deleteFile.replaceAll(`${process.env.BASEURL}/uploads/`, '');

        if (![
            'users/avatar.png',
            'admins/avatar.png',
            'vendors/avatar.png',
            'customers/avatar.png',
            'products/product-placeholder.png',
            'product-categories/product-placeholder.png',
            '404-file-not-found.jpg'
        ].includes(deleteFile)) {
            if (fs.existsSync(`public/uploads/` + deleteFile)) {
                fs.unlinkSync(`public/uploads/` + deleteFile)
            }
        }

        return true;
    } catch (error) {
        return false;
    }
}