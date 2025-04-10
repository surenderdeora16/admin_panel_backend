const router = require("express").Router();
const { showValidationErrors, authCheckAdmin } = require("../../middelwares");
const authController = require("../../controllers/admin/authController");
const generalSettingsController = require("../../controllers/admin/generalSettingsController");
const discountCouponController = require("../../controllers/admin/discountCouponController");
const usersController = require("../../controllers/admin/usersController");
const CommonController = require("../../controllers/admin/CommonController");
const locationController = require("../../controllers/locationController");
const UpcomingGovtExam = require("../../controllers/admin/UpcomingGovtExam");
const subjectController = require("../../controllers/admin/subjectController")
const chapterController = require("../../controllers/admin/chapterController")
const topicController = require("../../controllers/admin/topicController")
const questionController = require("../../controllers/admin/questionController")

const checkValid = require("../../middelwares/validator");
const Storage = require("../../helpers/Storage");
const bannerController = require("../../controllers/admin/bannerController");
const upload = new Storage.uploadTo({ dir: "admins", isImage: true });
const uploadSettings = new Storage.uploadTo({ dir: "settings", isImage: true });
const retreatSettings = new Storage.uploadTo({ dir: "retreat" });
const uploadBanner = new Storage.uploadTo({
  dir: "main_banner",
  isImage: true,
  fileSize: 10,
});
const uploadUpcomingGovtExamImage = new Storage.uploadTo({
  dir: "upcoming_govt_exam",
  isImage: true,
  // fileSize: 10,
});



//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Configure multer for file uploads
const multer = require("multer")
const path = require("path")
const crypto = require("crypto")

const storageQues = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../../temp")
    // Create directory if it doesn't exist
    require("fs").mkdirSync(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString("hex")
    cb(null, `${Date.now()}-${uniqueSuffix}${path.extname(file.originalname)}`)
  },
})

const uploadQues = multer({
  storage: storageQues,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only excel files
    const filetypes = /xlsx|xls/
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = filetypes.test(file.mimetype)

    if (extname && mimetype) {
      return cb(null, true)
    } else {
      cb(new Error("Only Excel files (.xlsx, .xls) are allowed"))
    }
  },
})


// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


// User Auth
router.post(
  "/login",
  checkValid("login"),
  showValidationErrors,
  authController.login
);
router.post(
  "/send-otp",
  checkValid("sendOtp"),
  showValidationErrors,
  authController.sendotp
);
router.post(
  "/login-otp",
  checkValid("loginWithOtp"),
  showValidationErrors,
  authController.loginWithOtp
);
router.post(
  "/reset-password",
  checkValid("resetPassword"),
  showValidationErrors,
  authController.resetPassword
);

// Protected Routes..
router.use(authCheckAdmin);

// Admin Protected Routes
router.get("/logout", authController.logout);
router.post(
  "/change-password",
  checkValid("changePassword"),
  showValidationErrors,
  authController.changePassword
);
router.get("/profile", authController.getProfile);
router.post(
  "/update-profile",
  upload.single("image"),
  checkValid("updateProfile"),
  showValidationErrors,
  authController.updateProfile
);
router.post(
  "/change-profile-image",
  upload.single("image"),
  authController.changeProfileImage
);

router.delete(
  "/toggle-status/:table/:id",
  generalSettingsController.toggleStatus
);
router.delete(
  "/delete-record/:table/:id",
  generalSettingsController.commonDelete
);

router.get(
  "/settings-list/:type",
  generalSettingsController.listGeneralSetting
);
router.put(
  "/update-settings",
  uploadSettings.fields([
    { name: "favicon", maxCount: 1 },
    { name: "logo", maxCount: 1 },
    { name: "footer_logo", maxCount: 1 },
  ]),
  generalSettingsController.updateGeneralSetting
);

router.post(
  "/discount-coupon",
  checkValid("discountCouponAdd"),
  showValidationErrors,
  discountCouponController.create
);
router.put(
  "/discount-coupon",
  checkValid("discountCouponEdit"),
  showValidationErrors,
  discountCouponController.update
);
router.get("/discount-coupons-datatable", discountCouponController.list);

