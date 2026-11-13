import { apiRequest } from './client';

export function fetchDashboardSummary() {
  return apiRequest('/dashboard/summary/');
}

export function executeRandomDraw({ requestedCount, excludeWinners, title, idempotencyKey }) {
  return apiRequest('/draws/execute/', {
    method: 'POST',
    body: JSON.stringify({
      requested_count: Number(requestedCount),
      exclude_winners: Boolean(excludeWinners),
      title: title || 'Quick Selection Draw',
      idempotency_key: idempotencyKey || null,
    }),
  });
}

export function fetchDrawHistory(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiRequest(`/draws/${query}`);
}

export function deleteDrawSession(id) {
  return apiRequest(`/draws/${id}/`, {
    method: 'DELETE',
  });
}

export function clearAllDrawHistory() {
  return apiRequest('/draws/clear/', {
    method: 'DELETE',
  });
}

