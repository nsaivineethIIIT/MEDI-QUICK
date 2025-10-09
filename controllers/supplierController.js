const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');
const Supplier = require('../models/Supplier');
const Employee = require('../models/Employee');
const Appointment = require('../models/Appointment');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const { SUPPLIER_SECURITY_CODE } = require('../constants/constants');

const {checkEmailExists, checkMobileExists} = require('../utils/utils');

exports.signup = async (req, res) => {
    
    const {
        name,
        email,
        mobile,
        address,
        supplierID,
        password,
        securityCode
    } = req.body;

    try {
        if (!name || !email || !mobile || !address || !supplierID || !password || !securityCode) {
            return res.status(400).json({
                error: 'All fields are required',
                details: 'Missing name, email, mobile, address, supplierID, password, or security code'
            });
        }

        if (securityCode !== SUPPLIER_SECURITY_CODE) {
            return res.status(400).json({
                error: 'Invalid security code',
                details: 'The provided security code is incorrect'
            });
        }
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
            return res.status(400).json({
                error: 'Email already in use',
                details: 'This email is already registered with another account'
            });
        }

        // Check for existing mobile across all collections
        const mobileExists = await checkMobileExists(mobile);
        if (mobileExists) {
            return res.status(400).json({
                error: 'Mobile number already in use',
                details: 'This mobile number is already registered with another account'
            });
        }
        const existingSupplier = await Supplier.findOne({
            $or: [
                { email },
                { supplierID }
            ]
        });

        if (existingSupplier) {
            return res.status(400).json({
                error: 'Supplier with same email or supplier ID already exists',
                details: 'Email or supplier ID must be unique'
            });
        }

        const newSupplier = new Supplier({
            name,
            email,
            mobile,
            address,
            supplierID,
            password
        });

        await newSupplier.save();

        res.status(201).json({
            message: 'Signup successful',
            redirect: '/supplier/form'
        });
    } catch (err) {
        console.error("Error during supplier signup:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.login =  async (req, res) => {
  
    const { email, password, securityCode } = req.body;

    try {
        if (!email || !password || !securityCode) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (securityCode !== SUPPLIER_SECURITY_CODE) {
            return res.status(400).json({ error: 'Invalid security code' });
        }

        const supplier = await Supplier.findOne({ email, password });

        if (!supplier) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Update lastLogin
        supplier.lastLogin = new Date();
        await supplier.save();
        req.session.supplierId = supplier._id.toString();
        res.status(200).json({
            message: 'Login successful',
            redirect: '/supplier/dashboard'
        });
    } catch (err) {
        console.error("Error during supplier login:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        if (!req.session.supplierId) {
            return res.redirect('/supplier/form?error=login_required');
        }

        // Just render the template without data - data will be fetched via API
        res.render('supplier_profile', {
            title: 'Supplier Profile'
        });
    } catch (err) {
        console.error("Error rendering supplier profile:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/supplier/form'
        });
    }
};

