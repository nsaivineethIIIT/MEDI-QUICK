const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/dashboard', adminController.getDashboard); // Admin dashboard
router.get('/api/appointments', adminController.getAppointments); // Get all appointments (with filtering)
router.get('/api/earnings', adminController.getEarnings); // Get earnings data
router.get('/api/signins', adminController.getSignins);
router.get('/form', adminController.getForm);  // Get all sign-in activities
router.post('/login',adminController.login);
router.post('/signup',adminController.signup);
router.get('/users',adminController.getUsers);
router.delete('/users/:type/:id',adminController.deleteUser);
router.get('/profile', adminController.getProfile); // Get doctor profile
router.get('/edit-profile', adminController.getEditProfile); // Get edit profile form
router.post('/update-profile', adminController.updateProfile);
router.get('/profile-data', adminController.getProfileData);

module.exports = router;