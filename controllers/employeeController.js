const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');
const Supplier = require('../models/Supplier');
const Employee = require('../models/Employee');
const Appointment = require('../models/Appointment');
const Order = require('../models/Order')
const mongoose = require('mongoose');
const { EMPLOYEE_SECURITY_CODE } = require('../constants/constants');

const {checkEmailExists, checkMobileExists} = require('../utils/utils');

exports.signup = async (req, res) => {
    const {
        name,
        email,
        mobile,
        address,
        password,
        securityCode
    } = req.body;

    try {
        if (!name || !email || !mobile || !address || !password || !securityCode) {
            return res.status(400).json({
                error: 'All fields are required',
                details: 'Missing name, email, mobile, address, password, or security code'
            });
        }

        if (securityCode !== EMPLOYEE_SECURITY_CODE) {
            return res.status(400).json({
                error: 'Invalid security code',
                details: 'The provided security code is incorrect'
            });
        }
        // Enforce uniqueness within Employee collection only
        const existingEmployee = await Employee.findOne({ email });

        if (existingEmployee) {
            return res.status(400).json({
                error: 'Employee with this email already exists',
                details: 'Email must be unique'
            });
        }

        // Ensure mobile is unique within Employee collection
        const existingMobileEmployee = await Employee.findOne({ mobile });
        if (existingMobileEmployee) {
            return res.status(400).json({
                error: 'Mobile number already in use',
                details: 'This mobile number is already registered with another employee'
            });
        }

        const newEmployee = new Employee({
            name,
            email,
            mobile,
            address,
            password
        });

        await newEmployee.save();

        res.status(201).json({
            message: 'Signup successful',
            redirect: '/employee_form'
        });
    } catch (err) {
        console.error("Error during employee signup:", err.message);
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
            return res.status(400).json({
                error: 'All fields are required',
                details: 'Missing email, password, or security code'
            });
        }

        if (securityCode !== EMPLOYEE_SECURITY_CODE) {
            return res.status(400).json({
                error: 'Invalid security code',
                details: 'The provided security code is incorrect'
            });
        }

        const employee = await Employee.findOne({ email, password });

        if (!employee) {
            return res.status(401).json({
                error: 'Invalid credentials',
                details: 'Incorrect email or password'
            });
        }
        // Update lastLogin
        employee.lastLogin = new Date();
        await employee.save();
        req.session.employeeId = employee._id.toString();
        return res.status(200).json({
            message: 'Login successful',
            redirect: '/employee/dashboard'
        });
    } catch (err) {
        console.error("Error during employee login:", err.message);
        return res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.logout = async (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err.message);
        }
        res.redirect('employee/dashboard');
    });
    res.status(200).json({
        message: 'Logout successful',
        redirect: '/employee/form'
    });
};

exports.getDoctorRequestsCount = async (req, res) => {
    const count = await Doctor.countDocuments({ isApproved: false });
    console.log(`Doctor requests count: ${count}`);
        res.status(200).json({
        count
    });
};


// exports.getProfile = async (req, res) => {
//     try {
//         if (!req.session.employeeId) {
//             return res.redirect('/employee/form?error=login_required');
//         }

//         if (!mongoose.Types.ObjectId.isValid(req.session.employeeId)) {
//             return res.status(400).render('error', {
//                 message: 'Invalid session data',
//                 redirect: '/employee/form'
//             });
//         }

//         const employee = await Employee.findById(req.session.employeeId).lean();

//         if (!employee) {
//             return res.status(404).render('error', {
//                 message: 'Employee not found',
//                 redirect: '/employee/form'
//             });
//         }

//         employee.previousRegistrations = [
//             {
//                 doctorName: "Dr. Smith",
//                 registrationDate: "15th Jan 2025",
//                 status: "Approved"
//             },
//             {
//                 doctorName: "Dr. Johnson",
//                 registrationDate: "22nd Feb 2025",
//                 status: "Rejected"
//             }
//         ];

//         employee.pendingRegistrations = [
//             {
//                 doctorName: "Dr. Williams",
//                 registrationDate: "5th Mar 2025"
//             }
//         ];

//         res.render('employee_profile', {
//             employee,
//             title: 'Employee Profile'
//         });
//     } catch (err) {
//         console.error("Error fetching employee profile:", err.message);
//         res.status(500).render('error', {
//             message: 'Internal server error',
//             details: process.env.NODE_ENV === 'development' ? err.message : undefined,
//             redirect: '/employee_form'
//         });
//     }
// };
exports.getProfile = async (req, res) => {
    try {
        if (!req.session.employeeId) {
            return res.redirect('/employee/form?error=login_required');
        }

        if (!mongoose.Types.ObjectId.isValid(req.session.employeeId)) {
            return res.status(400).render('error', {
                message: 'Invalid session data',
                redirect: '/employee/form'
            });
        }

        // Just render the template without data - data will be fetched via API
        res.render('employee_profile', {
            title: 'Employee Profile'
        });
    } catch (err) {
        console.error("Error rendering employee profile:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/employee/form'
        });
    }
};

