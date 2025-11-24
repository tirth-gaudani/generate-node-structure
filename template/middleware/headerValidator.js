import { SELECT_Q } from '../utils/SQLWorker.js';
import constants from '../config/constants.js';
const { ENCRYPTION_BYPASS } = constants;
import en from '../languages/en.js';
import CryptoJS from 'crypto-js';
const SECRET = CryptoJS.enc.Utf8.parse(process.env.KEY);
const IV = CryptoJS.enc.Utf8.parse(process.env.KEY);
import loc from 'localizify';
const { t } = loc;
const { default: localizify } = loc;
// const { default: localizify } = require('localizify');
// const { t } = require('localizify');
import jwt from 'jsonwebtoken';

const checkApiKey = function (req, res, next) {
    if (req.headers['api-key']) {
        let apiKey = CryptoJS.AES.decrypt(req.headers['api-key'], SECRET, { iv: IV }).toString(CryptoJS.enc.Utf8)
        apiKey = apiKey.replace(/"/g, '');
        if (apiKey && apiKey == process.env.API_KEY) {
            next();
        } else {
            sendResponse(req, res, 401, 'Unauthorized', { keyword: 'invalid_api_key', components: {} });
        }
    } else {
        sendResponse(req, res, 401, 'Unauthorized', { keyword: 'invalid_api_key', components: {} });
    }

}

const checkToken = async function (req, res, next) {
    try {
        req.loginUser = {};
        let token = ''
        if (req.headers['app'] === 'apk') {
            // token = cryptoLib.decrypt(req.headers['token'], shaKey, process.env.IV);
            throw new Error("APK token decryption not supported (cryptlib removed)");
        } else {
            token = CryptoJS.AES.decrypt(req.headers['token'], SECRET, { iv: IV }).toString(CryptoJS.enc.Utf8)
        }
        // console.log('token :', token);
        const { data } = jwt.verify(token, process.env.JWT_SECRET_KEY);
        // console.log(' <<<---- Token data ---->>> ', data);

        if (data.user_type === 'company') {
            req.loginUser.company_id = data.user_id;
        } else if (data.user_type === 'employee') {
            req.loginUser.employee_id = data.user_id;
        } else if (data.user_type === 'client') {
            req.loginUser.client_id = data.user_id;
        } else if (data.user_type === 'Admin') {
            req.loginUser.admin_id = data.user_id;
        }
        req.loginUser.user_type = data.user_type;
        req.loginUser.user_id = data.user_id;
        req.loginUser.agora_id = data.agora_id;

        if (data.user_id && data.user_type == 'company') {
            const { is_active } = await SELECT_Q(`select u.is_active from tbl_company as u JOIN tbl_user_device as ud ON u.id = ud.user_id where u.id = ${data.user_id} AND u.is_delete = false AND ud.token = '${token}' and ud.user_type='company'`, 'S');

            if (is_active == false) throw new Error('user_inactive_by_admin');

            next();
        } else if (data.user_id && data.user_type == 'client') {
            const { is_active } = await SELECT_Q(`select u.is_active from tbl_client as u JOIN tbl_user_device as ud ON u.id = ud.user_id where u.id = ${data.user_id} AND u.is_delete = false AND ud.token = '${token}' and ud.user_type='client'`, 'S');

            if (is_active == false) throw new Error('user_inactive_by_admin');

            next();
        } else if (data.user_id && data.user_type == 'employee') {
            const { is_active } = await SELECT_Q(`select u.is_active from tbl_employee as u JOIN tbl_user_device as ud ON u.id = ud.user_id where u.id = ${data.user_id} AND u.is_delete = false AND ud.token = '${token}' and ud.user_type='employee'`, 'S');

            if (is_active == false) throw new Error('user_inactive_by_admin');

            next();
        } else if (data.user_id && data.user_type == 'Admin') {
            const { is_active } = await SELECT_Q(`select u.is_active from tbl_admin as u where u.id = ${data.user_id} AND u.is_delete = false AND u.token = '${token}'`, 'S');

            if (is_active == false) throw new Error('user_inactive_by_admin');

            next();
        } else {
            throw new Error("token_invalid");
        }
    } catch (e) {
        console.log('e :', e);
        let keyword = 'token_invalid';

        if (e.message == 'user_inactive_by_admin') {
            keyword = 'user_inactive_by_admin'
        } else if (e.message == 'user_blocked_by_admin') {
            keyword = 'user_blocked_by_admin'
        }

        sendResponse(req, res, 401, '-1', { keyword: keyword, components: {} }, {});
    }
}

const checkBodyInline = (rules) => {
    // JOI validation commen
    return (req, res, next) => {
        const schema = rules.messages({
            'any.required': getMessage(req?.headers?.['accept-language'], 'validation.required', { label: '{#label}' }),
            'string.empty': getMessage(req?.headers?.['accept-language'], 'validation.empty', { label: '{#label}' }),
            'string.max': getMessage(req?.headers?.['accept-language'], 'validation.max', { label: '{#label}', max: '{#limit}' }),
            'string.min': getMessage(req?.headers?.['accept-language'], 'validation.min', { label: '{#label}', min: '{#limit}' }),
            'number.max': getMessage(req?.headers?.['accept-language'], 'number.validation.max', { label: '{#label}', max: '{#limit}' }),
            'number.min': getMessage(req?.headers?.['accept-language'], 'number.validation.min', { label: '{#label}', min: '{#limit}' }),
        });
        const validationData = (req?.files ? { ...req?.body, ...req?.files } : req.body) || {};
        const { error } = schema.validate(validationData, { abortEarly: true });
        if (error) {
            console.log('error :', error);
            const errorMessage = error?.details?.[0]?.message?.replace(/\"/g, '')?.replace(/_/g, ' ');
            console.log('Error: =----->>  ', errorMessage);
            return res.status(400).json({ status: 'error', message: errorMessage, });
        }
        next();
    };
}

// Function to return response for any api
const sendResponse = function (req, res, statuscode, responseStatus, { keyword, components }, responsedata) {

    let formatmsg = getMessage(req.headers['accept-language'], keyword, components);
    let encrypted_data = ''
    if (req?.headers['isEncrypt'] == 'false') {
        encrypted_data = { status: responseStatus, message: formatmsg, data: responsedata };
    } else {
        encrypted_data = encryption({ status: responseStatus, message: formatmsg, data: responsedata }, req);
    }

    res.status(statuscode);
    res.send(encrypted_data);
}

const decryption = function (req, res, next) {
    if (!ENCRYPTION_BYPASS) {
        try {
            console.log('req.body :', req.body);
            if (req.body != undefined && Object.keys(req.body).length !== 0) {
                req.body = JSON.parse(CryptoJS.AES.decrypt(req.body, SECRET, { iv: IV }).toString(CryptoJS.enc.Utf8));
                next();
            } else {
                next();
            }
        } catch (error) {
            console.log('error :', error);
            res.status(200);
            res.json({ code: 0, message: "badEncrypt" });
        }
    } else {
        next();
    }
}

// Function to encrypt the response body before sending response
const encryption = function (response_data, req) {
    if (!ENCRYPTION_BYPASS) {
        return CryptoJS.AES.encrypt(JSON.stringify(response_data), SECRET, { iv: IV }).toString();
    } else {
        return response_data;
    }
}

// Function to send users language from any place
const getMessage = function (requestLanguage, key, value = {}) {
    try {
        localizify.add('en', en).setLocale(requestLanguage);

        let message = t(key, value);

        return message;
    } catch (e) {
        console.log('e :', e);
        return "Something went wrong";
    }
}


const decryptionjs = (encrypted_text, callback) => {
    try {
        if (typeof encrypted_text === 'object' && Object.keys(encrypted_text).length === 0) {
            callback({});
        } else if (typeof encrypted_text === 'object' && Object.keys(encrypted_text).length !== 0) {
            var decrypted = JSON.parse(CryptoJS.AES.decrypt(encrypted_text, SECRET, { iv: IV }).toString(CryptoJS.enc.Utf8));
            callback(decrypted);
        } else if (encrypted_text != undefined && encrypted_text != null && encrypted_text != '' && typeof encrypted_text !== 'object') {
            var decrypted = CryptoJS.AES.decrypt(encrypted_text, SECRET, { iv: IV }).toString(CryptoJS.enc.Utf8);
            callback(decrypted);
        } else {
            callback({});
        }
    } catch (error) {
        // console.log('error :', error);
        callback('encryption is in correct Please check', error);
    }
}

const encryptionjs = (response_data, callback) => {
    var data;
    try {
        data = JSON.parse(response_data);
    } catch (error) {
        data = response_data
    }
    console.log('data :', data);
    let encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), SECRET, { iv: IV }).toString();
    // let encrypted = data;
    callback(encrypted);
}

export default {
    checkApiKey,
    checkToken,
    sendResponse,
    decryption,
    encryption,
    checkBodyInline,
    decryptionjs,
    encryptionjs
};
export { sendResponse };
