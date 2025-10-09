const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');

router.get('/dashboard', supplierController.getDashboard);
router.get('/form', supplierController.getForm);
router.post('/signup', supplierController.signup);
router.post('/login', supplierController.login);
router.get('/profile', supplierController.getProfile);
router.get('/edit-profile', supplierController.editProfile);
router.post('/update-profile', supplierController.updateProfile);
router.get('/profile-data', supplierController.getProfileData);

// Medicines
router.post('/api/add-medicine', supplierController.postAddMedicine);
router.get('/api/medicines', supplierController.getMedicines);
router.delete('/api/medicines/:id', supplierController.deleteMedicine);

// Orders (only routes with existing handlers)
router.get('/api/orders', supplierController.getOrders);

module.exports = router;