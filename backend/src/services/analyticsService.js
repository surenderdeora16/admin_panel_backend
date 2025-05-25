// /**
//  * Calculate percentile rank
//  */
// exports.calculatePercentile = (userScore, allScores) => {
//   try {
//     if (!Array.isArray(allScores) || allScores.length === 0) return 0

//     const validScores = allScores.filter((score) => typeof score === "number" && !isNaN(score))
//     if (validScores.length === 0) return 0

//     const sortedScores = validScores.sort((a, b) => a - b)
//     const belowCount = sortedScores.filter((score) => score < userScore).length

//     return (belowCount / validScores.length) * 100
//   } catch (error) {
//     console.error("Error calculating percentile:", error)
//     return 0
//   }
// }

// /**
//  * Generate performance insights based on exam data
//  */
// exports.getPerformanceInsights = (exam, sectionAnalysis, subjectAnalysis) => {
//   try {
//     const insights = []

//     // Validate input data
//     if (!exam || typeof exam !== "object") {
//       return [
//         {
//           title: "Performance Analysis",
//           description: "Your performance data has been recorded successfully.",
//         },
//       ]
//     }

//     const percentage = exam.percentage || 0
//     const totalQuestions = exam.totalQuestions || 0
//     const attemptedQuestions = exam.attemptedQuestions || 0
//     const correctAnswers = exam.correctAnswers || 0

//     // Overall performance insight
//     if (percentage >= 80) {
//       insights.push({
//         title: "🌟 Excellent Performance",
//         description: "Outstanding! You've scored above 80%. Keep up the excellent work!",
//       })
//     } else if (percentage >= 60) {
//       insights.push({
//         title: "👍 Good Performance",
//         description: "Good job! You're performing well. Focus on weak areas to improve further.",
//       })
//     } else if (percentage >= 40) {
//       insights.push({
//         title: "📈 Room for Improvement",
//         description: "You're on the right track. More practice in weak subjects will help you improve.",
//       })
//     } else {
//       insights.push({
//         title: "💪 Need More Practice",
//         description: "Don't worry! With consistent practice and focus, you can significantly improve your scores.",
//       })
//     }

//     // Time management insight
//     if (exam.totalTimeSpent && totalQuestions > 0) {
//       const avgTimePerQuestion = exam.totalTimeSpent / totalQuestions
//       if (avgTimePerQuestion > 120) {
//         // More than 2 minutes per question
//         insights.push({
//           title: "⏰ Time Management",
//           description: "You're spending too much time per question. Practice time-bound tests to improve speed.",
//         })
//       } else if (avgTimePerQuestion < 30) {
//         // Less than 30 seconds per question
//         insights.push({
//           title: "🚀 Quick Solver",
//           description:
//             "You're solving questions quickly! Make sure to read questions carefully to avoid silly mistakes.",
//         })
//       }
//     }

//     // Accuracy insight
//     const accuracy = attemptedQuestions > 0 ? (correctAnswers / attemptedQuestions) * 100 : 0
//     if (accuracy >= 85) {
//       insights.push({
//         title: "🎯 High Accuracy",
//         description: "Excellent accuracy! Your concept clarity is strong. Try to attempt more questions.",
//       })
//     } else if (accuracy < 60) {
//       insights.push({
//         title: "📚 Focus on Concepts",
//         description: "Work on strengthening your fundamentals. Quality practice is more important than quantity.",
//       })
//     }

//     // Section-wise insights
//     if (Array.isArray(sectionAnalysis) && sectionAnalysis.length > 0) {
//       const validSections = sectionAnalysis.filter((section) => section && typeof section === "object")

//       if (validSections.length > 0) {
//         const weakestSection = validSections.reduce((min, section) =>
//           (section.accuracy || 0) < (min.accuracy || 0) ? section : min,
//         )

//         const strongestSection = validSections.reduce((max, section) =>
//           (section.accuracy || 0) > (max.accuracy || 0) ? section : max,
//         )

