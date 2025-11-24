import express from 'express';
import authRoute from './Auth/auth.route.js';
import commonRoute from './Common/common.route.js';

let router = express.Router();

router.use('/auth', authRoute);
router.use('/common', commonRoute);

export default router;