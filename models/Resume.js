import mongoose from "mongoose";

const schema = new mongoose.Schema({
  id:         { type: String, required: true },
  userId:     { type: String, required: true, index: true },
  archetype:  { type: String, required: true },
  version:    { type: Number, default: 1 },
  fileName:   String,
  size:       Number,
  uploadedAt: String,
  localPath:  String,
}, { timestamps: true });

schema.index({ id: 1, userId: 1 }, { unique: true });

export default mongoose.model("Resume", schema);
