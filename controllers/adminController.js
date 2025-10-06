const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');
const Supplier = require('../models/Supplier');
const Employee = require('../models/Employee');
const Appointment = require('../models/Appointment');
const {checkEmailExists, checkMobileExists} = require('../utils/utils');
const { ADMIN_SECURITY_CODE } = require('../constants/constants');
const mongoose = require('mongoose');

exports.signup = async (req, res) => {
    const { name, email, mobile, address, password, securityCode } = req.body;

    try {
        if (!name || !email || !mobile || !address || !password || !securityCode) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (securityCode !== ADMIN_SECURITY_CODE) {
            return res.status(400).json({ error: 'Invalid security code' });
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

        const existingAdmin = await Admin.findOne({ email });

        if (existingAdmin) {
            return res.status(400).json({ error: 'Admin with this email already exists' });
        }

        const newAdmin = new Admin({ name, email, mobile, address, password });
        await newAdmin.save();

        res.status(201).json({
            message: 'Signup successful',
            redirect: '/admin/form'
        });
    } catch (err) {
        console.error("Error during admin signup:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.login = async (req, res) => {
    const { email, password, securityCode } = req.body;

    try {
        if (!email || !password || !securityCode) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (securityCode !== ADMIN_SECURITY_CODE) {
            return res.status(400).json({ error: 'Invalid security code' });
        }

        const admin = await Admin.findOne({ email, password });

        if (!admin) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Update lastLogin
        admin.lastLogin = new Date();
        await admin.save();
        req.session.adminId = admin._id.toString();
        res.status(200).json({
            message: 'Login successful',
            redirect: '/admin/dashboard'
        });
    } catch (err) {
        console.error("Error during admin login:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getProfile =  async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.redirect('/admin_form?error=login_required');
        }

        if (!mongoose.Types.ObjectId.isValid(req.session.adminId)) {
            return res.status(400).render('error', {
                message: 'Invalid session data',
                redirect: '/admin_form'
            });
        }

        const admin = await Admin.findById(req.session.adminId).lean();

        if (!admin) {
            return res.status(404).render('error', {
                message: 'Admin not found',
                redirect: '/admin_form'
            });
        }

        admin.completedConsultations = [
            {
                doctorName: "Dr. John",
                consultationDate: "10th May 2025",
                slot: "10AM - 11AM",
                onlineStatus: "Online"
            },
            {
                doctorName: "Dr. Smith",
                consultationDate: "12th May 2025",
                slot: "2PM - 3PM",
                onlineStatus: "Offline"
            }
        ];

        admin.pendingConsultations = [
            {
                doctorName: "Dr. Alice",
                consultationDate: "15th May 2025",
                slot: "11AM - 12PM",
                onlineStatus: "Online"
            }
        ];

        res.render('admin_profile', {
            admin,
            title: 'Admin Profile'
        });
    } catch (err) {
        console.error("Error fetching admin profile:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/'
        });
    }
};

exports.getEditProfile = async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.redirect('/admin_form?error=login_required');
        }

        if (!mongoose.Types.ObjectId.isValid(req.session.adminId)) {
            return res.status(400).render('error', {
                message: 'Invalid session data',
                redirect: '/admin_form'
            });
        }

        const admin = await Admin.findById(req.session.adminId)
            .select('name email mobile address')
            .lean();

        if (!admin) {
            return res.status(404).render('error', {
                message: 'Admin not found',
                redirect: '/admin_form'
            });
        }

        res.render('admin_edit_profile', {
            admin,
            title: 'Edit Admin Profile'
        });
    } catch (err) {
        console.error("Error fetching admin data:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/'
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.status(401).json({ error: 'Unauthorized: Please log in first' });
        }

        if (!mongoose.Types.ObjectId.isValid(req.session.adminId)) {
            return res.status(400).json({ error: 'Invalid session data' });
        }

        const { name, email, mobile, address } = req.body;

        if (!name || !email || !mobile || !address) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const emailExists = await Admin.findOne({ email, _id: { $ne: req.session.adminId } });
        if (emailExists) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        const mobileExists = await Admin.findOne({ mobile, _id: { $ne: req.session.adminId } });
        if (mobileExists) {
            return res.status(400).json({ error: 'Mobile number already in use' });
        }

        await Admin.findByIdAndUpdate(
            req.session.adminId,
            { name, email, mobile, address },
            { new: true }
        );

        res.redirect('/admin/profile');
    } catch (err) {
        console.error("Error updating admin profile:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getSignins = async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.status(401).json({ error: 'Unauthorized: Please log in as admin' });
        }
        const patients = await Patient.find().select('name email lastLogin').lean();
        const doctors = await Doctor.find().select('name email lastLogin').lean();
        const suppliers = await Supplier.find().select('name email lastLogin').lean();
        const employees = await Employee.find().select('name email lastLogin').lean();
        const admins = await Admin.find({ _id: { $ne: req.session.adminId } }).select('name email lastLogin').lean();

        const signins = [
            ...patients.map(p => ({ ...p, type: 'Patient' })),
            ...doctors.map(d => ({ ...d, type: 'Doctor' })),
            ...suppliers.map(s => ({ ...s, type: 'Supplier' })),
            ...employees.map(e => ({ ...e, type: 'Employee' })),
            ...admins.map(a => ({ ...a, type: 'Admin' }))
        ]
            .filter(user => user.lastLogin) // Only include users with a lastLogin
            .map(user => ({
                name: user.name,
                type: user.type,
                email: user.email,
                date: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-US') : 'N/A',
                time: user.lastLogin ? new Date(user.lastLogin).toLocaleTimeString('en-US') : 'N/A'
            }))
            .sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin)) // Sort by most recent
            .slice(0, 50); // Limit to 50 recent sign-ins

        res.json(signins);
    } catch (err) {
        console.error("Error fetching signins:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getUsers = async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.status(401).json({ error: 'Unauthorized: Please log in as admin' });
        }

        const patients = await Patient.find().select('name email').lean();
        const doctors = await Doctor.find().select('name email').lean();
        const suppliers = await Supplier.find().select('name email').lean();
        const employees = await Employee.find().select('name email').lean();
        const admins = await Admin.find({ _id: { $ne: req.session.adminId } }).select('name email').lean();

        const users = [
            ...patients.map(p => ({ ...p, type: 'Patient' })),
            ...doctors.map(d => ({ ...d, type: 'Doctor' })),
            ...suppliers.map(s => ({ ...s, type: 'Supplier' })),
            ...employees.map(e => ({ ...e, type: 'Employee' })),
            ...admins.map(a => ({ ...a, type: 'Admin' }))
        ];

        res.json(users);
    } catch (err) {
        console.error("Error fetching users:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.status(401).json({ error: 'Unauthorized: Please log in as admin' });
        }

        const { type, id } = req.params;
        let Model;

        switch (type.toLowerCase()) {
            case 'patient':
                Model = Patient;
                break;
            case 'doctor':
                Model = Doctor;
                break;
            case 'supplier':
                Model = Supplier;
                break;
            case 'employee':
                Model = Employee;
                break;
            case 'admin':
                Model = Admin;
                break;
            default:
                return res.status(400).json({ error: 'Invalid user type' });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // Prevent admin from deleting their own account
        if (type.toLowerCase() === 'admin' && id === req.session.adminId) {
            return res.status(403).json({ error: 'Cannot delete own admin account' });
        }

        // Delete associated appointments for patients and doctors
        if (type.toLowerCase() === 'patient') {
            await Appointment.deleteMany({ patientId: id });
        } else if (type.toLowerCase() === 'doctor') {
            await Appointment.deleteMany({ doctorId: id });
        }

        const deletedUser = await Model.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error("Error deleting user:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getDashboard = async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.redirect('/admin_form?error=login_required');
        }

        if (!mongoose.Types.ObjectId.isValid(req.session.adminId)) {
            return res.status(400).render('error', {
                message: 'Invalid session data',
                redirect: '/admin_form'
            });
        }

        const admin = await Admin.findById(req.session.adminId).select('email password').lean();

        if (!admin) {
            return res.status(404).render('error', {
                message: 'Admin not found',
                redirect: '/admin_form'
            });
        }

        console.log(`Login Details for Admin - Email: ${admin.email}, Password: ${admin.password}`);

        res.render('admin_dashboard');
    } catch (err) {
        console.error("Error accessing admin dashboard:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/admin_form'
        });
    }
};

