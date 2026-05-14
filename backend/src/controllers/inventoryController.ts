import { Request, Response } from 'express';
import Inventory from '../models/Inventory';

// Add a new incoming part
export const addPart = async (req: Request, res: Response) => {
  try {
    console.log("---> ATTEMPTING TO SAVE A NEW PART!");
    const newPart = await Inventory.create(req.body);
    res.status(201).json(newPart);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// View all parts in stock
export const getInventory = async (req: Request, res: Response) => {
  try {
    const parts = await Inventory.find({});
    res.status(200).json(parts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};