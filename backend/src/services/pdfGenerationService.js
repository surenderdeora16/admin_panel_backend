const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

exports.generateResultPDF = async (resultData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 15, bufferPages: true });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on("error", reject);

      // Constants for layout and styling
      const PAGE_WIDTH = 595;
      const MARGIN = 15;
      const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
      const COLORS = {
        headerGradientStart: "#00ddeb",
        headerGradientEnd: "#0073ff",
        text: "#1a1a1a",
        label: "#4a4a4a",
        background: "#f9fafb",
        border: "#d1d5db",
        correct: "#2ecc71",
        wrong: "#e74c3c",
        skipped: "#f1c40f",
        insightsBackground: "#fef3c7",
        insightsBorder: "#fcd34d",
        insightHighlight: "#ff9500",
        pass: "#d1fae5",
        fail: "#fee2e2",
        passText: "#065f46",
        failText: "#991b1b",
        appLink: "#00ff88",
        appBadgeStart: "#00ff88",
        appBadgeEnd: "#2ecc71",
      };

      // Safe data access with defaults
      const safeData = {
        exam: resultData.exam || {},
        testSeries: resultData.testSeries || {},
        user: resultData.user || {},
        performance: resultData.performance || {},
        sectionAnalysis: Array.isArray(resultData.sectionAnalysis) ? resultData.sectionAnalysis.slice(0, 1) : [],
        subjectAnalysis: Array.isArray(resultData.subjectAnalysis) ? resultData.subjectAnalysis.slice(0, 1) : [],
        insights: Array.isArray(resultData.insights) ? resultData.insights.slice(0, 1) : [],
        questionAnalysis: Array.isArray(resultData.questionAnalysis) ? resultData.questionAnalysis : [],
      };

      const examTitle = safeData.testSeries.title || "Your Test Journey";
      const studentName = safeData.user.name || "Star Student";
      const studentEmail = safeData.user.email || "N/A";
      const examDate = safeData.exam.endTime ? new Date(safeData.exam.endTime).toLocaleDateString() : "Today";
      const duration = safeData.exam.totalTimeSpent || 0;
      const score = safeData.performance.totalScore || 0;
      const maxScore = safeData.performance.maxScore || 0;
      const percentage = safeData.performance.percentage || 0;
      const rank = safeData.performance.rank || 0;
      const percentile = safeData.performance.percentile || 0;
      const accuracy = safeData.performance.accuracy || 0;
      const isPassed = safeData.performance.isPassed || false;
      const totalQuestions = safeData.performance.totalQuestions || 0;
      const correctAnswers = safeData.performance.correctAnswers || 0;
      const wrongAnswers = safeData.performance.wrongAnswers || 0;
      const skippedQuestions = safeData.performance.skippedQuestions || 0;

      // Helper function to draw a gradient
      const drawGradientRect = (x, y, width, height, startColor, endColor) => {
        const gradient = doc.linearGradient(x, y, x + width, y);
        gradient.stop(0, startColor).stop(1, endColor);
        doc.rect(x, y, width, height).fill(gradient);
      };

      // Helper function to draw a progress bar
      const drawProgressBar = (label, value, total, color, x, y) => {
        const percentage = total > 0 ? (value / total) * 100 : 0;
        doc.fillColor(COLORS.text).fontSize(6).font("Helvetica-Bold").text(`${label}: ${value}/${total} (${percentage.toFixed(1)}%)`, x, y);
        y += 6;
        doc.fillColor(COLORS.background).rect(x, y, 150, 4).fill();
        doc.fillColor(color).rect(x, y, 150 * (percentage / 100), 4).fill();
        doc.fillColor(COLORS.border).rect(x - 1, y - 1, 152, 6).stroke(); // Glowing border
        return y + 6;
      };

      // **Header**
      let y = 15;
      drawGradientRect(0, y, PAGE_WIDTH, 50, COLORS.headerGradientStart, COLORS.headerGradientEnd);
      doc.fillColor("white").font("Helvetica-Bold").fontSize(14).text("Your Score, Your Victory!", MARGIN, y + 10, { align: "center", width: CONTENT_WIDTH });
      doc.font("Helvetica-Oblique").fontSize(8).text("Join Test Exam Preparation to Win Big!", MARGIN, y + 30, { align: "center", width: CONTENT_WIDTH });
      y += 55;

      // **Student Information**
      doc.fillColor(COLORS.text).font("Helvetica-Bold").fontSize(9).text("Your Profile", MARGIN, y);
      doc.moveTo(MARGIN, y + 10).lineTo(MARGIN + 70, y + 10).lineWidth(1).stroke(COLORS.headerGradientStart);
      y += 12;
      doc.rect(MARGIN, y, CONTENT_WIDTH, 30).fillAndStroke(COLORS.background, COLORS.border);
      doc.fillColor(COLORS.label).fontSize(7);
      doc.font("Helvetica-Bold").text("Name:", MARGIN + 5, y + 5);
      doc.fillColor(COLORS.text).font("Helvetica").text(studentName, MARGIN + 40, y + 5);
      doc.fillColor(COLORS.label).font("Helvetica-Bold").text("Email:", MARGIN + 160, y + 5);
      doc.fillColor(COLORS.text).font("Helvetica").text(studentEmail, MARGIN + 190, y + 5);
      doc.fillColor(COLORS.label).font("Helvetica-Bold").text("Date:", MARGIN + 5, y + 15);
      doc.fillColor(COLORS.text).font("Helvetica").text(examDate, MARGIN + 40, y + 15);
      doc.fillColor(COLORS.label).font("Helvetica-Bold").text("Time:", MARGIN + 160, y + 15);
      doc.fillColor(COLORS.text).font("Helvetica").text(`${duration} min`, MARGIN + 190, y + 15);
      y += 35;

      // **Performance Overview**
      doc.fillColor(COLORS.text).fontSize(9).text("Your Performance Rocks!", MARGIN, y);
      doc.moveTo(MARGIN, y + 10).lineTo(MARGIN + 90, y + 10).lineWidth(1).stroke(COLORS.headerGradientStart);
      y += 12;
      const metrics = [
        { label: "Score", value: `${score}/${maxScore}`, bg: COLORS.background },
        { label: "%", value: `${percentage.toFixed(1)}%`, bg: COLORS.background },
        { label: "Result", value: isPassed ? "PASS" : "FAIL", bg: isPassed ? COLORS.pass : COLORS.fail, textColor: isPassed ? COLORS.passText : COLORS.failText },
        { label: "Rank", value: `#${rank}`, bg: COLORS.background },
        { label: "Percentile", value: `${percentile.toFixed(1)}%`, bg: COLORS.background },
        { label: "Accuracy", value: `${accuracy.toFixed(1)}%`, bg: COLORS.background },
      ];
      metrics.forEach((metric, index) => {
        const col = index % 4;
        const row = Math.floor(index / 4);
        const x = MARGIN + col * (CONTENT_WIDTH / 4);
        const cardY = y + row * 35;
        doc.rect(x, cardY, CONTENT_WIDTH / 4 - 5, 30).fillAndStroke(metric.bg, COLORS.border);
        doc.fillColor(metric.textColor || COLORS.text).font("Helvetica-Bold").fontSize(10).text(metric.value, x, cardY + 5, { width: CONTENT_WIDTH / 4 - 5, align: "center" });
        doc.fillColor(COLORS.label).font("Helvetica").fontSize(6).text(metric.label.toUpperCase(), x, cardY + 18, { width: CONTENT_WIDTH / 4 - 5, align: "center" });
        doc.fillColor("#e5e7eb").rect(x - 1, cardY - 1, CONTENT_WIDTH / 4 - 3, 32).stroke(); // Shadow effect
      });
      y += 70;

      // **Question Analysis**
      doc.fillColor(COLORS.text).fontSize(9).text("Your Question Breakdown", MARGIN, y);
      doc.moveTo(MARGIN, y + 10).lineTo(MARGIN + 90, y + 10).lineWidth(1).stroke(COLORS.headerGradientStart);
      y += 12;
      doc.rect(MARGIN, y, CONTENT_WIDTH, 40).fillAndStroke(COLORS.background, COLORS.border);
      y += 5;
      y = drawProgressBar("Correct", correctAnswers, totalQuestions, COLORS.correct, MARGIN + 5, y);
      y = drawProgressBar("Wrong", wrongAnswers, totalQuestions, COLORS.wrong, MARGIN + 5, y);
      y = drawProgressBar("Skipped", skippedQuestions, totalQuestions, COLORS.skipped, MARGIN + 5, y);
      y += 5;

      // **Combined Analysis (Section + Subject)**
      if (safeData.sectionAnalysis.length > 0 || safeData.subjectAnalysis.length > 0) {
        doc.fillColor(COLORS.text).fontSize(9).text("Your Strengths", MARGIN, y);
        doc.moveTo(MARGIN, y + 10).lineTo(MARGIN + 90, y + 10).lineWidth(1).stroke(COLORS.headerGradientStart);
        y += 12;
        const analysis = safeData.sectionAnalysis[0] || safeData.subjectAnalysis[0] || {};
        doc.rect(MARGIN, y, CONTENT_WIDTH / 2 - 5, 30).fillAndStroke(COLORS.background, COLORS.border);
        doc.fillColor(COLORS.text).font("Helvetica-Bold").fontSize(8).text(analysis.name || "Key Area", MARGIN + 5, y + 5);
        const accuracy = analysis.accuracy || 0;
        doc.font("Helvetica").fontSize(6).text(`Accuracy: ${accuracy.toFixed(1)}%`, MARGIN + 5, y + 15);
        doc.fillColor(COLORS.background).rect(MARGIN + 5, y + 20, 100, 4).fill();
        doc.fillColor(COLORS.correct).rect(MARGIN + 5, y + 20, 100 * (accuracy / 100), 4).fill();
        y += 35;
      }

      // **Performance Insights**
      if (safeData.insights.length > 0) {
        doc.fillColor(COLORS.text).fontSize(9).text("Your Success Tip!", MARGIN, y);
        doc.moveTo(MARGIN, y + 10).lineTo(MARGIN + 90, y + 10).lineWidth(1).stroke(COLORS.headerGradientStart);
        y += 12;
        const insight = safeData.insights[0];
        doc.rect(MARGIN, y, CONTENT_WIDTH, 20).fillAndStroke(COLORS.insightsBackground, COLORS.insightsBorder);
        doc.moveTo(MARGIN, y).lineTo(MARGIN, y + 20).lineWidth(2).stroke(COLORS.insightHighlight);
        doc.fillColor(COLORS.text).font("Helvetica-Bold").fontSize(7).text(insight.title || "Pro Tip!", MARGIN + 5, y + 5);
        doc.font("Helvetica").fontSize(6).text(insight.description || "Boost your score with Test Exam Preparation!", MARGIN + 5, y + 12, { width: CONTENT_WIDTH - 10 });
        y += 25;
      }

      // **Footer with App CTA**
      const footerY = 790;
      drawGradientRect(MARGIN, footerY, CONTENT_WIDTH, 30, COLORS.appBadgeStart, COLORS.appBadgeEnd);
      doc.fillColor("white").font("Helvetica-Bold").fontSize(9).text("Unlock Your Topper Potential!", MARGIN, footerY + 5, { align: "center", width: CONTENT_WIDTH });
      doc.font("Helvetica").fontSize(7).text("Download Test Exam Preparation Now! 🚀 Free Tests, Tips & More! https://your-app-url.com", MARGIN, footerY + 15, { align: "center", width: CONTENT_WIDTH, link: "https://your-app-url.com", underline: true });
      doc.fillColor(COLORS.label).font("Helvetica").fontSize(6).text(`Generated: ${new Date().toLocaleDateString()}`, MARGIN, footerY - 10, { align: "center", width: CONTENT_WIDTH });

      doc.end();
    } catch (error) {
      console.error("Error generating PDF:", error);
      reject(new Error(`PDF generation failed: ${error.message}`));
    }
  });
};

exports.generateResultPDFAlternative = exports.generateResultPDF;