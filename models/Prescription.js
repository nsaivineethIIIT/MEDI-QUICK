const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    patientName: { 
        type: String, 
        required: true 
    },
    patientEmail: { 
        type: String, 
        required: true 
    },
    doctorEmail: { 
        type: String, 
        required: true 
    },
    age: { 
        type: Number, 
        required: true 
    },
    gender: { 
        type: String, 
        enum: ['male', 'female', 'other'],
        required: true 
    },
    weight: { 
        type: Number, 
        required: true 
    },
    appointmentDate: { 
        type: Date, 
        required: true 
    },
    appointmentTime: { 
        type: String, 
        required: true 
    },
    symptoms: { 
        type: String, 
        required: true 
    },
    medicines: [{
        medicineName: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        instructions: { type: String }
    }],
    additionalNotes: { 
        type: String 
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    }
}, { timestamps: true });


const Prescription = mongoose.model('Prescription', prescriptionSchema);
module.exports = Prescription;