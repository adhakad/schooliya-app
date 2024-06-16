'use strict';
const mongoose = require('mongoose');
const MarksheetStructureModel = mongoose.model('marksheet-structure', {
    session: {
        type: String,
        required: true,
        trim: true,
    },
    adminId: {
        type: String,
        required: true,
        trim: true
    },
    class: {
        type: Number,
        required: true,
        trim: true,
    },
    stream: {
        type: String,
        required: true,
        trim: true,
    },

    // selectedExamType:{0:["halfYearly","final"]},







    resultPublishStatus: {
        type: Boolean,
        required: true,
        trim: true,
        enum: [true, false],
        default: false,
    }
});

module.exports = MarksheetStructureModel;