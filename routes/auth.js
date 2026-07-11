import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();

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
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, folderName: user.folderName || "" } });
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
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, folderName: user.folderName || "" } });
  } catch (err) { next(err); }
});

router.get("/me", async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "No token" });

    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password").lean();
    if (!user) return res.status(401).json({ error: "User not found" });

    res.json({ user: { id: user._id, name: user.name, email: user.email, folderName: user.folderName || "" } });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

router.put("/settings", async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "No token" });

    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    const update = {};
    if (req.body.folderName !== undefined) update.folderName = req.body.folderName;

    const user = await User.findByIdAndUpdate(decoded.id, update, { new: true }).select("-password").lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user: { id: user._id, name: user.name, email: user.email, folderName: user.folderName || "" } });
  } catch (err) { next(err); }
});

export default router;
