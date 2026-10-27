// Add these exports to client/src/services/api.js

export const attendanceAPI = {
  checkIn:         (data) => api.post('/attendance/check-in', data),
  checkOut:        (data) => api.post('/attendance/check-out', data),
  getToday:        ()     => api.get('/attendance/today'),
  getHistory:      (params) => api.get('/attendance/history', { params }),
  manualEntry:     (data) => api.post('/attendance/manual', data),
  getMonthlySummary: (params) => api.get('/attendance/monthly-summary', { params }),
  getShifts:       ()     => api.get('/attendance/shifts'),
  getHolidays:     (params) => api.get('/attendance/holidays', { params }),
  createHoliday:   (data) => api.post('/attendance/holidays', data),
  deleteHoliday:   (id)   => api.delete(`/attendance/holidays/${id}`),
};

export const leaveAPI = {
  apply:            (data)   => api.post('/leave', data),
  getMyLeaves:      (params) => api.get('/leave/my', { params }),
  getBalance:       (params) => api.get('/leave/balance', { params }),
  getPending:       ()       => api.get('/leave/pending'),
  action:           (id, data) => api.patch(`/leave/${id}/action`, data),
  cancel:           (id, data) => api.patch(`/leave/${id}/cancel`, data),
  getAll:           (params) => api.get('/leave', { params }),
  getPolicies:      ()       => api.get('/leave/policies'),
};
