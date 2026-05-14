import express from 'express';
import { addPart, getInventory } from '../controllers/inventoryController';

const router = express.Router();

// POST request to add a new part
router.post('/add', addPart);

// GET request to view all parts
router.get('/', getInventory);

export default router;