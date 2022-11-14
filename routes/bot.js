const express = require(`express`);
const router = express.Router();
const { f1, f2, f3 } = require(`../controllers`);

router.route(`/`).post(f1);

module.exports = router;
