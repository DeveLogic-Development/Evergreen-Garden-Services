export type Role = 'customer' | 'admin';

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  role: Role;
  created_at: string;
};

export type Service = {
  id: number;
  name: string;
  default_duration_minutes: number;
  active: boolean;
};

export type BookingStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled';
export type MonthlyPlanStatus = 'draft' | 'quoted' | 'active' | 'paused' | 'cancelled' | 'completed';
export type MonthlyPlanRequestStatus = 'requested' | 'contacted' | 'quoted' | 'closed';

export type Booking = {
  id: string;
  customer_id: string;
  service_id: number;
  requested_datetime: string;
  confirmed_datetime: string | null;
  address: string;
  notes: string | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  services?: Service;
  profiles?: Pick<Profile, 'full_name' | 'phone'>;
};

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';

export type Quote = {
  id: string;
  quote_number: string;
  customer_id: string;
  booking_id: string;
  status: QuoteStatus;
  valid_until: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  created_at: string;
  bookings?: Booking;
  quote_items?: QuoteItem[];
};

export type QuoteItem = {
  id: string;
  quote_id: string;
  description: string;
  qty: number;
  unit_price: number;
  line_total: number;
};

export type InvoiceStatus = 'draft' | 'sent' | 'overdue' | 'paid' | 'void';

export type Invoice = {
  id: string;
  invoice_number: string;
  customer_id: string;
  booking_id: string;
  quote_id: string | null;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  paid_at: string | null;
  created_at: string;
  invoice_items?: InvoiceItem[];
  bookings?: Booking;
  payments?: Payment[];
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  qty: number;
  unit_price: number;
  line_total: number;
};

export type PaymentMethod = 'eft' | 'cash' | 'card' | 'other';

export type Payment = {
  id: string;
  invoice_id: string;
  method: PaymentMethod;
  amount: number;
  reference: string | null;
  proof_file_path: string | null;
  created_at: string;
};

export type MonthlyPlanSchedule = {
  id: string;
  plan_id: string;
  service_id: number;
  day_of_week: number;
  start_time: string;
  duration_minutes: number;
  unit_price: number;
  created_at: string;
  services?: Service;
};

export type MonthlyPlanOccurrence = {
  id: string;
  plan_id: string;
  schedule_id: string;
  booking_id: string;
  occurrence_date: string;
  created_at: string;
  bookings?: Booking;
};

export type MonthlyPlanInvoice = {
  id: string;
  plan_id: string;
  invoice_id: string;
  billing_month: string;
  created_at: string;
  invoices?: Invoice;
};

export type MonthlyPlan = {
  id: string;
  customer_id: string;
  anchor_booking_id: string;
  quote_id: string | null;
  title: string;
  address: string;
  start_date: string;
  end_date: string | null;
  vat_rate: number;
  status: MonthlyPlanStatus;
  activated_at: string | null;
  paused_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, 'full_name' | 'phone'>;
  quotes?: Quote;
  monthly_plan_schedule?: MonthlyPlanSchedule[];
  monthly_plan_occurrences?: MonthlyPlanOccurrence[];
  monthly_plan_invoices?: MonthlyPlanInvoice[];
};

export type MonthlyPlanRequest = {
  id: string;
  customer_id: string;
  title: string;
  address: string;
  preferred_start_date: string | null;
  frequency_per_week: number;
  notes: string | null;
  status: MonthlyPlanRequestStatus;
  admin_notes: string | null;
  contacted_at: string | null;
  quoted_plan_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, 'full_name' | 'phone'>;
};

export type Settings = {
  id: number;
  business_name: string;
  reg_number: string | null;
  vat_registered: boolean;
  vat_number: string | null;
  vat_rate: number;
  address: string;
  banking_details: string;
  next_quote_number: number;
  next_invoice_number: number;
  service_areas: string[];
};
