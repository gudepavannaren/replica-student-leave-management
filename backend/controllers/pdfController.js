// backedn/controllers/pdfController.js
const path = require("path");
const fs = require("fs");

/**
 * Secure PDF download endpoint.
 * Prevents path traversal by resolving the requested filename and ensuring
 * the resolved path is inside the uploads directory.
 */
exports.downloadPDF = (req, res) => {
  try {
    const uploadsDir = path.resolve(__dirname, "../uploads");
    const requested = String(req.params.filename || "");
    // normalize removes things like ../ and ./ but may still be relative,
    // so we resolve and then ensure it's within uploadsDir
    const normalized = path.normalize(requested);
    const target = path.resolve(uploadsDir, normalized);

    // Prevent path traversal: ensure target starts with uploadsDir
    if (!target.startsWith(uploadsDir)) {
      return res.status(400).json({ message: "Invalid filename" });
    }

    if (!fs.existsSync(target)) {
      return res.status(404).json({ message: "File not found" });
    }

    return res.download(target);
  } catch (err) {
    console.error("PDF download error:", err);
    return res.status(500).json({ message: "Server error while downloading file" });
  }
};

// const path = require("path");

// exports.downloadPDF = (req, res) => {
//   const file = path.join(__dirname, '../uploads/', req.params.filename);
//   res.download(file);
// };