exports.uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    return res.status(201).json({
      message: "Image uploaded successfully",
      imageUrl,
      file: {
        filename: req.file.filename,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: `Error: ${error.message}` });
  }
};
