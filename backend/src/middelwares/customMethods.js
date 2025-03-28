const language = require('../languages/english');

module.exports = (req, res, next) => {

    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept');

    // Update Request Query Parameters 
    var { limit, pageNo, query, orderBy, orderDirection } = req.query
    req.query.limit = limit ? parseInt(limit) : 10;
    req.query.pageNo = pageNo ? parseInt(pageNo) : 1;
    req.query.query = query ? query : null;
    req.query.orderBy = orderBy ? orderBy : 'createdAt';
    req.query.orderDirection = orderDirection ? orderDirection : 'desc';

    // Rerquest :: get selected body parameters as object  
    req.getBody = function (array) {
        let output = {}, reqBody = this.body;
        Object.keys(reqBody).forEach(function (key) { if (array.includes(key)) output[key] = reqBody[key] });
        return output;
    }

    // Responce :: No records found
    res.noRecords = function (status = false) {
        return this.status(404).json({
            status,
            message: language.NO_RECORD_FOUND,
            data: []
        });
    }

    // Responce :: Success
    res.success = function (data = []) {
        return res.status(200).json({
            status: true,
            message: language.SUCCESS,
            data
        });
    }

    // Responce :: Datatables No records found
    res.datatableNoRecords = function () {
        return this.status(404).json({
            status: true,
            message: language.NO_RECORD_FOUND,
            data: {
                count: 0,
                current_page: 1,
                totalPages: 0,
                pagination: [],
                record: [],
            }
        });
    }

    res.pagination = function (results = [], total_count = 0, limit = 10, pageNo = 1) {
        var totalPages = Math.ceil(total_count / limit)

        var pagination = [pageNo];
        let i = pageNo + 1;
        while (i < (pageNo + 4) && i <= totalPages) {
            pagination.push(i)
            i++;
        }

        let j = pageNo - 1;
        while (j > (pageNo - 4) && j >= 1) {
            pagination.unshift(j)
            --j;
        }

        return this.success({
            count: total_count,
            current_page: pageNo,
            totalPages,
            pagination,
            record: results,
        });
    }


    // Responce :: Someting went wrong 
    res.someThingWentWrong = function (error = { message: language.SOMETHING_WENT_WRONG }) {
        return this.status(403).json({
            status: false,
            message: error.message || language.SOMETHING_WENT_WRONG,
            data: process.env.SHOW_ERROR ? error.stack.split("\n").splice(0, 10) : []
        })
    };

    // Responce :: Success Insert
    res.successInsert = function (data = []) {
        return this.status(201).json({
            status: true,
            message: language.RECORD_INSERTED_SUCCESSFULLY,
            data: data
        })
    };

    // Responce :: Success Update
    res.successUpdate = function (data = []) {
        return this.status(200).json({
            status: true,
            message: language.RECORD_UPDATEDED_SUCCESSFULLY,
            data: data
        });
    }

    res.successDelete = function (data = []) {
        return this.status(200).json({
            status: true,
            message: language.RECORD_DELETED_SUCCESSFULLY,
            data: data
        });
    }



    next()
};
