const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { uploadBlog } = require('../middlewares/upload');

router.get('/', blogController.getBlogs);
router.get('/post', blogController.getPostForm);
router.post('/submit', uploadBlog.array('images', 5), blogController.postSubmit);
router.get('/:id', blogController.getSingle);

module.exports = router;