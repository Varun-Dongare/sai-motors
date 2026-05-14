import Employee from './models/Employee';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import Inventory from './models/Inventory'; 
import Customer from './models/Customer'; 
import Invoice from './models/Invoice';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5006;

app.use(cors({
  origin: [
    "http://localhost:5173", // So it still works on your computer
    "https://sai-motors-alpha.vercel.app" // Your live frontend
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// ==========================================
//        INVENTORY ROUTES
// ==========================================
app.post('/api/inventory/add-direct', async (req, res) => {
  try {
    const newPart = await Inventory.create(req.body);
    res.status(201).json(newPart);
  } catch (error: any) { res.status(400).json({ message: error.message }); }
});

app.get('/api/inventory/all', async (req, res) => {
  try {
    const allParts = await Inventory.find({});
    res.status(200).json(allParts);
  } catch (error: any) { res.status(500).json({ message: error.message }); }
});

app.put('/api/inventory/update/:id', async (req, res) => {
  try {
    const updatedPart = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedPart);
  } catch (error: any) { res.status(400).json({ message: error.message }); }
});

app.delete('/api/inventory/delete/:id', async (req, res) => {
  try {
    await Inventory.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted" });
  } catch (error: any) { res.status(500).json({ message: error.message }); }
});

// ==========================================
//        CUSTOMER ROUTES
// ==========================================
app.post('/api/customers/add', async (req, res) => {
  try {
    const newCustomer = await Customer.create(req.body);
    res.status(201).json(newCustomer);
  } catch (error: any) { res.status(400).json({ message: error.message }); }
});

app.get('/api/customers/all', async (req, res) => {
  try {
    const customers = await Customer.find({});
    res.status(200).json(customers);
  } catch (error: any) { res.status(500).json({ message: error.message }); }
});

app.put('/api/customers/update/:id', async (req, res) => {
  try {
    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (error: any) { res.status(400).json({ message: error.message }); }
});

app.delete('/api/customers/delete/:id', async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted" });
  } catch (error: any) { res.status(500).json({ message: error.message }); }
});

// ==========================================
//        BILLING ROUTES
// ==========================================
app.post('/api/invoices/add', async (req, res) => {
  try {
    const newInvoice = await Invoice.create(req.body);
    // Deduct Stock logic
    if (req.body.partsUsed) {
      for (let item of req.body.partsUsed) {
        await Inventory.findByIdAndUpdate(item.partId, { $inc: { quantityInStock: -item.quantity } });
      }
    }
    res.status(201).json(newInvoice);
  } catch (error: any) { res.status(400).json({ message: error.message }); }
});

app.get('/api/invoices/all', async (req, res) => {
  try {
    const invoices = await Invoice.find({}).sort({ date: -1 });
    res.status(200).json(invoices);
  } catch (error: any) { res.status(500).json({ message: error.message }); }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ==========================================
//        STAFF & PAYROLL ROUTES
// ==========================================
app.post('/api/employees/add', async (req, res) => {
  try {
    const newEmp = await Employee.create(req.body);
    res.status(201).json(newEmp);
  } catch (error: any) { res.status(400).json({ message: error.message }); }
});

app.get('/api/employees/all', async (req, res) => {
  try {
    const employees = await Employee.find({});
    res.status(200).json(employees);
  } catch (error: any) { res.status(500).json({ message: error.message }); }
});

// Route to add a daily attendance record
app.put('/api/employees/attendance/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id, 
      { $push: { attendanceRecords: req.body } },
      { new: true }
    );
    res.status(200).json(employee);
  } catch (error: any) { res.status(400).json({ message: error.message }); }
});

app.delete('/api/employees/delete/:id', async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted" });
  } catch (error: any) { res.status(500).json({ message: error.message }); }
});