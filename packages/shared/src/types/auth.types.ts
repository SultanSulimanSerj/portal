export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  userId: string;
  email: string;
  companyId: string;
  roles: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}