exports.getProfileData = async (req, res) => {
    try {
        if (!req.session.employeeId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Please log in first'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(req.session.employeeId)) {
            return res.status(400).json({ error: 'Invalid session data' });
        }

        const employee = await Employee.findById(req.session.employeeId).lean();

        if (!employee) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Employee not found'
            });
        }

        // Add mock data for registrations (replace with actual data from your database)
        const profileData = {
            employee: {
                name: employee.name,
                email: employee.email,
                mobile: employee.mobile,
                address: employee.address
            },
            previousRegistrations: [
                {
                    doctorName: "Dr. Smith",
                    registrationDate: "15th Jan 2025",
                    status: "Approved"
                },
                {
                    doctorName: "Dr. Johnson",
                    registrationDate: "22nd Feb 2025",
                    status: "Rejected"
                }
            ],
            pendingRegistrations: [
                {
                    doctorName: "Dr. Williams",
                    registrationDate: "5th Mar 2025"
                }
            ]
        };

        res.status(200).json(profileData);
    } catch (err) {
        console.error("Error fetching employee profile data:", err.message);
        res.status(500).json({
            error: 'Server Error',
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.editProfile = async (req, res) => {
    try {
        if (!req.session.employeeId) {
            return res.redirect('/employee/form?error=login_required');
        }

        if (!mongoose.Types.ObjectId.isValid(req.session.employeeId)) {
            return res.status(400).render('error', {
                message: 'Invalid session data',
                redirect: '/employee/form'
            });
        }

        const employee = await Employee.findById(req.session.employeeId)
            .select('name email mobile address')
            .lean();

        if (!employee) {
            return res.status(404).render('error', {
                message: 'Employee not found',
                redirect: '/employee_form'
            });
        }

        res.render('employee_edit_profile', {
            employee,
            title: 'Edit Employee Profile'
        });
    } catch (err) {
        console.error("Error fetching employee data:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/employee_form'
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        if (!req.session.employeeId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Please log in first'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(req.session.employeeId)) {
            return res.status(400).json({ error: 'Invalid session data' });
        }

        const { name, email, mobile, address } = req.body;

        if (!name || !email || !mobile || !address) {
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
        const ifemailExists = await checkEmailExists(email, req.session.employeeId);
        if (ifemailExists) {
            return res.status(400).json({
                error: 'Duplicate Data',
                message: 'Email already in use by another user'
            });
        }
        // Check for existing mobile across all collections
        const ifmobileExists = await checkMobileExists(mobile, req.session.employeeId);
        if (ifmobileExists) {
            return res.status(400).json({
                error: 'Duplicate Data',
                message: 'Mobile number already in use by another user'
            });
        }
        const emailExists = await Employee.findOne({
            email,
            _id: { $ne: req.session.employeeId }
        });
        if (emailExists) {
            return res.status(400).json({
                error: 'Duplicate Data',
                message: 'Email already in use by another employee'
            });
        }

        const mobileExists = await Employee.findOne({
            mobile,
            _id: { $ne: req.session.employeeId }
        });
        if (mobileExists) {
            return res.status(400).json({
                error: 'Duplicate Data',
                message: 'Mobile number already in use by another employee'
            });
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(
            req.session.employeeId,
            { name, email, mobile, address },
            { new: true, runValidators: true }
        );

        if (!updatedEmployee) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Employee not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            redirect: '/employee/profile'
        });
    } catch (err) {
        console.error("Error updating employee profile:", err.message);
        res.status(500).json({
            error: 'Server Error',
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getDashboard = async (req, res) => {
    try {
        if (!req.session.employeeId) {
            return res.redirect('/employee/form?error=login_required');
        }

        if (!mongoose.Types.ObjectId.isValid(req.session.employeeId)) {
            return res.status(400).render('error', {
                message: 'Invalid session data',
                redirect: '/employee/form'
            });
        }

        const employee = await Employee.findById(req.session.employeeId).select('email password').lean();

        if (!employee) {
            return res.status(404).render('error', {
                message: 'Employee not found',
                redirect: '/employee/form'
            });
        }

        console.log(`Login Details for Employee - Email: ${employee.email}, Password: ${employee.password}`);

        res.render('employee_dashboard');
    } catch (err) {
        console.error("Error accessing employee dashboard:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/employee_form'
        });
    }
};

exports.getForm = (req, res) => {
    res.render('employee_form');
};

exports.getDoctorRequests = async (req, res) => {
    try {
        const doctors = await Doctor.find({ isApproved: false }).lean();
        res.render('employee_doctor_requests', { doctors });
    } catch (err) {
        console.error("Error fetching doctor requests:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/employee/dashboard'
        });
    }
};

exports.postApproveDoctor = async (req, res) => {
    const { id } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).render('error', {
                message: 'Invalid doctor ID',
                redirect: '/employee/dashboard'
            });
        }

        const ssn = 'DOC-' + Math.floor(100000000 + Math.random() * 900000000);
        await Doctor.findByIdAndUpdate(id, {
            isApproved: true,
            ssn
        });

        res.redirect('/employee/dashboard');
    } catch (err) {
        console.error("Error approving doctor:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/employee/dashboard'
        });
    }
};