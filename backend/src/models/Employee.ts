import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, default: 'Mechanic' },
  dailyWage: { type: Number, required: true },
  
  // Array to track daily attendance and money given
  attendanceRecords: [{
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    status: { type: String, enum: ['Present', 'Absent', 'Half-Day'], default: 'Present' },
    advanceGiven: { type: Number, default: 0 },
    notes: { type: String }
  }],
  
  joinedDate: { type: Date, default: Date.now }
});

export default mongoose.model('Employee', employeeSchema);