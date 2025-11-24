import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

process.env.KEY = process.env.KEY || '1234567890123456';
process.env.JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'unit-test-secret';
process.env.WEBSITE_BASE_URL = process.env.WEBSITE_BASE_URL || 'https://example.com/';

const queryMock = jest.fn();
const sendResponseMock = jest.fn();
const selectQMock = jest.fn();
const jwtSignMock = jest.fn().mockResolvedValue('signed-jwt-token');
const sendEmailMock = jest.fn().mockResolvedValue();
const checkUpdateDeviceInfoMock = jest.fn().mockResolvedValue();
const generateRandomOtpMock = jest.fn().mockResolvedValue({ otp: '654321', otp_expiry: new Date(Date.now() + 600000) });
const sendOtpMock = jest.fn().mockResolvedValue();
const userDeviceDetailsMock = jest.fn().mockResolvedValue({ device_type: 'I' });

jest.unstable_mockModule('../middleware/headerValidator.js', () => ({
  default: { sendResponse: sendResponseMock },
}));

jest.unstable_mockModule('../utils/common.js', () => ({
  default: {
    jwt_sign: jwtSignMock,
    sendEmail: sendEmailMock,
    checkUpdateDeviceInfo: checkUpdateDeviceInfoMock,
    generateRandomOtp: generateRandomOtpMock,
    sendOtp: sendOtpMock,
    user_device_details: userDeviceDetailsMock,
  },
}));

jest.unstable_mockModule('../config/database.js', () => ({
  default: { query: queryMock },
}));

jest.unstable_mockModule('../utils/SQLWorker.js', () => ({
  SELECT_Q: selectQMock,
}));

let Auth;
let countryList;

beforeAll(async () => {
  const authModule = await import('../modules/v1/api/Auth/auth.model.js');
  Auth = authModule.default.Auth;
  countryList = authModule.default.countryList;
});

beforeEach(() => {
  jest.clearAllMocks();
  queryMock.mockReset();
  selectQMock.mockReset();
  generateRandomOtpMock.mockResolvedValue({ otp: '654321', otp_expiry: new Date(Date.now() + 600000) });
});

const expectKeyword = (keyword) => {
  expect(sendResponseMock).toHaveBeenCalled();
  const calls = sendResponseMock.mock.calls;
  const lastCall = calls[calls.length - 1];
  const metaArg = lastCall[4];
  expect(metaArg).toEqual(expect.objectContaining({ keyword }));
};

const originalSetTimeout = global.setTimeout;
beforeAll(() => {
  jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
    fn();
    return 0;
  });
});

afterAll(() => {
  global.setTimeout.mockRestore?.();
  global.setTimeout = originalSetTimeout;
});

