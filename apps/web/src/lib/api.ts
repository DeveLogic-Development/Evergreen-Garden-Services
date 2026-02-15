import type {
  Booking,
  BookingStatus,
  Invoice,
  MonthlyPlan,
  MonthlyPlanRequest,
  MonthlyPlanRequestStatus,
  MonthlyPlanStatus,
  PaymentMethod,
  Profile,
  Quote,
  Service,
  Settings,
} from '@/types/db';
import { supabase } from '@/lib/supabase';

export type LineItemInput = {
  description: string;
  qty: number;
  unit_price: number;
};

export type MonthlyPlanScheduleInput = {
  service_id: number;
  day_of_week: number;
  start_time: string;
  duration_minutes: number;
  unit_price: number;
};

export async function upsertProfile(input: {
  full_name: string;
  phone: string;
  address: string;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase.from('profiles').upsert({ id: user.id, ...input }, { onConflict: 'id' });

  if (error) {
    throw error;
  }
}

export async function fetchServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Service[];
}

export async function listAdminServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('active', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Service[];
}

export async function createService(input: {
  name: string;
  default_duration_minutes: number;
  active: boolean;
}): Promise<void> {
  const { error } = await supabase.from('services').insert(input);
  if (error) {
    throw error;
  }
}

export async function updateService(
  serviceId: number,
  input: Partial<Pick<Service, 'name' | 'default_duration_minutes' | 'active'>>,
): Promise<void> {
  const { error } = await supabase.from('services').update(input).eq('id', serviceId);
  if (error) {
    throw error;
  }
}

export async function createBooking(input: {
  service_id: number;
  requested_datetime: string;
  address: string;
  notes?: string | undefined;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase.from('bookings').insert({ customer_id: user.id, ...input });
  if (error) {
    throw error;
  }
}

export async function listMyBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, services(*)')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  return (data ?? []) as Booking[];
}

export async function listAllBookings(filter?: {
  status?: BookingStatus | 'all';
  from?: string;
  to?: string;
}): Promise<Booking[]> {
  let query = supabase
    .from('bookings')
    .select('*, services(*), profiles(full_name, phone)')
    .order('created_at', { ascending: false });

  if (filter?.status && filter.status !== 'all') {
    query = query.eq('status', filter.status);
  }

  if (filter?.from) {
    query = query.gte('requested_datetime', filter.from);
  }

  if (filter?.to) {
    query = query.lte('requested_datetime', filter.to);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data ?? []) as Booking[];
}

export async function adminUpdateBooking(
  bookingId: string,
  input: { status?: BookingStatus; confirmed_datetime?: string | null },
): Promise<void> {
  const { error } = await supabase.from('bookings').update(input).eq('id', bookingId);
  if (error) {
    throw error;
  }
}

