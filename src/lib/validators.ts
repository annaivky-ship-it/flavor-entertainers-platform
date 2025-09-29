import { z } from 'zod';

// Base validation schemas
export const emailSchema = z.string().email('Please enter a valid email address');

export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .regex(/^(\+61|0)[2-9]\d{8}$/, 'Please enter a valid Australian phone number');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number');

// User and Profile schemas
export const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  whatsapp: phoneSchema.optional(),
  phone: phoneSchema.optional(),
  email: emailSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  role: z.enum(['client', 'performer']).default('client'),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// Booking schemas
export const bookingDetailsSchema = z.object({
  performerId: z.string().uuid('Invalid performer ID'),
  service: z.string().min(1, 'Please select a service'),
  eventDate: z.string().refine(
    (date) => new Date(date) > new Date(),
    'Event date must be in the future'
  ),
  eventAddress: z.string().min(10, 'Please provide a complete address'),
  duration: z.number().min(1, 'Duration must be at least 1 hour').max(12, 'Duration cannot exceed 12 hours'),
  guestCount: z.number().min(1, 'Guest count must be at least 1').optional(),
  specialRequirements: z.string().max(500, 'Special requirements cannot exceed 500 characters').optional(),
  contactName: z.string().min(2, 'Contact name must be at least 2 characters'),
  contactPhone: phoneSchema,
  contactEmail: emailSchema,
});

export const bookingQuoteSchema = z.object({
  performerId: z.string().uuid(),
  service: z.string().min(1),
  duration: z.number().min(1),
  eventDate: z.string(),
});

export const bookingApprovalSchema = z.object({
  bookingId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
  performerNotes: z.string().optional(),
});

// Payment schemas
export const paymentReceiptSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  receiptFile: z.string().url('Invalid receipt file URL'),
  notes: z.string().max(500).optional(),
});

export const paymentVerificationSchema = z.object({
  paymentId: z.string().uuid(),
  status: z.enum(['verified', 'failed']),
  notes: z.string().optional(),
  verifiedAmount: z.number().positive().optional(),
});

// PayID schemas
export const payidAccountSchema = z.object({
  payidIdentifier: z.string().min(1, 'PayID identifier is required'),
  payidType: z.enum(['email', 'phone', 'abn']),
  accountName: z.string().min(2, 'Account name must be at least 2 characters'),
  bankName: z.string().min(2, 'Bank name is required'),
  bsb: z.string().regex(/^\d{6}$/, 'BSB must be 6 digits').optional(),
  accountNumber: z.string().min(6, 'Account number must be at least 6 digits').optional(),
});

// Performer schemas
export const performerProfileSchema = z.object({
  stageName: z.string().min(2, 'Stage name must be at least 2 characters'),
  bio: z.string().max(1000, 'Bio cannot exceed 1000 characters').optional(),
  heroImage: z.string().url('Invalid image URL').optional(),
  services: z.record(z.boolean()).optional(),
  rateCard: z.record(z.number().positive()).optional(),
  isAvailable: z.boolean().default(true),
});

export const performerAvailabilitySchema = z.object({
  performerId: z.string().uuid(),
  isAvailable: z.boolean(),
  availabilityNote: z.string().max(200).optional(),
});

// Vetting schemas
export const vettingApplicationSchema = z.object({
  clientId: z.string().uuid(),
  idFile: z.string().url('Invalid ID file URL'),
  notes: z.string().max(500).optional(),
});

export const vettingDecisionSchema = z.object({
  applicationId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
  notes: z.string().max(500).optional(),
});

// Blacklist schemas
export const blacklistEntrySchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  status: z.enum(['active', 'inactive']).default('active'),
}).refine(data => data.email || data.phone, {
  message: 'Either email or phone must be provided',
  path: ['email'],
});

export const blacklistCheckSchema = z.object({
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
}).refine(data => data.email || data.phone, {
  message: 'Either email or phone must be provided',
});

