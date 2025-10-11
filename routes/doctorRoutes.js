const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { upload } = require('../middlewares/upload');
// modified doctor routes to complete implementation of appointment booking and cancellation
router.get('/dashboard', doctorController.getDashboard); // Doctor dashboard
router.get('/api/daily-earnings', doctorController.getDailyEarnings); // Get daily earnings
router.get('/form', doctorController.getForm); // Get form
router.post('/signup', upload.single('document'), doctorController.signup); // Doctor signup
router.post('/login', doctorController.login); // Doctor login
router.get('/profile', doctorController.getProfile); // Get doctor profile
router.get('/edit-profile', doctorController.getEditProfile); // Get edit profile form
router.post('/update-profile', doctorController.updateProfile); // Update doctor profile
router.get('/appointments',doctorController.getDoctorAppiontments);
router.get('/appointments/previous',doctorController.getPreviousAppointments);
router.get('/appointments/upcoming',doctorController.getUpcomingAppointments);
router.get('/api/profile',doctorController.getDoctorDetails);
// In doctorRoutes.js
router.get('/prescriptions/download/:id', doctorController.downloadPrescription);
//prescription routes
router.get('/generate-prescriptions', doctorController.getGeneratePrescriptionPage);
router.get('/prescriptions', doctorController.getPrescriptionsPage);
module.exports = router;