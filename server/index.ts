import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import analyzeRoutes from "./src/routes/analyze.route";

import errorMiddleware from "./src/middlewares/error.middleware";
import notFoundMiddleware from "./src/middlewares/notfound.middleware";

const app = express();

const corsOption = {
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOption));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use("/api/analyze", analyzeRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Not found middleware
app.use(notFoundMiddleware);

// Error middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received");

  server.close(() => {
    console.log("HTTP server closed");
  });
});