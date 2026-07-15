import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const schema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  folderName: { type: String, default: "" },
  folders: { type: [String], default: [] },
  googleClientId: { type: String, default: "" },
  googleClientSecret: { type: String, default: "" },
  gmailRefreshToken: { type: String, default: "" },
  gmailConnected: { type: Boolean, default: false },
  llmApiKey: { type: String, default: "" },
  llmProvider: { type: String, default: "cerebras" },
  llmEnabled: { type: Boolean, default: false },
}, { timestamps: true });

schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

schema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", schema);
