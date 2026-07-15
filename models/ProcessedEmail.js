import mongoose from "mongoose";

const schema = new mongoose.Schema({
  id:       { type: String, required: true },
  userId:   { type: String, required: true, index: true },
  gmailId:  { type: String, required: true },
  status:   { type: String, enum: ["skipped", "tracked"], required: true },
  emailDate: { type: String },
}, { timestamps: true });

schema.index({ id: 1, userId: 1 }, { unique: true });
schema.index({ userId: 1, gmailId: 1 }, { unique: true });

export default mongoose.model("ProcessedEmail", schema);