export async function listMyMonthlyPlans(): Promise<MonthlyPlan[]> {
  const { data, error } = await supabase
    .from('monthly_plans')
    .select(
      '*, quotes(*), monthly_plan_schedule(*, services(*)), monthly_plan_invoices(*, invoices(*)), monthly_plan_occurrences(*, bookings(*))',
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as MonthlyPlan[];
}

export async function listAllMonthlyPlans(): Promise<MonthlyPlan[]> {
  const { data, error } = await supabase
    .from('monthly_plans')
    .select(
      '*, profiles:customer_id(full_name, phone), quotes(*), monthly_plan_schedule(*, services(*)), monthly_plan_invoices(*, invoices(*)), monthly_plan_occurrences(*, bookings(*))',
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as MonthlyPlan[];
}

export async function createMonthlyPlanWithQuote(input: {
  customer_id: string;
  title: string;
  address: string;
  start_date: string;
  end_date?: string | null;
  valid_until: string;
  vat_rate: number;
  schedule: MonthlyPlanScheduleInput[];
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_monthly_plan_with_quote', {
    p_customer_id: input.customer_id,
    p_title: input.title,
    p_address: input.address,
    p_start_date: input.start_date,
    p_end_date: input.end_date ?? null,
    p_valid_until: input.valid_until,
    p_vat_rate: input.vat_rate,
    p_schedule: input.schedule,
  });

  if (error) {
    throw error;
  }

  const planId = data as string | null;
  if (!planId) {
    throw new Error('Monthly plan created but no plan id was returned');
  }
  return planId;
}

export async function generateMonthlyPlanBookings(planId: string, monthStart?: string): Promise<number> {
  const { data, error } = await supabase.rpc('generate_monthly_plan_bookings', {
    p_plan_id: planId,
    p_month_start: monthStart ?? new Date().toISOString().slice(0, 10),
  });
  if (error) {
    throw error;
  }
  return Number(data ?? 0);
}

export async function generateMonthlyPlanInvoices(monthStart?: string): Promise<number> {
  const { data, error } = await supabase.rpc('generate_monthly_plan_invoices', {
    p_month_start: monthStart ?? new Date().toISOString().slice(0, 10),
  });
  if (error) {
    throw error;
  }
  return Number(data ?? 0);
}

export async function setMonthlyPlanStatus(planId: string, status: MonthlyPlanStatus): Promise<void> {
  const { error } = await supabase.rpc('set_monthly_plan_status', {
    p_plan_id: planId,
    p_status: status,
  });
  if (error) {
    throw error;
  }
}

export async function listMyMonthlyPlanRequests(): Promise<MonthlyPlanRequest[]> {
  const { data, error } = await supabase
    .from('monthly_plan_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as MonthlyPlanRequest[];
}

export async function listAllMonthlyPlanRequests(): Promise<MonthlyPlanRequest[]> {
  const { data, error } = await supabase
    .from('monthly_plan_requests')
    .select('*, profiles:customer_id(full_name, phone)')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as MonthlyPlanRequest[];
}

export async function createMonthlyPlanRequest(input: {
  title: string;
  address: string;
  preferred_start_date?: string | null;
  frequency_per_week: number;
  notes?: string | null;
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_monthly_plan_request', {
    p_title: input.title,
    p_address: input.address,
    p_preferred_start_date: input.preferred_start_date ?? null,
    p_frequency_per_week: input.frequency_per_week,
    p_notes: input.notes ?? null,
  });

  if (error) {
    throw error;
  }

  const requestId = data as string | null;
  if (!requestId) {
    throw new Error('Request created but no request id was returned');
  }
  return requestId;
}

export async function adminUpdateMonthlyPlanRequest(
  requestId: string,
  input: {
    status?: MonthlyPlanRequestStatus;
    admin_notes?: string | null;
    contacted_at?: string | null;
    quoted_plan_id?: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from('monthly_plan_requests').update(input).eq('id', requestId);
  if (error) {
    throw error;
  }
}

export async function listMyQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, quote_items(*), bookings(*)')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  return (data ?? []) as Quote[];
}

export async function listAllQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, quote_items(*), bookings(*), profiles:customer_id(full_name, phone)')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Quote[];
}

export async function getQuoteById(quoteId: string): Promise<Quote | null> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, quote_items(*), bookings(*)')
    .eq('id', quoteId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as Quote | null) ?? null;
}

export async function setQuoteStatus(
  quoteId: string,
  status: 'accepted' | 'declined',
  autoCreateInvoice = false,
): Promise<void> {
  const { error } = await supabase.rpc('set_quote_status', {
    p_quote_id: quoteId,
    p_status: status,
    p_auto_create_invoice: autoCreateInvoice,
  });

  if (error) {
    throw error;
  }
}

export async function createQuoteWithItems(input: {
  customer_id: string;
  booking_id: string;
  valid_until: string;
  vat_rate: number;
  items: LineItemInput[];
}): Promise<void> {
  const { error } = await supabase.rpc('create_quote_with_items', {
    p_customer_id: input.customer_id,
    p_booking_id: input.booking_id,
    p_valid_until: input.valid_until,
    p_vat_rate: input.vat_rate,
    p_items: input.items,
  });

  if (error) {
    throw error;
  }
}

export async function createInvoiceWithItems(input: {
  customer_id: string;
  booking_id: string | null;
  quote_id: string | null;
  issue_date: string;
  due_date: string;
  vat_rate: number;
  items: LineItemInput[];
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_invoice_with_items', {
    p_customer_id: input.customer_id,
    p_booking_id: input.booking_id,
    p_quote_id: input.quote_id,
    p_issue_date: input.issue_date,
    p_due_date: input.due_date,
    p_vat_rate: input.vat_rate,
    p_items: input.items,
  });

  if (error) {
    throw error;
  }

  const invoiceId = data as string | null;
  if (!invoiceId) {
    throw new Error('Invoice created but no invoice id was returned');
  }
  return invoiceId;
}

export async function createInvoiceFromQuote(quoteId: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_invoice_from_quote', { p_quote_id: quoteId });
  if (error) {
    throw error;
  }

  const invoiceId = data as string | null;
  if (!invoiceId) {
    throw new Error('Invoice creation returned no invoice id');
  }
  return invoiceId;
}

export async function listMyInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, invoice_items(*), payments(*)')
    .neq('status', 'draft')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  return (data ?? []) as Invoice[];
}

export async function listAllInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, invoice_items(*), payments(*), profiles:customer_id(full_name, phone)')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Invoice[];
}

