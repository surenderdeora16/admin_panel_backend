// Configuration for question format in Excel uploads/downloads
export const QUESTION_FORMAT = {
    // Column headers in Excel file
    HEADERS: {
      QUESTION_TEXT: "Question Text",
      OPTION_1: "Option 1",
      OPTION_2: "Option 2",
      OPTION_3: "Option 3",
      OPTION_4: "Option 4",
      OPTION_5: "Option 5",
      RIGHT_ANSWER: "Right Answer (1/2/3/4/5)", // Changed from option1/option2/... to 1/2/3/...
      EXPLANATION: "Explanation",
    },
  
    // Mapping between numeric values in Excel and option keys in database
    RIGHT_ANSWER_MAP: {
      "1": "option1",
      "2": "option2",
      "3": "option3",
      "4": "option4",
      "5": "option5",
    },
  
    // Reverse mapping for displaying in Excel
    RIGHT_ANSWER_REVERSE_MAP: {
      option1: "1",
      option2: "2",
      option3: "3",
      option4: "4",
      option5: "5",
    },
  
    // Sample data for Excel template
    SAMPLE_DATA: [
      [
        "What is the capital of India?",
        "Mumbai",
        "New Delhi",
        "Kolkata",
        "Chennai",
        "",
        "2", // Changed from "option2" to "2"
        "New Delhi is the capital of India",
      ],
      [
        "What is the national color?",
        "Black",
        "Red",
        "White",
        "Green",
        "Purple",
        "4", // Changed from "option4" to "4"
        "Because it is green",
      ],
    ],
  }
  