import 'dotenv/config';

export default {
    'APP_NAME': process.env.APP_NAME,
    'PER_PAGE': '8',
    'PER_PAGE_TEN': '10',
    'IS_PRODUCTION': false,

    'WEBSITE_BASE_URL': process.env.WEBSITE_BASE_URL,
    'BASE_URL_WITHOUT_API_DOC': process.env.BASE_URL_WITHOUT_API_DOC,
    'SUPPORT_EMAIL': 'apistructure@gmail.com',

    'BASE_URL': process.env.AWS_S3_BASE_URL,

    //////////////////////////////////////////////////////////////////////
    //                           development                            //
    //////////////////////////////////////////////////////////////////////

    'ENCRYPTION_BYPASS': true,
    // 'ENCRYPTION_BYPASS': false,
};
