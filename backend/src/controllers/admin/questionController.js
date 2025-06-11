const QUESTION_FORMAT  = require("../../helpers/questionFormat")
const Question = require("../../models/Question");
const Topic = require("../../models/Topic");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const Subject = require("../../models/Subject");
const Chapter = require("../../models/Chapter");
const mongoose = require("mongoose")

// Get questions by topic
exports.getQuestions = async (req, res) => {
  try {
    const { page = 1, limit = 10, topicId, search } = req.query

    // Build query
    const query = { status: true }

    if (topicId) {
      query.topicId = topicId
    }

    if (search) {
      query.$or = [
        { questionText: { $regex: search, $options: "i" } },
        { option1: { $regex: search, $options: "i" } },
        { option2: { $regex: search, $options: "i" } },
        { option3: { $regex: search, $options: "i" } },
        { option4: { $regex: search, $options: "i" } },
        { option5: { $regex: search, $options: "i" } },
      ]
    }

    // Execute query with pagination
    const questions = await Question.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 })

    // Get total count
    const count = await Question.countDocuments(query)

    return res.status(200).json({
      status: true,
      message: "Questions fetched successfully",
      data: {
        record: questions,
        count,
        current_page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching questions:", error)
    return res.status(500).json({
      status: false,
      message: "Failed to fetch questions",
      error: error.message,
    })
  }
}

// Generate sample Excel template
// exports.generateSampleExcel = (req, res) => {
//   try {
//     // Create workbook and worksheet
//     const workbook = xlsx.utils.book_new()

//     // Create headers array from config
//     const headers = [
//       QUESTION_FORMAT.HEADERS.QUESTION_TEXT,
//       QUESTION_FORMAT.HEADERS.OPTION_1,
//       QUESTION_FORMAT.HEADERS.OPTION_2,
//       QUESTION_FORMAT.HEADERS.OPTION_3,
//       QUESTION_FORMAT.HEADERS.OPTION_4,
//       QUESTION_FORMAT.HEADERS.OPTION_5,
//       QUESTION_FORMAT.HEADERS.RIGHT_ANSWER,
//       QUESTION_FORMAT.HEADERS.EXPLANATION,
//     ]

//     // Create worksheet with headers and sample data
//     const data = [headers, ...QUESTION_FORMAT.SAMPLE_DATA]
//     const worksheet = xlsx.utils.aoa_to_sheet(data)

//     // Add worksheet to workbook
//     xlsx.utils.book_append_sheet(workbook, worksheet, "Questions")

//     // Create temp directory if it doesn't exist
//     const tempDir = path.join(__dirname, "../temp")
//     if (!fs.existsSync(tempDir)) {
//       fs.mkdirSync(tempDir, { recursive: true })
//     }

//     // Write to file
//     const filePath = path.join(tempDir, "sample_questions_template.xlsx")
//     xlsx.writeFile(workbook, filePath)

//     // Send file
//     return res.download(filePath, "sample_questions_template.xlsx", (err) => {
//       if (err) {
//         console.error("Error downloading file:", err)
//         return res.status(500).json({
//           status: false,
//           message: "Failed to download template",
//           error: err.message,
//         })
//       }

//       // Delete file after download
//       fs.unlinkSync(filePath)
//     })
//   } catch (error) {
//     console.error("Error generating sample Excel:", error)
//     return res.status(500).json({
//       status: false,
//       message: "Failed to generate sample Excel",
//       error: error.message,
//     })
//   }
// }

exports.generateSampleExcel = (req, res) => {
  try {
    // Create workbook and worksheet
    const workbook = xlsx.utils.book_new();

    // Create headers array from config
    const headers = [
      QUESTION_FORMAT.HEADERS.QUESTION_TEXT,
      QUESTION_FORMAT.HEADERS.OPTION_1,
      QUESTION_FORMAT.HEADERS.OPTION_2,
      QUESTION_FORMAT.HEADERS.OPTION_3,
      QUESTION_FORMAT.HEADERS.OPTION_4,
      QUESTION_FORMAT.HEADERS.OPTION_5,
      QUESTION_FORMAT.HEADERS.RIGHT_ANSWER,
      QUESTION_FORMAT.HEADERS.EXPLANATION,
    ];

    // Create worksheet with headers and sample data
    const data = [headers, ...QUESTION_FORMAT.SAMPLE_DATA];
    const worksheet = xlsx.utils.aoa_to_sheet(data);

    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, "Questions");

    // Generate buffer instead of writing to a file
    const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Set appropriate headers and send the buffer
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sample_questions_template.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error("Error generating sample Excel:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to generate sample Excel",
      error: error.message,
    });
  }
};

