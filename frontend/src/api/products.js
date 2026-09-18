import { apiGet, apiPost } from './client';

export function listProducts(token, { search, category } = {}) {
  return apiGet('listProducts', { token, search, category });
}

export function getProduct(token, id) {
  return apiGet('getProduct', { token, id });
}

export function addProduct(token, fields) {
  return apiPost('addProduct', { token, ...fields });
}

export function updateProduct(token, id, fields) {
  return apiPost('updateProduct', { token, id, ...fields });
}

export function deleteProduct(token, id) {
  return apiPost('deleteProduct', { token, id });
}

export function uploadImage(token, productId, imageBase64, imageMimeType) {
  return apiPost('uploadImage', { token, productId, imageBase64, imageMimeType });
}
