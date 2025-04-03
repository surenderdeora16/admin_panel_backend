const State = require("../models/State");
const District = require("../models/District");

// ................................ State .....................................
exports.state_json_list = async (req, res) => {
  try {
    const {
      limit = 10,
      pageNo = 1,
      query = "",
      orderBy = "name",
      orderDirection = -1,
    } = req.query;

    const skip = (pageNo - 1) * limit;
    const sortOrder = Number(orderDirection) === 1 ? 1 : -1;

    const searchFilter = query
      ? {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { code: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const totalCount = await State.countDocuments(searchFilter);

    const states = await State.find(searchFilter)
      .sort({ [orderBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    if (!states || states.length === 0) return res.noRecords();

    const results = states;
    return res.pagination(results, totalCount, limit, Number(pageNo));
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

(exports.getStates = async (req, res) => {
  try {
    const states = await State.find().sort("name").lean();
    if (!states.length) {
      return res.noRecords("No states found");
    }
    return res.success(states, "States fetched successfully");
  } catch (error) {
    return res.someThingWentWrong(error);
  }
}),
  (exports.addState = async (req, res) => {
    const { name, code } = req.body;

    try {
      const state = new State({ name, code });
      await state.save();

      return res.successInsert([state], "State added successfully");
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          status: false,
          message: "State or code already exists",
        });
      }
      return res.someThingWentWrong(error);
    }
  }),
  (exports.editState = async (req, res) => {
    const { id } = req.params;
    const { name, code } = req.body;

    try {
      if (!id) {
        return res.status(400).json({
          status: false,
          message: "State ID is required",
        });
      }

      const state = await State.findByIdAndUpdate(
        id,
        { name, code, updatedAt: Date.now() },
        { new: true, runValidators: true }
      );

      if (!state) {
        return res.noRecords("State not found");
      }

      return res.successUpdate([state], "State updated successfully");
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          status: false,
          message: "State or code already exists",
        });
      }
      return res.someThingWentWrong(error);
    }
  }),
  // ................................ Distrcit .....................................
  (exports.district_json_list = async (req, res) => {
    try {
      const {
        limit = 10,
        pageNo = 1,
        query = "",
        orderBy = "name",
        orderDirection = -1,
      } = req.query;

      const skip = (pageNo - 1) * limit;
      const sortOrder = Number(orderDirection) == 1 ? 1 : -1;

      const searchFilter = query
        ? {
            $or: [
              { name: { $regex: query, $options: "i" } },
              { code: { $regex: query, $options: "i" } },
            ],
          }
        : {};

      const totalCount = await District.countDocuments(searchFilter);

      const district = await District.find(searchFilter)
        .populate("stateId", "name code")
        .sort({ [orderBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit))
        .lean();

      if (!district || district.length === 0) return res.noRecords();

      const results = district;

      return res.pagination(results, totalCount, limit, Number(pageNo));
    } catch (error) {
      return res.someThingWentWrong(error);
    }
  });

(exports.getDistricts = async (req, res) => {
  const { stateId } = req.params;

  try {
    if (!stateId) {
      return res.status(400).json({
        status: false,
        message: "State ID is required",
      });
    }

    const districts = await District.find({ stateId }).sort("name").lean();
    if (!districts.length) {
      return res.noRecords("No districts found for this state");
    }

    return res.success(districts, "Districts fetched successfully");
  } catch (error) {
    return res.someThingWentWrong(error);
  }
}),
  (exports.addDistrict = async (req, res) => {
    const { name, stateId, code } = req.body;

    try {
      const stateExists = await State.findById(stateId);
      if (!stateExists) {
        return res.status(400).json({
          status: false,
          message: "Invalid state ID",
        });
      }

      const district = new District({ name, stateId, code });
      await district.save();

      return res.successInsert([district], "District added successfully");
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          status: false,
          message: "District or code already exists",
        });
      }
      return res.someThingWentWrong(error);
    }
  }),
  (exports.editDistrict = async (req, res) => {
    const { id } = req.params;
    const { name, stateId, code } = req.body;

    try {
      if (!id) {
        return res.status(400).json({
          status: false,
          message: "District ID is required",
        });
      }

      const stateExists = await State.findById(stateId);
      if (!stateExists) {
        return res.status(400).json({
          status: false,
          message: "Invalid state ID",
        });
      }

      const district = await District.findByIdAndUpdate(
        id,
        { name, stateId, code, updatedAt: Date.now() },
        { new: true, runValidators: true }
      );

      if (!district) {
        return res.noRecords("District not found");
      }

      return res.successUpdate([district], "District updated successfully");
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          status: false,
          message: "District or code already exists",
        });
      }
      return res.someThingWentWrong(error);
    }
  });
