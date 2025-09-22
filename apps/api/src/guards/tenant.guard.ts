import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { Database } from '../database/connection';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(@Inject('DATABASE') private db: Database) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.companyId) {
      throw new UnauthorizedException('No company context found');
    }

    try {
      // Set RLS context for this request
      await this.db.execute(
        sql`SET app.company_id = ${user.companyId}`
      );

      // Store company ID in request for later use
      request.companyId = user.companyId;
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Failed to set tenant context');
    }
  }
}