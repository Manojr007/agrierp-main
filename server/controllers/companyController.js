const Company = require('../models/Company');

// @desc    Get company info
// @route   GET /api/company
exports.getCompany = async (req, res, next) => {
    try {
        let company = await Company.findOne();
        if (!company) {
            company = await Company.create({
                name: 'My AgriERP Company',
                gstNumber: '22AAAAA0000A1Z5',
                address: { city: 'Pune', state: 'Maharashtra' },
            });
        }
        res.json({ success: true, data: company });
    } catch (error) {
        next(error);
    }
};

// @desc    Update company info
// @route   PUT /api/company
exports.updateCompany = async (req, res, next) => {
    try {
        let company = await Company.findOne();
        if (!company) {
            company = await Company.create(req.body);
        } else {
            company = await Company.findByIdAndUpdate(company._id, req.body, {
                new: true,
                runValidators: true,
            });
        }
        res.json({ success: true, data: company });
    } catch (error) {
        next(error);
    }
};
