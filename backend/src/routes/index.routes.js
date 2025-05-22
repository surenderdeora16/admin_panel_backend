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

router.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

// License Check..
router.use(customMethods);
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
