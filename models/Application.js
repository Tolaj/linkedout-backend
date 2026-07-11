import mongoose from "mongoose";

const schema = new mongoose.Schema({
  id:             { type: String, required: true, unique: true },
  userId:         { type: String, required: true, index: true },
  company:        { type: String, required: true },
  role:           { type: String, required: true },
  location:       String,
  dateApplied:    String,
  source:         { type: String, default: "LinkedIn" },
  status:         { type: String, default: "Applied" },
  resumeVersion:  String,
  referral:       { type: String, default: "N" },
  domain:         String,
  contact:        String,
  nextActionDate: String,
  notes:          String,
  link:           String,
  closeReason:    String,
}, { timestamps: true });

export default mongoose.model("Application", schema);