// Admin schemas
export const systemSettingsSchema = z.object({
  depositPercent: z.number().min(0).max(100, 'Deposit percentage must be between 0 and 100'),
  referralPercent: z.number().min(0).max(100, 'Referral percentage must be between 0 and 100'),
  adminWhatsapp: phoneSchema.optional(),
  adminEmail: emailSchema.optional(),
  payidEmail: emailSchema.optional(),
});

// Safety schemas
export const safetyAlertSchema = z.object({
  alertType: z.string().min(1, 'Alert type is required'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  severityLevel: z.number().min(1).max(5, 'Severity level must be between 1 and 5'),
  targetAudience: z.array(z.enum(['performers', 'clients', 'admins'])),
  locationSpecific: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const performerCheckInSchema = z.object({
  performerId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
  checkInType: z.enum(['arrival', 'departure', 'safety_check', 'emergency']),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  notes: z.string().max(500).optional(),
  isSafe: z.boolean().default(true),
});

// Review schemas
export const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  performerId: z.string().uuid(),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().max(1000, 'Comment cannot exceed 1000 characters').optional(),
});

export const reviewResponseSchema = z.object({
  reviewId: z.string().uuid(),
  response: z.string().min(10, 'Response must be at least 10 characters').max(500, 'Response cannot exceed 500 characters'),
});

// Notification schemas
export const whatsappNotificationSchema = z.object({
  to: phoneSchema,
  message: z.string().min(1, 'Message cannot be empty'),
  templateName: z.string().optional(),
  templateData: z.record(z.any()).optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

// Search and filter schemas
export const performerFilterSchema = z.object({
  category: z.enum(['waitressing', 'lap_dance', 'strip_show']).optional(),
  location: z.string().optional(),
  minRating: z.number().min(0).max(5).optional(),
  maxRate: z.number().positive().optional(),
  isAvailable: z.boolean().optional(),
  featured: z.boolean().optional(),
  services: z.array(z.string()).optional(),
});

export const searchSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty'),
  filters: performerFilterSchema.optional(),
  sortBy: z.enum(['rating', 'rate', 'name', 'availability']).default('rating'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

// Form data types
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type BookingDetailsFormData = z.infer<typeof bookingDetailsSchema>;
export type PaymentReceiptFormData = z.infer<typeof paymentReceiptSchema>;
export type PerformerProfileFormData = z.infer<typeof performerProfileSchema>;
export type VettingApplicationFormData = z.infer<typeof vettingApplicationSchema>;
export type BlacklistEntryFormData = z.infer<typeof blacklistEntrySchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
export type SystemSettingsFormData = z.infer<typeof systemSettingsSchema>;
export type SafetyAlertFormData = z.infer<typeof safetyAlertSchema>;
export type PerformerFilterFormData = z.infer<typeof performerFilterSchema>;

// Custom validation helpers
export const validateAustralianPostcode = (postcode: string): boolean => {
  return /^[0-9]{4}$/.test(postcode);
};

export const validateABN = (abn: string): boolean => {
  const abnDigits = abn.replace(/\s/g, '');
  if (!/^\d{11}$/.test(abnDigits)) return false;

  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  let sum = 0;

  for (let i = 0; i < 11; i++) {
    sum += parseInt(abnDigits[i]) * weights[i];
  }

  return sum % 89 === 0;
};

export const validateEventDate = (date: string, minHoursInAdvance = 24): boolean => {
  const eventDate = new Date(date);
  const now = new Date();
  const minDate = new Date(now.getTime() + minHoursInAdvance * 60 * 60 * 1000);

  return eventDate >= minDate;
};

// Sanitization helpers
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const sanitizePhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Convert to Australian format
  if (cleaned.startsWith('0')) {
    return '+61' + cleaned.substring(1);
  }
  if (cleaned.startsWith('61')) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('+61')) {
    return cleaned;
  }

  return cleaned;
};