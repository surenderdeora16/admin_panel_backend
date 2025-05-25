// const fs = require("fs")
// const path = require("path")

// /**
//  * Generate advanced PDF for exam result with charts and detailed analysis
//  */
// exports.generateResultPDF = async (resultData) => {
//   try {
//     // Validate input data
//     if (!resultData) {
//       throw new Error("Result data is required")
//     }

//     // Ensure all required data exists with defaults
//     const safeData = {
//       exam: resultData.exam || {},
//       testSeries: resultData.testSeries || {},
//       user: resultData.user || {},
//       performance: resultData.performance || {},
//       sectionAnalysis: Array.isArray(resultData.sectionAnalysis) ? resultData.sectionAnalysis : [],
//       subjectAnalysis: Array.isArray(resultData.subjectAnalysis) ? resultData.subjectAnalysis : [],
//       insights: Array.isArray(resultData.insights) ? resultData.insights : [],
//       questionAnalysis: Array.isArray(resultData.questionAnalysis) ? resultData.questionAnalysis : [],
//     }

//     // Create HTML content for PDF
//     const htmlContent = generateResultHTML(safeData)

//     if (!htmlContent) {
//       throw new Error("Failed to generate HTML content")
//     }

//     // Return HTML as buffer (you can integrate with PDF generation library like puppeteer)
//     return Buffer.from(htmlContent, "utf8")
//   } catch (error) {
//     console.error("Error generating PDF:", error)
//     throw new Error(`PDF generation failed: ${error.message}`)
//   }
// }
// /**
//  * Generate comprehensive HTML for result PDF
//  */
// function generateResultHTML(data) {
//   const { exam, testSeries, user, performance, sectionAnalysis, subjectAnalysis, insights, questionAnalysis } = data

//   return `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Exam Result - ${testSeries.title}</title>
//     <style>
//         * {
//             margin: 0;
//             padding: 0;
//             box-sizing: border-box;
//         }

//         body {
//             font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//             line-height: 1.6;
//             color: #333;
//             background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//             min-height: 100vh;
//         }

//         .container {
//             max-width: 1200px;
//             margin: 0 auto;
//             padding: 20px;
//             background: white;
//             box-shadow: 0 20px 40px rgba(0,0,0,0.1);
//             border-radius: 20px;
//             margin-top: 20px;
//             margin-bottom: 20px;
//         }

//         .header {
//             text-align: center;
//             padding: 30px 0;
//             background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//             color: white;
//             border-radius: 15px;
//             margin-bottom: 30px;
//             position: relative;
//             overflow: hidden;
//         }

//         .header::before {
//             content: '';
//             position: absolute;
//             top: -50%;
//             left: -50%;
//             width: 200%;
//             height: 200%;
//             background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
//             animation: rotate 20s linear infinite;
//         }

//         @keyframes rotate {
//             0% { transform: rotate(0deg); }
//             100% { transform: rotate(360deg); }
//         }

//         .header h1 {
//             font-size: 2.5em;
//             margin-bottom: 10px;
//             position: relative;
//             z-index: 1;
//         }

//         .header p {
//             font-size: 1.2em;
//             opacity: 0.9;
//             position: relative;
//             z-index: 1;
//         }

//         .student-info {
//             background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
//             padding: 25px;
//             border-radius: 15px;
//             color: white;
//             margin-bottom: 30px;
//             display: grid;
//             grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
//             gap: 20px;
//         }

//         .info-item {
//             text-align: center;
//         }

//         .info-label {
//             font-size: 0.9em;
//             opacity: 0.8;
//             margin-bottom: 5px;
//         }

//         .info-value {
//             font-size: 1.3em;
//             font-weight: bold;
//         }

//         .performance-overview {
//             display: grid;
//             grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
//             gap: 20px;
//             margin-bottom: 40px;
//         }

//         .metric-card {
//             background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
//             padding: 25px;
//             border-radius: 15px;
//             text-align: center;
//             color: white;
//             position: relative;
//             overflow: hidden;
//             transition: transform 0.3s ease;
//         }

