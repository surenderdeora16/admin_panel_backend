const UpcomingGovtExam = require("../../models/UpcomingGovtExam");

exports.create = async (req, res) => {
  try {
    const { title, examDate, description } = req.body;

    const examData = {
      title,
      description: description || null,
      examDate: examDate || null,
    };

    if (req.file) {
      examData.image = req.file.filename;
    }

    const exam = await UpcomingGovtExam.create(examData);

    return res.successInsert(
      this.formatExamResponse(exam),
      "Upcoming Govt. Exam created successfully"
    );
  } catch (error) {
    return res.status(500).json({
      status: false,
      message:
        error.code === 11000
          ? "Exam title already exists"
          : "Failed to create exam",
      data: error,
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, examDate, description } = req.body;

    const exam = await UpcomingGovtExam.findById(id);
    if (!exam || exam.deletedAt) {
      return res.status(404).json({
        status: false,
        message: "Exam not found",
      });
    }

    const updateData = {
      title: title || exam.title,
      examDate: examDate || exam.examDate,
      description: description || exam.description,
    };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    const updatedExam = await UpcomingGovtExam.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    return res.successUpdate(this.formatExamResponse(updatedExam));
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.list = async (req, res) => {
  try {
    const {
      limit = 10,
      pageNo = 1,
      query = "",
      orderBy = "title",
      orderDirection = -1,
    } = req.query;

    const skip = (pageNo - 1) * limit;
    const sortOrder = Number(orderDirection) === 1 ? 1 : -1;

    const searchFilter = query
      ? {
          deletedAt: null,
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        }
      : { deletedAt: null };

    const totalCount = await UpcomingGovtExam.countDocuments(searchFilter);

    const exams = await UpcomingGovtExam.find(searchFilter)
      .sort({ [orderBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    if (!exams || exams.length === 0) return res.noRecords();

    const results = exams.map((exam) => this.formatExamResponse(exam));

    return res.pagination(results, totalCount, limit, Number(pageNo));
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id);

    if (!exam || exam.deletedAt) {
      return res.status(404).json({
        status: false,
        message: "Exam not found",
      });
    }

    exam.status = !exam.status;
    await exam.save();

    res.json({
      status: true,
      message: `Exam ${
        exam.status ? "activated" : "deactivated"
      } successfully`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "Failed to toggle exam status",
    });
  }
};

exports.softDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id);

    if (!exam || exam.deletedAt) {
      return res.status(404).json({
        status: false,
        message: "Exam not found",
      });
    }

    await exam.softDelete();

    res.json({
      status: true,
      message: "Exam deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "Failed to delete exam",
    });
  }
};

// Helper method to format response
exports.formatExamResponse = (exam) => {
  return {
    _id: exam._id,
    title: exam.title,
    description: exam.description,
    // image: exam.image ? `/uploads/exams/${exam.image}` : null,
    image: exam.image ? `${exam.image}` : null,
    examDate: exam.examDate || null,
    dateStatus: exam.examDate
      ? `Exam Date: ${exam.examDate.toLocaleDateString("en-IN")}`
      : "Date to be announced soon",
    status: exam.status,
    createdAt: exam.createdAt,
  };
};
