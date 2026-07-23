import mongoose from "mongoose";

const schema = new mongoose.Schema({
  id:             { type: String, required: true },
  userId:         { type: String, required: true, index: true },
  company:        { type: String, required: true, maxlength: 200 },
  role:           { type: String, required: true, maxlength: 200 },
  location:       { type: String, maxlength: 200 },
  dateApplied:    String,
  source:         { type: String, default: "LinkedIn" },
  status:         { type: String, default: "Applied" },
  resumeVersion:  String,
  referral:       { type: String, default: "N" },
  domain:         String,
  contact:        String,
  nextActionDate: String,
  notes:          { type: String, maxlength: 5000 },
  link:           { type: String, maxlength: 2000 },
  closeReason:    String,
  formFields:     { type: Array, default: [], validate: { validator: v => !Array.isArray(v) || v.length <= 100, message: "formFields cannot exceed 100 items" } },
}, { timestamps: true });

schema.index({ id: 1, userId: 1 }, { unique: true });

export default mongoose.model("Application", schema);
