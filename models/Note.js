import mongoose from "mongoose";

const schema = new mongoose.Schema({
  id:      { type: String, required: true, unique: true },
  userId:  { type: String, required: true, index: true },
  section: { type: String, required: true },
  title:   String,
  content: String,
  appId:   String,
}, { timestamps: true });

export default mongoose.model("Note", schema);
