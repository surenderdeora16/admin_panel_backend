const {
  licenseCheck,
  errorHandler,
  customMethods,
  showValidationErrors,
} = require("../middelwares");
const checkValid = require("../middelwares/validator");
const generalSettingsController = require("../controllers/admin/generalSettingsController");
const express = require("express");
const { checkAndSubmitExpiredExams } = require("../utils/scheduledTasks");
const router = express.Router();
const dynamicContentController = require("../controllers/user/dynamicContentController")
const Storage = require("../helpers/Storage");
const uploadEditor = new Storage.uploadTo({ dir: "editor", isImage: true });

router.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

// License Check..
router.use(customMethods);

// router.post('/uploads/editor', uploadEditor.single('file'), (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ success: false, message: 'No file uploaded' });
//     }
//     if (req.fileValidationError) {
//       return res.status(400).json({ success: false, message: req.fileValidationError.file });
//     }
//     const fileUrl = `${process.env.BASEURL || 'http://localhost:3000'}/uploads/editor/${req.file.filename}`;
//     res.json({
//       success: true,
//       data: {
//         files: [fileUrl],
//         baseurl: `${process.env.BASEURL || 'http://localhost:3000'}/uploads/editor/`
//       }
//     });
//   } catch (error) {
//     console.error('Editor upload error:', error);
//     res.status(500).json({ success: false, message: 'Upload failed: ' + error.message });
//   }
// });


router.post("/upload-editor-image", uploadEditor.single('file'),function (req, res) {
  console.log("editorimage",);
  if (!req.file) {
    return res.status(400).json({ error: true, msg: "No file uploaded" });
  }

  const fileUrl = process.env.BASEURL +"/uploads/editor/"+  req.file.filename;

  return res.status(200).json({
    error: false,
    msg: "Image uploaded successfully",
    data: fileUrl
  });
});

router.use(licenseCheck);


router.get("/policy/:type", dynamicContentController.getDynamicContentByType)


// Admin Routes
router.get("/settings/:type", generalSettingsController.getGeneralSetting);

router.post("/cron/auto-submit-exams", (req, res) => {
  //   if (req.query.secret !== process.env.CRON_SECRET) {
  //     return res.status(403).json({ status: false, message: "Unauthorized" });
  //   }
  checkAndSubmitExpiredExams()
    .then(() =>
      res.json({ status: true, message: "Exam auto-submit completed" })
    )
    .catch((error) =>
      res.status(500).json({ status: false, message: error.message })
    );
});

router.use("/user/", require("./user/index.routes"));
router.use("/admin/", require("./admin/index.routes"));

// Application Error handler
router.use(errorHandler);

// 404 API not found
router.all("*", function (req, res) {
  res.status(404).send({ status: 404, message: "API not found", data: [] });
});

module.exports = router;
