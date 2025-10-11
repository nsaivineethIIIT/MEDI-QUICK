const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const upload = require('../middlewares/upload'); // ✅ NOT { upload }


router.get('/dashboard', supplierController.getDashboard);
router.get('/form', supplierController.getForm);
router.post('/signup', supplierController.signup);
router.post('/login', supplierController.login);
router.get('/profile', supplierController.getProfile);
router.get('/edit-profile', supplierController.editProfile);
router.post('/update-profile', supplierController.updateProfile);

// Medicines
router.post('/api/add-medicine', supplierController.postAddMedicine);
router.get('/api/medicines', supplierController.getMedicines);
router.delete('/api/medicines/:id', supplierController.deleteMedicine);

// Orders (only routes with existing handlers)
router.get('/api/orders', supplierController.getOrders);

// File upload
router.post('/uploadPhoto/:id', upload.single('profilePhoto'), supplierController.uploadPhoto);
router.post('/profile/photo', upload.single('profilePhoto'), supplierController.updateProfilePhoto);

// Home page
router.get('/home_page.html', (req, res) => {
  res.render('supplier_home_page'); // or res.sendFile if it's a static HTML
});
router.get('/home', (req, res) => {
  res.render('supplier_home_page'); // or res.sendFile if using HTML
  // OR
  // res.sendFile(path.join(__dirname, '../public/supplier/home_page.html')); // If using static HTML
});

module.exports = router;