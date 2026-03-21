import { env } from '$env/dynamic/public';
import type {
  AuthResponse,
  User,
  Company,
  EmployeeProfile,
  WorkSchedule,
  TimeRecord,
  AttendanceDay,
  QrCodeSession,
  DashboardSummary,
  TimeRecordType,
} from '$lib/types';
import { authStore } from '$lib/stores/auth';
import { get } from 'svelte/store';

function resolveBaseUrl(): string {
  if (env.PUBLIC_API_URL) {
    return env.PUBLIC_API_URL;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }

  return 'http://localhost:3000';
}

const BASE_URL = resolveBaseUrl();

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = `${baseUrl}/api`;
  }

  private getHeaders(requireAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (requireAuth) {
      const auth = get(authStore);
      if (auth.accessToken) {
        headers['Authorization'] = `Bearer ${auth.accessToken}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Erro desconhecido',
        statusCode: response.status,
      }));
      throw error;
    }

    const text = await response.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    requireAuth = true,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.getHeaders(requireAuth),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('POST', '/auth/login', { email, password }, false);
  }

  async registerCompanyAdmin(data: {
    companyName: string;
    companyCnpj?: string;
    companyEmail: string;
    companyPhone?: string;
    companyAddress?: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('POST', '/auth/register-company-admin', data, false);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('POST', '/auth/refresh', { refreshToken }, false);
  }

  async logout(refreshToken?: string): Promise<void> {
    return this.request('POST', '/auth/logout', { refreshToken });
  }

  // Users
  async getMe(): Promise<User> {
    return this.request<User>('GET', '/users/me');
  }

  async createUser(data: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }): Promise<User> {
    return this.request<User>('POST', '/users', data);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.request<User>('PATCH', `/users/${id}`, data);
  }

  // Companies
  async getCompany(): Promise<Company> {
    return this.request<Company>('GET', '/companies/me');
  }

  async updateCompany(data: Partial<Company>): Promise<Company> {
    return this.request<Company>('PATCH', '/companies/me', data);
  }

  // Employees
  async getEmployees(): Promise<EmployeeProfile[]> {
    return this.request<EmployeeProfile[]>('GET', '/employees');
  }

  async createEmployee(data: Partial<EmployeeProfile>): Promise<EmployeeProfile> {
    return this.request<EmployeeProfile>('POST', '/employees', data);
  }

  async updateEmployee(id: string, data: Partial<EmployeeProfile>): Promise<EmployeeProfile> {
    return this.request<EmployeeProfile>('PATCH', `/employees/${id}`, data);
  }

  // Work Schedules
  async getWorkSchedules(): Promise<WorkSchedule[]> {
    return this.request<WorkSchedule[]>('GET', '/work-schedules');
  }

  async createWorkSchedule(data: Partial<WorkSchedule>): Promise<WorkSchedule> {
    return this.request<WorkSchedule>('POST', '/work-schedules', data);
  }

  // Time Records
  async createManualRecord(data: {
    type: TimeRecordType;
    recordedAt?: string;
    notes?: string;
  }): Promise<TimeRecord> {
    return this.request<TimeRecord>('POST', '/time-records/manual', data);
  }

  async createQrcodeRecord(data: {
    token: string;
    notes?: string;
  }): Promise<TimeRecord> {
    return this.request<TimeRecord>('POST', '/time-records/qrcode', data);
  }

  async createFacialRecord(data: {
    type: TimeRecordType;
    image: string;
    notes?: string;
    thresholdAccept?: number;
    thresholdReview?: number;
  }): Promise<{ record: TimeRecord; facialDecision: string; score: number; threshold: { accept: number; review: number } } | { decision: string; score: number; threshold: { accept: number; review: number }; message?: string }> {
    return this.request('POST', '/time-records/facial', data);
  }

  async getMyRecords(params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<TimeRecord[]> {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return this.request<TimeRecord[]>('GET', `/time-records/me${query}`);
  }

  async getCompanyRecords(params?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    type?: string;
  }): Promise<TimeRecord[]> {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return this.request<TimeRecord[]>('GET', `/time-records/company${query}`);
  }

  // Attendance
  async getMyAttendance(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<AttendanceDay[]> {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return this.request<AttendanceDay[]>('GET', `/attendance/me${query}`);
  }

  async getCompanyAttendance(params?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
  }): Promise<AttendanceDay[]> {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return this.request<AttendanceDay[]>('GET', `/attendance/company${query}`);
  }

  async getDashboard(): Promise<DashboardSummary> {
    return this.request<DashboardSummary>('GET', '/attendance/dashboard');
  }

  async markAbsent(userId: string, date: string): Promise<AttendanceDay> {
    return this.request<AttendanceDay>('POST', `/attendance/absent/${userId}/${date}`, {});
  }

  // QR Code
  async createQrCodeSession(data: {
    allowedType: TimeRecordType;
    expirationMinutes?: number;
  }): Promise<QrCodeSession> {
    return this.request<QrCodeSession>('POST', '/qrcode/session', data);
  }

  async getCurrentQrCodeSession(): Promise<QrCodeSession> {
    return this.request<QrCodeSession>('GET', '/qrcode/session/current');
  }

  async getQrCodeHistory(): Promise<QrCodeSession[]> {
    return this.request<QrCodeSession[]>('GET', '/qrcode/session/history');
  }

  async validateQrToken(token: string): Promise<{ valid: boolean; session: Partial<QrCodeSession> }> {
    return this.request('GET', `/qrcode/validate/${token}`, undefined, false);
  }

  // Facial (admin)
  async enrollFace(data: { images: string[]; userId: string }): Promise<{
    templateId: string;
    samplesUsed: number;
    qualityScore: number | null;
    engine: string;
    version: string;
  }> {
    return this.request('POST', '/facial/enroll', data);
  }

  async getFaceStatus(userId: string): Promise<{
    hasTemplate: boolean;
    template: {
      id: string;
      createdAt: string;
      samplesCount: number;
      qualityScore: number | null;
      engine: string;
      version: string;
    } | null;
  }> {
    return this.request('GET', `/facial/status/${userId}`);
  }
}

export const api = new ApiClient(BASE_URL);