// Create a new question
exports.createQuestion = async (req, res) => {
  try {
    const {
      questionText,
      option1,
      option2,
      option3,
      option4,
      option5,
      rightAnswer,
      explanation,
      subjectId,
      chapterId,
      topicId,
    } = req.body

    // Validate required fields
    if (
      !questionText ||
      !option1 ||
      !option2 ||
      !option3 ||
      !option4 ||
      !rightAnswer ||
      !subjectId ||
      !chapterId ||
      !topicId
    ) {
      return res.status(400).json({
        status: false,
        message: "Please provide all required fields",
      })
    }

    // Create new question
    const question = await Question.create({
      questionText,
      option1,
      option2,
      option3,
      option4,
      option5: option5 || "",
      rightAnswer,
      explanation: explanation || "",
      subjectId,
      chapterId,
      topicId,
      status: true,
      createdBy: req.user?._id,
    })

    // Increment question count in the topic
    await Topic.findByIdAndUpdate(topicId, {
      $inc: { questionCount: 1 },
    })

    return res.status(201).json({
      status: true,
      message: "Question created successfully",
      data: question,
    })
  } catch (error) {
    console.error("Error creating question:", error)
    return res.status(500).json({
      status: false,
      message: "Failed to create question",
      error: error.message,
    })
  }
}

// Upload questions from Excel
exports.uploadQuestions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "Please upload an Excel file",
      })
    }

    const { subjectId, chapterId, topicId } = req.body

    if (!subjectId || !chapterId || !topicId) {
      return res.status(400).json({
        status: false,
        message: "Subject, Chapter, and Topic IDs are required",
      })
    }

    // Read Excel file
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = xlsx.utils.sheet_to_json(worksheet)

    if (data.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Excel file is empty",
      })
    }

    // Validate and process data
    const questions = []
    const errors = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i]

      // Check required fields
      if (
        !row[QUESTION_FORMAT.HEADERS.QUESTION_TEXT] ||
        !row[QUESTION_FORMAT.HEADERS.OPTION_1] ||
        !row[QUESTION_FORMAT.HEADERS.OPTION_2] ||
        !row[QUESTION_FORMAT.HEADERS.OPTION_3] ||
        !row[QUESTION_FORMAT.HEADERS.OPTION_4] ||
        !row[QUESTION_FORMAT.HEADERS.RIGHT_ANSWER]
      ) {
        errors.push(`Row ${i + 2}: Missing required fields`)
        continue
      }

      // Validate right answer
      const rightAnswerValue = row[QUESTION_FORMAT.HEADERS.RIGHT_ANSWER]
      const rightAnswer = QUESTION_FORMAT.RIGHT_ANSWER_MAP[rightAnswerValue]

      if (!rightAnswer) {
        errors.push(`Row ${i + 2}: Invalid right answer format. Must be one of: 1, 2, 3, 4, 5`)
        continue
      }

      // Create question object
      questions.push({
        questionText: row[QUESTION_FORMAT.HEADERS.QUESTION_TEXT],
        option1: row[QUESTION_FORMAT.HEADERS.OPTION_1],
        option2: row[QUESTION_FORMAT.HEADERS.OPTION_2],
        option3: row[QUESTION_FORMAT.HEADERS.OPTION_3],
        option4: row[QUESTION_FORMAT.HEADERS.OPTION_4],
        option5: row[QUESTION_FORMAT.HEADERS.OPTION_5] || "",
        rightAnswer: rightAnswer,
        explanation: row[QUESTION_FORMAT.HEADERS.EXPLANATION] || "",
        subjectId,
        chapterId,
        topicId,
        status: true,
        createdBy: req.user?._id,
      })
    }

    if (questions.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No valid questions found in Excel file",
        errors,
      })
    }

    // Insert questions
    const insertedQuestions = await Question.insertMany(questions)

    // Update topic question count
    await Topic.findByIdAndUpdate(topicId, {
      $inc: { questionCount: insertedQuestions.length },
    })

    return res.status(201).json({
      status: true,
      message: `${insertedQuestions.length} questions uploaded successfully`,
      errors: errors.length > 0 ? errors : undefined,
      data: insertedQuestions,
    })
  } catch (error) {
    console.error("Error uploading questions from Excel:", error)
    return res.status(500).json({
      status: false,
      message: "Failed to upload questions from Excel",
      error: error.message,
    })
  }
}

