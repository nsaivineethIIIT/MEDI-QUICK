const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: function () { return !this.isBlockedSlot; } // Only required if not a blocked slot
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled', 'blocked'],
        default: 'pending'
    },
    type: {
        type: String,
        enum: ['online', 'offline'],
        required: function () { return !this.isBlockedSlot; } // Only required if not a blocked slot
    },
    consultationFee: {
        type: Number,
        required: function () { return !this.isBlockedSlot; } // Only required if not a blocked slot
    },
    notes: String,
    isBlockedSlot: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;