exports.getForm = (req, res) => {
    res.render('admin_form');
};

exports.getAppointments = async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Add date filtering if provided
        const { startDate, endDate } = req.query;
        let query = {
            isBlockedSlot: { $ne: true },
            status: { $ne: 'cancelled' }
        };

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const appointments = await Appointment.find(query)
            .populate('patientId', 'name')
            .populate('doctorId', 'name specialization')
            .sort({ date: 1, time: 1 })
            .lean();

        const formattedAppointments = appointments.map(appt => {
            const dateStr = appt.date.toISOString().split('T')[0];
            return {
                _id: appt._id,
                patientName: appt.patientId?.name || 'Unknown Patient',
                doctorName: appt.doctorId?.name || 'Unknown Doctor',
                doctorId: appt.doctorId?._id,
                specialization: appt.doctorId?.specialization || 'General Physician',
                date: dateStr,
                time: appt.time,
                fee: appt.consultationFee || 0,
                revenue: (appt.consultationFee || 0) * 0.1, // 10% revenue
                status: appt.status
            };
        });

        res.json(formattedAppointments);
    } catch (err) {
        console.error("Error fetching appointments:", err.message);
        res.status(500).json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getEarnings =  async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Define the start date (Jan 1, 2025)
        const startDate = new Date('2025-01-01');
        const endDate = new Date(); // Current date

        // Fetch appointments within the date range
        const appointments = await Appointment.find({
            isBlockedSlot: { $ne: true },
            status: { $ne: 'cancelled' },
            date: { $gte: startDate, $lte: endDate }
        })
            .populate('doctorId', 'specialization')
            .lean();

        // Aggregate daily earnings
        const dailyEarnings = {};
        appointments.forEach(appt => {
            const dateStr = appt.date.toISOString().split('T')[0]; // YYYY-MM-DD
            if (!dailyEarnings[dateStr]) {
                dailyEarnings[dateStr] = {
                    date: dateStr,
                    count: 0,
                    totalFees: 0,
                    totalRevenue: 0
                };
            }
            dailyEarnings[dateStr].count++;
            dailyEarnings[dateStr].totalFees += appt.consultationFee || 0;
            dailyEarnings[dateStr].totalRevenue += (appt.consultationFee || 0) * 0.1;
        });

        // Aggregate monthly earnings
        const monthlyEarnings = {};
        appointments.forEach(appt => {
            const date = new Date(appt.date);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            if (!monthlyEarnings[monthKey]) {
                monthlyEarnings[monthKey] = {
                    month: monthKey,
                    count: 0,
                    totalFees: 0,
                    totalRevenue: 0
                };
            }
            monthlyEarnings[monthKey].count++;
            monthlyEarnings[monthKey].totalFees += appt.consultationFee || 0;
            monthlyEarnings[monthKey].totalRevenue += (appt.consultationFee || 0) * 0.1;
        });

        // Aggregate yearly earnings
        const yearlyEarnings = {};
        appointments.forEach(appt => {
            const year = new Date(appt.date).getFullYear();
            if (!yearlyEarnings[year]) {
                yearlyEarnings[year] = {
                    year,
                    count: 0,
                    totalFees: 0,
                    totalRevenue: 0
                };
            }
            yearlyEarnings[year].count++;
            yearlyEarnings[year].totalFees += appt.consultationFee || 0;
            yearlyEarnings[year].totalRevenue += (appt.consultationFee || 0) * 0.1;
        });

        // Convert to arrays and sort
        const dailyEarningsArray = Object.values(dailyEarnings)
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
        const monthlyEarningsArray = Object.values(monthlyEarnings)
            .sort((a, b) => a.month.localeCompare(b.month));
        const yearlyEarningsArray = Object.values(yearlyEarnings)
            .sort((a, b) => a.year - b.year);

        res.json({
            daily: dailyEarningsArray,
            monthly: monthlyEarningsArray,
            yearly: yearlyEarningsArray
        });
    } catch (err) {
        console.error("Error fetching earnings:", err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getSignins = async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get all users from all collections with timestamps
        const [patients, doctors, admins, suppliers, employees] = await Promise.all([
            Patient.find().select('name email createdAt').lean(),
            Doctor.find().select('name email createdAt').lean(),
            Admin.find().select('name email createdAt').lean(),
            Supplier.find().select('name email createdAt').lean(),
            Employee.find().select('name email createdAt').lean()
        ]);

        // Combine all users and add type information
        const allUsers = [
            ...patients.map(u => ({ ...u, type: 'Patient' })),
            ...doctors.map(u => ({ ...u, type: 'Doctor' })),
            ...admins.map(u => ({ ...u, type: 'Admin' })),
            ...suppliers.map(u => ({ ...u, type: 'Supplier' })),
            ...employees.map(u => ({ ...u, type: 'Employee' }))
        ];

        // Sort by lastLogin date (newest first)
        allUsers.sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin));

        // Format the data
        const signins = allUsers.map(user => ({
            name: user.name,
            email: user.email,
            date: user.createdAt.toLocaleDateString('en-US'),
            time: user.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            type: user.type
        }));

        res.json(signins);
    } catch (err) {
        console.error("Error fetching signins:", err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};