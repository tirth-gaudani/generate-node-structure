import { jest } from '@jest/globals';

// Mock dependencies using unstable_mockModule
await jest.unstable_mockModule('../config/database.js', () => ({
    default: {
        query: jest.fn(),
    },
}));

await jest.unstable_mockModule('../utils/common.js', () => ({
    default: {
        jwt_sign: jest.fn().mockResolvedValue('mock_token'),
        sendEmail: jest.fn(),
        checkUpdateDeviceInfo: jest.fn(),
        generateRandomOtp: jest.fn().mockResolvedValue({ otp: '123456', otp_expiry: new Date(Date.now() + 600000) }),
        sendOtp: jest.fn(),
        user_device_details: jest.fn().mockResolvedValue({}),
    },
}));

await jest.unstable_mockModule('bcryptjs', () => ({
    default: {
        hash: jest.fn().mockResolvedValue('hashed_password'),
        compare: jest.fn().mockResolvedValue(true),
    },
}));

await jest.unstable_mockModule('../middleware/headerValidator.js', () => {
    const sendResponse = (req, res, status, code, { keyword }, data) => {
        res.status(status).json({ code: status, message: code, data });
    };
    return {
        __esModule: true,
        default: {
            checkApiKey: (req, res, next) => next(),
            checkToken: (req, res, next) => {
                req.loginUser = { user_id: 1 };
                next();
            },
            decryption: (req, res, next) => next(),
            checkBodyInline: () => (req, res, next) => next(),
            sendResponse,
        },
        sendResponse,
    };
});

await jest.unstable_mockModule('../utils/uniqueMiddleware.js', () => ({
    default: {
        userCheckEmail: (req, res, next) => next(),
        userCheckMobile: (req, res, next) => next(),
        userCheckSocialId: (req, res, next) => next(),
    },
}));

// Import modules after mocking
const { default: request } = await import('supertest');
const { default: express } = await import('express');
const { default: bodyParser } = await import('body-parser');
const { default: authRoute } = await import('../modules/v1/api/Auth/auth.route.js');
const { default: con } = await import('../config/database.js');

const app = express();
app.use(bodyParser.json());
app.use('/api/v1/auth', authRoute);

describe('Auth API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock for queries to avoid failures on unexpected calls
        con.query.mockResolvedValue({ rows: [] });
    });

    describe('POST /signup', () => {
        it('should sign up a user successfully', async () => {
            con.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Insert user

            const res = await request(app)
                .post('/api/v1/auth/signup')
                .set('api_key', process.env.API_KEY || 'test_api_key')
                .send({
                    first_name: 'John',
                    last_name: 'Doe',
                    email: 'john@example.com',
                    password: 'password123',
                    country_code: '+1',
                    mobile_number: '1234567890',
                    login_type: 'S'
                });

            expect(res.status).toBe(200);
            expect(res.body.code).toBe(200);
            expect(res.body.message).toBe('success');
        });
    });

    describe('POST /login', () => {
        it('should login a user successfully', async () => {
            // Mock user with password starting with $2 to avoid migration query
            con.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'john@example.com', password: '$2a$12$hashed_password', is_active: true, is_verify: true }] });
            con.query.mockResolvedValueOnce({}); // Update online status

            const res = await request(app)
                .post('/api/v1/auth/login')
                .set('api_key', process.env.API_KEY || 'test_api_key')
                .send({
                    email: 'john@example.com',
                    password: 'password123'
                });

            expect(res.status).toBe(200);
            expect(res.body.code).toBe(200);
            expect(res.body.message).toBe('1');
        });
    });
});
