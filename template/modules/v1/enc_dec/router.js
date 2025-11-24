import express from 'express';
import headerValidator from '../../../middleware/headerValidator.js';
const { sendResponse } = headerValidator;
const router = express.Router();
import model from './model.js';

/*==================================================== 
   encryption api                                                                               
====================================================== */

router.post('/encryption', (req, res) => {

    let request = req.body;
    console.log('request :', request);
    model.reactEncryption(request, res, (responseCode, responseMsg, responseData) => {
        sendResponse(req, res, 200, responseCode, responseMsg, responseData);
    });

})

router.post('/decryption', (req, res) => {

    let request = req.body;
    model.reactDecryption(request, res, (responseCode, responseMsg, responseData) => {
        sendResponse(req, res, 200, responseCode, responseMsg, responseData);
    });

})

export default router;