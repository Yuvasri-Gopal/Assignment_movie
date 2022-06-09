"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.schema;
const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    }
});
module.exports = mongoose.model('user', userSchema);
