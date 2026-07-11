import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import auth from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import crud from "./routes/crud.js";
import Application from "./models/Application.js";
import Email from "./models/Email.js";
import EmailTemplate from "./models/EmailTemplate.js";
import Resume from "./models/Resume.js";
import Note from "./models/Note.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json({ limit: "10mb" }));

// DB connection middleware (runs before all routes on Vercel)
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
  console.log("Connected to MongoDB");
}

app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Public routes
app.use("/api/auth", authRoutes);

app.get("/api/health", async (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  res.json({ status: "ok", db: states[dbState] || "unknown" });
});

// Protected routes — require JWT
app.use("/api/applications", auth, crud(Application));
app.use("/api/emails", auth, crud(Email));
app.use("/api/templates", auth, crud(EmailTemplate));
app.use("/api/resumes", auth, crud(Resume));
app.use("/api/notes", auth, crud(Note));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

if (!process.env.VERCEL) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("Connected to MongoDB");
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error("MongoDB connection failed:", err.message);
      process.exit(1);
    });
}

export default app;
