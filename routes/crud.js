import { Router } from "express";

export default function crud(Model) {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const docs = await Model.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
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
      const doc = await Model.create({ ...req.body, userId: req.userId });
      res.status(201).json(doc);
    } catch (err) { next(err); }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      const doc = await Model.findOneAndUpdate(
        { id: req.params.id, userId: req.userId },
        { ...req.body, userId: req.userId },
        { new: true, upsert: true, runValidators: true }
      ).lean();
      res.json(doc);
    } catch (err) { next(err); }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      await Model.findOneAndDelete({ id: req.params.id, userId: req.userId });
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  return router;
}
