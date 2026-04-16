/**
 * SkillVista API Client for React Native
 *
 * Connects to the FastAPI backend for:
 * - Authentication (candidate login)
 * - Dashboard data
 * - Cohort analytics
 * - Student reports
 */

const BASE_URL = 'http://localhost:4000/api'

let _authToken = null

export function setAuthToken(token) {
  _authToken = token
}

export function clearAuthToken() {
  _authToken = null
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (_authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed: ${response.status}`)
  }

  return response.json()
}

// ── Auth ──

export async function getCandidates() {
  return request('/auth/candidates')
}

export async function loginCandidate(studentId) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId }),
  })
  setAuthToken(data.token)
  return data
}

export async function getCurrentUser() {
  return request('/auth/me')
}

// ── Interview ──

export async function getDashboard() {
  return request('/interview/dashboard')
}

export async function getInterviewHistory() {
  return request('/interview/history')
}

// ── Analytics ──

export async function getStudentReport(studentId) {
  return request(`/analytics/student/${studentId}`)
}

export async function getMyLatestReport() {
  return request('/analytics/me/latest')
}

// ── Faculty ──

export async function getCohortData(academicYear = null) {
  const params = academicYear ? `?academic_year=${academicYear}` : ''
  return request(`/faculty/cohort${params}`)
}

export async function getStudentGrowth(studentId) {
  return request(`/faculty/student/${studentId}/growth`)
}

export async function getAnalyticsSummary() {
  return request('/faculty/analytics/summary')
}

export default {
  setAuthToken,
  clearAuthToken,
  getCandidates,
  loginCandidate,
  getCurrentUser,
  getDashboard,
  getInterviewHistory,
  getStudentReport,
  getMyLatestReport,
  getCohortData,
  getStudentGrowth,
  getAnalyticsSummary,
}
