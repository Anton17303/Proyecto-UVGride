// backend/src/middleware/avatar.middleware.js
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { randomUUID } = require("crypto");

// Carpeta donde guardaremos los avatares
const AVATARS_DIR = path.join(process.cwd(), "uploads", "avatars");

// Asegura que exista la carpeta uploads/avatars
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
ensureDir(AVATARS_DIR);

// Configuración de almacenamiento en disco
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATARS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase(); // .jpg | .png | .webp
    cb(null, `${randomUUID()}${ext}`);
  },
});

// Filtrar tipos de archivo permitidos
function fileFilter(req, file, cb) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Tipo de archivo no permitido"), false);
  }
  cb(null, true);
}

// Límite de tamaño: 2MB
const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

module.exports = { uploadAvatar };