describe('Auth API handlers', () => {
  test('signUp success', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const req = {
      body: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        country_code: '+1',
        mobile_number: '5551112222',
        password: 'Secret123',
        login_type: 'S',
        device_type: 'I',
      },
      headers: {},
    };
    await Auth.signUp(req, {});
    expect(sendOtpMock).toHaveBeenCalled();
    expectKeyword('rest_keywords_user_signup_success');
  });

  test('completeProfile updates names', async () => {
    queryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id: 1, first_name: 'John', last_name: 'Doe' }] });
    const req = {
      body: { name: 'John Doe', email: 'john@example.com' },
      loginUser: { user_id: 1 },
      headers: {},
    };
    await Auth.completeProfile(req, {});
    expectKeyword('rest_keywords_user_complete_profile_success');
  });

  test('login success with bcrypt password', async () => {
    const hash = await bcrypt.hash('Secret123', 12);
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 1, password: hash, is_active: true, is_delete: false, is_verify: true }] })
      .mockResolvedValueOnce({});
    const req = { body: { email: 'john@example.com', password: 'Secret123' }, headers: {} };
    await Auth.login(req, {});
    expectKeyword('rest_keywords_user_login_success');
  });

  test('resendOtp sends code', async () => {
    const userRow = { id: 1, country_code: '+1', mobile_number: '555' };
    queryMock
      .mockResolvedValueOnce({ rows: [userRow] })
      .mockResolvedValueOnce({ rows: [userRow] });
    const req = { body: { email: 'john@example.com' }, headers: {} };
    await Auth.resendOtp(req, {});
    expectKeyword('otp_sent');
  });

  test('verifyOtp success', async () => {
    const userRow = { id: 1, otp: '654321', otp_expiry: new Date(Date.now() + 600000), is_delete: false, is_active: true };
    queryMock
      .mockResolvedValueOnce({ rows: [userRow] })
      .mockResolvedValueOnce({});
    const req = { body: { country_code: '+1', mobile_number: '555', otp: 654321 }, headers: {} };
    await Auth.verifyOtp(req, {});
    expectKeyword('otp_verified');
  });

  test('forgotPassword issues email', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({});
    const req = { body: { email: 'john@example.com' }, headers: {} };
    await Auth.forgotPassword(req, {});
    expect(sendEmailMock).toHaveBeenCalled();
    expectKeyword('mail_sent_1');
  });

  test('resetPassword stores new hash', async () => {
    const hashed = await bcrypt.hash('OldPass123', 12);
    const jwtToken = jwt.sign({ data: { user_id: 1, user_type: 'user', email: 'john@example.com' } }, process.env.JWT_SECRET_KEY);
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 1, email: 'john@example.com', forgot_token: jwtToken, forgot_expiry: new Date(Date.now() + 600000), password: hashed }] })
      .mockResolvedValueOnce({});
    const req = { body: { forgot_token: jwtToken, new_password: 'NewPass123', confirm_password: 'NewPass123' }, headers: {} };
    await Auth.resetPassword(req, {});
    expectKeyword('password_changed');
  });

  test('changePassword updates hash', async () => {
    const hashed = await bcrypt.hash('Current123', 12);
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 1, password: hashed, is_delete: false }] })
      .mockResolvedValueOnce({});
    const req = {
      body: { current_password: 'Current123', new_password: 'NextPass123', confirm_password: 'NextPass123' },
      loginUser: { user_id: 1 },
      headers: {},
    };
    await Auth.changePassword(req, {});
    expectKeyword('password_changed');
  });

  test('deleteAccount marks user deleted', async () => {
    queryMock.mockResolvedValueOnce({}).mockResolvedValueOnce({});
    const req = { loginUser: { user_id: 1 }, headers: {} };
    await Auth.deleteAccount(req, {});
    expectKeyword('rest_keywords_user_delete_success');
  });

  test('logout clears tokens', async () => {
    queryMock.mockResolvedValueOnce({}).mockResolvedValueOnce({});
    const req = { loginUser: { user_id: 1 }, headers: {} };
    await Auth.logout(req, {});
    expectKeyword('logout_success');
  });

  test('contactUs stores inquiry', async () => {
    queryMock.mockResolvedValueOnce({});
    const req = {
      body: { subject: 'Help', description: 'Need assistance', email: 'john@example.com' },
      loginUser: { user_id: 1 },
      headers: {},
    };
    await Auth.contactUs(req, {});
    expectKeyword('rest_keywords_contact_us_success');
  });

  test('userDetails returns sanitized user', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 1, first_name: 'John', password: 'secret' }] });
    const req = { loginUser: { user_id: 1 }, headers: {} };
    await Auth.userDetails(req, {});
    expectKeyword('user_details_success');
  });

  test('updateDeviceInfo returns updated user', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 1, first_name: 'John', password: 'secret' }] });
    const req = { loginUser: { user_id: 1 }, body: { device_type: 'I' }, headers: {} };
    await Auth.updateDeviceInfo(req, {});
    expectKeyword('user_details_update_success');
  });

  test('editProfile persists changes', async () => {
    queryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id: 1, first_name: 'Johnny' }] });
    const req = {
      loginUser: { user_id: 1 },
      body: { first_name: 'Johnny', email: 'johnny@example.com' },
      headers: {},
    };
    await Auth.editProfile(req, {});
    expectKeyword('rest_keywords_user_profile_edit_success');
  });

  test('countryList returns data', async () => {
    selectQMock.mockResolvedValueOnce([{ country_code: '+1', name: 'USA' }]);
    const req = { headers: {} };
    await countryList(req, {});
    expectKeyword('country_list_found');
  });
});