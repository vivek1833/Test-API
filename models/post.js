const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
    "title": {
        type: String,
        required: true,
    },
    "body": {
        type: String,
        required: true,
    },
    "image": {
        type: String,
        required: true
    },
    "like": {
        type: Number,
        required: true
    },
    "comments": [{
        comment: {
            type: String,
            required: true
        }
    }]
})

const Post = new mongoose.model("post", postSchema);

module.exports = Post;