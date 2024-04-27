'use strict';
const mongoose = require('mongoose');

const OTPModel = mongoose.model('otp', {
    email: {
        type: String,
        required: true,
        trim: true,
    },
    otp: {
        type: Number,
        required: true,
        trim: true,
    },
});

module.exports = OTPModel;