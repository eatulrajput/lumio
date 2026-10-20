import multer from "multer";

const storage = multer.diskStorage({
  // cb ---> it is callback

  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    // For unique file naming
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    // cb(null, file.fieldname + '-' + uniqueSuffix)

    cb(null, file.originalname);
  },
});

export const upload = multer({
  storage,
});
