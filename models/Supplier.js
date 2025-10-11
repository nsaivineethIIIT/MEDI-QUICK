const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    supplierID: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    lastLogin: { type: Date },
    profilePhoto: {
        type: String,
        default: '/images/dummy-profile.png'
    }
}, { timestamps: true });

const Supplier = mongoose.model('Supplier', supplierSchema);
module.exports = Supplier;
