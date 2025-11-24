import headerValidator from '../../../../middleware/headerValidator.js';
const { decryption, checkBodyInline, checkToken, checkApiKey } = headerValidator;
import express from 'express';
const router = express.Router();
import authModel from './auth.model.js';
import authRules from './rules/auth.rules.js';
import uniqueMiddleware from '../../../../utils/uniqueMiddleware.js';
const { userCheckEmail, userCheckMobile, userCheckSocialId } = uniqueMiddleware;
import rateLimit from 'express-rate-limit';

const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 OTP requests per hour
    message: {
        code: 429,
        status: 'error',
        message: 'Too many OTP requests from this IP, please try again after an hour',
        keyword: 'too_many_otp_requests',
        components: {}
    }
});

//////////////////////////////////////////////////////////////////////
//                              Auth                                //
//////////////////////////////////////////////////////////////////////
router.post("/signup", checkApiKey, decryption, checkBodyInline(authRules["signup"]), userCheckSocialId, userCheckEmail, userCheckMobile, authModel?.Auth?.signUp);

router.post("/complete_profile", checkApiKey, checkToken, decryption, checkBodyInline(authRules["complete_profile"]), authModel?.Auth?.completeProfile);

router.post("/login", checkApiKey, decryption, checkBodyInline(authRules["login"]), authModel?.Auth?.login);

router.post("/resend_otp", otpLimiter, checkApiKey, decryption, checkBodyInline(authRules["resend_otp"]), authModel?.Auth?.resendOtp);

router.post("/verify_otp", checkApiKey, decryption, checkBodyInline(authRules["verify_otp"]), authModel?.Auth?.verifyOtp);

router.post("/forgot_password", checkApiKey, decryption, checkBodyInline(authRules["forgot_password"]), authModel?.Auth?.forgotPassword);

router.post("/reset_password", checkApiKey, decryption, checkBodyInline(authRules["reset_password"]), authModel?.Auth?.resetPassword);

router.post("/change_password", checkApiKey, checkToken, decryption, checkBodyInline(authRules["change_password"]), authModel?.Auth?.changePassword);

router.post("/delete_account", checkApiKey, checkToken, decryption, checkBodyInline(authRules["delete_account"]), authModel?.Auth?.deleteAccount);

router.post("/logout", checkApiKey, checkToken, decryption, checkBodyInline(authRules["logout"]), authModel?.Auth?.logout);

router.post("/contact_us", checkApiKey, checkToken, decryption, checkBodyInline(authRules["contact_us"]), authModel?.Auth?.contactUs);

router.post("/user_details", checkApiKey, checkToken, decryption, checkBodyInline(authRules["user_details"]), authModel?.Auth?.userDetails);

router.post("/update_device_info", checkApiKey, checkToken, decryption, checkBodyInline(authRules["update_device"]), authModel?.Auth?.updateDeviceInfo);

router.post("/edit_profile", checkApiKey, checkToken, decryption, checkBodyInline(authRules["edit_profile"]), authModel?.Auth?.editProfile);

export default router;