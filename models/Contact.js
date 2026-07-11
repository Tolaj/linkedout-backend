import mongoose from "mongoose";

const schema = new mongoose.Schema({
  id:       { type: String, required: true, unique: true },
  userId:   { type: String, required: true, index: true },
  appId:    { type: String, index: true },
  name:     String,
  email:    { type: String, required: true },
  position: String,
  notes:    String,
}, { timestamps: true });

export default mongoose.model("Contact", schema);
