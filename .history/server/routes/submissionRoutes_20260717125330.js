const express = require('express');
const router = express.Router();
const { submitTask, getSubmission, getAllSubmissions, reviewSubmission } = require('../controllers/submissionController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// ── Admin routes (defined FIRST — must come before /:taskId to avoid shadowing) ──
router.get('/admin/all', protect, adminOnly, getAllSubmissions);
router.put('/:id/review', protect, adminOnly, reviewSubmission);

// ── Talent routes ──
// so the file is saved to disk even if the request is later rejected
router.post("/:taskId", protect, (req, res, next) => {
  upload.single("file")(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        message: err.message,
      });
    }

    next();
  });
}, submitTask);
router.get('/:taskId', protect, getSubmission);

module.exports = router;