//         if ((weakestSection.accuracy || 0) < 50) {
//           insights.push({
//             title: `📉 Weak Area: ${weakestSection.name || "Unknown Section"}`,
//             description: `Focus more on ${weakestSection.name || "this section"}. Your accuracy is ${weakestSection.accuracy || 0}% in this section.`,
//           })
//         }

//         if ((strongestSection.accuracy || 0) > 80) {
//           insights.push({
//             title: `💪 Strong Area: ${strongestSection.name || "Unknown Section"}`,
//             description: `Great performance in ${strongestSection.name || "this section"}! Your accuracy is ${strongestSection.accuracy || 0}%.`,
//           })
//         }
//       }
//     }

//     // Attempt strategy insight
//     const attemptPercentage = totalQuestions > 0 ? (attemptedQuestions / totalQuestions) * 100 : 0
//     if (attemptPercentage < 70) {
//       insights.push({
//         title: "📊 Attempt More Questions",
//         description: `You attempted only ${attemptPercentage.toFixed(1)}% of questions. Try to attempt more questions to maximize your score.`,
//       })
//     }

//     // Subject-wise insights
//     if (Array.isArray(subjectAnalysis) && subjectAnalysis.length > 0) {
//       const weakSubjects = subjectAnalysis.filter(
//         (subject) => subject && typeof subject === "object" && (subject.accuracy || 0) < 50,
//       )

//       if (weakSubjects.length > 0) {
//         const subjectNames = weakSubjects
//           .map((s) => s.name || "Unknown Subject")
//           .filter((name) => name !== "Unknown Subject")
//           .join(", ")

//         if (subjectNames) {
//           insights.push({
//             title: "📖 Subjects to Focus",
//             description: `Pay special attention to: ${subjectNames}. These subjects need more practice.`,
//           })
//         }
//       }
//     }

//     return insights.length > 0
//       ? insights
//       : [
//           {
//             title: "Performance Analysis",
//             description: "Your performance data has been recorded successfully.",
//           },
//         ]
//   } catch (error) {
//     console.error("Error generating insights:", error)
//     return [
//       {
//         title: "Performance Analysis",
//         description: "Your performance data has been recorded successfully.",
//       },
//     ]
//   }
// }

// /**
//  * Generate comparison data with previous attempts
//  */
// exports.getProgressComparison = async (userId, testSeriesId) => {
//   try {
//     const Exam = require("../models/Exam")

//     // Validate input
//     if (!userId || !testSeriesId) {
//       return null
//     }

//     const previousExams = await Exam.find({
//       userId,
//       testSeriesId,
//       status: "COMPLETED",
//     })
//       .sort({ createdAt: -1 })
//       .limit(5)

//     if (!previousExams || previousExams.length < 2) {
//       return null
//     }

//     const latest = previousExams[0]
//     const previous = previousExams[1]

//     // Validate exam data
//     if (!latest || !previous) {
//       return null
//     }

//     return {
//       scoreImprovement: (latest.totalScore || 0) - (previous.totalScore || 0),
//       percentageImprovement: (latest.percentage || 0) - (previous.percentage || 0),
//       accuracyImprovement:
//         ((latest.correctAnswers || 0) / (latest.attemptedQuestions || 1)) * 100 -
//         ((previous.correctAnswers || 0) / (previous.attemptedQuestions || 1)) * 100,
//       timeImprovement: (previous.totalTimeSpent || 0) - (latest.totalTimeSpent || 0),
//       rankImprovement: (previous.rank || 0) - (latest.rank || 0),
//     }
//   } catch (error) {
//     console.error("Error getting progress comparison:", error)
//     return null
//   }
// }



/**
 * Calculate percentile for a given score
 */
exports.calculatePercentile = (userScore, allScores) => {
  try {
    if (!Array.isArray(allScores) || allScores.length === 0) {
      return 0
    }

    const sortedScores = allScores.sort((a, b) => a - b)
    const userPosition = sortedScores.filter((score) => score < userScore).length
    const percentile = (userPosition / sortedScores.length) * 100

    return Math.round(percentile * 100) / 100 // Round to 2 decimal places
  } catch (error) {
    console.error("Error calculating percentile:", error)
    return 0
  }
}