//         .metric-card:hover {
//             transform: translateY(-5px);
//         }

//         .metric-card::before {
//             content: '';
//             position: absolute;
//             top: 0;
//             left: 0;
//             right: 0;
//             bottom: 0;
//             background: rgba(255,255,255,0.1);
//             transform: translateX(-100%);
//             transition: transform 0.6s ease;
//         }

//         .metric-card:hover::before {
//             transform: translateX(100%);
//         }

//         .metric-value {
//             font-size: 2.5em;
//             font-weight: bold;
//             margin-bottom: 10px;
//             position: relative;
//             z-index: 1;
//         }

//         .metric-label {
//             font-size: 1em;
//             opacity: 0.9;
//             position: relative;
//             z-index: 1;
//         }

//         .section-title {
//             font-size: 1.8em;
//             color: #333;
//             margin: 40px 0 20px 0;
//             padding-bottom: 10px;
//             border-bottom: 3px solid #667eea;
//             position: relative;
//         }

//         .section-title::after {
//             content: '';
//             position: absolute;
//             bottom: -3px;
//             left: 0;
//             width: 50px;
//             height: 3px;
//             background: #f5576c;
//         }

//         .chart-container {
//             background: white;
//             padding: 30px;
//             border-radius: 15px;
//             box-shadow: 0 10px 30px rgba(0,0,0,0.1);
//             margin-bottom: 30px;
//         }

//         .progress-bar {
//             width: 100%;
//             height: 20px;
//             background: #e0e0e0;
//             border-radius: 10px;
//             overflow: hidden;
//             margin: 10px 0;
//         }

//         .progress-fill {
//             height: 100%;
//             background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
//             border-radius: 10px;
//             transition: width 1s ease;
//         }

//         .analysis-grid {
//             display: grid;
//             grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
//             gap: 25px;
//             margin-bottom: 40px;
//         }

//         .analysis-card {
//             background: white;
//             padding: 25px;
//             border-radius: 15px;
//             box-shadow: 0 10px 30px rgba(0,0,0,0.1);
//             border-left: 5px solid #667eea;
//         }

//         .pie-chart {
//             width: 200px;
//             height: 200px;
//             margin: 20px auto;
//         }

//         .insights-section {
//             background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
//             padding: 30px;
//             border-radius: 15px;
//             margin-bottom: 30px;
//         }

//         .insight-item {
//             background: rgba(255,255,255,0.8);
//             padding: 15px;
//             border-radius: 10px;
//             margin-bottom: 15px;
//             border-left: 4px solid #f5576c;
//         }

//         .question-analysis {
//             margin-top: 40px;
//         }

//         .question-item {
//             background: white;
//             padding: 20px;
//             border-radius: 10px;
//             margin-bottom: 15px;
//             box-shadow: 0 5px 15px rgba(0,0,0,0.1);
//             border-left: 4px solid ${performance.isPassed ? "#4CAF50" : "#f44336"};
//         }

//         .question-correct {
//             border-left-color: #4CAF50;
//         }

//         .question-wrong {
//             border-left-color: #f44336;
//         }

//         .question-skipped {
//             border-left-color: #ff9800;
//         }

//         .status-badge {
//             display: inline-block;
//             padding: 5px 15px;
//             border-radius: 20px;
//             font-size: 0.8em;
//             font-weight: bold;
//             text-transform: uppercase;
//         }

//         .status-correct {
//             background: #4CAF50;
//             color: white;
//         }

//         .status-wrong {
//             background: #f44336;
//             color: white;
//         }

//         .status-skipped {
//             background: #ff9800;
//             color: white;
//         }

//         .footer {
//             text-align: center;
//             padding: 30px;
//             background: #f8f9fa;
//             border-radius: 15px;
//             margin-top: 40px;
//             color: #666;
//         }

//         @media print {
//             body {
//                 background: white;
//             }
//             .container {
//                 box-shadow: none;
//                 margin: 0;
//             }
//         }
//     </style>
// </head>
// <body>
//     <div class="container">
//         <!-- Header -->
//         <div class="header">
//             <h1>📊 Exam Result Report</h1>
//             <p>${testSeries.title}</p>
//         </div>