// New API endpoint to fetch supplier profile data
exports.getProfileData = async (req, res) => {
    try {
        console.log('Session ID:', req.session.supplierId); // Debug log
        
        if (!req.session.supplierId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Please log in first'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(req.session.supplierId)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid session data' 
            });
        }

        const supplier = await Supplier.findById(req.session.supplierId).lean();

        if (!supplier) {
            return res.status(404).json({
                success: false,
                error: 'Not Found',
                message: 'Supplier not found'
            });
        }

        // Add mock data for orders (replace with actual data from your database)
        const profileData = {
            success: true,
            supplier: {
                name: supplier.name,
                email: supplier.email,
                mobile: supplier.mobile,
                address: supplier.address,
                supplierID: supplier.supplierID
            },
            previousOrders: [
                {
                    orderId: "ORD-1001",
                    orderDate: "10th Jan 2025",
                    status: "Delivered"
                },
                {
                    orderId: "ORD-1002",
                    orderDate: "15th Feb 2025",
                    status: "Cancelled"
                }
            ],
            pendingOrders: [
                {
                    orderId: "ORD-1003",
                    orderDate: "5th Mar 2025"
                }
            ]
        };

        res.status(200).json(profileData);
    } catch (err) {
        console.error("Error fetching supplier profile data:", err.message);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// exports.getProfile = async (req, res) => {
//     try {
//         if (!req.session.supplierId) {
//             return res.redirect('/supplier/form?error=login_required');
//         }

//         if (!mongoose.Types.ObjectId.isValid(req.session.supplierId)) {
//             return res.status(400).render('error', {
//                 message: 'Invalid session data',
//                 redirect: '/supplier/form'
//             });
//         }

//         const supplier = await Supplier.findById(req.session.supplierId).lean();

//         if (!supplier) {
//             return res.status(404).render('error', {
//                 message: 'Supplier not found',
//                 redirect: '/supplier/form'
//             });
//         }

//         supplier.previousOrders = [
//             {
//                 orderId: "ORD-1001",
//                 orderDate: "10th Jan 2025",
//                 status: "Delivered"
//             },
//             {
//                 orderId: "ORD-1002",
//                 orderDate: "15th Feb 2025",
//                 status: "Cancelled"
//             }
//         ];

//         supplier.pendingOrders = [
//             {
//                 orderId: "ORD-1003",
//                 orderDate: "5th Mar 2025"
//             }
//         ];

//         res.render('supplier_profile', {
//             supplier,
//             title: 'Supplier Profile'
//         });
//     } catch (err) {
//         console.error("Error fetching supplier profile:", err.message);
//         res.status(500).render('error', {
//             message: 'Internal server error',
//             details: process.env.NODE_ENV === 'development' ? err.message : undefined,
//             redirect: '/supplier/form'
//         });
//     }
// };

exports.editProfile = async (req, res) => {
    try {
        if (!req.session.supplierId) {
            return res.redirect('/supplier/form?error=login_required');
        }

        if (!mongoose.Types.ObjectId.isValid(req.session.supplierId)) {
            return res.status(400).render('error', {
                message: 'Invalid session data',
                redirect: '/supplier/form'
            });
        }

        const supplier = await Supplier.findById(req.session.supplierId)
            .select('name email mobile address supplierID')
            .lean();

        if (!supplier) {
            return res.status(404).render('error', {
                message: 'Supplier not found',
                redirect: '/supplier/form'
            });
        }

        res.render('supplier_edit_profile', {
            supplier,
            title: 'Edit Supplier Profile'
        });
    } catch (err) {
        console.error("Error fetching supplier data:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/supplier/form'
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        if (!req.session.supplierId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Please log in first'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(req.session.supplierId)) {
            return res.status(400).json({ error: 'Invalid session data' });
        }

        const { name, email, mobile, address, supplierID } = req.body;

        if (!name || !email || !mobile || !address || !supplierID) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'All fields are required'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid email format'
            });
        }

        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(mobile)) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Mobile number must be 10 digits'
            });
        }
        const ifemailExists = await checkEmailExists(email, req.session.supplierId);
        if (ifemailExists) {
            return res.status(400).json({
                error: 'Duplicate Data',
                message: 'Email already in use by another user'
            });
        }

        // Check for existing mobile across all collections
        const ifmobileExists = await checkMobileExists(mobile, req.session.supplierId);
        if (ifmobileExists) {
            return res.status(400).json({
                error: 'Duplicate Data',
                message: 'Mobile number already in use by another user'
            });
        }
        const emailExists = await Supplier.findOne({
            email,
            _id: { $ne: req.session.supplierId }
        });
        if (emailExists) {
            return res.status(400).json({
                error: 'Duplicate Data',
                message: 'Email already in use by another supplier'
            });
        }

        const mobileExists = await Supplier.findOne({
            mobile,
            _id: { $ne: req.session.supplierId }
        });
        if (mobileExists) {
            return res.status(400).json({
                error: 'Duplicate Data',
                message: 'Mobile number already in use by another supplier'
            });
        }

        const supplierIDExists = await Supplier.findOne({
            supplierID,
            _id: { $ne: req.session.supplierId }
        });
        if (supplierIDExists) {
            return res.status(400).json({
                error: 'Duplicate Data',
                message: 'Supplier ID already in use by another supplier'
            });
        }

        const updatedSupplier = await Supplier.findByIdAndUpdate(
            req.session.supplierId,
            { name, email, mobile, address, supplierID },
            { new: true, runValidators: true }
        );

        if (!updatedSupplier) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Supplier not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            redirect: '/supplier/profile'
        });
    } catch (err) {
        console.error("Error updating supplier profile:", err.message);
        res.status(500).json({
            error: 'Server Error',
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getOrders = async (req, res) => {
    try {
        if (!req.session.supplierId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const orders = await Order.find({ supplierId: req.session.supplierId })
            .populate('medicineId', 'name medicineID')
            .populate('patientId', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        res.json(orders.map(order => ({
            id: order._id,
            medicine: order.medicineId.name,
            medicineId: order.medicineId.medicineID,
            patient: order.patientId.name,
            quantity: order.quantity,
            totalCost: order.totalCost,
            status: order.status,
            orderDate: order.createdAt.toLocaleDateString()
        })));
    } catch (err) {
        console.error("Error fetching supplier orders:", err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getDashboard = async (req, res) => {
    try {
        if (!req.session.supplierId) {
            return res.redirect('/supplier/form?error=login_required');
        }

        if (!mongoose.Types.ObjectId.isValid(req.session.supplierId)) {
            return res.status(400).render('error', {
                message: 'Invalid session data',
                redirect: '/supplier/form'
            });
        }

        const supplier = await Supplier.findById(req.session.supplierId).select('email password').lean();

        if (!supplier) {
            return res.status(404).render('error', {
                message: 'Supplier not found',
                redirect: '/supplier/form'
            });
        }

        console.log(`Login Details for Supplier - Email: ${supplier.email}, Password: ${supplier.password}`);

        res.render('supplier_dashboard');
    } catch (err) {
        console.error("Error accessing supplier dashboard:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/supplier/form'
        });
    }
};

exports.getForm = (req, res) => {
    res.render('supplier_form');
};

exports.postAddMedicine = async (req, res) => {
    if (!req.session.supplierId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, medicineID, quantity, cost, manufacturer, expiryDate } = req.body;

    try {
        if (!name || !medicineID || !quantity || !cost || !manufacturer || !expiryDate) {
            return res.status(400).json({
                error: 'All fields are required',
                details: 'Missing required fields'
            });
        }

        // Validate quantity and cost
        if (quantity < 0 || cost < 0) {
            return res.status(400).json({
                error: 'Invalid input',
                details: 'Quantity and cost cannot be negative'
            });
        }

        // Check for existing medicineID
        const existingMedicine = await Medicine.findOne({ medicineID });
        if (existingMedicine) {
            return res.status(400).json({
                error: 'Medicine ID already exists',
                details: 'A medicine with this ID already exists'
            });
        }

        const newMedicine = new Medicine({
            name: name.trim(),
            medicineID: medicineID.trim(),
            quantity: parseInt(quantity),
            cost: parseFloat(cost),
            manufacturer: manufacturer.trim(),
            expiryDate: new Date(expiryDate),
            supplierId: req.session.supplierId
        });

        await newMedicine.save();
        res.status(201).json({
            message: 'Medicine added successfully',
            medicine: newMedicine
        });
    } catch (err) {
        console.error("Error adding medicine:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getMedicines = async (req, res) => {
    if (!req.session.supplierId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const medicines = await Medicine.find({ supplierId: req.session.supplierId })
            .sort({ createdAt: -1 })
            .lean();

        const formattedMedicines = medicines.map(med => ({
            id: med._id,
            name: med.name,
            medicineID: med.medicineID,
            quantity: med.quantity,
            cost: med.cost.toFixed(2),
            manufacturer: med.manufacturer,
            expiryDate: new Date(med.expiryDate).toLocaleDateString('en-US')
        }));

        res.json(formattedMedicines);
    } catch (err) {
        console.error("Error fetching medicines:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.deleteMedicine = async (req, res) => {
    if (!req.session.supplierId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid medicine ID' });
        }

        const result = await Medicine.deleteOne({
            _id: id,
            supplierId: req.session.supplierId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Medicine not found or unauthorized' });
        }

        res.json({ message: 'Medicine removed successfully' });
    } catch (err) {
        console.error("Error removing medicine:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};
