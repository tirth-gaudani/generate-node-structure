import con from '../config/database.js';
import { sendResponse } from '../middleware/headerValidator.js';
import { SELECT_Q } from './SQLWorker.js';

const uniqueCheck = {

    userCheckEmail: async (req, res, next) => {
        let { body } = req;
        const emailCheck = await SELECT_Q(`Select email from tbl_user where is_delete=false and is_active=true and is_verify=true and (email='${body?.email?.toLowerCase()}' ${!body?.social_id ? `OR (mobile_number='${body?.mobile_number}' and country_code='${body?.country_code}')` : ''})`, 'S');
        if (emailCheck) {
            sendResponse(req, res, 201, 'error', { keyword: 'text_email_already_exist', components: { key: body?.email } });
        } else {
            const deletedUser = await con.query(`delete from tbl_user where is_verify=false and email='${body?.email?.toLowerCase()}' RETURNING id`);
            if (deletedUser?.rows?.[0]) {
                await con.query(`delete from tbl_user_device where id='${deletedUser?.rows?.[0]?.id}'`);
            }
            next();
        }
    },

    userCheckMobile: async (req, res, next) => {
        let { body } = req;
        if (!body?.social_id) {
            let mobileCheck = await SELECT_Q(`Select country_code, mobile_number from tbl_user where is_delete=false and is_verify=true and is_active=true and mobile_number='${body?.mobile_number}' and country_code='${body?.country_code}'`, 'S');
            if (mobileCheck) {
                sendResponse(req, res, 201, 'error', { keyword: 'text_field_already_exist', components: { key: (body?.country_code + ' ' + body?.mobile_number) } });
            } else {
                const deletedUser = await con.query(`delete from tbl_user where is_verify=false and mobile_number='${body?.mobile_number}' and country_code='${body?.country_code}' RETURNING id`)
                if (deletedUser?.rows?.[0]) {
                    await con.query(`delete from tbl_user_device where id='${deletedUser?.rows?.[0]?.id}'`);
                }
                next();
            }
        } else {
            next();
        }
    },

    userCheckSocialId: async (req, res, next) => {
        let { body } = req;
        let socialIdCheck = await SELECT_Q(`Select social_id from tbl_user where is_delete=false and is_verify=true and is_active=true and social_id='${body?.social_id}'`, 'S');
        if (socialIdCheck) {
            sendResponse(req, res, 201, 'error', { keyword: 'duplicate_social_id', components: {} });
        } else {
            next();
        }
    },

}

export default uniqueCheck;