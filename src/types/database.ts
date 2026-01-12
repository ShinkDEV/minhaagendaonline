export type AppRole = 'admin' | 'professional' | 'super_admin';
export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'other';
export type CommissionType = 'percent' | 'fixed';
export type CommissionStatus = 'pending' | 'paid';
export type CashflowType = 'income' | 'expense';

export interface Salon {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  timezone: string;
  created_at: string;
}

export interface Profile {
  id: string;
  salon_id: string | null;
  full_name: string;
  phone: string | null;
  active: boolean;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Professional {
  id: string;
  salon_id: string;
  profile_id: string | null;
  display_name: string;
  legal_name: string | null;
  cpf: string | null;
  position: string | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  pix_key: string | null;
  pix_key_type: string | null;
  can_delete_appointments: boolean;
  commission_percent_default: number;
  active: boolean;
  created_at: string;
}

export interface WorkingHours {
  id: string;
  salon_id: string;
  professional_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
}

export interface Client {
  id: string;
  salon_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  gender: string | null;
  cpf: string | null;
  rg: string | null;
  credit_balance: number;
  created_at: string;
}

export interface ClientCreditMovement {
  id: string;
  salon_id: string;
  client_id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  salon_id: string;
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
  created_at: string;
}

export interface ProfessionalServiceCommission {
  id: string;
  salon_id: string;
  professional_id: string;
  service_id: string;
  type: CommissionType;
  value: number;
}

export interface Appointment {
  id: string;
  salon_id: string;
  professional_id: string;
  client_id: string | null;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  total_amount: number;
  notes: string | null;
  created_by: string | null;
  cancelled_reason: string | null;
  created_at: string;
  // Joined data
  professional?: Professional;
  client?: Client;
  appointment_services?: AppointmentService[];
}

export interface AppointmentService {
  id: string;
  appointment_id: string;
  service_id: string;
  price_charged: number;
  duration_minutes: number | null;
  service?: Service;
}

export interface Payment {
  id: string;
  salon_id: string;
  appointment_id: string;
  paid_at: string;
  method: PaymentMethod;
  amount: number;
}

export interface Commission {
  id: string;
  salon_id: string;
  appointment_id: string;
  professional_id: string;
  amount: number;
  status: CommissionStatus;
  calculated_at: string;
  paid_at: string | null;
  professional?: Professional;
  appointment?: Appointment;
}

export interface CashflowCategory {
  id: string;
  salon_id: string;
  name: string;
  type: CashflowType;
}

export interface CashflowEntry {
  id: string;
  salon_id: string;
  type: CashflowType;
  category_id: string | null;
  amount: number;
  occurred_at: string;
  description: string | null;
  related_appointment_id: string | null;
  category?: CashflowCategory;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  max_professionals: number;
}

export interface SalonPlan {
  salon_id: string;
  plan_id: string;
  started_at: string;
  plan?: Plan;
}
