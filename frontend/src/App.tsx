import React, { useState, useEffect } from 'react';

// --- INTERFACES ---
interface Part { _id: string; partName: string; partNumber: string; category: string; quantityInStock: number; costPrice: number; sellingPrice: number; }
interface Customer { _id: string; customerName: string; contactNumber: string; email: string; address: string; vehicleNumber: string; vehicleModel: string; }
interface Invoice { _id: string; vehicleNumber: string; customerName: string; laborCharges: { description: string, amount: number }[]; partsUsed: { partName: string, quantity: number, price: number }[]; subtotal: number; discount?: number; cgst: number; sgst: number; totalAmount: number; date: string; paymentMethod: string; transactionId?: string; kmsDriven?: string; }
interface Attendance { date: string; status: string; advanceGiven: number; notes: string; }
interface Employee { _id: string; name: string; phone: string; role: string; dailyWage: number; attendanceRecords: Attendance[]; }

function App() {
  // Move it here! 👇
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [activeTab, setActiveTab] = useState('jobcards');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedInv, setSelectedInv] = useState<Invoice | null>(null);

  // ... rest of your code stays the same

  // --- DATA ---
  const [inventory, setInventory] = useState<Part[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // --- FORM STATES ---
  const [inventoryForm, setInventoryForm] = useState({ partName: '', partNumber: '', category: 'Engine Parts', quantityInStock: '', costPrice: '', sellingPrice: '' });
  const [editingInvId, setEditingInvId] = useState<string | null>(null);
  const [customerForm, setCustomerForm] = useState({ customerName: '', contactNumber: '', email: '', address: '', vehicleNumber: '', vehicleModel: '' });
  const [editingCustId, setEditingCustId] = useState<string | null>(null);

  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [kmsDriven, setKmsDriven] = useState('');
  const [discount, setDiscount] = useState('0');
  const [laborItems, setLaborItems] = useState([{ description: '', amount: '' }]);
  const [partItems, setPartItems] = useState([{ partId: '', quantity: '1' }]);
  const [payMethod, setPayMethod] = useState('Cash');
  const [txnId, setTxnId] = useState('');

  // --- STAFF FORM STATES ---
  const [empForm, setEmpForm] = useState({ name: '', phone: '', role: 'Mechanic', dailyWage: '' });
  const [attForm, setAttForm] = useState({ employeeId: '', date: new Date().toISOString().split('T')[0], status: 'Present', advanceGiven: '', notes: '' });

const API_BASE = "http://localhost:5006/api";
  const fetchData = async () => {
    try {
      const invRes = await fetch(`${API_BASE}/inventory/all`).then(r => r.json()).catch(() => []);
      const custRes = await fetch(`${API_BASE}/customers/all`).then(r => r.json()).catch(() => []);
      const invcRes = await fetch(`${API_BASE}/invoices/all`).then(r => r.json()).catch(() => []);
      const empRes = await fetch(`${API_BASE}/employees/all`).then(r => r.json()).catch(() => []);

      setInventory(Array.isArray(invRes) ? invRes : []);
      setCustomers(Array.isArray(custRes) ? custRes : []);
      setInvoices(Array.isArray(invcRes) ? invcRes : []);
      setEmployees(Array.isArray(empRes) ? empRes : []);
      setLoading(false);
    } catch (e) { console.error(e); setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const capitalize = (s: string) => (s || '').replace(/\b\w/g, c => c.toUpperCase());

  // --- NUMBER TO WORDS CONVERTER ---
  const numberToWords = (num: number) => {
    const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
    const nStr = Math.floor(num).toString();
    if (nStr.length > 9) return 'Overflow';
    const n = ('000000000' + nStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (Number(n[1]) != 0) ? (a[Number(n[1])] || b[n[1][0] as any] + ' ' + a[n[1][1] as any]) + 'Crore ' : '';
    str += (Number(n[2]) != 0) ? (a[Number(n[2])] || b[n[2][0] as any] + ' ' + a[n[2][1] as any]) + 'Lakh ' : '';
    str += (Number(n[3]) != 0) ? (a[Number(n[3])] || b[n[3][0] as any] + ' ' + a[n[3][1] as any]) + 'Thousand ' : '';
    str += (Number(n[4]) != 0) ? (a[Number(n[4])] || b[n[4][0] as any] + ' ' + a[n[4][1] as any]) + 'Hundred ' : '';
    str += (Number(n[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0] as any] + ' ' + a[n[5][1] as any]) : '';
    return str.trim() ? str.trim() + ' Rupees Only' : 'Zero Rupees Only';
  };

  const calculateBill = () => {
    const labor = laborItems.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const parts = partItems.reduce((s, i) => {
      const p = inventory.find(inv => inv._id === i.partId);
      return s + ((p?.sellingPrice || 0) * (Number(i.quantity) || 0));
    }, 0);
    const sub = labor + parts;
    const disc = Number(discount) || 0;
    const taxable = sub - disc;
    const cgst = taxable * 0.09;
    const sgst = taxable * 0.09;
    return { subtotal: sub, discount: disc, taxable, cgst, sgst, totalAmount: taxable + cgst + sgst };
  };

  // --- SUBMITS ---
  const handleInvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingInvId ? `${API_BASE}/inventory/update/${editingInvId}` : `${API_BASE}/inventory/add-direct`;
    await fetch(url, { method: editingInvId ? 'PUT' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...inventoryForm, quantityInStock: Number(inventoryForm.quantityInStock), costPrice: Number(inventoryForm.costPrice), sellingPrice: Number(inventoryForm.sellingPrice)})});
    setEditingInvId(null); setInventoryForm({partName:'', partNumber:'', category:'Engine Parts', quantityInStock:'', costPrice:'', sellingPrice:''});
    fetchData();
  };

  const handleInvDelete = async (id: string) => { if (window.confirm("Remove item?")) { await fetch(`${API_BASE}/inventory/delete/${id}`, { method: 'DELETE' }); fetchData(); } };

  const handleCustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingCustId ? `${API_BASE}/customers/update/${editingCustId}` : `${API_BASE}/customers/add`;
    await fetch(url, { method: editingCustId ? 'PUT' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(customerForm)});
    setEditingCustId(null); setCustomerForm({customerName:'', contactNumber:'', email:'', address:'', vehicleNumber:'', vehicleModel:''});
    fetchData();
  };

  const handleCustDelete = async (id: string) => { if (window.confirm("Delete customer?")) { await fetch(`${API_BASE}/customers/delete/${id}`, { method: 'DELETE' }); fetchData(); } };

  const handleEmpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_BASE}/employees/add`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...empForm, dailyWage: Number(empForm.dailyWage)})});
    setEmpForm({ name: '', phone: '', role: 'Mechanic', dailyWage: '' });
    fetchData();
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!attForm.employeeId) return alert("Select an Employee!");
    await fetch(`${API_BASE}/employees/attendance/${attForm.employeeId}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ date: attForm.date, status: attForm.status, advanceGiven: Number(attForm.advanceGiven), notes: attForm.notes }) });
    setAttForm({...attForm, advanceGiven: '', notes: ''});
    alert("Attendance & Advance recorded!");
    fetchData();
  };

  const handleEmpDelete = async (id: string) => { if (window.confirm("Remove Employee?")) { await fetch(`${API_BASE}/employees/delete/${id}`, { method: 'DELETE' }); fetchData(); } };

  const handleBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selectedVehicle) return alert("Please select a vehicle!");
    const cust = customers.find(c => c.vehicleNumber === selectedVehicle);
    const { subtotal, discount: discVal, cgst, sgst, totalAmount } = calculateBill();

    const formattedParts = partItems.filter(p => p.partId).map(p => {
      const invPart = inventory.find(i => i._id === p.partId);
      return { partId: p.partId, partName: invPart?.partName || "Part", quantity: Number(p.quantity) || 1, price: invPart?.sellingPrice || 0 };
    });

    try {
      const payload = { vehicleNumber: selectedVehicle, customerName: cust?.customerName || "Unknown", laborCharges: laborItems.filter(l => l.description && l.amount), partsUsed: formattedParts, subtotal, discount: discVal, cgst, sgst, totalAmount, paymentMethod: payMethod, transactionId: txnId, kmsDriven };
      const res = await fetch(`${API_BASE}/invoices/add`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      
      if(res.ok) { 
        alert("Bill Saved!");
        if (cust?.contactNumber) {
          const laborText = laborItems.filter(l => l.description).map(l => `• ${l.description}: ₹${l.amount}`).join('\n');
          const partsText = formattedParts.map(p => `• ${p.partName} (x${p.quantity}): ₹${(p.price * p.quantity).toFixed(2)}`).join('\n');
          const message = `*SAI MOTORS INVOICE* 🧾\n----------------------------\n*Customer:* ${cust.customerName}\n*Vehicle:* ${cust.vehicleNumber}\n----------------------------\n*LABOR CHARGES:*\n${laborText || "No labor charges"}\n\n*PARTS USED:*\n${partsText || "No parts used"}\n----------------------------\n*Subtotal:* ₹${subtotal.toFixed(2)}\n*Discount:* ₹${discVal}\n*GST (18%):* ₹${(cgst + sgst).toFixed(2)}\n*GRAND TOTAL: ₹${Math.round(totalAmount)}*\n----------------------------\nThank you for choosing Sai Motors! 🙏`;
          window.open(`https://wa.me/91${cust.contactNumber}?text=${encodeURIComponent(message)}`, '_blank');
        }
        setSelectedVehicle(''); setLaborItems([{description:'', amount:''}]); setPartItems([{partId:'', quantity:'1'}]); setTxnId(''); setKmsDriven(''); setDiscount('0');
        fetchData(); 
      }
    } catch (err) { alert("Server Error"); }
  };

  const handlePrint = () => {
    if (!selectedInv) return;
    const originalTitle = document.title;
    const safeName = selectedInv.customerName.replace(/[^a-zA-Z0-9]/g, '_'); 
    document.title = `SaiMotors_Invoice_${safeName}`; 
    window.print();
    document.title = originalTitle;
  };

  // --- RENDERS ---
  const renderInventory = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-extrabold text-gray-800">Inventory Management</h2>
      <div className={`rounded-xl shadow p-6 border ${editingInvId ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
        <h3 className="text-xl font-bold mb-4">{editingInvId ? '✏️ Edit Part' : '➕ Add New Part'}</h3>
        <form onSubmit={handleInvSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="text" placeholder="Part Name" value={inventoryForm.partName} onChange={e => setInventoryForm({...inventoryForm, partName: capitalize(e.target.value)})} className="border p-2 rounded" required />
          <input type="text" placeholder="Part Number" value={inventoryForm.partNumber} onChange={e => setInventoryForm({...inventoryForm, partNumber: e.target.value.toUpperCase()})} className="border p-2 rounded" required />
          <select value={inventoryForm.category} onChange={e => setInventoryForm({...inventoryForm, category: e.target.value})} className="border p-2 rounded bg-white">
            <option value="Engine Parts">Engine Parts</option><option value="Fluids">Fluids</option><option value="Electrical">Electrical</option><option value="Brakes">Brakes</option><option value="Suspension">Suspension</option><option value="Body Parts">Body Parts</option><option value="Accessories">Accessories</option>
          </select>
          <input type="number" placeholder="Stock" value={inventoryForm.quantityInStock} onChange={e => setInventoryForm({...inventoryForm, quantityInStock: e.target.value})} className="border p-2 rounded" required />
          <input type="number" placeholder="Cost Price (₹)" value={inventoryForm.costPrice} onChange={e => setInventoryForm({...inventoryForm, costPrice: e.target.value})} className="border p-2 rounded" required />
          <input type="number" placeholder="Selling Price (₹)" value={inventoryForm.sellingPrice} onChange={e => setInventoryForm({...inventoryForm, sellingPrice: e.target.value})} className="border p-2 rounded" required />
          <button className="bg-blue-600 text-white font-bold py-2 rounded col-span-3 hover:bg-blue-700">{editingInvId ? 'Update Part' : 'Save Part'}</button>
        </form>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-800 text-white"><tr><th className="p-4">Part</th><th className="p-4">Number</th><th className="p-4">Stock</th><th className="p-4 text-right">Price</th><th className="p-4 text-center">Actions</th></tr></thead>
          <tbody>
            {inventory.map(p => (
              <tr key={p._id} className="border-b hover:bg-gray-50"><td className="p-4 font-medium">{p.partName}</td><td className="p-4 uppercase text-gray-500">{p.partNumber}</td><td className="p-4">{p.quantityInStock}</td><td className="p-4 text-right font-bold text-green-600">₹{p.sellingPrice}</td>
                <td className="p-4 text-center space-x-2">
                  <button onClick={() => { setEditingInvId(p._id); setInventoryForm({partName:p.partName, partNumber:p.partNumber, category:p.category, quantityInStock:p.quantityInStock.toString(), costPrice:p.costPrice.toString(), sellingPrice:p.sellingPrice.toString()}); }} className="text-blue-600 font-bold text-xs">Edit</button>
                  <button onClick={() => handleInvDelete(p._id)} className="text-red-600 font-bold text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-extrabold text-gray-800">Customer & Vehicle Registry</h2>
      <div className={`rounded-xl shadow p-6 border ${editingCustId ? 'bg-indigo-50 border-indigo-200' : 'bg-white'}`}>
        <h3 className="text-xl font-bold mb-4">{editingCustId ? '✏️ Edit Customer' : '📝 Register Customer'}</h3>
        <form onSubmit={handleCustSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Vehicle No" value={customerForm.vehicleNumber} onChange={e => setCustomerForm({...customerForm, vehicleNumber: e.target.value.toUpperCase()})} className="border p-2 rounded font-bold uppercase" required />
          <input type="text" placeholder="Model" value={customerForm.vehicleModel} onChange={e => setCustomerForm({...customerForm, vehicleModel: capitalize(e.target.value)})} className="border p-2 rounded" required />
          <input type="text" placeholder="Owner Name" value={customerForm.customerName} onChange={e => setCustomerForm({...customerForm, customerName: capitalize(e.target.value)})} className="border p-2 rounded" required />
          <input type="text" placeholder="Phone Number" value={customerForm.contactNumber} onChange={e => setCustomerForm({...customerForm, contactNumber: e.target.value})} className="border p-2 rounded" required />
          <input type="email" placeholder="Email Address" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} className="border p-2 rounded" />
          <input type="text" placeholder="Address" value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: capitalize(e.target.value)})} className="border p-2 rounded" />
          <button className="bg-indigo-600 text-white font-bold py-2 rounded col-span-2 hover:bg-indigo-700">{editingCustId ? 'Update Record' : 'Register Customer'}</button>
        </form>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-800 text-white"><tr><th className="p-4">Vehicle</th><th className="p-4">Model</th><th className="p-4">Owner</th><th className="p-4 text-center">Actions</th></tr></thead>
          <tbody>
            {customers.map(c => (
              <tr key={c._id} className="border-b hover:bg-gray-50"><td className="p-4 font-bold text-indigo-700">{c.vehicleNumber}</td><td className="p-4">{c.vehicleModel}</td><td className="p-4 font-medium">{c.customerName}</td>
                <td className="p-4 text-center space-x-2">
                  <button onClick={() => { setEditingCustId(c._id); setCustomerForm({customerName:c.customerName, contactNumber:c.contactNumber, email:c.email||'', address:c.address||'', vehicleNumber:c.vehicleNumber, vehicleModel:c.vehicleModel}); }} className="text-indigo-600 font-bold text-xs">Edit</button>
                  <button onClick={() => handleCustDelete(c._id)} className="text-red-600 font-bold text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEmployees = () => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-extrabold text-gray-800">Staff & Payroll</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6 border border-orange-100">
            <h3 className="text-xl font-bold mb-4 text-orange-800">➕ Add New Staff</h3>
            <form onSubmit={handleEmpSubmit} className="space-y-4">
              <input type="text" placeholder="Full Name" value={empForm.name} onChange={e => setEmpForm({...empForm, name: capitalize(e.target.value)})} className="w-full border p-2 rounded" required />
              <input type="text" placeholder="Phone Number" value={empForm.phone} onChange={e => setEmpForm({...empForm, phone: e.target.value})} className="w-full border p-2 rounded" required />
              <div className="flex gap-4">
                <select value={empForm.role} onChange={e => setEmpForm({...empForm, role: e.target.value})} className="flex-1 border p-2 rounded bg-white">
                  <option value="Mechanic">Mechanic</option><option value="Helper">Helper</option><option value="Manager">Manager</option>
                </select>
                <input type="number" placeholder="Daily Wage (₹)" value={empForm.dailyWage} onChange={e => setEmpForm({...empForm, dailyWage: e.target.value})} className="flex-1 border p-2 rounded" required />
              </div>
              <button className="w-full bg-orange-600 text-white font-bold py-2 rounded hover:bg-orange-700">Add Staff Member</button>
            </form>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-teal-100">
            <h3 className="text-xl font-bold mb-4 text-teal-800">📝 Daily Attendance & Advances</h3>
            <form onSubmit={handleAttendanceSubmit} className="space-y-4">
              <select value={attForm.employeeId} onChange={e => setAttForm({...attForm, employeeId: e.target.value})} className="w-full border p-2 rounded bg-white" required>
                <option value="">-- Select Employee --</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
              <div className="flex gap-4">
                <input type="date" value={attForm.date} onChange={e => setAttForm({...attForm, date: e.target.value})} className="flex-1 border p-2 rounded" required />
                <select value={attForm.status} onChange={e => setAttForm({...attForm, status: e.target.value})} className="flex-1 border p-2 rounded bg-white">
                  <option value="Present">Present (Full Day)</option><option value="Half-Day">Half-Day</option><option value="Absent">Absent</option>
                </select>
              </div>
              <div className="flex gap-4">
                <input type="number" placeholder="Cash Advance Given (₹)" value={attForm.advanceGiven} onChange={e => setAttForm({...attForm, advanceGiven: e.target.value})} className="flex-1 border p-2 rounded" />
                <input type="text" placeholder="Notes (Lunch, Travel, etc.)" value={attForm.notes} onChange={e => setAttForm({...attForm, notes: e.target.value})} className="flex-1 border p-2 rounded" />
              </div>
              <button className="w-full bg-teal-600 text-white font-bold py-2 rounded hover:bg-teal-700">Record Today's Log</button>
            </form>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow overflow-hidden border">
          <div className="bg-gray-800 p-4 text-white font-bold flex justify-between">
            <span>Staff Payroll Summary</span><span className="text-xs font-normal">Month: {currentMonth}</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100"><tr><th className="p-4">Name & Role</th><th className="p-4 text-center">Days Worked</th><th className="p-4 text-right">Advances Taken</th><th className="p-4 text-right">Net Pay Due</th><th className="p-4 text-center">Actions</th></tr></thead>
            <tbody>
              {employees.length === 0 ? <tr><td colSpan={5} className="p-4 text-center text-gray-500">No staff registered.</td></tr> : employees.map(emp => {
                const monthlyRecords = (emp.attendanceRecords || []).filter(r => r.date.startsWith(currentMonth));
                const daysWorked = monthlyRecords.filter(r => r.status === 'Present').length + (monthlyRecords.filter(r => r.status === 'Half-Day').length * 0.5);
                const totalAdvances = monthlyRecords.reduce((sum, r) => sum + (r.advanceGiven || 0), 0);
                const netPay = (daysWorked * emp.dailyWage) - totalAdvances;
                return (
                  <tr key={emp._id} className="border-b hover:bg-gray-50">
                    <td className="p-4"><div className="font-bold">{emp.name}</div><div className="text-[10px] text-gray-500 uppercase">{emp.role} • ₹{emp.dailyWage}/day</div></td>
                    <td className="p-4 text-center font-bold text-blue-600">{daysWorked} Days</td>
                    <td className="p-4 text-right text-red-500 font-medium">₹{totalAdvances}</td>
                    <td className="p-4 text-right font-black text-emerald-600 text-base">₹{netPay.toFixed(2)}</td>
                    <td className="p-4 text-center"><button onClick={() => handleEmpDelete(emp._id)} className="text-red-600 font-bold text-xs hover:underline">Remove</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderReceiptModal = () => {
    if (!selectedInv) return null;
    
    // Fallback numbers to prevent crashes
    const subtotal = selectedInv.subtotal || 0;
    const discountVal = selectedInv.discount || 0;
    const taxableAmount = subtotal - discountVal;
    const cgst = selectedInv.cgst || 0;
    const sgst = selectedInv.sgst || 0;
    const totalAmount = Math.round(selectedInv.totalAmount || 0);

    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50 print:bg-white print:p-0">
        {/* MODAL CLOSE BUTTON (Hides on print) */}
        <div className="absolute top-4 right-4 flex gap-4 print:hidden">
          <button onClick={handlePrint} className="bg-emerald-600 text-white font-bold px-6 py-2 rounded-lg shadow-md hover:bg-emerald-700">Print / Save PDF</button>
          <button onClick={() => setShowModal(false)} className="bg-gray-800 text-white font-bold px-4 py-2 rounded-lg hover:bg-black">✕ Close</button>
        </div>

        {/* PRINTABLE AREA */}
        <div id="printable-bill" className="bg-white w-full max-w-4xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] print:max-h-none print:shadow-none font-sans text-black border-2 border-black print:border-none">
          
          {/* Marathi Headers */}
          <div className="flex justify-between text-xs font-bold mb-2">
            <span>|| श्री काळभैरव प्रसन्न ||</span>
            <span>|| श्री खंडोबा प्रसन्न ||</span>
          </div>

          {/* Top Company & Invoice Info Box */}
          <div className="grid grid-cols-2 border border-black mb-4">
            <div className="p-3 border-r border-black flex gap-3 items-center">
              {/* WINGED LOGO PLACEHOLDER */}
            <img src="/logo.jpg" alt="Sai Motors" className="w-[150px] h-auto object-contain" />              
              <div>
                <h1 className="text-xl font-black uppercase tracking-wide text-blue-900">SAI MOTORS</h1>
                <p className="text-[10px] font-bold">GSTIN: 27CDJPP7433C1ZG</p>
                <p className="text-[10px]">33, Sai Motors, Nanded - Bidar Road</p>
                <p className="text-[10px]">Somnathpur, Udgir, Latur, MAHARASHTRA 413517</p>
                <p className="text-[10px] font-bold">Mobile: +91 9561516202 / 9923040848</p>
                <p className="text-[10px]">Email: saimotorsri@gmail.com</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 text-xs">
              <div className="p-3 border-r border-black">
                <p className="mb-2"><strong>Invoice #:</strong> <br/>INV-{selectedInv._id ? selectedInv._id.slice(-5).toUpperCase() : 'NEW'}</p>
                <p className="mb-2"><strong>Invoice Date:</strong> <br/>{new Date(selectedInv.date).toLocaleDateString('en-IN')}</p>
                <p><strong>KMs Driven:</strong> <br/>{selectedInv.kmsDriven || '-'}</p>
              </div>
              <div className="p-3">
                <p className="mb-1 text-[10px] uppercase font-bold text-gray-500">Invoice To:</p>
                <p className="font-bold uppercase text-sm mb-1">{selectedInv.customerName}</p>
                <p className="mb-1 font-mono">{selectedInv.vehicleNumber}</p>
                <p className="text-[10px]">Ph: {customers.find(c => c.vehicleNumber === selectedInv.vehicleNumber)?.contactNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

          <p className="text-center font-bold text-sm underline mb-2 tracking-widest uppercase">TAX INVOICE</p>

          {/* Itemized Table */}
          <table className="w-full text-xs border-collapse border border-black mb-4">
            <thead className="bg-gray-100 font-bold uppercase text-center text-[10px]">
              <tr>
                <th className="border border-black p-1.5 w-8">Sr</th>
                <th className="border border-black p-1.5 text-left">Description and Part Number</th>
                <th className="border border-black p-1.5 w-16">HSN/SAC</th>
                <th className="border border-black p-1.5 w-12">LITER</th>
                <th className="border border-black p-1.5 w-12">Qty</th>
                <th className="border border-black p-1.5 w-20 text-right">Rate</th>
                <th className="border border-black p-1.5 w-24 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(selectedInv.partsUsed || []).map((p, i) => (
                <tr key={`part-${i}`}>
                  <td className="border border-black p-1.5 text-center">{i + 1}</td>
                  <td className="border border-black p-1.5">{p.partName || 'Spare Part'}</td>
                  <td className="border border-black p-1.5 text-center">8708</td>
                  <td className="border border-black p-1.5 text-center">1</td>
                  <td className="border border-black p-1.5 text-center">{p.quantity || 1}</td>
                  <td className="border border-black p-1.5 text-right font-mono">{(p.price || 0).toFixed(2)}</td>
                  <td className="border border-black p-1.5 text-right font-mono">{((p.price || 0) * (p.quantity || 1)).toFixed(2)}</td>
                </tr>
              ))}
              {(selectedInv.laborCharges || []).map((l, i) => {
                const startIdx = (selectedInv.partsUsed?.length || 0) + 1;
                return (
                <tr key={`lab-${i}`}>
                  <td className="border border-black p-1.5 text-center">{startIdx + i}</td>
                  <td className="border border-black p-1.5">{l.description} (Labor & Services)</td>
                  <td className="border border-black p-1.5 text-center">9987</td>
                  <td className="border border-black p-1.5 text-center">1</td>
                  <td className="border border-black p-1.5 text-center">1</td>
                  <td className="border border-black p-1.5 text-right font-mono">{(l.amount || 0).toFixed(2)}</td>
                  <td className="border border-black p-1.5 text-right font-mono">{(l.amount || 0).toFixed(2)}</td>
                </tr>
              )})}
              
              {/* Table Spacer for minimum height if needed */}
              <tr>
                <td className="border-l border-r border-black p-4"></td><td className="border-l border-r border-black p-4"></td><td className="border-l border-r border-black p-4"></td><td className="border-l border-r border-black p-4"></td><td className="border-l border-r border-black p-4"></td><td className="border-l border-r border-black p-4"></td><td className="border-l border-r border-black p-4"></td>
              </tr>

              {/* Totals Section inside Table */}
              <tr className="font-bold border-t border-black bg-gray-50 text-[11px]">
                <td colSpan={5} className="border border-black p-1.5 text-right">Total Items: {(selectedInv.partsUsed?.length || 0) + (selectedInv.laborCharges?.length || 0)}</td>
                <td className="border border-black p-1.5 text-right">Sub Total:</td>
                <td className="border border-black p-1.5 text-right font-mono">₹{subtotal.toFixed(2)}</td>
              </tr>
              <tr className="border-t border-black text-[11px]">
                <td colSpan={5} className="border-l border-black p-1.5 text-right bg-white"></td>
                <td className="border border-black p-1.5 text-right bg-gray-50">Discount:</td>
                <td className="border border-black p-1.5 text-right font-mono bg-gray-50">₹{discountVal.toFixed(2)}</td>
              </tr>
              <tr className="border-t border-black text-[11px]">
                <td colSpan={5} className="border-l border-black p-1.5 text-right bg-white"></td>
                <td className="border border-black p-1.5 text-right bg-gray-50">Taxable Amount:</td>
                <td className="border border-black p-1.5 text-right font-mono bg-gray-50">₹{taxableAmount.toFixed(2)}</td>
              </tr>
              <tr className="border-t border-black text-[11px]">
                <td colSpan={5} className="border-l border-black p-1.5 text-right bg-white"></td>
                <td className="border border-black p-1.5 text-right bg-gray-50">CGST (9.0%):</td>
                <td className="border border-black p-1.5 text-right font-mono bg-gray-50">₹{cgst.toFixed(2)}</td>
              </tr>
              <tr className="border-t border-black text-[11px]">
                <td colSpan={5} className="border-l border-black p-1.5 text-right bg-white"></td>
                <td className="border border-black p-1.5 text-right bg-gray-50">SGST (9.0%):</td>
                <td className="border border-black p-1.5 text-right font-mono bg-gray-50">₹{sgst.toFixed(2)}</td>
              </tr>
              <tr className="border-t border-black bg-gray-200 font-bold text-sm">
                <td colSpan={5} className="border border-black p-2 uppercase text-[10px]">Total Amount( Rs ): <br/>{numberToWords(totalAmount)}</td>
                <td className="border border-black p-2 text-right">Total Payable:</td>
                <td className="border border-black p-2 text-right font-mono">₹{totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Footer Grid: Bank details & Signatures */}
          <div className="grid grid-cols-2 border border-black text-[10px]">
            <div className="p-3 border-r border-black">
              <p className="font-bold mb-1 uppercase text-gray-600">Bank Details</p>
              <table className="w-full">
                <tbody>
                  <tr><td className="w-24 font-bold">Bank Name:</td><td>Bank of Baroda, Udgir</td></tr>
                  <tr><td className="font-bold">Account Name:</td><td>Sai Motors</td></tr>
                  <tr><td className="font-bold">Account No:</td><td className="font-mono">42880200000180</td></tr>
                  <tr><td className="font-bold">IFSC Code:</td><td className="font-mono">BARB0UDGIRX (0-Zero)</td></tr>
                </tbody>
              </table>
              <p className="mt-2 text-gray-500 italic">This is a computer generated invoice.</p>
            </div>
            
            <div className="p-3 relative flex flex-col justify-between">
              <div>
                <p className="font-bold mb-1 uppercase">Terms and Conditions:</p>
                <p>Money cannot be refunded.</p>
              </div>
              <div className="flex justify-between items-end mt-10">
                 <div className="text-center w-32 border-t border-black pt-1">Customer Signature</div>
                 <div className="text-center w-32 border-t border-black pt-1">For SAI MOTORS<br/><span className="text-[8px]">Authorised Signatory</span></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  const renderJobCards = () => {
    const { subtotal, discount: discVal, cgst, sgst, totalAmount } = calculateBill();
    const roundedTotal = Math.round(totalAmount);
    const upiUrl = `upi://pay?pa=9923040848@ybl&pn=Sai%20Motors&am=${roundedTotal}.00&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(upiUrl)}`;

    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-extrabold text-gray-800">Job Card & Professional Billing</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-xl shadow border">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className="w-full border p-3 rounded-lg font-bold bg-gray-50 border-gray-300">
                  <option value="">-- Select Registered Vehicle --</option>
                  {customers.map(c => <option key={c._id} value={c.vehicleNumber}>{c.vehicleNumber} - {c.customerName}</option>)}
                </select>
                <input type="text" placeholder="KMs Driven (e.g. 45000)" value={kmsDriven} onChange={e => setKmsDriven(e.target.value)} className="w-full border p-3 rounded-lg font-bold bg-gray-50" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded bg-gray-50 text-sm">
                  <h4 className="font-bold mb-3 text-blue-700 uppercase">🛠️ Labor</h4>
                  {laborItems.map((item, i) => (
                    <div key={`lab-input-${i}`} className="flex gap-2 mb-2">
                      <input type="text" placeholder="Task" value={item.description} onChange={e => {const l = [...laborItems]; l[i].description = capitalize(e.target.value); setLaborItems(l);}} className="flex-1 border p-2 text-xs rounded" />
                      <input type="number" placeholder="₹" value={item.amount} onChange={e => {const l = [...laborItems]; l[i].amount = e.target.value; setLaborItems(l);}} className="w-16 border p-2 text-xs rounded" />
                    </div>
                  ))}
                  <button type="button" onClick={() => setLaborItems([...laborItems, {description:'', amount:''}])} className="text-blue-600 font-bold text-xs hover:underline">+ Add Row</button>
                </div>
                
                <div className="p-4 border rounded bg-gray-50 text-sm">
                  <h4 className="font-bold mb-3 text-orange-700 uppercase">📦 Parts</h4>
                  {partItems.map((item, i) => (
                    <div key={`part-input-${i}`} className="flex gap-2 mb-2">
                      <select value={item.partId} onChange={e => {const p = [...partItems]; p[i].partId = e.target.value; setPartItems(p);}} className="flex-1 border p-1 text-xs rounded">
                        <option value="">Select Part</option>
                        {inventory.map(inv => <option key={inv._id} value={inv._id}>{inv.partName} (Qty: {inv.quantityInStock})</option>)}
                      </select>
                      <input type="number" value={item.quantity} onChange={e => {const p = [...partItems]; p[i].quantity = e.target.value; setPartItems(p);}} className="w-10 border p-1 text-xs rounded" />
                    </div>
                  ))}
                  <button type="button" onClick={() => setPartItems([...partItems, {partId:'', quantity:'1'}])} className="text-orange-600 font-bold text-xs hover:underline">+ Add Part</button>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow border">
              <h3 className="font-bold mb-4 text-sm uppercase text-gray-500">Payment & Discount</h3>
              <div className="flex gap-4 mb-4">
                {['Cash', 'UPI/Online', 'Card'].map(m => (
                  <button key={m} type="button" onClick={() => setPayMethod(m)} className={`flex-1 py-2 rounded-lg font-bold border transition-all ${payMethod === m ? 'bg-slate-800 text-white shadow-md' : 'bg-gray-100'}`}>{m}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {payMethod !== 'Cash' && <input type="text" placeholder="Transaction ID / Ref No" value={txnId} onChange={e => setTxnId(e.target.value.toUpperCase())} className="w-full border p-3 rounded-lg font-mono text-sm bg-gray-50" />}
                <input type="number" placeholder="Discount Amount (₹)" value={discount} onChange={e => setDiscount(e.target.value)} className="w-full border p-3 rounded-lg font-bold text-sm bg-red-50 border-red-200" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900 p-6 rounded-xl text-white shadow-2xl h-fit border-t-4 border-emerald-500">
            <h3 className="text-center font-bold text-lg mb-6 border-b border-slate-700 pb-2">BILL PREVIEW</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-400"><span>Subtotal:</span><span className="text-white">₹{subtotal.toFixed(2)}</span></div>
              {discVal > 0 && <div className="flex justify-between text-red-400"><span>Discount:</span><span>-₹{discVal.toFixed(2)}</span></div>}
              <div className="flex justify-between text-slate-400 text-xs italic"><span>CGST (9%):</span><span className="text-white">₹{cgst.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-400 text-xs italic"><span>SGST (9%):</span><span className="text-white">₹{sgst.toFixed(2)}</span></div>
              <div className="flex justify-between text-2xl font-black pt-4 border-t border-slate-700 text-emerald-400"><span>TOTAL:</span><span>₹{roundedTotal}</span></div>
              {payMethod === 'UPI/Online' && roundedTotal > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-700 text-center">
                  <p className="text-[10px] text-slate-500 mb-2 uppercase">Scan to Pay (9923040848)</p>
                  <img src={qrUrl} alt="QR" className="mx-auto border-4 border-white rounded p-1 bg-white" />
                </div>
              )}
              <button onClick={handleBillSubmit} disabled={!selectedVehicle} className={`w-full font-black py-4 rounded-xl mt-6 transition-all ${!selectedVehicle ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 text-slate-900 shadow-lg'}`}>GENERATE BILL</button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow border overflow-hidden">
          <div className="bg-gray-100 p-4 font-bold text-gray-700 border-b">BILLING HISTORY</div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50"><tr><th className="p-4">Date</th><th className="p-4">Vehicle</th><th className="p-4">Payment</th><th className="p-4 text-right">Total</th><th className="p-4 text-center">Action</th></tr></thead>
            <tbody>
              {invoices.length === 0 ? <tr><td colSpan={5} className="p-4 text-center text-gray-400">No transactions recorded yet.</td></tr> : invoices.map(inv => (
                <tr key={inv._id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{inv.date ? new Date(inv.date).toLocaleDateString() : 'N/A'}</td>
                  <td className="p-4 font-bold">{inv.vehicleNumber}</td>
                  <td className="p-4"><span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold uppercase">{inv.paymentMethod || 'CASH'}</span></td>
                  <td className="p-4 text-right font-black text-emerald-600">₹{Math.round(inv.totalAmount || 0)}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => { setSelectedInv(inv); setShowModal(true); }} className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-black transition-all">View Bill 📄</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

return (
    <div className="flex h-screen bg-gray-100 font-sans">
      
      {/* --- COLLAPSIBLE SIDEBAR --- */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-slate-900 text-white py-6 flex flex-col shadow-2xl print:hidden`}>
        
        {/* Header & Hamburger Icon */}
        <div className={`flex items-center mb-10 border-b border-slate-800 pb-4 px-4 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {sidebarOpen && <h1 className="text-2xl font-black text-blue-400">SAI MOTORS</h1>}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-gray-300"
            title="Toggle Sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-4 flex-1 px-4">
          <button title="Inventory" onClick={() => setActiveTab('inventory')} className={`w-full flex items-center p-3 rounded-xl font-bold transition-all ${activeTab === 'inventory' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800'} ${!sidebarOpen && 'justify-center'}`}>
            <span className="text-xl">📦</span>
            {sidebarOpen && <span className="ml-3">Inventory</span>}
          </button>
          
          <button title="Customers" onClick={() => setActiveTab('customers')} className={`w-full flex items-center p-3 rounded-xl font-bold transition-all ${activeTab === 'customers' ? 'bg-indigo-600 shadow-lg' : 'hover:bg-slate-800'} ${!sidebarOpen && 'justify-center'}`}>
            <span className="text-xl">👥</span>
            {sidebarOpen && <span className="ml-3">Customers</span>}
          </button>
          
          <button title="Job Cards" onClick={() => setActiveTab('jobcards')} className={`w-full flex items-center p-3 rounded-xl font-bold transition-all ${activeTab === 'jobcards' ? 'bg-emerald-600 shadow-lg' : 'hover:bg-slate-800'} ${!sidebarOpen && 'justify-center'}`}>
            <span className="text-xl">📄</span>
            {sidebarOpen && <span className="ml-3">Job Cards</span>}
          </button>
          
          <button title="Staff & Payroll" onClick={() => setActiveTab('employees')} className={`w-full flex items-center p-3 rounded-xl font-bold transition-all mt-8 border-t border-slate-700 ${activeTab === 'employees' ? 'bg-orange-600 shadow-lg' : 'hover:bg-slate-800 text-orange-200'} ${!sidebarOpen && 'justify-center'}`}>
            <span className="text-xl">🛠️</span>
            {sidebarOpen && <span className="ml-3">Staff & Payroll</span>}
          </button>
        </nav>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 p-10 overflow-y-auto print:p-0">
        {loading ? (
          <div className="h-full flex items-center justify-center font-black text-gray-300 text-2xl animate-pulse">BOOTING SAI MOTORS...</div>
        ) : (
          activeTab === 'inventory' ? renderInventory() :
          activeTab === 'customers' ? renderCustomers() :
          activeTab === 'employees' ? renderEmployees() :
          renderJobCards()
        )}
      </div>
      
      {showModal && renderReceiptModal()}
    </div>
  );
}

export default App;