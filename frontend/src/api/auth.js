import { apiGet, apiPost } from './client';

export function login(username, password) {
  return apiPost('login', { username, password });
}

export function logout(token) {
  return apiPost('logout', { token });
}

export function me(token) {
  return apiGet('me', { token });
}

export function changePassword(token, oldPassword, newPassword) {
  return apiPost('changePassword', { token, oldPassword, newPassword });
}
