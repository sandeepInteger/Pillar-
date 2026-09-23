export type UserRole = "admin" | "viewer";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin (full access)",
  viewer: "Viewer (read only)",
};

export type EmployeeType =
  | "founder"
  | "staff"
  | "engineer"
  | "foreman"
  | "labour"
  | "carpenter"
  | "mason";

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
  salary_type: SalaryType;
  daily_rate: number | null;
  hourly_rate: number | null;
  monthly_salary: number | null;
  monthly_sl_days: number;
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
  salary_type: SalaryType;
  daily_rate: string;
  hourly_rate: string;
  monthly_salary: string;
  monthly_sl_days: string;
  phones: PhoneInput[];
  payment_methods: PaymentInput[];
}

export interface SalaryRow {
  employee: EmployeeWithRelations;
  manDays: number;
  absentDays: number;
  slDays: number;
  regularHours: number;
  overtimeHours: number;
  dailyRate: number | null;
  monthlySalary: number | null;
  salaryType: SalaryType;
  rateDisplay: string | null;
  grossAmount: number | null;
  salaryDeduction: number;
  slAllowance: number;
  totalPaidOut: number;
  openingBalance: number;
  monthBalance: number | null;
  balanceDue: number | null;
  hasPaymentMethod: boolean;
}

export interface SalarySummary {
  rows: SalaryRow[];
  totalManDays: number;
  totalGross: number;
  totalPaidOut: number;
  totalBalanceDue: number;
  employeesWithRate: number;
  employeesMissingRate: number;
  employeesMissingPayment: number;
}

export type SalaryPaymentType =
  | "advance"
  | "salary"
  | "weekly_kharcha"
  | "bonus"
  | "deduction";

export type SalaryPaymentMode = "upi" | "bank" | "cash";

export interface SalaryPayment {
  id: string;
  employee_id: string;
  payment_date: string;
  amount: number;
  payment_type: SalaryPaymentType;
  payment_mode: SalaryPaymentMode | null;
  payment_app: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface SalaryPaymentFormData {
  payment_date: string;
  amount: string;
  payment_type: SalaryPaymentType;
  payment_mode: SalaryPaymentMode;
  payment_app: string;
  payment_reference: string;
  notes: string;
}

export interface SalaryLedgerEntry {
  id: string;
  date: string;
  label: string;
  paymentType: SalaryPaymentType | "earned" | "opening";
  paymentMode: SalaryPaymentMode | null;
  paymentApp: string | null;
  paymentReference: string | null;
  paidOut: number;
  earned: number;
  isCalculated?: boolean;
}

export interface EmployeeSalaryDetail {
  employee: EmployeeWithRelations;
  month: string;
  manDays: number;
  absentDays: number;
  slDays: number;
  dailyRate: number | null;
  monthlySalary: number | null;
  salaryType: SalaryType;
  slAllowance: number;
  salaryDeduction: number;
  grossAmount: number | null;
  totalPaidOut: number;
  openingBalance: number;
  monthBalance: number | null;
  balanceDue: number | null;
  ledger: SalaryLedgerEntry[];
  payments: SalaryPayment[];
}

export const SALARY_PAYMENT_TYPE_LABELS: Record<SalaryPaymentType, string> = {
  advance: "Advance",
  salary: "Salary",
  weekly_kharcha: "Weekly Kharcha",
  bonus: "Bonus",
  deduction: "Deduction",
};

export const SALARY_PAYMENT_MODE_LABELS: Record<SalaryPaymentMode, string> = {
  upi: "UPI",
  bank: "Bank Account",
  cash: "Cash",
};

export const SALARY_PAYMENT_APP_OPTIONS = [
  "PhonePe",
  "Google Pay",
  "Paytm",
  "BHIM",
  "Amazon Pay",
  "Other",
] as const;

export const EMPLOYEE_TYPE_LABELS: Record<EmployeeType, string> = {
  founder: "Founder",
  staff: "Staff",
  engineer: "Engineer",
  foreman: "Foreman",
  labour: "Labour",
  carpenter: "Carpenter",
  mason: "Mason",
};

/** List / row order: top of org → site workers */
export const EMPLOYEE_TYPE_DISPLAY_ORDER: EmployeeType[] = [
  "founder",
  "engineer",
  "foreman",
  "carpenter",
  "mason",
  "labour",
  "staff",
];

export function compareEmployeeTypes(
  a: EmployeeType,
  b: EmployeeType
): number {
  const rank = (type: EmployeeType) => {
    const index = EMPLOYEE_TYPE_DISPLAY_ORDER.indexOf(type);
    return index === -1 ? EMPLOYEE_TYPE_DISPLAY_ORDER.length : index;
  };
  return rank(a) - rank(b);
}

/** Dropdown options for type filters (People, Attendance, Salary) */
export const EMPLOYEE_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "Everyone" },
  ...EMPLOYEE_TYPE_DISPLAY_ORDER.map((value) => ({
    value,
    label: EMPLOYEE_TYPE_LABELS[value],
  })),
];

