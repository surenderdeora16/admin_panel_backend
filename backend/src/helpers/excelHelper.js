const xlsx = require("xlsx")
const fs = require("fs")
const path = require("path")

// Generate sample Excel template for questions
exports.generateQuestionTemplate = () => {
  // Create workbook and worksheet
  const workbook = xlsx.utils.book_new()
  const worksheet = xlsx.utils.aoa_to_sheet([
    [
      "Question Text",
      "Option 1",
      "Option 2",
      "Option 3",
      "Option 4",
      "Option 5",
      "Right Answer (option1/option2/option3/option4/option5)",
      "Explanation",
      "Subject ID",
      "Chapter ID",
      "Topic ID",
      "Correct Marks",
      "Negative Marks",
    ],
    [
      "What is the capital of India?",
      "Mumbai",
      "New Delhi",
      "Kolkata",
      "Chennai",
      "",
      "option2",
      "New Delhi is the capital of India",
      "60f1a5b3e6d8a52b3c9a1234", // Example Subject ID
      "60f1a5c7e6d8a52b3c9a5678", // Example Chapter ID
      "60f1a5d9e6d8a52b3c9a9abc", // Example Topic ID
      "1",
      "0.25",
    ],
  ])

  // Add worksheet to workbook
  xlsx.utils.book_append_sheet(workbook, worksheet, "Questions")

  // Create temp directory if it doesn't exist
  const tempDir = path.join(__dirname, "../temp")
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  // Write to file
  const filePath = path.join(tempDir, "sample_questions_template.xlsx")
  xlsx.writeFile(workbook, filePath)

  return filePath
}

// Parse Excel file for questions
exports.parseQuestionExcel = (buffer) => {
  // Read Excel file
  const workbook = xlsx.read(buffer, { type: "buffer" })
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = xlsx.utils.sheet_to_json(worksheet)

  // Validate and process data
  const questions = []
  const errors = []

  for (let i = 0; i < data.length; i++) {
    const row = data[i]

    // Check required fields
    if (
      !row["Question Text"] ||
      !row["Option 1"] ||
      !row["Option 2"] ||
      !row["Option 3"] ||
      !row["Option 4"] ||
      !row["Right Answer (option1/option2/option3/option4/option5)"] ||
      !row["Subject ID"] ||
      !row["Chapter ID"] ||
      !row["Topic ID"]
    ) {
      errors.push(`Row ${i + 2}: Missing required fields`)
      continue
    }

    // Validate right answer
    const rightAnswer = row["Right Answer (option1/option2/option3/option4/option5)"]
    if (!["option1", "option2", "option3", "option4", "option5"].includes(rightAnswer)) {
      errors.push(
        `Row ${i + 2}: Invalid right answer format. Must be one of: option1, option2, option3, option4, option5`,
      )
      continue
    }

    // Create question object
    questions.push({
      questionText: row["Question Text"],
      option1: row["Option 1"],
      option2: row["Option 2"],
      option3: row["Option 3"],
      option4: row["Option 4"],
      option5: row["Option 5"] || "",
      rightAnswer: rightAnswer,
      explanation: row["Explanation"] || "",
      subjectId: row["Subject ID"],
      chapterId: row["Chapter ID"],
      topicId: row["Topic ID"],
      correctMarks: row["Correct Marks"] || 1,
      negativeMarks: row["Negative Marks"] || 0.25,
    })
  }

  return { questions, errors }
}
