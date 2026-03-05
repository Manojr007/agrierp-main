const express = require('express');
const router = express.Router();
const { getCompany, updateCompany } = require('../controllers/companyController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');

router.route('/')
    .get(protect, getCompany)
    .put(protect, authorize('admin'), updateCompany);

module.exports = router;
