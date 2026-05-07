// routes/chat.js
import express from "express";
import multer from "multer";
import cors from "cors";
import { sendToOpenAI } from "../utils/client.js";
import docParser from "../utils/upload/docParser.js";
import { docAnalyzer } from "../utils/query/docAnalyzer.js";
import { sectionizer } from "../utils/sectionize/sectionizer.js";
import submit from "../utils/soa/submit.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(pdf|docx)$/)) {
      //this checks that the file extention is .jpg, .jpeg or .png
      return cb(new Error("Please upload a .pdf or .docx file!"));
    }

    cb(undefined, true);
  },
});

router.post("/api/chat", async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await sendToOpenAI(prompt);
    return res.status(200).json({ response });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "LLM call failed", details: err.message });
  }
});

router.options("/doc/upload", cors());

router.post(
  "/doc/upload",
  upload.single("document"),
  async (req, res) => {
    // upload document
    return docParser(req, res);
  },
  (error, req, res, next) => {
    //this routes my errors to the user when they happen rather then the html error that was
    return res.status(400).send({ error: error.message });
  },
);

router.post("/doc/sectionize/:docId", async (req, res) => {
  return sectionizer(req, res);
});

router.post("/doc/analyze/", async (req, res) => {
  return docAnalyzer(req, res);
});

router.post("/soa/submit", async (req, res) => {
  return submit(req, res);
});

export default router;
