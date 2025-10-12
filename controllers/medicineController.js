const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');

exports.getDetail = async (req, res) => {
    try {
        if (!req.session.patientId) {
            return res.redirect('/patient/form?error=login_required'); // Updated to match patientController.js
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).render('error', {
                message: 'Invalid medicine ID',
                redirect: '/patient/order-medicines' // Updated to match route
            });
        }

        const medicine = await Medicine.findById(req.params.id).lean();

        if (!medicine) {
            return res.status(404).render('error', {
                message: 'Medicine not found',
                redirect: '/patient/order-medicines' // Updated to match route
            });
        }

        // Format expiry date for display
        const formattedExpiryDate = medicine.expiryDate ?
            new Date(medicine.expiryDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short'
            }) : 'Not specified';

        res.render('medicine_detail', {
            medicine: {
                ...medicine,
                formattedExpiryDate,
                imageUrl: medicine.imageUrl || 'https://th.bing.com/th/id/OIP.1N_r8UyW1bIoHyb_YCmcaAHaHa?w=250&h=250&c=8&rs=1&qlt=90&o=6&dpr=1.3&pid=3.1&rm=2', // Use model field if available
                returnPolicy: medicine.returnPolicy || '3 DAYS RETURNABLE', // Use model field if available
                consumeType: medicine.consumeType || 'TOPICAL' // Use model field if available
            },
            title: medicine.name
        });
    } catch (err) {
        console.error("Error fetching medicine:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/patient/order-medicines' // Updated to match route
        });
    }
};
