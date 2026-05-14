import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  // Link this bill to a specific vehicle/customer
  vehicleNumber: { type: String, required: true },
  customerName: { type: String, required: true },
  
  // Array of labor charges (Task Name + Cost)
  laborCharges: [{
    description: String,
    amount: Number
  }],

  // Array of parts used (Linked to Inventory)
  partsUsed: [{
    partId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    partName: String,
    quantity: Number,
    price: Number
  }],

  // Financial Breakdown
  subtotal: { type: Number, required: true },
  cgst: { type: Number, required: true }, // 9% of subtotal
  sgst: { type: Number, required: true }, // 9% of subtotal
  totalAmount: { type: Number, required: true },

  // Payment Tracking
  paymentMethod: { 
    type: String, 
    enum: ['Cash', 'UPI/Online', 'Card'], 
    default: 'Cash' 
  },
  transactionId: { type: String }, // Optional: Filled only for UPI/Card
  
  date: { type: Date, default: Date.now }
});

export default mongoose.model('Invoice', invoiceSchema);