import { z } from 'zod';

export const RoleSchema = z.enum(['customer', 'admin']);

export const BookingStatusSchema = z.enum([
  'requested',
  'confirmed',
  'completed',
  'cancelled',
]);

export const QuoteStatusSchema = z.enum([
  'draft',
  'sent',
  'accepted',
  'declined',
  'expired',
]);

export const InvoiceStatusSchema = z.enum([
  'draft',
  'sent',
  'overdue',
  'paid',
  'void',
]);

export const PaymentMethodSchema = z.enum(['eft', 'cash', 'card', 'other']);

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(2),
  phone: z.string().min(7),
  address: z.string().min(5),
  role: RoleSchema.default('customer'),
});

export const UpsertProfileSchema = ProfileSchema.pick({
  full_name: true,
  phone: true,
  address: true,
});

export const BookingCreateSchema = z.object({
  service_id: z.number().int().positive(),
  requested_datetime: z.string().datetime(),
  address: z.string().min(5),
  notes: z.string().max(1000).optional(),
});

export const QuoteItemSchema = z.object({
  description: z.string().min(1),
  qty: z.number().positive(),
  unit_price: z.number().nonnegative(),
});

export const InvoiceItemSchema = QuoteItemSchema;

export const QuoteCreateSchema = z.object({
  customer_id: z.string().uuid(),
  booking_id: z.string().uuid(),
  valid_until: z.string().date(),
  vat_rate: z.number().min(0).max(1),
  items: z.array(QuoteItemSchema).min(1),
});

export const InvoiceCreateSchema = z.object({
  customer_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
  quote_id: z.string().uuid().optional(),
  issue_date: z.string().date(),
  due_date: z.string().date(),
  vat_rate: z.number().min(0).max(1),
  items: z.array(InvoiceItemSchema).min(1),
});

export const SettingsSchema = z.object({
  business_name: z.string().min(2),
  reg_number: z.string().nullable().optional(),
  vat_registered: z.boolean(),
  vat_number: z.string().nullable().optional(),
  vat_rate: z.number().min(0).max(1),
  address: z.string().min(5),
  banking_details: z.string().min(5),
});

export type Role = z.infer<typeof RoleSchema>;
export type BookingStatus = z.infer<typeof BookingStatusSchema>;
export type QuoteStatus = z.infer<typeof QuoteStatusSchema>;
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export type Profile = z.infer<typeof ProfileSchema>;
export type UpsertProfileInput = z.infer<typeof UpsertProfileSchema>;
export type BookingCreateInput = z.infer<typeof BookingCreateSchema>;
export type QuoteCreateInput = z.infer<typeof QuoteCreateSchema>;
export type InvoiceCreateInput = z.infer<typeof InvoiceCreateSchema>;
export type SettingsInput = z.infer<typeof SettingsSchema>;
