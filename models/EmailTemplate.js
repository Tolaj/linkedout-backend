import mongoose from "mongoose";

const schema = new mongoose.Schema({
  id:      { type: String, required: true },
  userId:  { type: String, required: true, index: true },
  name:    { type: String, required: true },
  subject: String,
  body:    String,
}, { timestamps: true });

schema.index({ id: 1, userId: 1 }, { unique: true });

export default mongoose.model("EmailTemplate", schema);
