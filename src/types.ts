export type UserRole = 'super' | 'owner' | 'hr' | 'employee';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  username: string;
  password?: string; // Hashed
  role: UserRole;
  branch: string;
  department?: string;
  phone?: string;
  photoUrl?: string;
  status?: 'Available' | 'Busy' | 'On Leave' | 'Remote' | 'Meeting';
  joinDate: string;
  salaryA: number;
  salaryB: number;
  epf: number;
  advances: number;
  cover: number;
  intensive: number;
  travelling: number;
  net: number;
  performanceScore?: number;
  leaveQuotas: {
    annual: number;
    sick: number;
    casual: number;
    short: number;
  };
  usedLeaves: {
    annual: number;
    sick: number;
    casual: number;
    short: number;
  };
  sortOrder?: number;
  bankName?: string;
  bankBranch?: string;
  accountNo?: string;
  accountHolderName?: string;
  nic?: string;
  nickname?: string;
  extraDays?: number;
}

export interface AttendanceRecord {
  id?: string;
  userId: string;
  date: string;
  checkIn: any; // Date
  checkOut?: any;
  isLate: boolean;
  isEarlyOut: boolean;
}

export type LeaveType = 'Annual' | 'Sick' | 'Casual' | 'Short';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface LeaveRequest {
  id?: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  leaveType: LeaveType;
  startDate: any;
  endDate: any;
  startTime?: string;
  endTime?: string;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  createdAt: any;
  isQuotaExceeded?: boolean;
  imageUrl?: string;
  userPhoto?: string;
}

export interface Holiday {
  id: string;
  date: string;
  title: string;
  type: 'Public' | 'Bank' | 'Mercantile';
}

export interface Task {
  id?: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: any;
}

export interface PayrollRecord {
  id?: string;
  userId: string;
  userName: string;
  month: number;
  year: number;
  salaryA: number;
  salaryB: number;
  epf: number;
  advances: number;
  cover: number;
  intensive: number;
  travelling: number;
  extraDays?: number;
  netSalary: number;
  status: 'Paid' | 'Pending';
  createdAt: any;
  branch: string;
  sortOrder?: number;
  // Additional fields for management
  incentives?: number;
  bonus?: number;
}

export interface PerformanceRecord {
  id: string;
  userId: string;
  userName: string;
  evaluatorId: string;
  evaluatorName: string;
  score: number;
  rating: number;
  feedback: string;
  hrFeedback?: string;
  selfEvaluation?: string;
  goals: string[];
  status: 'Draft' | 'Completed' | 'Self-Evaluated';
  createdAt: any;
}

export type AdvanceStatus = 'Pending' | 'Approved' | 'Rejected';

export interface AdvanceRequest {
  id?: string;
  userId: string;
  userName?: string;
  userRole?: UserRole;
  userPhoto?: string;
  amount: number;
  reason: string;
  status: AdvanceStatus;
  approvedBy?: string;
  createdAt: string;
  updatedAt?: string;
}
