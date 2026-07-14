import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = Router();

function userPayload(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    folderName: user.folderName || "",
    folders: user.folders || [],
    googleClientId: user.googleClientId || "",
    googleClientSecret: user.googleClientSecret || "",
    gmailConnected: user.gmailConnected || false,
    llmApiKey: user.llmApiKey || "",
    llmProvider: user.llmProvider || "cerebras",
    llmEnabled: !!user.llmEnabled,
  };
}

function signToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user);
    res.status(201).json({ token, user: userPayload(user) });
  } catch (err) { next(err); }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user);
    res.json({ token, user: userPayload(user) });
  } catch (err) { next(err); }
});

router.get("/me", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("-password").lean();
    if (!user) return res.status(401).json({ error: "User not found" });
    res.json({ user: userPayload(user) });
  } catch (err) { next(err); }
});

router.put("/settings", auth, async (req, res, next) => {
  try {
    const allowed = ["folderName", "folders", "googleClientId", "googleClientSecret", "llmApiKey", "llmProvider", "llmEnabled"];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true }).select("-password").lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: userPayload(user) });
  } catch (err) { next(err); }
});

export default router;