export async function sendInvoiceToCustomer(invoiceId: string): Promise<{ emailed: boolean; message?: string }> {
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', invoiceId)
    .maybeSingle();

  if (invoiceError) {
    throw invoiceError;
  }
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.status === 'draft') {
    const { error: sendStatusError } = await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', invoiceId);
    if (sendStatusError) {
      throw sendStatusError;
    }
  }

  const { data, error } = await supabase.functions.invoke('send-invoice-email', {
    body: { invoiceId },
  });

  if (error) {
    return {
      emailed: false,
      message:
        'Invoice is now available to the client, but email delivery failed. Configure/deploy send-invoice-email.',
    };
  }

  const payload = data as { ok?: boolean; error?: string } | null;
  if (payload && payload.ok === false) {
    return {
      emailed: false,
      message: payload.error ?? 'Invoice is available to the client, but email could not be sent.',
    };
  }

  return { emailed: true };
}

export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, invoice_items(*), bookings(*), payments(*)')
    .eq('id', invoiceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as Invoice | null) ?? null;
}

export async function markInvoicePaid(input: {
  invoice_id: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  proof_file_path?: string;
}): Promise<void> {
  const { error } = await supabase.rpc('mark_invoice_paid', {
    p_invoice_id: input.invoice_id,
    p_method: input.method,
    p_amount: input.amount,
    p_reference: input.reference ?? null,
    p_proof_file_path: input.proof_file_path ?? null,
  });

  if (error) {
    throw error;
  }
}

export async function uploadProofOfPayment(input: {
  invoiceId: string;
  customerId: string;
  file: File;
  amount: number;
  reference?: string | undefined;
}): Promise<void> {
  const sanitizedName = input.file.name.replaceAll(/[^A-Za-z0-9._-]/g, '-');
  const path = `pop/${input.customerId}/${input.invoiceId}/${Date.now()}-${sanitizedName}`;

  const { error: storageError } = await supabase.storage.from('documents').upload(path, input.file, {
    cacheControl: '3600',
    upsert: false,
    contentType: input.file.type,
  });

  if (storageError) {
    throw storageError;
  }

  const { error } = await supabase.from('payments').insert({
    invoice_id: input.invoiceId,
    method: 'eft',
    amount: input.amount,
    reference: input.reference ?? null,
    proof_file_path: path,
  });

  if (error) {
    throw error;
  }
}

export async function getSignedDocumentUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 120);
  if (error) {
    throw error;
  }
  return data.signedUrl;
}

export async function getSettings(): Promise<Settings | null> {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
  if (error) {
    throw error;
  }
  return (data as Settings | null) ?? null;
}

export async function getPublicSettings(): Promise<
  Pick<
    Settings,
    | 'business_name'
    | 'reg_number'
    | 'vat_registered'
    | 'vat_number'
      | 'vat_rate'
      | 'address'
      | 'banking_details'
      | 'service_areas'
  > | null
> {
  const { data, error } = await supabase.rpc('get_public_settings');
  if (error) {
    throw error;
  }
  const row = (data as Array<
    Pick<
      Settings,
      | 'business_name'
      | 'reg_number'
      | 'vat_registered'
      | 'vat_number'
      | 'vat_rate'
      | 'address'
      | 'banking_details'
      | 'service_areas'
    >
  > | null)?.[0];
  return row ?? null;
}

export async function updateSettings(input: Partial<Settings>): Promise<void> {
  const { error } = await supabase.from('settings').update(input).eq('id', 1);
  if (error) {
    throw error;
  }
}

export async function getDashboardCounts(): Promise<{
  requestedBookings: number;
  sentQuotes: number;
  sentInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
}> {
  const today = new Date().toISOString().slice(0, 10);
  const [bookings, quotes, invoicesSent, invoicesPaid, overdueInvoices] = await Promise.all([
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'requested'),
    supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).in('status', ['sent', 'overdue']),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .in('status', ['sent', 'overdue'])
      .lt('due_date', today),
  ]);

  if (bookings.error) throw bookings.error;
  if (quotes.error) throw quotes.error;
  if (invoicesSent.error) throw invoicesSent.error;
  if (invoicesPaid.error) throw invoicesPaid.error;
  if (overdueInvoices.error) throw overdueInvoices.error;

  return {
    requestedBookings: bookings.count ?? 0,
    sentQuotes: quotes.count ?? 0,
    sentInvoices: invoicesSent.count ?? 0,
    paidInvoices: invoicesPaid.count ?? 0,
    overdueInvoices: overdueInvoices.count ?? 0,
  };
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }
}

export async function signUp(email: string, password: string): Promise<{ hasSession: boolean }> {
  const redirectTo = `${window.location.origin}/login`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) {
    throw error;
  }
  return { hasSession: Boolean(data.session) };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const redirectTo = `${window.location.origin}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    throw error;
  }
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    throw error;
  }
}

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'customer')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Profile[];
}
