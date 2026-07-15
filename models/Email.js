import mongoose from "mongoose";

const schema = new mongoose.Schema({
  id:             { type: String, required: true },
  userId:         { type: String, required: true, index: true },
  appId:          { type: String, index: true },
  direction:      { type: String, default: "outbound" },
  recipientEmail: String,
  recipientName:  String,
  company:        String,
  role:           String,
  subject:        String,
  body:           String,
  status:         { type: String, default: "draft" },
  followUpDate:   String,
  sentAt:         String,
  threadId:       String,
  gmailId:        String,
  snippet:        String,
}, { timestamps: true });

schema.index({ id: 1, userId: 1 }, { unique: true });

export default mongoose.model("Email", schema);
