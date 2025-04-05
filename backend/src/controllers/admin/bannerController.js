const Banner = require("../../models/Banner");
const fs = require("fs").promises;
const path = require("path");
const { validationResult } = require("express-validator");

class BannerController {
  async create(req, res) {
    try {
      console.log("Files received:", req.files);
      console.log("Body received:", req.body);

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          status: false,
          message: "At least one image is required",
          data: [],
        });
      }

      // Create directory if it doesn't exist
      const uploadDir = path.join(
        __dirname,
        "../../../public/uploads/main_banner"
      );
      await fs.mkdir(uploadDir, { recursive: true });

      const images = req.files.map((file, index) => ({
        url: file.filename,
        order: index,
        isActive: true,
        deletedAt: null,
      }));

      const banner = new Banner({
        images,
        createdBy: req.admin._id,
      });

      await banner.save();

      return res.successInsert(banner, "Banner created successfully");
    } catch (error) {
      if (req.files) {
        await Promise.all(
          req.files.map((file) =>
            fs
              .unlink(
                path.join(
                  __dirname,
                  "../../../public/uploads/main_banner",
                  file.filename
                )
              )
              .catch(() => {})
          )
        );
      }
      return res.someThingWentWrong(error);
    }
  }

  // Update banner (images, order, status)
  async update(req, res) {
    try {
      const { id } = req.params;
      let { imageOrders, isActive, orderUpdateOnly } = req.body;
      const newImages = req.files || [];

      console.log("Files received:", req.files);
      console.log("Body received:", req.body);

      const banner = await Banner.findById(id);
      if (!banner) {
        return res.noRecords("Banner not found");
      }
      // Skip image validation if we're only updating order
      const isOrderUpdateOnly = orderUpdateOnly === "true";

      // Only validate images if we're not doing an order-only update
      if (!isOrderUpdateOnly && !newImages.length && banner.images.filter(img => !img.deletedAt && img.isActive).length === 0) {
        return res.status(400).json({
          status: false,
          message: "Invalid Input Provided..!!",
          data: {
            images: "At least one image is required"
          }
        });
      }

     if (typeof isActive === "boolean" || isActive === "true" || isActive === "false") {
        banner.isActive = isActive === "true" ? true : isActive === "false" ? false : isActive;
      }

      // Create directory if it doesn't exist
      if (newImages.length) {
        const uploadDir = path.join(
          __dirname,
          "../../../public/uploads/main_banner"
        );
        await fs.mkdir(uploadDir, { recursive: true });
      }

      if (newImages.length) {
        const newImageDocs = newImages.map((file, index) => ({
          url: file.filename,
          order: banner.images.length + index,
          isActive: true,
          deletedAt: null,
        }));
        banner.images.push(...newImageDocs);
      }

      // Parse imageOrders if it's a string
      if (typeof imageOrders === "string") {
        try {
          imageOrders = JSON.parse(imageOrders);
        } catch (e) {
          console.error("Error parsing imageOrders:", e);
          imageOrders = [];
        }
      }

      // Update image orders
      if (Array.isArray(imageOrders) && imageOrders.length > 0) {
        for (const orderItem of imageOrders) {
          if (
            orderItem &&
            orderItem.id &&
            typeof orderItem.order === "number"
          ) {
            const image = banner.images.id(orderItem.id);
            if (image && !image.deletedAt) {
              image.order = orderItem.order;
            }
          }
        }
      }

      // Sort images by order
      banner.images.sort((a, b) => a.order - b.order);
      await banner.save();

      return res.successUpdate(banner, "Banner updated successfully");
    } catch (error) {
      console.error("Banner update error:", error);
      // Cleanup new uploaded files on error
      if (req.files) {
        await Promise.all(
          req.files.map((file) =>
            fs
              .unlink(
                path.join(
                  __dirname,
                  "../../../public/uploads/main_banner",
                  file.filename
                )
              )
              .catch(() => {})
          )
        );
      }
      return res.someThingWentWrong(error);
    }
  }

  // Update a single image in a banner
  async updateSingleImage(req, res) {
    try {
      const { id } = req.params;
      const { imageId } = req.body;

      if (!req.file) {
        return res.status(400).json({
          status: false,
          message: "No image file provided",
          data: [],
        });
      }

      const banner = await Banner.findById(id);
      if (!banner) {
        return res.noRecords("Banner not found");
      }

      const image = banner.images.id(imageId);
      if (!image || image.deletedAt) {
        return res.noRecords("Image not found or already deleted");
      }

      // Create directory if it doesn't exist
      const uploadDir = path.join(
        __dirname,
        "../../../public/uploads/main_banner"
      );
      await fs.mkdir(uploadDir, { recursive: true });

      // Delete old image file if it exists
      try {
        await fs.unlink(path.join(uploadDir, image.url));
      } catch (err) {
        console.error("Error deleting old image:", err);
        // Continue even if old file deletion fails
      }

      // Update image with new file
      image.url = req.file.filename;
      await banner.save();

      return res.successUpdate(banner, "Image updated successfully");
    } catch (error) {
      console.error("Image update error:", error);
      // Cleanup new uploaded file on error
      if (req.file) {
        fs.unlink(
          path.join(
            __dirname,
            "../../../public/uploads/main_banner",
            req.file.filename
          )
        ).catch((err) => console.error("File cleanup error:", err));
      }
      return res.someThingWentWrong(error);
    }
  }

  async deleteImage(req, res) {
    try {
      const { bannerId, imageId } = req.params;

      const banner = await Banner.findById(bannerId);
      if (!banner) {
        return res.noRecords("Banner not found");
      }

      const image = banner.images.id(imageId);
      if (!image || image.deletedAt) {
        return res.noRecords("Image not found or already deleted");
      }

      image.isActive = false;
      image.deletedAt = new Date();
      await banner.save();

      // Async file deletion
      const filePath = path.join(
        __dirname,
        "../../../public/uploads/main_banner",
        image.url
      );
      fs.access(filePath)
        .then(() => fs.unlink(filePath))
        .catch((err) => console.error("File deletion failed:", err));

      return res.successDelete(banner, "Image deleted successfully");
    } catch (error) {
      console.error("Image deletion error:", error);
      return res.someThingWentWrong(error);
    }
  }

  // List banners with active images only
  async list(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const query = {
        isActive: true,
      };

      const [banners, totalCount] = await Promise.all([
        Banner.find(query)
          .populate("createdBy", "name email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number.parseInt(limit))
          .lean(),
        Banner.countDocuments(query),
      ]);

      // Filter and sort images in memory
      const processedBanners = banners.map((banner) => ({
        ...banner,
        images: banner.images
          .filter((img) => !img.deletedAt && img.isActive)
          .sort((a, b) => a.order - b.order),
      }));

      return res.pagination(processedBanners, totalCount, limit, Number(page));
    } catch (error) {
      console.error("Banner list error:", error);
      return res.someThingWentWrong(error);
    }
  }

  // Get single banner with latest record
  async getSingleBannerWithImages(req, res) {
    try {
      const banner = await Banner.findOne({
        isActive: true,
      })
        .sort({ createdAt: -1 })
        .populate("createdBy", "name email")
        .lean();

      if (!banner) {
        return res.noRecords("Banner not found");
      }

      banner.images = banner.images
        .filter((img) => !img.deletedAt && img.isActive)
        .sort((a, b) => a.order - b.order);

      return res.success(banner, "Banner with images fetched successfully");
    } catch (error) {
      console.error("Banner fetch error:", error);
      return res.someThingWentWrong(error);
    }
  }
}

module.exports = new BannerController();
