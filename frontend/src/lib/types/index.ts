export type Role = 'COMPANY_ADMIN' | 'EMPLOYEE';

export type TimeRecordType = 'CLOCK_IN' | 'BREAK_START' | 'BREAK_END' | 'CLOCK_OUT';

export type RecordMethod = 'MANUAL' | 'QR_CODE' | 'FACIAL';

export type AttendanceStatus =
  | 'ON_TIME'
  | 'LATE'
  | 'ABSENT'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'INCONSISTENT';

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  email: string;
  phone?: string;
  address?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  companyId: string;
  company?: Pick<Company, 'id' | 'name'>;
  createdAt: string;
}

export interface EmployeeProfile {
  id: string;
  userId: string;
  registration?: string;
  position?: string;
  department?: string;
  hireDate?: string;
  workScheduleId?: string;
  workSchedule?: WorkSchedule;
  user?: Pick<User, 'id' | 'name' | 'email' | 'active'>;
}

export interface WorkSchedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  workingDays: number[];
  toleranceMinutes: number;
  companyId: string;
  createdAt: string;
}

export interface TimeRecord {
  id: string;
  type: TimeRecordType;
  method: RecordMethod;
  recordedAt: string;
  notes?: string;
  userId: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  createdAt: string;
}

export interface AttendanceDay {
  id: string;
  date: string;
  status: AttendanceStatus;
  totalMinutes?: number;
  expectedMinutes?: number;
  lateMinutes: number;
  notes?: string;
  userId: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface QrCodeSession {
  id: string;
  token: string;
  allowedType: TimeRecordType;
  companyId?: string;
  expiresAt: string;
  createdAt?: string;
  used: boolean;
  usedAt?: string;
  qrCodeImage?: string;
  active?: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface DashboardSummary {
  date: string;
  totalEmployees: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  notRecordedToday: number;
}

export interface ApiError {
  message: string | string[];
  error: string;
  statusCode: number;
}
