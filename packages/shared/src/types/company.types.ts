export type MembershipRole = 'OWNER' | 'ADMIN' | 'PM' | 'WORKER' | 'VIEWER';

export interface CompanyInfo {
  id: string;
  name: string;
  subdomain: string;
  description?: string;
  logo?: string;
  website?: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

export interface MemberInfo {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: MembershipRole;
  joinedAt?: Date;
  invitedAt?: Date;
}