const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    theme: { type: String, required: true },
    content: { type: String, required: true },
    authorName: { type: String, required: true },
    authorEmail: { type: String, required: true },
    authorType: { type: String, enum: ['user', 'doctor', 'employee'], default: 'user' },
    images: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;