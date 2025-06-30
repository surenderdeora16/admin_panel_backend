const { clean } = require("../../helpers/string");
const { GeneralSetting, createFromHexString, mongoose } = require("../../models");
const Storage = require('../../helpers/storage');

exports.getGeneralSetting = async (req, res) => {
    try {
        var setting = await GeneralSetting.find({ setting_type: { $in: req.params.type.split(',').map(r => parseInt(r)) } });
        var setting_arr = setting.reduce((obj, item) => Object.assign(obj, { [item.field_name]: item.field_value }), {});

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

// exports.updateGeneralSetting = async (req, res) => {
//     try {
//         var data = clean(req.body)
//         var type = clean(req.query.type)
//         delete data?.favicon;
//         delete data?.footer_logo;
//         delete data?.logo;

//         // Files Upload
//         const { logo = null, footer_logo = null, favicon = null } = req.files
//         if (logo || footer_logo || favicon) {

//             var setting = await GeneralSetting.find({ setting_name: ['favicon', 'footer_logo', 'logo'] });
//             var setting_arr = setting.reduce((obj, item) => Object.assign(obj, { [item.field_name]: item.field_value }), {});

//             if (logo != undefined) {
//                 Storage.deleteFile(`setting/${setting_arr?.logo}`);
//                 data.logo = logo[0].filename
//             }

//             if (footer_logo != undefined) {
//                 Storage.deleteFile(`setting/${setting_arr?.footer_logo}`);
//                 data.footer_logo = footer_logo[0].filename
//             }


//             if (favicon != undefined) {
//                 Storage.deleteFile(`setting/${setting_arr?.favicon}`);
//                 data.favicon = favicon[0].filename
//             }
//         }

//         for (var key in data) {
//             await GeneralSetting.updateOne({ field_name: key, setting_type: type }, { field_value: data[key] });
//         }

//         return res.successUpdate();
//     } catch (error) {
//         console.log("error", error)
//         return res.someThingWentWrong(error);
//     }
// }

exports.updateGeneralSetting = async (req, res) => {
    try {
        const data = clean(req.body);
        const settingType = clean(req.query.type); // Changed from 'type' to 'settingType' for clarity

        // Remove non-setting fields
        delete data.type;
        
        // Get all valid fields for this setting type
        const validFields = await GeneralSetting.find({ 
            setting_type: settingType 
        }).distinct('field_name');

        let updateCount = 0;
        
        for (const [fieldName, fieldValue] of Object.entries(data)) {
            if (validFields.includes(fieldName)) {
                const result = await GeneralSetting.updateOne(
                    { 
                        field_name: fieldName, 
                        setting_type: settingType 
                    },
                    { 
                        field_value: fieldValue.toString() // Ensure string value
                    }
                );
                
                if (result.modifiedCount > 0) {
                    updateCount++;
                }
            }
        }

        if (updateCount === 0) {
            return res.status(200).json({
                success: false,
                message: "No fields were updated - possibly invalid field names or same values"
            });
        }


        console.log("updateCount", updateCount)
        
        return res.status(200).json({
            success: true,
            message: `Successfully updated ${updateCount} field(s)`
        });
        
    } catch (error) {
        console.error("Error in updateGeneralSetting:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
}

exports.toggleStatus = async (req, res) => {
    try {
        console.log("req.params", req.params)
        var record = await mongoose.connection.db.collection(req.params.table)
        .findOne({ 
            $or: [
            { _id: createFromHexString(req?.params?.id) }, 
            { id: req?.params?.id }
            ] 
        });
        console.log("record", record)
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
