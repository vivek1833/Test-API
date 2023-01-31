const mongoose = require('mongoose')

const regSchema = new mongoose.Schema({
    "username": {
        type: String,
        required: true,
    },
    "email": {
        type: String,
        required: true,
        unique: true,
    },
    "password": {
        type: String,
        required: true
    },
    "tokens": [{
        token: {
            type: String,
            required: true
        }
    }]
})

const User = new mongoose.model("testuser", regSchema);

module.exports = User;