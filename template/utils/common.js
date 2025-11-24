import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { SELECT_Q } from '../utils/SQLWorker.js';
import nodemailer from 'nodemailer';
import con from '../config/database.js';

const common = {

    jwt_validate: async (token) => {
        try {
            const verified = jwt.verify(token, process.env.JWT_SECRET_KEY);

            if (verified) {
                return verified;
            } else {
                throw new Error("token_invalid");
            }
        } catch (error) {
            // Access Denied 
            throw new Error("token_invalid");
        }
    },

    jwt_sign: (user_id, user_type, expiresIn = "30d") => {
        const payload = {
            data: { user_id, user_type }
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn });
        return token;
    },

    user_device_details: async (user_id, user_type) => {
        try {
            let device_details = await SELECT_Q(`select id as user_device_id, user_id, user_type, token, device_name, device_type, device_token, model_name, uuid, os_version, ip, language from tbl_user_device WHERE user_id = '${user_id}' and user_type='${user_type}'`, 'S');

            return device_details;
        } catch (e) {
            throw new Error("user_not_found");
        }

    },

    sendEmail: (to_mail, subject, message) => {
        return new Promise((resolve, reject) => {

            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD
                }
            });

            var mailOptions = {
                from: process.env.EMAIL,
                to: to_mail,
                subject: subject,
                html: message
            };

            transporter.sendMail(mailOptions, function (error, info) {
                console.log('info :', info);
                if (!error) {
                    resolve(true);
                } else {
                    console.log('error In mail send -=-=-=---->>>    ', error);
                    resolve(false);
                }
            });

        });
    },

    checkDeviceInfo: function (user_id) {
        return new Promise(async (resolve, reject) => {
            try {
                let user_device_data = await SELECT_Q(`SELECT * FROM tbl_user_device WHERE user_id = '${user_id}'`, 'S');
                resolve(user_device_data);
            } catch {
                resolve(false);
            }
        });
    },

    updateDeviceInfo: function (user_id, params) {
        return new Promise(async (resolve, reject) => {
            try {
                let update_device_data = await con.query(`UPDATE tbl_user_device SET token=$1,device_type=$2,device_token=$3,uuid=$4,os_version=$5,device_name=$6,model_name=$7,ip=$8 WHERE user_id = '${user_id}'`, params);
                resolve(update_device_data);
            } catch (e) {
                reject(e)
            }
        });
    },

    addDeviceInformation: function (params) {
        return new Promise(async (resolve, reject) => {
            try {
                let { rows: insert_device_data } = await con.query(`INSERT INTO tbl_user_device (token, device_type, device_token, uuid, os_version, device_name, model_name, ip, user_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`, params);
                resolve(insert_device_data?.[0]);
            } catch (e) {
                reject(e)
            }
        });
    },

    checkUpdateDeviceInfo: function (user_id, params) {
        return new Promise(async (resolve, reject) => {
            try {
                let DeviceInfo = await common.checkDeviceInfo(user_id);
                let upd_device = [
                    params?.token || DeviceInfo?.token || null,
                    params?.device_type || null,
                    params?.device_token || null,
                    params?.uuid || '',
                    params?.os_version || '',
                    params?.device_name || '',
                    params?.model_name || '',
                    params?.ip || '',
                ]

                if (DeviceInfo) {
                    let result = await common.updateDeviceInfo(user_id, upd_device);
                    resolve(result);
                } else {
                    upd_device.push(user_id);
                    let result = await common.addDeviceInformation(upd_device);
                    resolve(result);
                }
            } catch (e) {
                reject(e);
            }
        });
    },

    generateRandomOtp: async () => {
        // const otp = Math.floor(100000 + Math.random() * 900000);
        const otp = 123456;
        let currentDate = new Date();
        currentDate.setMinutes(currentDate.getMinutes() + 10); // Expired in 10 minutes
        return {
            otp,
            otp_expiry: currentDate,
        };
    },

    sendOtp: async (phone, otp) => {
        try {
            let message = "Dear Customer, " + otp + " is your One Time Password (OTP). Please enter the OTP to proceed. Thank you, " + process.env.APP_NAME;
            if (phone) {
                return true;
            } else {
                return false;
            }
        } catch (e) {
            console.log('Error in sendOtp ==------>>>  :  ', e);
            return e;
        }
    },
}

export default common;