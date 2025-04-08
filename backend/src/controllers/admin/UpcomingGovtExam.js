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
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      isActive: true,
      deletedAt: null,
    };

    const [exams, totalCount] = await Promise.all([
      UpcomingGovtExam.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number.parseInt(limit))
        .lean(),
      UpcomingGovtExam.countDocuments(query),
    ]);

    const processedExams = exams.map((exam) => this.formatExamResponse(exam));

    return res.pagination(processedExams, totalCount, limit, Number(page));
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

    exam.isActive = !exam.isActive;
    await exam.save();

    res.json({
      status: true,
      message: `Exam ${
        exam.isActive ? "activated" : "deactivated"
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
    id: exam._id,
    title: exam.title,
    description: exam.description,
    // image: exam.image ? `/uploads/exams/${exam.image}` : null,
    image: exam.image ? `${exam.image}` : null,
    examDate: exam.examDate || null,
    dateStatus: exam.examDate
      ? `Exam Date: ${exam.examDate.toLocaleDateString("en-IN")}`
      : "Date to be announced soon",
    isActive: exam.isActive,
    createdAt: exam.createdAt,
  };
};
