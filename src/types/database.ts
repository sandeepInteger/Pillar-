export type UserRole = "admin" | "engineer";

export type EmployeeType =
  | "founder"
  | "staff"
  | "engineer"
  | "foreman"
  | "labour";

export type EmployeeStatus = "active" | "inactive" | "left";

export type PaymentMethodType = "bank" | "upi";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  photo_url: string | null;
  employee_type: EmployeeType;
  designation: string | null;
  status: EmployeeStatus;
  start_date: string | null;
  end_date: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  landmark: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  aadhaar_last_4: string | null;
  pan_number: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeePhone {
  id: string;
  employee_id: string;
  phone_number: string;
  label: string;
  is_primary: boolean;
  created_at: string;
}

export interface EmployeePaymentMethod {
  id: string;
  employee_id: string;
  method_type: PaymentMethodType;
  is_primary: boolean;
  account_holder_name: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  upi_id: string | null;
  upi_phone: string | null;
  notes: string | null;
  created_at: string;
}

export interface EmployeeWithRelations extends Employee {
  employee_phones: EmployeePhone[];
  employee_payment_methods: EmployeePaymentMethod[];
}

export interface PhoneInput {
  phone_number: string;
  label: string;
  is_primary: boolean;
}

export interface PaymentInput {
  method_type: PaymentMethodType;
  is_primary: boolean;
  account_holder_name: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  upi_id: string;
  upi_phone: string;
  notes: string;
}

export interface EmployeeFormData {
  full_name: string;
  employee_type: EmployeeType;
  designation: string;
  status: EmployeeStatus;
  start_date: string;
  end_date: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  aadhaar_last_4: string;
  pan_number: string;
  notes: string;
  phones: PhoneInput[];
  payment_methods: PaymentInput[];
}

export const EMPLOYEE_TYPE_LABELS: Record<EmployeeType, string> = {
  founder: "Founder",
  staff: "Staff",
  engineer: "Engineer",
  foreman: "Foreman",
  labour: "Labour",
};

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  left: "Left",
};

export const EMPLOYEE_TYPE_COLORS: Record<EmployeeType, string> = {
  founder: "bg-violet-100 text-violet-700",
  staff: "bg-indigo-100 text-indigo-700",
  engineer: "bg-purple-100 text-purple-700",
  foreman: "bg-amber-100 text-amber-800",
  labour: "bg-slate-100 text-slate-700",
};

export type ShiftType = "absent" | "half" | "full" | "double";

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  shift_type: ShiftType;
  day_units: number;
  project_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceCellInput {
  employee_id: string;
  attendance_date: string;
  shift_type: ShiftType;
  project_id?: string | null;
}

export const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
  absent: "Absent",
  half: "Half Shift",
  full: "Full Shift",
  double: "Double Shift",
};

export const SHIFT_TYPE_SHORT: Record<ShiftType, string> = {
  absent: "A",
  half: "½",
  full: "F",
  double: "2×",
};

export const SHIFT_DAY_UNITS: Record<ShiftType, number> = {
  absent: 0,
  half: 0.5,
  full: 1,
  double: 2,
};

export const SHIFT_TYPE_COLORS: Record<ShiftType, string> = {
  absent: "bg-red-50 text-red-600 border-red-100",
  half: "bg-amber-50 text-amber-800 border-amber-100",
  full: "bg-emerald-50 text-emerald-700 border-emerald-100",
  double: "bg-violet-50 text-violet-700 border-violet-100",
};

export type ProjectStatus = "active" | "on_hold" | "completed";

export interface Project {
  id: string;
  project_code: string;
  name: string;
  client_name: string | null;
  location: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectAssignment {
  id: string;
  project_id: string;
  employee_id: string;
  is_active: boolean;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface ProjectAssignmentWithEmployee extends ProjectAssignment {
  employees: Employee;
}

export interface ProjectWithTeam extends Project {
  project_assignments: ProjectAssignmentWithEmployee[];
}

export interface ProjectFormData {
  name: string;
  client_name: string;
  location: string;
  status: ProjectStatus;
  start_date: string;
  end_date: string;
  description: string;
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  on_hold: "bg-amber-50 text-amber-800 ring-1 ring-amber-100",
  completed: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

/** Engineers/staff/founder can be on multiple projects; labour/foreman typically one site */
export const MULTI_PROJECT_TYPES: EmployeeType[] = [
  "engineer",
  "staff",
  "founder",
];