/** Daily-wage site workers counted with labour in site analytics */
export const SITE_LABOUR_TYPES: EmployeeType[] = [
  "labour",
  "carpenter",
  "mason",
];

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
  carpenter: "bg-orange-100 text-orange-800",
  mason: "bg-stone-100 text-stone-700",
};

export type ShiftType =
  | "absent"
  | "half"
  | "full"
  | "double"
  | "sl"
  | "hours";

export type SalaryType = "daily" | "monthly" | "hourly";

/** Foreman & engineer: shift attendance + daily wage with paid SL allowance */
export const DAILY_WAGE_SL_EMPLOYEE_TYPES: EmployeeType[] = [
  "foreman",
  "engineer",
];

export function usesDailyWageWithSl(employeeType: EmployeeType): boolean {
  return DAILY_WAGE_SL_EMPLOYEE_TYPES.includes(employeeType);
}

export function usesShiftAttendance(employeeType: EmployeeType): boolean {
  return usesDailyWageWithSl(employeeType);
}

/** Founder: fixed monthly pay only — no attendance or SL tracking */
export function isFounderFixedSalary(employeeType: EmployeeType): boolean {
  return employeeType === "founder";
}

export function tracksAttendance(employeeType: EmployeeType): boolean {
  return !isFounderFixedSalary(employeeType);
}

/** Standard hours that count as one present day */
export const STANDARD_SHIFT_HOURS = 8;

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  shift_type: ShiftType;
  day_units: number;
  hours_worked: number | null;
  overtime_hours: number;
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
  hours_worked?: number | null;
  project_id?: string | null;
}

export type HourlyAttendanceStatus = "absent" | "sl" | "work";

export interface HourlyAttendanceCell {
  status: HourlyAttendanceStatus;
  hours: number;
}

export const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
  absent: "Absent",
  half: "Half Shift",
  full: "Full Shift",
  double: "Double Shift",
  sl: "SL (Paid Leave)",
  hours: "Hours worked",
};

export const SHIFT_TYPE_SHORT: Record<ShiftType, string> = {
  absent: "A",
  half: "½",
  full: "F",
  double: "2×",
  sl: "SL",
  hours: "H",
};

export const SHIFT_DAY_UNITS: Record<ShiftType, number> = {
  absent: 0,
  half: 0.5,
  full: 1,
  double: 2,
  sl: 0,
  hours: 0,
};

export const SHIFT_TYPE_COLORS: Record<ShiftType, string> = {
  absent: "bg-red-50 text-red-600 border-red-100",
  half: "bg-amber-50 text-amber-800 border-amber-100",
  full: "bg-emerald-50 text-emerald-700 border-emerald-100",
  double: "bg-violet-50 text-violet-700 border-violet-100",
  sl: "bg-sky-50 text-sky-700 border-sky-100",
  hours: "bg-emerald-50 text-emerald-800 border-emerald-100",
};

export const SALARY_TYPE_LABELS: Record<SalaryType, string> = {
  daily: "Daily wage",
  monthly: "Fixed monthly",
  hourly: "Hourly wage",
};

/** Standard working days/month for monthly salary deductions (India sites) */
export const STANDARD_MONTH_WORKING_DAYS = 26;

export const DEFAULT_MONTHLY_SL_DAYS: Partial<Record<EmployeeType, number>> = {
  engineer: 1,
  foreman: 1,
};