//         <!-- Student Information -->
//         <div class="student-info">
//             <div class="info-item">
//                 <div class="info-label">Student Name</div>
//                 <div class="info-value">${user.name}</div>
//             </div>
//             <div class="info-item">
//                 <div class="info-label">Email</div>
//                 <div class="info-value">${user.email}</div>
//             </div>
//             <div class="info-item">
//                 <div class="info-label">Exam Date</div>
//                 <div class="info-value">${new Date(exam.endTime).toLocaleDateString()}</div>
//             </div>
//             <div class="info-item">
//                 <div class="info-label">Duration</div>
//                 <div class="info-value">${exam.totalTimeSpent} min</div>
//             </div>
//         </div>

//         <!-- Performance Overview -->
//         <div class="performance-overview">
//             <div class="metric-card">
//                 <div class="metric-value">${performance.totalScore}</div>
//                 <div class="metric-label">Total Score</div>
//             </div>
//             <div class="metric-card">
//                 <div class="metric-value">${performance.percentage}%</div>
//                 <div class="metric-label">Percentage</div>
//             </div>
//             <div class="metric-card">
//                 <div class="metric-value">#${performance.rank}</div>
//                 <div class="metric-label">Rank</div>
//             </div>
//             <div class="metric-card">
//                 <div class="metric-value">${performance.percentile}%</div>
//                 <div class="metric-label">Percentile</div>
//             </div>
//             <div class="metric-card">
//                 <div class="metric-value">${performance.accuracy}%</div>
//                 <div class="metric-label">Accuracy</div>
//             </div>
//             <div class="metric-card">
//                 <div class="metric-value">${performance.isPassed ? "✅ PASS" : "❌ FAIL"}</div>
//                 <div class="metric-label">Result</div>
//             </div>
//         </div>

//         <!-- Question Breakdown -->
//         <h2 class="section-title">📈 Question Analysis</h2>
//         <div class="chart-container">
//             <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
//                 <div>
//                     <h4>Correct Answers</h4>
//                     <div class="progress-bar">
//                         <div class="progress-fill" style="width: ${(performance.correctAnswers / performance.totalQuestions) * 100}%; background: #4CAF50;"></div>
//                     </div>
//                     <p>${performance.correctAnswers} / ${performance.totalQuestions}</p>
//                 </div>
//                 <div>
//                     <h4>Wrong Answers</h4>
//                     <div class="progress-bar">
//                         <div class="progress-fill" style="width: ${(performance.wrongAnswers / performance.totalQuestions) * 100}%; background: #f44336;"></div>
//                     </div>
//                     <p>${performance.wrongAnswers} / ${performance.totalQuestions}</p>
//                 </div>
//                 <div>
//                     <h4>Skipped Questions</h4>
//                     <div class="progress-bar">
//                         <div class="progress-fill" style="width: ${(performance.skippedQuestions / performance.totalQuestions) * 100}%; background: #ff9800;"></div>
//                     </div>
//                     <p>${performance.skippedQuestions} / ${performance.totalQuestions}</p>
//                 </div>
//             </div>
//         </div>

//         <!-- Section Analysis -->
//         <h2 class="section-title">📚 Section-wise Performance</h2>
//         <div class="analysis-grid">
//             ${sectionAnalysis
//               .map(
//                 (section) => `
//                 <div class="analysis-card">
//                     <h3>${section.name}</h3>
//                     <div style="margin: 15px 0;">
//                         <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
//                             <span>Accuracy:</span>
//                             <strong>${section.accuracy}%</strong>
//                         </div>
//                         <div class="progress-bar">
//                             <div class="progress-fill" style="width: ${section.accuracy}%;"></div>
//                         </div>
//                     </div>
//                     <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 0.9em;">
//                         <div>Correct: <strong>${section.correct}</strong></div>
//                         <div>Wrong: <strong>${section.wrong}</strong></div>
//                         <div>Attempted: <strong>${section.attempted}</strong></div>
//                         <div>Skipped: <strong>${section.skipped}</strong></div>
//                     </div>
//                     <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
//                         <div>Score: <strong>${section.score} / ${section.maxScore}</strong></div>
//                         <div>Time: <strong>${Math.floor(section.timeSpent / 60)} min</strong></div>
//                     </div>
//                 </div>
//             `,
//               )
//               .join("")}
//         </div>

