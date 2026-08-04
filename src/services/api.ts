import { Report, SensorDevice, CitizenComplaint, TelemetryLog, SystemSettings, UserProfile, LoginLogEntry } from '../utils/storage';

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error (${response.status}): ${errText || response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export const reportsApi = {
  fetch: () => fetch(`${API_BASE}/reports`).then(res => handleResponse<Report[]>(res)),
  create: (report: Omit<Report, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) =>
    fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    }).then(res => handleResponse<Report>(res)),
  update: (id: string, updates: Partial<Report>) =>
    fetch(`${API_BASE}/reports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).then(res => handleResponse<Report>(res)),
  delete: (id: string) =>
    fetch(`${API_BASE}/reports/${id}`, { method: 'DELETE' }).then(res => {
      if (!res.ok) throw new Error(`Failed to delete report ${id}`);
    }),
  clearCompleted: () =>
    fetch(`${API_BASE}/reports/clear-completed`, { method: 'POST' }).then(res =>
      handleResponse<{ deletedCount: number }>(res)
    )
};

export const complaintsApi = {
  fetch: () => fetch(`${API_BASE}/complaints`).then(res => handleResponse<CitizenComplaint[]>(res)),
  create: (complaint: any) =>
    fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaint)
    }).then(res => handleResponse<CitizenComplaint>(res)),
  update: (id: string, updates: Partial<CitizenComplaint>) =>
    fetch(`${API_BASE}/complaints/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).then(res => handleResponse<CitizenComplaint>(res)),
  upvote: (id: string) =>
    fetch(`${API_BASE}/complaints/${id}/upvote`, { method: 'POST' }).then(res =>
      handleResponse<CitizenComplaint>(res)
    )
};

export const sensorsApi = {
  fetch: () => fetch(`${API_BASE}/sensors`).then(res => handleResponse<SensorDevice[]>(res)),
  updateAll: (sensors: SensorDevice[]) =>
    fetch(`${API_BASE}/sensors`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sensors)
    }).then(res => handleResponse<SensorDevice[]>(res))
};

export const notificationsApi = {
  fetch: () => fetch(`${API_BASE}/notifications`).then(res => handleResponse<any[]>(res)),
  update: (id: string, updates: any) =>
    fetch(`${API_BASE}/notifications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).then(res => handleResponse<any>(res)),
  markAllRead: () =>
    fetch(`${API_BASE}/notifications/mark-all-read`, { method: 'POST' }).then(res =>
      handleResponse<any[]>(res)
    )
};

export const logsApi = {
  fetch: () => fetch(`${API_BASE}/logs`).then(res => handleResponse<TelemetryLog[]>(res)),
  clear: () =>
    fetch(`${API_BASE}/logs/clear`, { method: 'POST' }).then(res => {
      if (!res.ok) throw new Error('Failed to clear logs');
    })
};

export const settingsApi = {
  fetch: () => fetch(`${API_BASE}/settings`).then(res => handleResponse<SystemSettings>(res)),
  save: (settings: SystemSettings) =>
    fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    }).then(res => handleResponse<SystemSettings>(res))
};

export const usersApi = {
  fetch: () => fetch(`${API_BASE}/users`).then(res => handleResponse<UserProfile[]>(res)),
  save: (user: UserProfile) =>
    fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    }).then(res => handleResponse<UserProfile>(res))
};

export const loginLogsApi = {
  fetch: () => fetch(`${API_BASE}/login-logs`).then(res => handleResponse<LoginLogEntry[]>(res)),
  create: (entry: Omit<LoginLogEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) =>
    fetch(`${API_BASE}/login-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    }).then(res => handleResponse<LoginLogEntry>(res)),
  clear: () =>
    fetch(`${API_BASE}/login-logs/clear`, { method: 'POST' }).then(res => {
      if (!res.ok) throw new Error('Failed to clear login logs');
    })
};

export const simulationApi = {
  triggerStep: (step: number, currentReportId: string | null) =>
    fetch(`${API_BASE}/simulation/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step, currentReportId })
    }).then(res => handleResponse<{ nextReportId: string | null }>(res))
};
