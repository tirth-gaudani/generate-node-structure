import Joi from 'joi';

const authRules = {
    signup: Joi.object({
        country_code: Joi.string().trim().required().max(6),
        mobile_number: Joi.string().trim().required().pattern(/^[0-9]+$/).max(13).messages({
            'string.pattern.base': 'Mobile number must contain only numbers',
        }),
        login_type: Joi.string().trim().required().valid('S', 'G', 'F', 'A').messages({
            'any.only': 'Login type is invalid.',
        }),
        password: Joi.string().trim().required().min(6).max(20).messages({
            'string.min': 'Password must be at least 6 characters long',
            'string.max': 'Password must be at most 20 characters long',
        }),
        first_name: Joi.string().trim().required().pattern(/^[A-Za-z\s]+$/).max(250).messages({
            'string.pattern.base': 'Name must contain only letters and spaces',
        }),
        last_name: Joi.string().trim().required().pattern(/^[A-Za-z\s]+$/).max(250).messages({
            'string.pattern.base': 'Name must contain only letters and spaces',
        }),
        email: Joi.string().email().required().messages({
            'string.email': 'Please enter a valid email address',
        }),
        device_type: Joi.string().trim().optional().allow('').valid('I', 'A', 'W').max(1).messages({
            'string.max': 'Device type limit exceeded',
            'any.only': 'Device type is invalid.',
        }),
        device_name: Joi.string().trim().optional().allow('').max(200).messages({
            'string.max': 'Device name limit exceeded',
        }),
        device_token: Joi.string().trim().optional().allow(''),
        os_version: Joi.string().trim().optional().allow('').max(200).messages({
            'string.max': 'OS version limit exceeded',
        }),
        device_ip: Joi.string().trim().optional().allow('').max(120).messages({
            'string.max': 'Device IP limit exceeded',
        }),
        // add other signup fields if needed
    }),

    auth_social: Joi.object({
        login_type: Joi.string().valid('G', 'A', 'F').required(),
        idToken: Joi.alternatives().conditional('login_type', {
            switch: [
                { is: 'G', then: Joi.string().trim().required() },
                { is: 'A', then: Joi.string().trim().required() },
            ],
            otherwise: Joi.string().trim().optional().allow(''),
        }),
        accessToken: Joi.alternatives().conditional('login_type', {
            is: 'F',
            then: Joi.string().trim().required(),
            otherwise: Joi.string().trim().optional().allow(''),
        }),
        name: Joi.string().trim().optional().allow(''),
        device_type: Joi.string().trim().optional().allow('').valid('I', 'A').max(1).messages({
            'string.max': 'Device type limit exceeded',
            'any.only': 'Device type is invalid.',
        }),
        device_name: Joi.string().trim().optional().allow('').max(200).messages({
            'string.max': 'Device name limit exceeded',
        }),
        device_token: Joi.string().trim().optional().allow(''),
        os_version: Joi.string().trim().optional().allow('').max(200).messages({
            'string.max': 'OS version limit exceeded',
        }),
        device_ip: Joi.string().trim().optional().allow('').max(120).messages({
            'string.max': 'Device IP limit exceeded',
        }),
    }),

    resend_otp: Joi.object({
        email: Joi.string().email().optional().allow(''),
        country_code: Joi.string().trim().optional().allow('').max(6),
        mobile_number: Joi.string().trim().optional().allow('').pattern(/^[0-9]+$/).max(13).messages({
            'string.pattern.base': 'Mobile number must contain only numbers',
        }),
    }).custom((value, helpers) => {
        const hasEmail = !!value.email;
        const hasPhone = !!(value.country_code && value.mobile_number);
        if (!hasEmail && !hasPhone) {
            return helpers.error('any.custom', { message: 'Provide either email or country_code + mobile_number' });
        }
        return value;
    }, 'resend otp validation'),

    verify_otp: Joi.object({
        country_code: Joi.string().trim().required().max(6),
        mobile_number: Joi.string().trim().required().pattern(/^[0-9]+$/).max(13).messages({
            'string.pattern.base': 'Mobile number must contain only numbers',
        }),
        otp: Joi.number().integer().min(100000).max(999999).required().messages({
            'number.base': 'OTP must be a number',
            'number.integer': 'OTP must be a valid 6-digit number',
            'number.min': 'OTP must be a 6-digit number',
            'number.max': 'OTP must be a 6-digit number',
            'any.required': 'OTP is required',
        }),
    }),

    login: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Please enter a valid email address',
        }),
        password: Joi.string().trim().required().min(6).max(64),
    }),

    complete_profile: Joi.object({
        name: Joi.string().trim().required().pattern(/^[A-Za-z\s]+$/).max(250).messages({
            'string.pattern.base': 'Name must contain only letters and spaces',
        }),
        email: Joi.string().email().required().messages({
            'string.email': 'Please enter a valid email address',
        }),
        currency_id: Joi.number().integer().required().messages({
            'number.base': 'Currency ID must be a number',
            'number.integer': 'Currency ID must be a valid number',
            'any.required': 'Currency ID is required',
        }),
        referral_code: Joi.string().trim().optional().allow('').max(10).messages({
            'string.max': 'Referral code limit exceeded',
        }),
    }),

    edit_profile: Joi.object({
        first_name: Joi.string().trim().optional().allow('').pattern(/^[A-Za-z\s]+$/).max(250),
        last_name: Joi.string().trim().optional().allow('').pattern(/^[A-Za-z\s]+$/).max(250),
        email: Joi.string().email().optional().allow(''),
        country_code: Joi.string().trim().optional().allow('').max(6),
        mobile_number: Joi.string().trim().optional().allow('').pattern(/^[0-9]+$/).max(13),
        login_type: Joi.string().trim().optional().allow('').valid('S', 'G', 'F', 'A'),
    }),

    smart_contribution: Joi.object({
        is_smart_contribution: Joi.boolean().required().messages({
            'boolean.base': 'Smart contribution must be a boolean',
            'any.required': 'Smart contribution is required',
        }),
    }),

    currency_update: Joi.object({
        currency_id: Joi.number().integer().required().messages({
            'number.base': 'Currency ID must be a number',
            'number.integer': 'Currency ID must be a valid number',
            'any.required': 'Currency ID is required',
        }),
    }),

    update_device: Joi.object({
        device_type: Joi.string().trim().optional().allow('').valid('I', 'A', 'W').max(1),
        device_name: Joi.string().trim().optional().allow('').max(200),
        device_token: Joi.string().trim().optional().allow(''),
        os_version: Joi.string().trim().optional().allow('').max(200),
        device_ip: Joi.string().trim().optional().allow('').max(120),
        model_name: Joi.string().trim().optional().allow('').max(200),
        uuid: Joi.string().trim().optional().allow('').max(200),
    }),

    kyc_complete: Joi.object({
        // Add KYC fields here when needed
    }),
    delete_account: Joi.object({}),
    logout: Joi.object({}),
    user_details: Joi.object({}),
    organization_list_for_client: Joi.object({}),
    add_or_edit_notification_prefernces: Joi.object({}),
    contact_us: Joi.object({
        subject: Joi.string().trim().required(),
        description: Joi.string().trim().required(),
        email: Joi.string().email().required(),
    }),

    forgot_password: Joi.object({
        email: Joi.string().email().required(),
    }),

    reset_password: Joi.object({
        forgot_token: Joi.string().trim().required(),
        new_password: Joi.string().trim().required().min(6).max(64),
        confirm_password: Joi.string().trim().required().valid(Joi.ref('new_password')).messages({
            'any.only': 'Confirm password must match new password',
        }),
    }),

    change_password: Joi.object({
        current_password: Joi.string().trim().required().min(6).max(64),
        new_password: Joi.string().trim().required().min(6).max(64),
        confirm_password: Joi.string().trim().required().valid(Joi.ref('new_password')).messages({
            'any.only': 'Confirm password must match new password',
        }),
    }),
};

export default authRules;