//         <!-- Subject Analysis -->
//         <h2 class="section-title">🎯 Subject-wise Performance</h2>
//         <div class="analysis-grid">
//             ${subjectAnalysis
//               .map(
//                 (subject) => `
//                 <div class="analysis-card">
//                     <h3>${subject.name}</h3>
//                     <div style="margin: 15px 0;">
//                         <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
//                             <span>Accuracy:</span>
//                             <strong>${subject.accuracy}%</strong>
//                         </div>
//                         <div class="progress-bar">
//                             <div class="progress-fill" style="width: ${subject.accuracy}%;"></div>
//                         </div>
//                     </div>
//                     <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 0.9em;">
//                         <div>Correct: <strong>${subject.correct}</strong></div>
//                         <div>Wrong: <strong>${subject.wrong}</strong></div>
//                         <div>Total: <strong>${subject.total}</strong></div>
//                         <div>Score: <strong>${subject.score}</strong></div>
//                     </div>
//                 </div>
//             `,
//               )
//               .join("")}
//         </div>

//         <!-- Performance Insights -->
//         <h2 class="section-title">💡 Performance Insights</h2>
//         <div class="insights-section">
//             ${insights
//               .map(
//                 (insight) => `
//                 <div class="insight-item">
//                     <strong>${insight.title}</strong>
//                     <p>${insight.description}</p>
//                 </div>
//             `,
//               )
//               .join("")}
//         </div>

//         <!-- Detailed Question Analysis -->
//         <h2 class="section-title">📝 Question-wise Analysis</h2>
//         <div class="question-analysis">
//             ${questionAnalysis
//               .slice(0, 20)
//               .map(
//                 (question, index) => `
//                 <div class="question-item question-${question.isCorrect === true ? "correct" : question.isCorrect === false ? "wrong" : "skipped"}">
//                     <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
//                         <h4>Question ${question.sequence}</h4>
//                         <span class="status-badge status-${question.isCorrect === true ? "correct" : question.isCorrect === false ? "wrong" : "skipped"}">
//                             ${question.isCorrect === true ? "Correct" : question.isCorrect === false ? "Wrong" : "Skipped"}
//                         </span>
//                     </div>
//                     <p><strong>Subject:</strong> ${question.subject} | <strong>Chapter:</strong> ${question.chapter} | <strong>Topic:</strong> ${question.topic}</p>
//                     <p><strong>Section:</strong> ${question.section} | <strong>Time Spent:</strong> ${question.timeSpent}s</p>
//                     ${
//                       question.isCorrect === false
//                         ? `
//                         <div style="margin-top: 10px; padding: 10px; background: #ffebee; border-radius: 5px;">
//                             <p><strong>Your Answer:</strong> ${question.userAnswer || "Not Attempted"}</p>
//                             <p><strong>Correct Answer:</strong> ${question.correctAnswer}</p>
//                         </div>
//                     `
//                         : ""
//                     }
//                 </div>
//             `,
//               )
//               .join("")}
//             ${
//               questionAnalysis.length > 20
//                 ? `
//                 <div style="text-align: center; padding: 20px; color: #666;">
//                     ... and ${questionAnalysis.length - 20} more questions
//                 </div>
//             `
//                 : ""
//             }
//         </div>

//         <!-- Footer -->
//         <div class="footer">
//             <p>📅 Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
//             <p>🎓 LMS - Learning Management System</p>
//             <p>This is an automated report. For any queries, please contact support.</p>
//         </div>
//     </div>
// </body>
// </html>
//   `
// }

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

/**
 * Generate advanced PDF for exam result with charts and detailed analysis
 */
