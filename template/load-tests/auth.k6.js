import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '10s', target: 0 },
  ],
};

const BASE_URL = 'http://localhost:3000/api/v1/auth';
const API_KEY = 'test_api_key'; // Replace with actual API key

export default function () {
  const email = `testuser_${__VU}_${__ITER}@example.com`;
  const password = 'password123';

  // Signup
  let signupRes = http.post(`${BASE_URL}/signup`, JSON.stringify({
    first_name: 'Test',
    last_name: 'User',
    email: email,
    password: password,
    country_code: '+1',
    mobile_number: '1234567890',
    login_type: 'S'
  }), {
    headers: { 'Content-Type': 'application/json', 'api_key': API_KEY },
  });

  check(signupRes, {
    'signup status is 200': (r) => r.status === 200,
  });

  sleep(1);

  // Login
  let loginRes = http.post(`${BASE_URL}/login`, JSON.stringify({
    email: email,
    password: password,
  }), {
    headers: { 'Content-Type': 'application/json', 'api_key': API_KEY },
  });

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login has token': (r) => r.json('data.token') !== undefined,
  });

  const token = loginRes.json('data.token');

  sleep(1);

  // User Details
  if (token) {
    let detailsRes = http.post(`${BASE_URL}/user_details`, {}, {
      headers: { 'Content-Type': 'application/json', 'api_key': API_KEY, 'token': token },
    });

    check(detailsRes, {
      'user details status is 200': (r) => r.status === 200,
    });
  }
}
