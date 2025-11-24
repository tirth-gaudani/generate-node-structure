import { SELECT_Q } from '../../../../utils/SQLWorker.js';
import headerValidator from '../../../../middleware/headerValidator.js';
const { sendResponse } = headerValidator;
import common from '../../../../utils/common.js';
const { jwt_sign, sendEmail, checkUpdateDeviceInfo, generateRandomOtp, sendOtp, user_device_details } = common;
import CryptoJS from 'crypto-js';
const SECRET = CryptoJS.enc.Utf8.parse(process.env.KEY);
const IV = CryptoJS.enc.Utf8.parse(process.env.KEY);
import moment from 'moment';
import forgot_pass_template from '../../../../views/templates/forgot_pass.js';
import con from '../../../../config/database.js';
import jwt from 'jsonwebtoken';
import constants from '../../../../config/constants.js';
const { WEBSITE_BASE_URL } = constants;
import bcrypt from 'bcryptjs';

const sanitizeUser = (user) => {
    if (!user) return null;
    const { password, otp, otp_expiry, forgot_token, forgot_expiry, ...safe } = user;
    return safe;
};

const getUserByEmail = async (email) => {
    if (!email) return null;
    const { rows } = await con.query(`SELECT * FROM tbl_user WHERE email=$1`, [email.toLowerCase()]);
    return rows?.[0] || null;
};

const getUserByPhone = async (country_code, mobile_number) => {
    if (!country_code || !mobile_number) return null;
    const { rows } = await con.query(`SELECT * FROM tbl_user WHERE country_code=$1 AND mobile_number=$2`, [country_code, mobile_number]);
    return rows?.[0] || null;
};

const verifyPassword = async (plain, hash) => {
    if (!hash) return false;
    if (hash.startsWith('$2')) {
        return bcrypt.compare(plain, hash);
    }
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(plain), SECRET, { iv: IV }).toString();
    return encrypted === hash;
};

const migratePasswordIfNeeded = async (user, plainPassword) => {
    if (!user?.password || user?.password.startsWith('$2')) return;
    const newHash = await bcrypt.hash(plainPassword, 12);
    await con.query(`UPDATE tbl_user SET password=$1 WHERE id=$2`, [newHash, user?.id]);
};

const updatePasswordHash = async (userId, password) => {
    const newHash = await bcrypt.hash(password, 12);
    await con.query(`UPDATE tbl_user SET password=$1 WHERE id=$2`, [newHash, userId]);
};

const issueOtpForUser = async (user) => {
    const otpPayload = await generateRandomOtp();
    await con.query(`UPDATE tbl_user SET otp=$1, otp_expiry=$2 WHERE id=$3`, [otpPayload?.otp || null, otpPayload?.otp_expiry || null, user?.id]);
    if (user?.country_code && user?.mobile_number && otpPayload?.otp) {
        await sendOtp(`${user.country_code}${user.mobile_number}`, otpPayload.otp);
    }
    return otpPayload;
};

const ensureUserActive = (user) => {
    if (!user || user.is_delete) {
        return { ok: false, message: 'user_not_found_or_deleted' };
    }
    if (user.is_active === false) {
        return { ok: false, message: 'user_inactive_or_deleted' };
    }
    return { ok: true };
};

const buildUpdateQuery = (tableName, id, fields, data) => {
    const updates = [];
    const values = [];
    fields.forEach(field => {
        if (data[field] !== undefined) {
            updates.push(`${field}=$${updates.length + 1}`);
            values.push(field === 'email' ? data[field].toLowerCase() : data[field]);
        }
    });
    if (updates.length === 0) return null;
    values.push(id);
    return {
        text: `UPDATE ${tableName} SET ${updates.join(', ')}, updated_at=NOW() WHERE id=$${values.length}`,
        values
    };
};

