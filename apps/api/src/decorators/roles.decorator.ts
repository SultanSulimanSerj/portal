import { SetMetadata } from '@nestjs/common';
import { MembershipRole } from '../database/schemas/company.schema';

export const Roles = (...roles: MembershipRole[]) => SetMetadata('roles', roles);