/**
 * Generate performance insights based on exam data
 */
exports.getPerformanceInsights = (exam, sectionAnalysis, subjectAnalysis) => {
  try {
    const insights = []

    // Overall performance insight
    const percentage = exam.percentage || 0
    if (percentage >= 90) {
      insights.push({
        title: "Excellent Performance",
        description: "Outstanding performance! You have demonstrated exceptional understanding across all topics.",
      })
    } else if (percentage >= 75) {
      insights.push({
        title: "Good Performance",
        description:
          "Great job! Your performance shows strong conceptual understanding with room for minor improvements.",
      })
    } else if (percentage >= 60) {
      insights.push({
        title: "Average Performance",
        description:
          "Decent performance with significant scope for improvement. Focus on weak areas for better results.",
      })
    } else {
      insights.push({
        title: "Needs Improvement",
        description:
          "Your performance indicates need for more practice and conceptual clarity. Don't lose hope, consistent effort will help.",
      })
    }

    // Time management insight
    const attemptedQuestions = exam.attemptedQuestions || 0
    const totalQuestions = exam.totalQuestions || 0
    const attemptedPercentage = totalQuestions > 0 ? (attemptedQuestions / totalQuestions) * 100 : 0

    if (attemptedPercentage < 80) {
      insights.push({
        title: "Time Management",
        description:
          "You attempted only " +
          attemptedPercentage.toFixed(1) +
          "% of questions. Work on improving your speed and time management.",
      })
    } else if (attemptedPercentage >= 95) {
      insights.push({
        title: "Excellent Time Management",
        description: "Great time management! You attempted most questions, showing good exam strategy.",
      })
    }

    // Accuracy insight
    const accuracy = attemptedQuestions > 0 ? ((exam.correctAnswers || 0) / attemptedQuestions) * 100 : 0
    if (accuracy >= 90) {
      insights.push({
        title: "High Accuracy",
        description:
          "Excellent accuracy rate of " + accuracy.toFixed(1) + "%. Your conceptual understanding is very strong.",
      })
    } else if (accuracy < 60) {
      insights.push({
        title: "Improve Accuracy",
        description:
          "Your accuracy is " +
          accuracy.toFixed(1) +
          "%. Focus on understanding concepts rather than attempting more questions.",
      })
    }

    // Section-wise insights
    if (Array.isArray(sectionAnalysis) && sectionAnalysis.length > 0) {
      const weakestSection = sectionAnalysis.reduce((prev, current) =>
        prev.accuracy < current.accuracy ? prev : current,
      )

      const strongestSection = sectionAnalysis.reduce((prev, current) =>
        prev.accuracy > current.accuracy ? prev : current,
      )

      if (weakestSection.accuracy < 50) {
        insights.push({
          title: "Focus Area",
          description: `${weakestSection.name} needs attention with ${weakestSection.accuracy}% accuracy. Dedicate more time to this section.`,
        })
      }

      if (strongestSection.accuracy > 80) {
        insights.push({
          title: "Strength Area",
          description: `Excellent performance in ${strongestSection.name} with ${strongestSection.accuracy}% accuracy. Keep it up!`,
        })
      }
    }

    // Subject-wise insights
    if (Array.isArray(subjectAnalysis) && subjectAnalysis.length > 0) {
      const weakSubjects = subjectAnalysis.filter((subject) => subject.accuracy < 60)
      if (weakSubjects.length > 0) {
        insights.push({
          title: "Subject Focus",
          description: `Focus on: ${weakSubjects.map((s) => s.name).join(", ")}. These subjects need more practice and revision.`,
        })
      }
    }

    return insights.length > 0
      ? insights
      : [
          {
            title: "Performance Analysis",
            description: "Your performance data has been recorded. Keep practicing for better results!",
          },
        ]
  } catch (error) {
    console.error("Error generating insights:", error)
    return [
      {
        title: "Performance Analysis",
        description: "Your performance data has been recorded successfully.",
      },
    ]
  }
}
