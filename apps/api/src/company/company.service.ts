import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Database } from '../database/connection';
import { companies, memberships, users, invitations } from '../database/schemas';
import { eq, and } from 'drizzle-orm';
import { 
  CreateCompanyDto, 
  UpdateCompanyDto, 
  InviteMemberDto,
  UpdateMemberRoleDto,
  CompanyResponseDto,
  MemberResponseDto,
} from '@saas/shared';

@Injectable()
export class CompanyService {
  constructor(@Inject('DATABASE') private db: Database) {}

  async getCompany(companyId: string): Promise<CompanyResponseDto> {
    const [company] = await this.db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return {
      id: company.id,
      name: company.name,
      subdomain: company.subdomain,
      description: company.description,
      logo: company.logo,
      website: company.website,
      phone: company.phone,
      address: company.address,
      taxId: company.taxId,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }

  async updateCompany(
    companyId: string,
    updateCompanyDto: UpdateCompanyDto,
    userId: string,
  ): Promise<CompanyResponseDto> {
    // Check if user has permission (OWNER or ADMIN)
    await this.checkCompanyPermission(userId, companyId, ['OWNER', 'ADMIN']);

    // Check subdomain uniqueness if provided
    if (updateCompanyDto.subdomain) {
      const existingCompany = await this.db
        .select()
        .from(companies)
        .where(and(
          eq(companies.subdomain, updateCompanyDto.subdomain),
          eq(companies.id, companyId)
        ))
        .limit(1);

      if (existingCompany.length > 0 && existingCompany[0].id !== companyId) {
        throw new ConflictException('Subdomain is already taken');
      }
    }

    const [updatedCompany] = await this.db
      .update(companies)
      .set({
        ...updateCompanyDto,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId))
      .returning();

    if (!updatedCompany) {
      throw new NotFoundException('Company not found');
    }

    return {
      id: updatedCompany.id,
      name: updatedCompany.name,
      subdomain: updatedCompany.subdomain,
      description: updatedCompany.description,
      logo: updatedCompany.logo,
      website: updatedCompany.website,
      phone: updatedCompany.phone,
      address: updatedCompany.address,
      taxId: updatedCompany.taxId,
      createdAt: updatedCompany.createdAt,
      updatedAt: updatedCompany.updatedAt,
    };
  }

  async getMembers(companyId: string): Promise<MemberResponseDto[]> {
    const members = await this.db
      .select({
        membership: memberships,
        user: users,
      })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(eq(memberships.companyId, companyId));

    return members.map(({ membership, user }) => ({
      id: membership.id,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      role: membership.role,
      joinedAt: membership.joinedAt,
      invitedAt: membership.invitedAt,
    }));
  }

  async inviteMember(
    companyId: string,
    inviteMemberDto: InviteMemberDto,
    invitedBy: string,
  ): Promise<{ success: true; message: string }> {
    // Check if user has permission (OWNER or ADMIN)
    await this.checkCompanyPermission(invitedBy, companyId, ['OWNER', 'ADMIN']);

    const { email, role } = inviteMemberDto;

    // Check if user already exists in company
    const existingMember = await this.db
      .select()
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(and(
        eq(users.email, email),
        eq(memberships.companyId, companyId)
      ))
      .limit(1);

    if (existingMember.length > 0) {
      throw new ConflictException('User is already a member of this company');
    }

    // Check if invitation already exists
    const existingInvitation = await this.db
      .select()
      .from(invitations)
      .where(and(
        eq(invitations.email, email),
        eq(invitations.companyId, companyId),
        eq(invitations.acceptedAt, null)
      ))
      .limit(1);

    if (existingInvitation.length > 0) {
      throw new ConflictException('Invitation already sent to this email');
    }

    // Create invitation
    const token = require('uuid').v4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.db
      .insert(invitations)
      .values({
        email,
        companyId,
        role,
        invitedBy,
        token,
        expiresAt,
      });

    // TODO: Send invitation email

    return { success: true, message: 'Invitation sent successfully' };
  }

  async updateMemberRole(
    companyId: string,
    memberId: string,
    updateMemberRoleDto: UpdateMemberRoleDto,
    updatedBy: string,
  ): Promise<MemberResponseDto> {
    // Check if user has permission (OWNER or ADMIN)
    await this.checkCompanyPermission(updatedBy, companyId, ['OWNER', 'ADMIN']);

    const [updatedMembership] = await this.db
      .update(memberships)
      .set({
        role: updateMemberRoleDto.role,
        updatedAt: new Date(),
      })
      .where(and(
        eq(memberships.id, memberId),
        eq(memberships.companyId, companyId)
      ))
      .returning();

    if (!updatedMembership) {
      throw new NotFoundException('Member not found');
    }

    // Get updated member with user info
    const [memberWithUser] = await this.db
      .select({
        membership: memberships,
        user: users,
      })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(eq(memberships.id, memberId))
      .limit(1);

    return {
      id: memberWithUser.membership.id,
      user: {
        id: memberWithUser.user.id,
        email: memberWithUser.user.email,
        firstName: memberWithUser.user.firstName,
        lastName: memberWithUser.user.lastName,
      },
      role: memberWithUser.membership.role,
      joinedAt: memberWithUser.membership.joinedAt,
      invitedAt: memberWithUser.membership.invitedAt,
    };
  }

  async removeMember(
    companyId: string,
    memberId: string,
    removedBy: string,
  ): Promise<{ success: true; message: string }> {
    // Check if user has permission (OWNER or ADMIN)
    await this.checkCompanyPermission(removedBy, companyId, ['OWNER', 'ADMIN']);

    // Cannot remove OWNER
    const [memberToRemove] = await this.db
      .select()
      .from(memberships)
      .where(and(
        eq(memberships.id, memberId),
        eq(memberships.companyId, companyId)
      ))
      .limit(1);

    if (!memberToRemove) {
      throw new NotFoundException('Member not found');
    }

    if (memberToRemove.role === 'OWNER') {
      throw new ForbiddenException('Cannot remove company owner');
    }

    // Remove member
    await this.db
      .delete(memberships)
      .where(eq(memberships.id, memberId));

    return { success: true, message: 'Member removed successfully' };
  }

  private async checkCompanyPermission(
    userId: string,
    companyId: string,
    allowedRoles: string[],
  ) {
    const [membership] = await this.db
      .select()
      .from(memberships)
      .where(and(
        eq(memberships.userId, userId),
        eq(memberships.companyId, companyId)
      ))
      .limit(1);

    if (!membership || !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}