exports.generateResultPDF = async (resultData) => {
  let browser = null;

  try {
    // Validate input data
    if (!resultData) {
      throw new Error("Result data is required");
    }

    console.log("Generating PDF with data:", {
      examId: resultData.exam?.id,
      studentName: resultData.user?.name,
      testTitle: resultData.testSeries?.title,
    });

    // Ensure all required data exists with defaults
    const safeData = {
      exam: resultData.exam || {},
      testSeries: resultData.testSeries || {},
      user: resultData.user || {},
      performance: resultData.performance || {},
      sectionAnalysis: Array.isArray(resultData.sectionAnalysis)
        ? resultData.sectionAnalysis
        : [],
      subjectAnalysis: Array.isArray(resultData.subjectAnalysis)
        ? resultData.subjectAnalysis
        : [],
      insights: Array.isArray(resultData.insights) ? resultData.insights : [],
      questionAnalysis: Array.isArray(resultData.questionAnalysis)
        ? resultData.questionAnalysis
        : [],
    };

    // Create HTML content for PDF
    const htmlContent = generateResultHTML(safeData);

    if (!htmlContent) {
      throw new Error("Failed to generate HTML content");
    }

    console.log(
      "HTML content generated successfully, starting PDF generation..."
    );

    // Launch puppeteer browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 800 });

    // Set content and wait for it to load
    await page.setContent(htmlContent, {
      waitUntil: ["networkidle0", "domcontentloaded"],
      timeout: 30000,
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
    });

    console.log("PDF generated successfully, buffer size:", pdfBuffer.length);

    return pdfBuffer;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }
  }
};

/**
 * Generate comprehensive HTML for result PDF
 */
