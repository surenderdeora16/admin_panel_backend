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
                  "../../../public/uploads/banners",
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
      const { imageOrders, isActive } = req.body;
      const newImages = req.files || [];

      const banner = await Banner.findById(id);
      if (!banner) {
        return res.noRecords("Banner not found");
      }

      if (typeof isActive === "boolean") {
        banner.isActive = isActive;
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

      // Update image orders
      if (imageOrders?.length) {
        for (const { id: imageId, order } of imageOrders) {
          const image = banner.images.id(imageId);
          if (image && !image.deletedAt) {
            image.order = order;
          }
        }
      }

      // Sort images by order
      banner.images.sort((a, b) => a.order - b.order);
      await banner.save();

      return res.successUpdate(banner, "Banner updated successfully");
    } catch (error) {
      // Cleanup new uploaded files on error
      if (req.files) {
        await Promise.all(
          req.files.map((file) =>
            fs
              .unlink(
                path.join(
                  __dirname,
                  "../../../public/uploads/banners",
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
      fs.unlink(
        path.join(__dirname, "../../../public/uploads/banners", image.url)
      ).catch((err) => console.error("File deletion failed:", err));

      return res.successDelete(banner, "Image deleted successfully");
    } catch (error) {
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
        "images.deletedAt": null,
      };

      const [banners, totalCount] = await Promise.all([
        Banner.find(query)
          .populate("createdBy", "name email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
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
      return res.someThingWentWrong(error);
    }
  }

  // Get single banner
  //   async get(req, res) {
  //     try {
  //       const { id } = req.params;
  //       const banner = await Banner.findById(id)
  //         .populate("createdBy", "name email")
  //         .lean();

  //       if (!banner) {
  //         return res.noRecords("Banner not found");
  //       }

  //       banner.images = banner.images
  //         .filter((img) => !img.deletedAt && img.isActive)
  //         .sort((a, b) => a.order - b.order);

  //       return res.success(banner, "Banner fetched successfully");
  //     } catch (error) {
  //       return res.someThingWentWrong(error);
  //     }
  //   }
  async getSingleBannerWithImages(req, res) {
    try {
      const banner = await Banner.findOne({
        isActive: true,
        "images.deletedAt": null,
      })
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
      return res.someThingWentWrong(error);
    }
  }
}

module.exports = new BannerController();
