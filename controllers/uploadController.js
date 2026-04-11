const cloudinary = require("../config/cloudinary");

const toDataUri = (file) => {
  const encoded = file.buffer.toString("base64");
  return `data:${file.mimetype};base64,${encoded}`;
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const dataUri = toDataUri(req.file);
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: process.env.CLOUDINARY_FOLDER || "blog_platform",
      resource_type: "image",
    });

    return res.status(201).json({
      message: "Image uploaded successfully",
      imageUrl: result.secure_url,
      publicId: result.public_id,
      file: {
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: `Error: ${error.message}` });
  }
};