function generateResultHTML(data) {
  try {
    const {
      exam,
      testSeries,
      user,
      performance,
      sectionAnalysis,
      subjectAnalysis,
      insights,
      questionAnalysis,
    } = data;

    // Safe access to nested properties
    const examTitle = testSeries.title || "Unknown Test";
    const studentName = user.name || "Unknown Student";
    const studentEmail = user.email || "N/A";
    const examDate = exam.endTime
      ? new Date(exam.endTime).toLocaleDateString()
      : "N/A";
    const duration = exam.totalTimeSpent || 0;
    const score = performance.totalScore || 0;
    const maxScore = performance.maxScore || 0;
    const percentage = performance.percentage || 0;
    const rank = performance.rank || 0;
    const percentile = performance.percentile || 0;
    const accuracy = performance.accuracy || 0;
    const isPassed = performance.isPassed || false;
    const totalQuestions = performance.totalQuestions || 0;
    const correctAnswers = performance.correctAnswers || 0;
    const wrongAnswers = performance.wrongAnswers || 0;
    const skippedQuestions = performance.skippedQuestions || 0;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exam Result - ${examTitle}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.4;
            color: #333;
            background: white;
            font-size: 12px;
        }
        
        .container {
            max-width: 100%;
            margin: 0;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        
        .header h1 {
            font-size: 24px;
            margin-bottom: 8px;
            font-weight: bold;
        }
        
        .header p {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .student-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #dee2e6;
            page-break-inside: avoid;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        
        .info-label {
            font-weight: bold;
            color: #666;
        }
        
        .info-value {
            color: #333;
            font-weight: 600;
        }
        
        .performance-overview {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        
        .metric-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #dee2e6;
        }
        
        .metric-value {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #333;
        }
        
        .metric-label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            font-weight: 600;
        }
        
        .section-title {
            font-size: 16px;
            color: #333;
            margin: 25px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #667eea;
            font-weight: bold;
            page-break-after: avoid;
        }
        
        .chart-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        
        .progress-container {
            margin-bottom: 15px;
        }
        
        .progress-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 11px;
            font-weight: 600;
        }
        
        .progress-bar {
            width: 100%;
            height: 12px;
            background: #e9ecef;
            border-radius: 6px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            border-radius: 6px;
            transition: width 0.3s ease;
        }
        
        .progress-correct { background: #28a745; }
        .progress-wrong { background: #dc3545; }
        .progress-skipped { background: #ffc107; }
        
        .analysis-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .analysis-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
            page-break-inside: avoid;
        }
        
        .analysis-card h3 {
            font-size: 14px;
            margin-bottom: 10px;
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            font-size: 11px;
            margin-top: 10px;
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
        }
        
        .insights-section {
            background: #fff3cd;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #ffeaa7;
            page-break-inside: avoid;
        }
        
        .insight-item {
            background: white;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 8px;
            border-left: 3px solid #f39c12;
            font-size: 11px;
        }
        
        .insight-title {
            font-weight: bold;
            margin-bottom: 3px;
            color: #333;
        }
        
        .footer {
            text-align: center;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-top: 25px;
            color: #666;
            font-size: 10px;
            border: 1px solid #dee2e6;
            page-break-inside: avoid;
        }
        
        .result-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .badge-pass {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .badge-fail {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        @media print {
            body { 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .page-break {
                page-break-before: always;
            }
            
            .no-break {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header no-break">
            <h1>📊 Exam Result Report</h1>
            <p>${examTitle}</p>
        </div>
        
        <!-- Student Information -->
        <div class="student-info no-break">
            <h3 style="margin-bottom: 10px; color: #333;">Student Information</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${studentName}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${studentEmail}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Exam Date:</span>
                    <span class="info-value">${examDate}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Duration:</span>
                    <span class="info-value">${duration} minutes</span>
                </div>
            </div>
        </div>
        
        <!-- Performance Overview -->
        <div class="performance-overview no-break">
            <div class="metric-card">
                <div class="metric-value">${score}/${maxScore}</div>
                <div class="metric-label">Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${percentage.toFixed(1)}%</div>
                <div class="metric-label">Percentage</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">
                    <span class="result-badge ${
                      isPassed ? "badge-pass" : "badge-fail"
                    }">
                        ${isPassed ? "PASS" : "FAIL"}
                    </span>
                </div>
                <div class="metric-label">Result</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">#${rank}</div>
                <div class="metric-label">Rank</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${percentile.toFixed(1)}%</div>
                <div class="metric-label">Percentile</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${accuracy.toFixed(1)}%</div>
                <div class="metric-label">Accuracy</div>
            </div>
        </div>
        
        <!-- Question Analysis -->
        <h2 class="section-title">📈 Question Analysis</h2>
        <div class="chart-container no-break">
            <div class="progress-container">
                <div class="progress-header">
                    <span>Correct Answers</span>
                    <span>${correctAnswers}/${totalQuestions}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill progress-correct" style="width: ${
                      totalQuestions > 0
                        ? (correctAnswers / totalQuestions) * 100
                        : 0
                    }%;"></div>
                </div>
            </div>
            
            <div class="progress-container">
                <div class="progress-header">
                    <span>Wrong Answers</span>
                    <span>${wrongAnswers}/${totalQuestions}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill progress-wrong" style="width: ${
                      totalQuestions > 0
                        ? (wrongAnswers / totalQuestions) * 100
                        : 0
                    }%;"></div>
                </div>
            </div>
            
            <div class="progress-container">
                <div class="progress-header">
                    <span>Skipped Questions</span>
                    <span>${skippedQuestions}/${totalQuestions}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill progress-skipped" style="width: ${
                      totalQuestions > 0
                        ? (skippedQuestions / totalQuestions) * 100
                        : 0
                    }%;"></div>
                </div>
            </div>
        </div>
        
        <!-- Section Analysis -->
        ${
          sectionAnalysis.length > 0
            ? `
        <h2 class="section-title">📚 Section-wise Performance</h2>
        <div class="analysis-grid">
            ${sectionAnalysis
              .map(
                (section) => `
                <div class="analysis-card">
                    <h3>${section.name || "Unknown Section"}</h3>
                    <div class="progress-container">
                        <div class="progress-header">
                            <span>Accuracy</span>
                            <span>${(section.accuracy || 0).toFixed(1)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill progress-correct" style="width: ${
                              section.accuracy || 0
                            }%;"></div>
                        </div>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span>Correct:</span>
                            <strong>${section.correct || 0}</strong>
                        </div>
                        <div class="stat-item">
                            <span>Wrong:</span>
                            <strong>${section.wrong || 0}</strong>
                        </div>
                        <div class="stat-item">
                            <span>Attempted:</span>
                            <strong>${section.attempted || 0}</strong>
                        </div>
                        <div class="stat-item">
                            <span>Skipped:</span>
                            <strong>${section.skipped || 0}</strong>
                        </div>
                        <div class="stat-item">
                            <span>Score:</span>
                            <strong>${(section.score || 0).toFixed(1)}</strong>
                        </div>
                        <div class="stat-item">
                            <span>Time:</span>
                            <strong>${Math.floor(
                              (section.timeSpent || 0) / 60
                            )}m</strong>
                        </div>
                    </div>
                </div>
            `
              )
              .join("")}
        </div>
        `
            : ""
        }
        
        <!-- Subject Analysis -->
        ${
          subjectAnalysis.length > 0
            ? `
        <div class="page-break"></div>
        <h2 class="section-title">🎯 Subject-wise Performance</h2>
        <div class="analysis-grid">
            ${subjectAnalysis
              .map(
                (subject) => `
                <div class="analysis-card">
                    <h3>${subject.name || "Unknown Subject"}</h3>
                    <div class="progress-container">
                        <div class="progress-header">
                            <span>Accuracy</span>
                            <span>${(subject.accuracy || 0).toFixed(1)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill progress-correct" style="width: ${
                              subject.accuracy || 0
                            }%;"></div>
                        </div>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span>Correct:</span>
                            <strong>${subject.correct || 0}</strong>
                        </div>
                        <div class="stat-item">
                            <span>Wrong:</span>
                            <strong>${subject.wrong || 0}</strong>
                        </div>
                        <div class="stat-item">
                            <span>Total:</span>
                            <strong>${subject.total || 0}</strong>
                        </div>
                        <div class="stat-item">
                            <span>Score:</span>
                            <strong>${(subject.score || 0).toFixed(1)}</strong>
                        </div>
                    </div>
                </div>
            `
              )
              .join("")}
        </div>
        `
            : ""
        }
        
        <!-- Performance Insights -->
        ${
          insights.length > 0
            ? `
        <h2 class="section-title">💡 Performance Insights</h2>
        <div class="insights-section no-break">
            ${insights
              .map(
                (insight) => `
                <div class="insight-item">
                    <div class="insight-title">${
                      insight.title || "Insight"
                    }</div>
                    <div>${
                      insight.description || "No description available"
                    }</div>
                </div>
            `
              )
              .join("")}
        </div>
        `
            : ""
        }
        
        <!-- Footer -->
        <div class="footer no-break">
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p><strong>Test Exam Prepration</strong></p>
            <p>This is an automated report. For any queries, please contact support.</p>
        </div>
    </div>
</body>
</html>
    `;

    return htmlContent;
  } catch (error) {
    console.error("Error generating HTML:", error);
    throw new Error(`HTML generation failed: ${error.message}`);
  }
}

/**
 * Alternative PDF generation using html-pdf (fallback)
 */
exports.generateResultPDFAlternative = async (resultData) => {
  try {
    const pdf = require("html-pdf");

    // Generate HTML content
    const htmlContent = generateResultHTML(resultData);

    const options = {
      format: "A4",
      orientation: "portrait",
      border: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
      },
      type: "pdf",
      quality: "75",
      renderDelay: 1000,
      zoomFactor: 1,
    };

    return new Promise((resolve, reject) => {
      pdf.create(htmlContent, options).toBuffer((err, buffer) => {
        if (err) {
          console.error("PDF generation error:", err);
          reject(new Error(`PDF generation failed: ${err.message}`));
        } else {
          console.log("PDF generated successfully with html-pdf");
          resolve(buffer);
        }
      });
    });
  } catch (error) {
    console.error("Error in alternative PDF generation:", error);
    throw error;
  }
};
