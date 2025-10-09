const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

router.post('/signup', employeeController.signup);
router.post('/login', employeeController.login);
router.get('/dashboard', employeeController.getDashboard);
router.get('/form', employeeController.getForm);
router.get('/doctor_requests', employeeController.getDoctorRequests);
router.get('/logout', employeeController.logout);
router.get('/doctor_requests_count', employeeController.getDoctorRequestsCount);
router.get('/profile', employeeController.getProfile);
router.get('/edit-profile', employeeController.editProfile);
router.post('/update-profile', employeeController.updateProfile);
router.post('/approve_doctor/:id', employeeController.postApproveDoctor);
router.get('/profile-data', employeeController.getProfileData);

module.exports = router;