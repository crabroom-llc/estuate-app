import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: true,
  },
  token: { type: String },
  lastLogin: { type: Date },
  userType: { type: String, default: "user" },
}, { timestamps: true });

const user = mongoose.models.user || mongoose.model("user", userSchema, "user");

export default user;
