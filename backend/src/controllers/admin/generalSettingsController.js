const { clean } = require("../../helpers/string");
const { GeneralSetting, createFromHexString, mongoose } = require("../../models");
const Storage = require('../../helpers/Storage');

exports.getGeneralSetting = async (req, res) => {
    try {
        console.log("req", req)
        var setting = await GeneralSetting.find({ setting_type: { $in: req.params.type.split(',').map(r => parseInt(r)) } });
        console.log("setting", setting)
        var setting_arr = setting.reduce((obj, item) => Object.assign(obj, { [item.field_name]: item.field_value }), {});
        console.log("setting_arr", setting_arr)

        if (setting.length > 0) {
            console.log(1)
            return res.success(setting_arr);
        } else {
            console.log(2)
            return res.noRecords();
        }
    } catch (error) {
        console.log("error:", error)
        return res.someThingWentWrong(error);
    }
}

exports.listGeneralSetting = async (req, res) => {
    try {

        var setting = await GeneralSetting.find({ setting_type: parseInt(req.params.type) }, '-createdAt -updatedAt').sort('_id');
        if (setting.length > 0) {
            return res.success(setting.map(row => row.toObject({ getters: true })));
        } else {
            return res.noRecords();
        }
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}

exports.updateGeneralSetting = async (req, res) => {
    try {
        var data = clean(req.body)
        var type = clean(req.query.type)
        delete data.favicon;
        delete data.footer_logo;
        delete data.logo;

        // Files Upload
        const { logo = null, footer_logo = null, favicon = null } = req.files
        if (logo || footer_logo || favicon) {

            var setting = await GeneralSetting.find({ setting_name: ['favicon', 'footer_logo', 'logo'] });
            var setting_arr = setting.reduce((obj, item) => Object.assign(obj, { [item.field_name]: item.field_value }), {});

            if (logo != undefined) {
                Storage.deleteFile(`setting/${setting_arr?.logo}`);
                data.logo = logo[0].filename
            }

            if (footer_logo != undefined) {
                Storage.deleteFile(`setting/${setting_arr?.footer_logo}`);
                data.footer_logo = footer_logo[0].filename
            }


            if (favicon != undefined) {
                Storage.deleteFile(`setting/${setting_arr?.favicon}`);
                data.favicon = favicon[0].filename
            }
        }

        for (var key in data) {
            await GeneralSetting.updateOne({ field_name: key, setting_type: type }, { field_value: data[key] });
        }

        return res.successUpdate();
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}

exports.toggleStatus = async (req, res) => {
    try {


        var record = await mongoose.connection.db.collection(req.params.table).findOne({ _id: createFromHexString(req.params.id) });
        if (record) {
            await mongoose.connection.db.collection(req.params.table).updateOne({ _id: createFromHexString(req.params.id) }, { $set: { status: !record.status } });
            return res.success(record);
        } else {
            return res.noRecords();
        }
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}

exports.commonDelete = async (req, res) => {
    try {

        var record = await mongoose.connection.db.collection(req.params.table).findOne({ _id: createFromHexString(req.params.id) });
        if (record) {
            await mongoose.connection.db.collection(req.params.table).updateOne({ _id: createFromHexString(req.params.id) }, { $set: { deletedAt: new Date() } });
            return res.successDelete(record);
        } else {
            return res.noRecords();
        }
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}