const Banner = require("../../models/Banner");
const Batch = require("../../models/Batch");
const UpcomingGovtExam = require("../../models/UpcomingGovtExam");

exports.dashboard = async (req, res) => {
    try {
        const { limit = 5, pageNo = 1 } = req.query;
    
        // Fetch banners
        const banners = await Banner.findOne({ isActive: true })
          .sort({ createdAt: -1 })
          .lean();
        const bannerImages = banners ? banners.images.filter(img => !img.deletedAt && img.isActive).sort((a, b) => a.order - b.order) : [];
    
        // Fetch top batches
        const batches = await Batch.find({ status: true, deletedAt: null })
          .sort({ sequence: 1, createdAt: -1 })
          .skip((pageNo - 1) * limit)
          .limit(limit)
          .lean();
    
        // Fetch upcoming govt exams
        const exams = await UpcomingGovtExam.find({ status: true, deletedAt: null })
          .sort({ examDate: 1 })
          .skip((pageNo - 1) * limit)
          .limit(limit)
          .lean();
    
        const response = {
          banners: bannerImages,
          batches,
          exams,
          timestamp: new Date()
        };
    
        res.success(response);
      } catch (error) {
        logger.error(`Dashboard fetch error: ${error.message}`);
        res.someThingWentWrong(error);
      }
}