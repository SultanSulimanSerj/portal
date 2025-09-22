import { pgTable, uuid, varchar, timestamp, text, pgEnum } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { users } from './auth.schema';
import { z } from 'zod';

// Enums
export const membershipRoleEnum = pgEnum('membership_role', [
  'OWNER',
  'ADMIN', 
  'PM',
  'WORKER',
  'VIEWER'
]);

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  subdomain: varchar('subdomain', { length: 50 }).unique().notNull(),
  description: text('description'),
  logo: varchar('logo', { length: 500 }), // S3 key
  website: varchar('website', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  taxId: varchar('tax_id', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  role: membershipRoleEnum('role').notNull(),
  invitedBy: uuid('invited_by').references(() => users.id),
  invitedAt: timestamp('invited_at'),
  joinedAt: timestamp('joined_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  role: membershipRoleEnum('role').notNull(),
  invitedBy: uuid('invited_by').references(() => users.id).notNull(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Zod schemas
export const selectCompanySchema = createSelectSchema(companies);
export const insertCompanySchema = createInsertSchema(companies);
export const selectMembershipSchema = createSelectSchema(memberships);
export const insertMembershipSchema = createInsertSchema(memberships);
export const selectInvitationSchema = createSelectSchema(invitations);
export const insertInvitationSchema = createInsertSchema(invitations);

// Types
export type Company = z.infer<typeof selectCompanySchema>;
export type NewCompany = z.infer<typeof insertCompanySchema>;
export type Membership = z.infer<typeof selectMembershipSchema>;
export type NewMembership = z.infer<typeof insertMembershipSchema>;
export type Invitation = z.infer<typeof selectInvitationSchema>;
export type NewInvitation = z.infer<typeof insertInvitationSchema>;

// Role type
export type MembershipRole = 'OWNER' | 'ADMIN' | 'PM' | 'WORKER' | 'VIEWER';