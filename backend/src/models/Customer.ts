import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  vehicleNumber: { type: String, required: true, uppercase: true },
  vehicleModel: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Customer', customerSchema);