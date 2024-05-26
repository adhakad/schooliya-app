'use strict';
const mongoose = require('mongoose');

const StudentUserModel = mongoose.model('student-user', {
    adminId: {
        type: String,
        required: true,
        trim: true
      },
    studentId: {
        type: String,
        required: true,
        trim: true,
        unique:true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique:true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
});

module.exports = StudentUserModel;