export const DEFAULT_SALARY_TYPE: Record<EmployeeType, SalaryType> = {
  labour: "hourly",
  carpenter: "hourly",
  mason: "hourly",
  foreman: "daily",
  engineer: "daily",
  staff: "hourly",
  founder: "monthly",
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

export interface ProjectBankInflow {
  id: string;
  project_id: string;
  received_date: string;
  amount: number;
  reference_note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ProjectBankInflowWeekSummary {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  totalAmount: number;
  entryCount: number;
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

export type RaBillPaymentStatus = "pending" | "received";

export interface RaBill {
  id: string;
  project_id: string;
  bill_label: string;
  contractor_name: string | null;
  confirmed_date: string;
  work_period_start: string | null;
  work_period_end: string | null;
  gross_amount: number;
  gst_applicable: boolean;
  igst_amount: number;
  retention_amount: number;
  tds_amount: number;
  net_amount: number;
  bank_received_date: string | null;
  bank_received_amount: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RaBillWithProject extends RaBill {
  projects: Pick<Project, "id" | "name" | "project_code" | "client_name">;
}

export interface RaBillFormData {
  project_id: string;
  bill_label: string;
  contractor_name: string;
  confirmed_date: string;
  work_period_start: string;
  work_period_end: string;
  gross_amount: string;
  gst_applicable: boolean;
  retention_amount: string;
  tds_amount: string;
  bank_received_date: string;
  bank_received_amount: string;
  notes: string;
}

export interface RaBillSummary {
  billCount: number;
  pendingCount: number;
  totalGross: number;
  totalRetention: number;
  totalTds: number;
  totalNet: number;
  pendingNet: number;
  receivedNet: number;
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

export interface MonthWorkStats {
  month: string;
  monthLabel: string;
  monthShort: string;
  labourWorkers: number;
  foremanWorkers: number;
  totalSiteWorkers: number;
  labourManDays: number;
  foremanManDays: number;
  totalSiteManDays: number;
  allManDays: number;
  allWorkers: number;
}

export interface MonthSalaryTypeStats {
  month: string;
  monthLabel: string;
  monthShort: string;
  employeeType: EmployeeType;
  workers: number;
  manDays: number;
  grossEarned: number;
  paidOut: number;
  balanceDue: number;
}

export interface MonthSalaryTotals {
  month: string;
  monthLabel: string;
  monthShort: string;
  grossEarned: number;
  paidOut: number;
  balanceDue: number;
}

/** RA bills grouped by confirmed / submitted month */
export interface MonthRaBillStats {
  month: string;
  monthLabel: string;
  monthShort: string;
  billCount: number;
  grossAmount: number;
  igstAmount: number;
  totalBillAmount: number;
  retentionAmount: number;
  tdsAmount: number;
  netAmount: number;
  /** Sum of bank_received_amount for bills confirmed this month */
  receivedFromBills: number;
  pendingNet: number;
}

/** Cash credited to bank from RA bills, grouped by bank_received_date month */
export interface MonthRaBillCashReceipt {
  month: string;
  monthLabel: string;
  monthShort: string;
  amount: number;
  billCount: number;
}

export type WorkType = "block_work" | "shuttering_work";

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  block_work: "Block Work",
  shuttering_work: "Shuttering Work",
};

/** Add new work types here as they come up — mirror in a new migration's check constraint. */
export const WORK_TYPE_DISPLAY_ORDER: WorkType[] = [
  "block_work",
  "shuttering_work",
];

export type WorkQuantityUnit = "nos" | "sqft" | "cum" | "rft";

export const WORK_QUANTITY_UNIT_LABELS: Record<WorkQuantityUnit, string> = {
  nos: "Nos",
  sqft: "Sqft",
  cum: "Cum",
  rft: "Rft",
};

export interface WorkQuantityLog {
  id: string;
  project_id: string;
  work_date: string;
  work_type: WorkType;
  quantity: number;
  unit: WorkQuantityUnit;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkQuantityLogWithProject extends WorkQuantityLog {
  projects: Pick<Project, "id" | "name" | "project_code">;
}

export interface WorkQuantityFormData {
  project_id: string;
  work_date: string;
  work_type: WorkType;
  quantity: string;
  unit: WorkQuantityUnit;
  notes: string;
}

export interface WorkQuantityTypeTotal {
  workType: WorkType;
  totalsByUnit: Partial<Record<WorkQuantityUnit, number>>;
  entryCount: number;
}

export interface WorkQuantitySummary {
  entryCount: number;
  byType: WorkQuantityTypeTotal[];
}

export interface AnalyticsData {
  fromMonth: string;
  toMonth: string;
  workByMonth: MonthWorkStats[];
  salaryByType: MonthSalaryTypeStats[];
  salaryTotalsByMonth: MonthSalaryTotals[];
  raBillsByMonth: MonthRaBillStats[];
  raBillCashByMonth: MonthRaBillCashReceipt[];
  selectedMonthWork: MonthWorkStats | null;
  selectedMonthSalaryTotals: MonthSalaryTotals | null;
  selectedMonthRaBills: MonthRaBillStats | null;
}

export const EMPLOYEE_TYPE_CHART_COLORS: Record<EmployeeType, string> = {
  labour: "#64748b",
  carpenter: "#ea580c",
  mason: "#78716c",
  foreman: "#d97706",
  engineer: "#9333ea",
  staff: "#6366f1",
  founder: "#7c3aed",
};

export const ANALYTICS_SALARY_TYPES: EmployeeType[] = [
  ...EMPLOYEE_TYPE_DISPLAY_ORDER,
];
