import { Router } from "express";

const FORBIDDEN_KEYS = ["_id", "__v", "userId", "createdAt", "updatedAt"];

function sanitizeBody(body) {
  if (!body || typeof body !== "object") return {};
  const clean = { ...body };
  for (const key of FORBIDDEN_KEYS) delete clean[key];
  for (const [key, val] of Object.entries(clean)) {
    if (typeof key === "string" && key.startsWith("$")) { delete clean[key]; continue; }
    if (val !== null && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
      if (Object.keys(val).some((k) => k.startsWith("$"))) delete clean[key];
    }
  }
  return clean;
}

export default function crud(Model, options = {}) {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(parseInt(req.query.limit) || 500, 1000);
      const docs = await Model.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      res.json(docs);
    } catch (err) { next(err); }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const doc = await Model.findOne({ id: req.params.id, userId: req.userId }).lean();
      if (!doc) return res.status(404).json({ error: "Not found" });
      res.json(doc);
    } catch (err) { next(err); }
  });

  router.post("/", async (req, res, next) => {
    try {
      const doc = await Model.create({ ...sanitizeBody(req.body), userId: req.userId });
      res.status(201).json(doc);
    } catch (err) { next(err); }
  });

  router.post("/sync", async (req, res, next) => {
    try {
      const items = req.body;
      if (!Array.isArray(items)) return res.status(400).json({ error: "Expected an array" });
      if (items.length > 500) return res.status(400).json({ error: "Batch too large (max 500)" });
      const ops = [];
      for (const item of items) {
        const clean = sanitizeBody(item);
        let filter;
        if (options.syncKeys) {
          filter = { userId: req.userId };
          for (const key of options.syncKeys) filter[key] = clean[key];
        } else {
          if (!clean.id) continue;
          filter = { id: clean.id, userId: req.userId };
        }
        ops.push({
          updateOne: {
            filter,
            update: { $set: { ...clean, userId: req.userId } },
            upsert: true,
          },
        });
      }
      if (ops.length > 0) await Model.bulkWrite(ops);
      const syncFilter = { userId: req.userId };
      if (options.syncKeys) {
        for (const key of options.syncKeys) {
          syncFilter[key] = { $in: items.map(i => i[key]).filter(Boolean) };
        }
      } else {
        syncFilter.id = { $in: items.map(i => i.id).filter(Boolean) };
      }
      const results = await Model.find(syncFilter).lean();
      res.json(results);
    } catch (err) { next(err); }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      const doc = await Model.findOneAndUpdate(
        { id: req.params.id, userId: req.userId },
        { ...sanitizeBody(req.body), userId: req.userId },
        { new: true, runValidators: true }
      ).lean();
      if (!doc) return res.status(404).json({ error: "Not found" });
      res.json(doc);
    } catch (err) { next(err); }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const doc = await Model.findOneAndDelete({ id: req.params.id, userId: req.userId });
      if (!doc) return res.status(404).json({ error: "Not found" });
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  return router;
}
