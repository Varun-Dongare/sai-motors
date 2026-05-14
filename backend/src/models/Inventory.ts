import mongoose, { Document, Schema } from 'mongoose';

export interface IInventory extends Document {
  partName: string;
  partNumber: string;
  category: string;
  quantityInStock: number;
  costPrice: number;
  sellingPrice: number;
}

const inventorySchema = new Schema<IInventory>(
  {
    partName: { type: String, required: true },
    partNumber: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    quantityInStock: { type: Number, required: true, default: 0 },
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IInventory>('Inventory', inventorySchema);