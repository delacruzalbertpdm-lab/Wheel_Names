import { apiRequest } from './client';

export function fetchParticipants(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.is_eligible !== undefined && params.is_eligible !== '') {
    query.set('is_eligible', String(params.is_eligible));
  }
  if (params.department) query.set('department', params.department);

  const qs = query.toString();
  return apiRequest(`/participants/${qs ? `?${qs}` : ''}`);
}

export function createParticipant(payload) {
  return apiRequest('/participants/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateParticipant(id, payload) {
  return apiRequest(`/participants/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteParticipant(id) {
  return apiRequest(`/participants/${id}/`, {
    method: 'DELETE',
  });
}

export function importParticipantsFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest('/participants/import/', {
    method: 'POST',
    body: formData,
  });
}

export function resetAllEligibility() {
  return apiRequest('/participants/reset-eligibility/', {
    method: 'POST',
  });
}

export function seedSampleParticipants() {
  return apiRequest('/participants/seed-sample/', {
    method: 'POST',
  });
}

export function bulkDeleteParticipants(ids = null) {
  return apiRequest('/participants/bulk-delete/', {
    method: 'POST',
    body: JSON.stringify(ids ? { ids } : {}),
  });
}