// Location Routes
router.get("/states-datatable", locationController.state_json_list);
router.get("/district-datatable", locationController.district_json_list);
router.post(
  "/states",
  checkValid("addState"),
  showValidationErrors,
  locationController.addState
);
router.post(
  "/districts",
  checkValid("addDistrict"),
  showValidationErrors,
  locationController.addDistrict
);
router.put(
  "/states/:id",
  checkValid("editState"),
  showValidationErrors,
  locationController.editState
);
router.put(
  "/districts/:id",
  checkValid("editDistrict"),
  showValidationErrors,
  locationController.editDistrict
);

// Banner Routes ......................................................
router.post(
  "/banner-create",
  uploadBanner.array("images", 10),
  showValidationErrors,
  bannerController.create
);
router.put(
  "/banner-update/:id",
  uploadBanner.array("images", 10),
  checkValid("updateBanner"),
  showValidationErrors,
  bannerController.update
);
router.put(
  "/update-single-image/:id",
  uploadBanner.single("image"),
  bannerController.updateSingleImage
);
router.delete(
  "/banner-delete-image/:bannerId/:imageId",
  bannerController.deleteImage
);
router.get("/banner-list", bannerController.list);
router.get(
  "/getSingleBannerWithImages",
  bannerController.getSingleBannerWithImages
);
// router.get("/:id", bannerController.get);

// Upcomg Govt Exam Routes ............................................
router.post(
  "/create-upcoming-govt-exam",
  uploadUpcomingGovtExamImage.single("image"),
  checkValid("addUpcomingGovtExam"),
  showValidationErrors,
  UpcomingGovtExam.create
);
router.put(
  "/update-upcoming-govt-exam/:id",
  uploadUpcomingGovtExamImage.single("image"),
  checkValid("updateUpcomingGovtExam"),
  showValidationErrors,
  UpcomingGovtExam.update
);
router.get("/list-upcoming-govt-exam", UpcomingGovtExam.list);



// Exam Library Routes ....................................................................................................
// Subject Routes
router.get("/subjects", subjectController.getSubjects)
router.get("/subjects/:id", subjectController.getSubjectById)
router.post("/subjects", checkValid("createSubject"), showValidationErrors, subjectController.createSubject)
router.put("/subjects/:id", checkValid("updateSubject"), showValidationErrors, subjectController.updateSubject)
router.delete("/subjects/:id", subjectController.deleteSubject)

// Chapter Routes
router.get("/chapters", chapterController.getChapters)
router.get("/chapters/:id", chapterController.getChapterById)
router.post("/chapters", checkValid("createChapter"), showValidationErrors, chapterController.createChapter)
router.put("/chapters/:id", checkValid("updateChapter"), showValidationErrors, chapterController.updateChapter)
router.delete("/chapters/:id", chapterController.deleteChapter)

// Topic Routes
router.get("/topics", topicController.getTopics)
router.get("/topics/:id", topicController.getTopicById)
router.post("/topics", checkValid("createTopic"), showValidationErrors, topicController.createTopic)
router.put("/topics/:id", checkValid("updateTopic"), showValidationErrors, topicController.updateTopic)
router.delete("/topics/:id", topicController.deleteTopic)

// Question Routes
router.get("/questions", questionController.getQuestions)
router.get("/questions/:id", questionController.getQuestionById)
router.post("/questions", checkValid("createQuestion"), showValidationErrors, questionController.createQuestion)
router.put("/questions/:id", checkValid("updateQuestion"), showValidationErrors, questionController.updateQuestion)
router.delete("/questions/:id", questionController.deleteQuestion)
router.post("/questions/bulk-delete", questionController.bulkDeleteQuestions)

// Import/Export Routes
router.post("/questions/import", uploadQues.single("file"), questionController.importQuestions)
router.get("/questions/template/download", questionController.downloadTemplate)



//-------------------------
router.get("/users-datatable", usersController.list);
router.get("/contact-us-datatable", CommonController.contactUsList);

router.all("/admin/*", function (req, res) {
  res.status(404).send({
    status: 404,
    message: "API not found",
    data: [],
  });
});

module.exports = router;