//////////////////////////////////////////////////////////////////////
//                            Auth API                              //
//////////////////////////////////////////////////////////////////////
let Auth = {

    signUp: async (req, res) => {
        try {
            let { body } = req;
            let otpGenerate = body?.social_id ? {} : await generateRandomOtp();
            const passwordHash = body?.password ? await bcrypt.hash(body?.password, 12) : '';
            const ins_data = [
                body?.social_id || null,
                body?.first_name,
                body?.last_name,
                body?.email?.toLowerCase(),
                body?.country_code ? body?.country_code : '',
                body?.mobile_number ? body?.mobile_number : '',
                passwordHash,
                body?.login_type,
                true,
                false,
                false,
                otpGenerate?.otp || null,
                otpGenerate?.otp_expiry || null,
                body?.social_id ? true : false,
            ];
            let { rows } = await con.query(`INSERT INTO tbl_user (social_id, first_name, last_name, email, country_code, mobile_number, password, login_type, is_active, is_online, is_delete, otp, otp_expiry, is_verify) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`, ins_data);
            let user_id = rows?.[0]?.id;
            if (body?.country_code && body?.mobile_number && otpGenerate?.otp) {
                await sendOtp(body?.country_code + body?.mobile_number, otpGenerate?.otp);
            }
            const token = await jwt_sign(user_id, "user", "1d");
            body.token = token;
            await checkUpdateDeviceInfo(user_id, body);
            return sendResponse(req, res, 200, 'success', { keyword: "rest_keywords_user_signup_success", components: {} }, { user_id: user_id, token });
        } catch (e) {
            console.log('e :', e);
            return sendResponse(req, res, 500, 'error', { keyword: "rest_keywords_user_signup_failed", components: {} }, e?.message);
        }
    },

    completeProfile: async (req, res) => {
        try {
            const { user_id } = req.loginUser;
            const { name, ...otherFields } = req.body || {};

            const dataToUpdate = { ...otherFields };
            if (name) {
                const parts = name.trim().split(/\s+/);
                dataToUpdate.first_name = parts.shift();
                dataToUpdate.last_name = parts.join(' ');
            }

            const query = buildUpdateQuery('tbl_user', user_id, ['first_name', 'last_name', 'email', 'country_code', 'mobile_number', 'login_type'], dataToUpdate);

            if (query) {
                await con.query(query.text, query.values);
            }

            const { rows } = await con.query(`SELECT * FROM tbl_user WHERE id=$1`, [user_id]);
            return sendResponse(req, res, 200, '1', { keyword: "rest_keywords_user_complete_profile_success", components: {} }, sanitizeUser(rows?.[0]));
        } catch (e) {
            console.log('e :', e);
            return sendResponse(req, res, 200, '0', { keyword: "rest_keywords_user_complete_profile_failed", components: {} }, e?.message);
        }
    },

    login: async (req, res) => {
        try {
            let { body } = req;
            try {
                const user = await getUserByEmail(body?.email);
                if (!user) {
                    return sendResponse(req, res, 200, '0', { keyword: "rest_keywords_user_invalid_credantioal", components: {} });
                }

                const passwordValid = await verifyPassword(body?.password, user?.password);
                if (!passwordValid) {
                    return sendResponse(req, res, 200, '0', { keyword: "rest_keywords_user_invalid_credantioal", components: {} });
                }
                await migratePasswordIfNeeded(user, body?.password);

                const status = ensureUserActive(user);
                if (!status.ok) {
                    return sendResponse(req, res, 200, '0', { keyword: status.message, components: {} });
                }
                if (!user?.is_verify) {
                    return sendResponse(req, res, 200, '0', { keyword: "user_not_verified", components: {} });
                }

                await con.query(`UPDATE tbl_user SET is_online=true, updated_at=NOW() WHERE id=$1`, [user?.id]);
                const token = await jwt_sign(user?.id, 'user', '1d');
                body.token = token;
                await checkUpdateDeviceInfo(user?.id, body);

                return sendResponse(req, res, 200, '1', { keyword: "rest_keywords_user_login_success", components: {} }, {
                    user: sanitizeUser(user),
                    token,
                });
            } catch (e) {
                console.log('e :', e);
                return sendResponse(req, res, 200, '0', { keyword: "rest_keywords_user_login_failed", components: {} }, e?.message);
            }
        } catch (e) {
            console.log('e :', e);
            return sendResponse(req, res, 200, '0', { keyword: "rest_keywords_user_login_failed", components: {} }, e?.message);
        }
    },

    resendOtp: async (req, res) => {
        try {
            const { email, country_code, mobile_number } = req.body;
            const user = email ? await getUserByEmail(email) : await getUserByPhone(country_code, mobile_number);
            const status = ensureUserActive(user);
            if (!status.ok) {
                return sendResponse(req, res, 200, '0', { keyword: status.message, components: {} });
            }
            await issueOtpForUser(user);
            return sendResponse(req, res, 200, '1', { keyword: "otp_sent", components: {} });
        } catch (e) {
            console.log('e :', e);
            return sendResponse(req, res, 200, '0', { keyword: "faild_otp_sent", components: {} }, e?.message);
        }
    },

    verifyOtp: async (req, res) => {
        try {
            const { country_code, mobile_number, otp } = req.body;
            const user = await getUserByPhone(country_code, mobile_number);
            const status = ensureUserActive(user);
            if (!status.ok) {
                return sendResponse(req, res, 200, '0', { keyword: status.message, components: {} });
            }
            if (!user?.otp || user?.otp !== String(otp)) {
                return sendResponse(req, res, 200, '0', { keyword: "invalid_otp", components: {} });
            }
            if (user?.otp_expiry && moment.utc().isAfter(moment.utc(user?.otp_expiry))) {
                return sendResponse(req, res, 200, '0', { keyword: "otp_expired", components: {} });
            }
            await con.query(`UPDATE tbl_user SET otp=NULL, otp_expiry=NULL, is_verify=true, is_online=true WHERE id=$1`, [user?.id]);
            return sendResponse(req, res, 200, '1', { keyword: "otp_verified", components: {} });
        } catch (e) {
            console.log('e :', e);
            return sendResponse(req, res, 200, '0', { keyword: "faild_otp_sent", components: {} }, e?.message);
        }
    },

    forgotPassword: async (req, res) => {
        try {
            const email = req?.body?.email?.toLowerCase();
            const user = await getUserByEmail(email);
            const status = ensureUserActive(user);
            if (!status.ok) {
                return sendResponse(req, res, 200, '0', { keyword: "invalid_email_details", components: {} });
            }

            const enc_data = {
                expiresIn: '24h',
                data: { user_id: user?.id, user_type: 'user', email },
            };
            const token = jwt.sign(enc_data, process.env.JWT_SECRET_KEY);
            const forgotExpiry = moment().utc().add(24, 'hours').toDate();
            await con.query(`UPDATE tbl_user SET forgot_token=$1, forgot_expiry=$2 WHERE id=$3`, [token, forgotExpiry, user?.id]);

            const mail_otp_user = forgot_pass_template({ url: `${WEBSITE_BASE_URL}reset_password/${token}/user` });
            setTimeout(() => {
                sendEmail(email, "COR Software - Password Reset", mail_otp_user);
            }, 100);

            return sendResponse(req, res, 200, '1', { keyword: "mail_sent_1", components: {} });
        } catch (e) {
            console.log('e :', e);
            return sendResponse(req, res, 200, '0', { keyword: "rest_keywords_user_forgot_failed", components: {} }, e?.message);
        }
    },

    resetPassword: async (req, res) => {
        try {
            const verified = jwt.verify(req?.body?.forgot_token, process.env.JWT_SECRET_KEY);
            const { rows } = await con.query(`SELECT * FROM tbl_user WHERE id=$1 AND email=$2`, [verified?.data?.user_id, verified?.data?.email]);
            const user = rows?.[0];
            if (!user || user?.forgot_token !== req?.body?.forgot_token) {
                return sendResponse(req, res, 200, '0', { keyword: "link_expired", components: {} });
            }
            if (user?.forgot_expiry && moment.utc().isAfter(moment.utc(user?.forgot_expiry))) {
                return sendResponse(req, res, 200, '0', { keyword: "link_expired", components: {} });
            }
            if (user?.password && user?.password.startsWith('$2')) {
                const same = await bcrypt.compare(req?.body?.new_password, user?.password);
                if (same) {
                    return sendResponse(req, res, 200, '0', { keyword: "old_password_same", components: {} });
                }
            }
            if (req?.body?.new_password !== req?.body?.confirm_password) {
                return sendResponse(req, res, 200, '0', { keyword: "new_password_and_confirm_same", components: {} });
            }
            await con.query(`UPDATE tbl_user SET password=$1, forgot_token=NULL, forgot_expiry=NULL WHERE id=$2`, [await bcrypt.hash(req?.body?.new_password, 12), user?.id]);
            return sendResponse(req, res, 200, '1', { keyword: "password_changed", components: {} });
        } catch (e) {
            console.log('e :', e);
            return sendResponse(req, res, 200, '0', { keyword: "rest_keywords_user_forgot_failed", components: {} }, e?.message);
        }
    },

    changePassword: async (req, res) => {
        try {
            const { user_id } = req.loginUser;
            const { rows } = await con.query(`SELECT * FROM tbl_user WHERE id=$1 AND is_delete=false`, [user_id]);
            const user = rows?.[0];
            if (!user) {
                return sendResponse(req, res, 200, '0', { keyword: "invalid_old_password", components: {} });
            }
            const valid = await verifyPassword(req?.body?.current_password, user?.password);
            if (!valid) {
                return sendResponse(req, res, 200, '0', { keyword: "invalid_old_password", components: {} });
            }
            if (user?.password?.startsWith('$2')) {
                const same = await bcrypt.compare(req?.body?.new_password, user?.password);
                if (same) {
                    return sendResponse(req, res, 200, '0', { keyword: "old_password_same", components: {} });
                }
            }
            if (req?.body?.new_password !== req?.body?.confirm_password) {
                return sendResponse(req, res, 200, '0', { keyword: "new_password_and_confirm_same", components: {} });
            }
            await updatePasswordHash(user?.id, req?.body?.new_password);
            return sendResponse(req, res, 200, '1', { keyword: "password_changed", components: {} });
        } catch (e) {
            console.log('e :', e);
            return sendResponse(req, res, 200, '0', { keyword: "rest_keywords_user_forgot_failed", components: {} }, e?.message);
        }
    },

    deleteAccount: async (req, res) => {
        try {
            let { user_id } = req.loginUser;
            await con.query(`UPDATE tbl_user SET is_delete=true, is_online=false WHERE id=$1`, [user_id]);
            await con.query(`DELETE FROM tbl_user_device WHERE user_id=$1`, [user_id]);
            return sendResponse(req, res, 200, '1', { keyword: "rest_keywords_user_delete_success", components: {} });
        } catch (e) {
            console.log('e :', e);
            return sendResponse(req, res, 200, '0', { keyword: "rest_keywords_user_delete_failed", components: {} }, e?.message);
        }
    },

    logout: async (req, res) => {
        try {
            let { user_id } = req.loginUser;
            await con.query(`UPDATE tbl_user SET is_online=false WHERE id=$1`, [user_id]);
            await con.query(`UPDATE tbl_user_device SET token=NULL, device_token=NULL WHERE user_id=$1`, [user_id]);
            return sendResponse(req, res, 200, '1', { keyword: "logout_success", components: {} });
        } catch (e) {
            console.log('e :', e);
            return sendResponse(req, res, 200, '0', { keyword: "logout_failed", components: {} }, e?.message);
        }
    },

    contactUs: async (req, res) => {
        try {
            const { user_id } = req.loginUser;
            const { subject, email, description } = req.body;
            await con.query(`INSERT INTO tbl_contact_us (user_type, subject, email, description, user_id) VALUES ($1, $2, $3, $4, $5)`, ['user', subject, email?.toLowerCase(), description, user_id]);
            return sendResponse(req, res, 200, '1', { keyword: "rest_keywords_contact_us_success", components: {} });
        } catch (e) {
            console.log('e :', e);
            return sendResponse(req, res, 200, '0', { keyword: "rest_keywords_contact_us_failed", components: {} }, e?.message);
        }
    },

    userDetails: async (req, res) => {
        try {
            const { user_id } = req.loginUser;
            const { rows } = await con.query(`SELECT * FROM tbl_user WHERE id=$1`, [user_id]);
            const user = sanitizeUser(rows?.[0]);
            if (!user) {
                return sendResponse(req, res, 200, '0', { keyword: "user_details_failed", components: {} });
            }
            const deviceInfo = await user_device_details(user_id, 'user');
            return sendResponse(req, res, 200, '1', { keyword: "user_details_success", components: {} }, { ...user, device_info: deviceInfo });
        } catch (e) {
            console.log('e :', e);
            return sendResponse(req, res, 200, '0', { keyword: "user_details_failed", components: {} }, e?.message);
        }
    },

    updateDeviceInfo: async (req, res) => {
        try {
            let { body } = req;
            let { user_id } = req.loginUser;
            await checkUpdateDeviceInfo(user_id, body);
            const { rows } = await con.query(`SELECT * FROM tbl_user WHERE id=$1`, [user_id]);
            return sendResponse(req, res, 200, '1', { keyword: "user_details_update_success", components: {} }, sanitizeUser(rows?.[0]));
        } catch (e) {
            console.log('e :', e);
            return sendResponse(req, res, 200, '0', { keyword: "user_details_update_failed", components: {} }, e?.message);
        }
    },

    editProfile: async (req, res) => {
        try {
            const { user_id } = req.loginUser;
            const query = buildUpdateQuery('tbl_user', user_id, ['first_name', 'last_name', 'email', 'country_code', 'mobile_number', 'login_type'], req.body);

            if (query) {
                await con.query(query.text, query.values);
            }

            const { rows } = await con.query(`SELECT * FROM tbl_user WHERE id=$1`, [user_id]);
            return sendResponse(req, res, 200, '1', { keyword: "rest_keywords_user_profile_edit_success", components: {} }, sanitizeUser(rows?.[0]));
        } catch (e) {
            console.log('e :', e);
            return sendResponse(req, res, 200, '0', { keyword: "rest_keywords_user_edit_profile_failed", components: {} }, e?.message);
        }
    },

}
export default {
    Auth
};