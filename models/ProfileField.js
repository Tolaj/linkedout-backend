import mongoose from "mongoose";

const schema = new mongoose.Schema({
  id:        { type: String, required: true, unique: true },
  userId:    { type: String, required: true, index: true },
  category:  { type: String, required: true, enum: ["personal", "work", "education", "links", "eeo", "custom"] },
  fieldKey:  { type: String, required: true },
  label:     { type: String, required: true },
  value:     { type: String, default: "" },
  type:      { type: String, default: "text", enum: ["text", "select", "textarea", "file"] },
  options:   [String],
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

schema.index({ userId: 1, fieldKey: 1 }, { unique: true });

export default mongoose.model("ProfileField", schema);