// Delete a question
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)

    if (!question) {
      return res.status(404).json({
        status: false,
        message: "Question not found",
      })
    }

    // Delete the question
    await Question.findByIdAndDelete(req.params.id)

    // Decrement topic question count
    await Topic.findByIdAndUpdate(question.topicId, {
      $inc: { questionCount: -1 },
    })

    return res.status(200).json({
      status: true,
      message: "Question deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting question:", error)
    return res.status(500).json({
      status: false,
      message: "Failed to delete question",
      error: error.message,
    })
  }
}



exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      questionText,
      option1,
      option2,
      option3,
      option4,
      option5,
      rightAnswer,
      explanation,
      subjectId,
      chapterId,
      topicId,
      correctMarks,
      negativeMarks,
    } = req.body;

    // Validate question ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: false, message: 'Invalid question ID' });
    }

    // Check if question exists
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ status: false, message: 'Question not found' });
    }

    // Validate references
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ status: false, message: 'Subject not found' });
    }

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ status: false, message: 'Chapter not found' });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ status: false, message: 'Topic not found' });
    }

    // Update question fields
    question.questionText = questionText;
    question.option1 = option1;
    question.option2 = option2;
    question.option3 = option3;
    question.option4 = option4;
    question.option5 = option5 || '';
    question.rightAnswer = rightAnswer;
    question.explanation = explanation || '';
    question.subjectId = subjectId;
    question.chapterId = chapterId;
    question.topicId = topicId;
    question.correctMarks = correctMarks || question.correctMarks;
    question.negativeMarks = negativeMarks || question.negativeMarks;
    question.updatedBy = req.user?._id;
    question.updatedAt = new Date();

    await question.save();

    res.status(200).json({
      status: true,
      message: 'Question updated successfully',
      data: question,
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};


// const Question = require("../../models/Question")
// const Topic = require("../../models/Topic")
// const xlsx = require("xlsx")
// const fs = require("fs")
// const path = require("path")

// // Create a new question
// exports.createQuestion = async (req, res) => {
//   try {
//     const {
//       questionText,
//       option1,
//       option2,
//       option3,
//       option4,
//       option5,
//       rightAnswer,
//       explanation,
//       subjectId,
//       chapterId,
//       topicId,
//       correctMarks,
//       negativeMarks,
//     } = req.body

//     // Validate required fields
//     if (
//       !questionText ||
//       !option1 ||
//       !option2 ||
//       !option3 ||
//       !option4 ||
//       !rightAnswer ||
//       !subjectId ||
//       !chapterId ||
//       !topicId
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide all required fields",
//       })
//     }

//     // Create new question
//     const question = await Question.create({
//       questionText,
//       option1,
//       option2,
//       option3,
//       option4,
//       option5,
//       rightAnswer,
//       explanation,
//       subjectId,
//       chapterId,
//       topicId,
//       correctMarks: correctMarks || 1,
//       negativeMarks: negativeMarks || 0.25,
//       createdBy: req.user._id,
//     })

//     // Increment question count in the topic
//     await Topic.findByIdAndUpdate(topicId, {
//       $inc: { questionCount: 1 },
//     })

//     return res.status(201).json({
//       success: true,
//       data: question,
//       message: "Question created successfully",
//     })
//   } catch (error) {
//     console.error("Error creating question:", error)
//     return res.status(500).json({
//       success: false,
//       message: "Failed to create question",
//       error: error.message,
//     })
//   }
// }

// // Get all questions with pagination and filters
// exports.getQuestions = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, subjectId, chapterId, topicId, search } = req.query

//     // Build query
//     const query = { status: true }

//     if (subjectId) query.subjectId = subjectId
//     if (chapterId) query.chapterId = chapterId
//     if (topicId) query.topicId = topicId

//     if (search) {
//       query.$or = [
//         { questionText: { $regex: search, $options: "i" } },
//         { option1: { $regex: search, $options: "i" } },
//         { option2: { $regex: search, $options: "i" } },
//         { option3: { $regex: search, $options: "i" } },
//         { option4: { $regex: search, $options: "i" } },
//         { option5: { $regex: search, $options: "i" } },
//       ]
//     }

//     // Execute query with pagination
//     const questions = await Question.find(query)
//       .populate("subjectId", "name")
//       .populate("chapterId", "name")
//       .populate("topicId", "name")
//       .skip((page - 1) * limit)
//       .limit(Number.parseInt(limit))
//       .sort({ createdAt: -1 })

//     // Get total count
//     const total = await Question.countDocuments(query)

//     return res.status(200).json({
//       success: true,
//       data: questions,
//       pagination: {
//         total,
//         page: Number.parseInt(page),
//         limit: Number.parseInt(limit),
//         pages: Math.ceil(total / limit),
//       },
//     })
//   } catch (error) {
//     console.error("Error fetching questions:", error)
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch questions",
//       error: error.message,
//     })
//   }
// }

// // Get a single question by ID
// exports.getQuestion = async (req, res) => {
//   try {
//     const question = await Question.findById(req.params.id)
//       .populate("subjectId", "name")
//       .populate("chapterId", "name")
//       .populate("topicId", "name")

//     if (!question) {
//       return res.status(404).json({
//         success: false,
//         message: "Question not found",
//       })
//     }

//     return res.status(200).json({
//       success: true,
//       data: question,
//     })
//   } catch (error) {
//     console.error("Error fetching question:", error)
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch question",
//       error: error.message,
//     })
//   }
// }

// // Update a question


// // Delete a question
// exports.deleteQuestion = async (req, res) => {
//   try {
//     const question = await Question.findById(req.params.id)

//     if (!question) {
//       return res.status(404).json({
//         success: false,
//         message: "Question not found",
//       })
//     }

//     // Soft delete by updating status
//     await Question.findByIdAndUpdate(req.params.id, {
//       status: false,
//       updatedBy: req.user._id,
//     })

//     // Decrement question count in the topic
//     await Topic.findByIdAndUpdate(question.topicId, {
//       $inc: { questionCount: -1 },
//     })

//     return res.status(200).json({
//       success: true,
//       message: "Question deleted successfully",
//     })
//   } catch (error) {
//     console.error("Error deleting question:", error)
//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete question",
//       error: error.message,
//     })
//   }
// }

// // Generate sample Excel template
// exports.generateSampleExcel = (req, res) => {
//   try {
//     // Create workbook and worksheet
//     const workbook = xlsx.utils.book_new()
//     const worksheet = xlsx.utils.aoa_to_sheet([
//       [
//         "Question Text",
//         "Option 1",
//         "Option 2",
//         "Option 3",
//         "Option 4",
//         "Option 5",
//         "Right Answer (option1/option2/option3/option4/option5)",
//         "Explanation",
//         "Subject ID",
//         "Chapter ID",
//         "Topic ID",
//         "Correct Marks",
//         "Negative Marks",
//       ],
//       [
//         "What is the capital of India?",
//         "Mumbai",
//         "New Delhi",
//         "Kolkata",
//         "Chennai",
//         "",
//         "option2",
//         "New Delhi is the capital of India",
//         "60f1a5b3e6d8a52b3c9a1234", // Example Subject ID
//         "60f1a5c7e6d8a52b3c9a5678", // Example Chapter ID
//         "60f1a5d9e6d8a52b3c9a9abc", // Example Topic ID
//         "1",
//         "0.25",
//       ],
//     ])

//     // Add worksheet to workbook
//     xlsx.utils.book_append_sheet(workbook, worksheet, "Questions")

//     // Create temp directory if it doesn't exist
//     const tempDir = path.join(__dirname, "../temp")
//     if (!fs.existsSync(tempDir)) {
//       fs.mkdirSync(tempDir, { recursive: true })
//     }

//     // Write to file
//     const filePath = path.join(tempDir, "sample_questions_template.xlsx")
//     xlsx.writeFile(workbook, filePath)

//     // Send file
//     return res.download(filePath, "sample_questions_template.xlsx", (err) => {
//       if (err) {
//         console.error("Error downloading file:", err)
//         return res.status(500).json({
//           success: false,
//           message: "Failed to download template",
//           error: err.message,
//         })
//       }

//       // Delete file after download
//       fs.unlinkSync(filePath)
//     })
//   } catch (error) {
//     console.error("Error generating sample Excel:", error)
//     return res.status(500).json({
//       success: false,
//       message: "Failed to generate sample Excel",
//       error: error.message,
//     })
//   }
// }

// // Upload questions from Excel
// exports.uploadQuestionsExcel = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "Please upload an Excel file",
//       })
//     }

//     // Read Excel file
//     const workbook = xlsx.read(req.file.buffer, { type: "buffer" })
//     const worksheet = workbook.Sheets[workbook.SheetNames[0]]
//     const data = xlsx.utils.sheet_to_json(worksheet)

//     if (data.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Excel file is empty",
//       })
//     }

//     // Validate and process data
//     const questions = []
//     const errors = []

//     for (let i = 0; i < data.length; i++) {
//       const row = data[i]

//       // Check required fields
//       if (
//         !row["Question Text"] ||
//         !row["Option 1"] ||
//         !row["Option 2"] ||
//         !row["Option 3"] ||
//         !row["Option 4"] ||
//         !row["Right Answer (option1/option2/option3/option4/option5)"] ||
//         !row["Subject ID"] ||
//         !row["Chapter ID"] ||
//         !row["Topic ID"]
//       ) {
//         errors.push(`Row ${i + 2}: Missing required fields`)
//         continue
//       }

//       // Validate right answer
//       const rightAnswer = row["Right Answer (option1/option2/option3/option4/option5)"]
//       if (!["option1", "option2", "option3", "option4", "option5"].includes(rightAnswer)) {
//         errors.push(
//           `Row ${i + 2}: Invalid right answer format. Must be one of: option1, option2, option3, option4, option5`,
//         )
//         continue
//       }

//       // Create question object
//       questions.push({
//         questionText: row["Question Text"],
//         option1: row["Option 1"],
//         option2: row["Option 2"],
//         option3: row["Option 3"],
//         option4: row["Option 4"],
//         option5: row["Option 5"] || "",
//         rightAnswer: rightAnswer,
//         explanation: row["Explanation"] || "",
//         subjectId: row["Subject ID"],
//         chapterId: row["Chapter ID"],
//         topicId: row["Topic ID"],
//         correctMarks: row["Correct Marks"] || 1,
//         negativeMarks: row["Negative Marks"] || 0.25,
//         createdBy: req.user._id,
//       })
//     }

//     if (questions.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No valid questions found in Excel file",
//         errors,
//       })
//     }

//     // Insert questions
//     const insertedQuestions = await Question.insertMany(questions)

//     // Update topic question counts
//     const topicCounts = {}
//     for (const question of questions) {
//       topicCounts[question.topicId] = (topicCounts[question.topicId] || 0) + 1
//     }

//     for (const [topicId, count] of Object.entries(topicCounts)) {
//       await Topic.findByIdAndUpdate(topicId, {
//         $inc: { questionCount: count },
//       })
//     }

//     return res.status(201).json({
//       success: true,
//       message: `${insertedQuestions.length} questions uploaded successfully`,
//       errors: errors.length > 0 ? errors : undefined,
//       data: insertedQuestions,
//     })
//   } catch (error) {
//     console.error("Error uploading questions from Excel:", error)
//     return res.status(500).json({
//       success: false,
//       message: "Failed to upload questions from Excel",
//       error: error.message,
//     })
//   }
// }

// // Get questions by topic for test series
// exports.getQuestionsByTopic = async (req, res) => {
//   try {
//     const { topicId } = req.params

//     if (!topicId) {
//       return res.status(400).json({
//         success: false,
//         message: "Topic ID is required",
//       })
//     }

//     const questions = await Question.find({
//       topicId,
//       status: true,
//     }).select("_id questionText")

//     return res.status(200).json({
//       success: true,
//       data: questions,
//     })
//   } catch (error) {
//     console.error("Error fetching questions by topic:", error)
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch questions by topic",
//       error: error.message,
//     })
//   }
// }
