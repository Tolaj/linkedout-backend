import "dotenv/config";

if (!process.env.VERCEL) {
  if (!process.env.JWT_SECRET) {
    console.error("FATAL: JWT_SECRET is not set");
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error("FATAL: MONGODB_URI is not set");
    process.exit(1);
  }
}

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";

import auth from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import gmailRoutes from "./routes/gmail.js";
import crud from "./routes/crud.js";
import Application from "./models/Application.js";
import Email from "./models/Email.js";
import EmailTemplate from "./models/EmailTemplate.js";
import Resume from "./models/Resume.js";
import Note from "./models/Note.js";
import Contact from "./models/Contact.js";
import ProfileField from "./models/ProfileField.js";
import ProcessedEmail from "./models/ProcessedEmail.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.set("trust proxy", 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());

const allowedOrigins = (process.env.FRONTEND_URL || "").split(",").map(u => u.trim()).filter(Boolean);
const allowedExtensionId = process.env.CHROME_EXTENSION_ID || "";

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedExtensionId && origin === `chrome-extension://${allowedExtensionId}`) {
      return callback(null, true);
    }
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

// DB connection middleware (runs before all routes on Vercel)
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
  console.log("Connected to MongoDB");
}

mongoose.connection.on("disconnected", () => { isConnected = false; });

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
app.use("/api/gmail", gmailRoutes);

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
app.use("/api/contacts", auth, crud(Contact));
app.use("/api/profilefields", auth, crud(ProfileField, { syncKeys: ["fieldKey"] }));
app.use("/api/processedemails", auth, crud(ProcessedEmail, { syncKeys: ["gmailId"] }));

// 404 handler
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack || err.message);
  if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
  if (err.code === 11000) return res.status(409).json({ error: "Duplicate entry" });
  if (err.name === "CastError") return res.status(400).json({ error: "Invalid ID format" });
  const msg = process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
  res.status(500).json({ error: msg });
});

if (!process.env.VERCEL) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      isConnected = true;
      console.log("Connected to MongoDB");
      const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

      function shutdown() {
        console.log("Shutting down gracefully...");
        server.close(() => {
          mongoose.connection.close(false).then(() => {
            console.log("Closed MongoDB connection");
            process.exit(0);
          });
        });
        setTimeout(() => process.exit(1), 10000);
      }
      process.on("SIGTERM", shutdown);
      process.on("SIGINT", shutdown);
    })
    .catch((err) => {
      console.error("MongoDB connection failed:", err.message);
      process.exit(1);
    });
}

export default app;
