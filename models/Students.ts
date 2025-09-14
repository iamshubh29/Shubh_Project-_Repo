import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  name: string;
  email: string;
  rollNumber: string;
  universityRollNo: string;
  eventName: string;
  branch: string;
  year: string;
  phoneNumber: string;
  cgpa: string;
  back: string;
  summary: string;
  clubs: string;
  aim: string;
  believe: string;
  expect: string;
  domain: string[];
  qrCode: string;
  attendance: {
    date: Date;
    present: boolean;
  }[];
  review?:number | null;
  comment:string | "";
  roundOneAttendance?: boolean;
  roundTwoAttendance?: boolean;
  roundOneQualified?: boolean;
  roundTwoQualified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      // unique: true, <-- This was the cause of the error. It is now removed.
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true,
      // unique: true, <-- This was also removed to allow re-use for different events.
    },
    universityRollNo: { type: String, required: true, trim: true },
    eventName: { type: String, required: true, trim: true },
    branch: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    cgpa: { type: String, required: true, trim: true },
    back: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    clubs: { type: String, required: true, trim: true },
    aim: { type: String, required: true, trim: true },
    believe: { type: String, required: true, trim: true },
    expect: { type: String, required: true, trim: true },
    domain: { type: [String], required: true, default: [] },
    qrCode: { type: String, unique: true, required: true },
    attendance: [{
        date: { type: Date, required: true },
        present: { type: Boolean, default: true },
    }],
    review: { type: Number, default: null },
    comment: { type: String, default: "" },
    roundOneAttendance: { type: Boolean, default: false },
    roundTwoAttendance: { type: Boolean, default: false },
    roundOneQualified: { type: Boolean, default: false },
    roundTwoQualified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// --- NEW: Create a compound unique index ---
// This ensures that the combination of an email and eventName must be unique.
StudentSchema.index({ email: 1, eventName: 1 }, { unique: true });
StudentSchema.index({ rollNumber: 1, eventName: 1 }, { unique: true });

export default mongoose.models.Students || mongoose.model<IStudent>('Students', StudentSchema);