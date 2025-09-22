import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database/connection';
import { users, companies, memberships, refreshTokens } from '../database/schemas';
import { eq, and } from 'drizzle-orm';
import { RegisterDto, LoginDto, AuthResponseDto } from '@saas/shared';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @Inject('DATABASE') private db: Database,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, companyName, companySubdomain } = registerDto;

    // Check if user exists
    const existingUser = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictException('User with this email already exists');
    }

    // Check subdomain availability
    if (companySubdomain) {
      const existingCompany = await this.db
        .select()
        .from(companies)
        .where(eq(companies.subdomain, companySubdomain))
        .limit(1);

      if (existingCompany.length > 0) {
        throw new ConflictException('Subdomain is already taken');
      }
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Start transaction
    const result = await this.db.transaction(async (tx) => {
      // Create user
      const [newUser] = await tx
        .insert(users)
        .values({
          email,
          firstName,
          lastName,
          passwordHash,
        })
        .returning();

      // Create company if provided
      let newCompany;
      if (companyName && companySubdomain) {
        [newCompany] = await tx
          .insert(companies)
          .values({
            name: companyName,
            subdomain: companySubdomain,
          })
          .returning();
      } else {
        // Create default company
        const defaultSubdomain = `user-${newUser.id.slice(0, 8)}`;
        [newCompany] = await tx
          .insert(companies)
          .values({
            name: `${firstName} ${lastName}'s Company`,
            subdomain: defaultSubdomain,
          })
          .returning();
      }

      // Create membership as OWNER
      const [membership] = await tx
        .insert(memberships)
        .values({
          userId: newUser.id,
          companyId: newCompany.id,
          role: 'OWNER',
          joinedAt: new Date(),
        })
        .returning();

      return { user: newUser, company: newCompany, membership };
    });

    // Generate tokens
    const tokens = await this.generateTokens(result.user, result.company.id, ['OWNER']);
    
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        emailVerified: result.user.emailVerified,
      },
      company: {
        id: result.company.id,
        name: result.company.name,
        subdomain: result.company.subdomain,
      },
      membership: {
        role: result.membership.role,
        joinedAt: result.membership.joinedAt,
      },
      tokens: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user with company and membership
    const userResult = await this.db
      .select({
        user: users,
        company: companies,
        membership: memberships,
      })
      .from(users)
      .innerJoin(memberships, eq(memberships.userId, users.id))
      .innerJoin(companies, eq(companies.id, memberships.companyId))
      .where(eq(users.email, email))
      .limit(1);

    if (userResult.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { user, company, membership } = userResult[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Generate tokens
    const tokens = await this.generateTokens(user, company.id, [membership.role]);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
      },
      company: {
        id: company.id,
        name: company.name,
        subdomain: company.subdomain,
      },
      membership: {
        role: membership.role,
        joinedAt: membership.joinedAt,
      },
      tokens: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    // Find and validate refresh token
    const tokenResult = await this.db
      .select()
      .from(refreshTokens)
      .where(and(
        eq(refreshTokens.userId, userId),
        eq(refreshTokens.token, refreshToken)
      ))
      .limit(1);

    if (tokenResult.length === 0 || tokenResult[0].expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Get user with company and membership
    const userResult = await this.db
      .select({
        user: users,
        company: companies,
        membership: memberships,
      })
      .from(users)
      .innerJoin(memberships, eq(memberships.userId, users.id))
      .innerJoin(companies, eq(companies.id, memberships.companyId))
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      throw new NotFoundException('User not found');
    }

    const { user, company, membership } = userResult[0];

    // Delete old refresh token
    await this.db
      .delete(refreshTokens)
      .where(eq(refreshTokens.token, refreshToken));

    // Generate new tokens
    return await this.generateTokens(user, company.id, [membership.role]);
  }

  async logout(refreshToken: string) {
    if (refreshToken) {
      await this.db
        .delete(refreshTokens)
        .where(eq(refreshTokens.token, refreshToken));
    }
  }

  private async generateTokens(user: any, companyId: string, roles: string[]) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      companyId,
      roles,
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.accessSecret'),
      expiresIn: this.configService.get('jwt.accessExpiresIn'),
    });

    // Generate refresh token
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.refreshSecret'),
      expiresIn: this.configService.get('jwt.refreshExpiresIn'),
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.db
      .insert(refreshTokens)
      .values({
        userId: user.id,
        token: refreshToken,
        expiresAt,
      });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }
}