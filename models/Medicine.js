const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    medicineID: { type: String, required: true, unique: true },
    quantity: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: true, min: 0 }, // Added cost field
    manufacturer: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    }
}, { timestamps: true });

const Medicine = mongoose.model('Medicine', medicineSchema);

module.exports = Medicine; // Add this line to export the model
