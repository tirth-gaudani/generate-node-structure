import headerValidator from '../../../../middleware/headerValidator.js';
const { decryption, checkApiKey } = headerValidator;
import express from 'express';
const router = express.Router();
import commonModel from './common.model.js';

//////////////////////////////////////////////////////////////////////
//                             Common                               //
//////////////////////////////////////////////////////////////////////
router.get("/country_list", checkApiKey, decryption, commonModel?.Common?.countryList);

export default router;