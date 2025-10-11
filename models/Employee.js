const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    password: { type: String, required: true },
    lastLogin: { type: Date },
    profilePhoto: {
        type: String,
        default: '/images/dummy-profile.png' // Path to dummy photo in public/images
    }
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);
module.exports = Employee;
