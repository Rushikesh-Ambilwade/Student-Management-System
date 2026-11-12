const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/', authenticate, getAnnouncements);
router.post('/', authenticate, authorize(['admin']), createAnnouncement);
router.put('/:id', authenticate, authorize(['admin']), updateAnnouncement);
router.delete('/:id', authenticate, authorize(['admin']), deleteAnnouncement);

module.exports = router;
