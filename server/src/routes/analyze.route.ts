import express from "express";

import {
  analyzeFrontend,
  analyzeBackend,
} from "../controllers/analyze.controller";

const router = express.Router();

router.post("/frontend", analyzeFrontend);

router.post("/backend", analyzeBackend);

export default router;