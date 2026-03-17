import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Role } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterCompanyAdminDto } from './dto/register-company-admin.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async registerCompanyAdmin(dto: RegisterCompanyAdminDto) {
    const [existingCompanyEmail, existingUserEmail] = await Promise.all([
      this.prisma.company.findUnique({ where: { email: dto.companyEmail } }),
      this.prisma.user.findUnique({ where: { email: dto.adminEmail } }),
    ]);

    if (existingCompanyEmail) {
      throw new ConflictException('E-mail da empresa ja cadastrado');
    }

    if (existingUserEmail) {
      throw new ConflictException('E-mail do administrador ja cadastrado');
    }

    if (dto.companyCnpj) {
      const existingCompanyCnpj = await this.prisma.company.findUnique({
        where: { cnpj: dto.companyCnpj },
      });

      if (existingCompanyCnpj) {
        throw new ConflictException('CNPJ ja cadastrado');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);

    const created = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: dto.companyName,
          cnpj: dto.companyCnpj,
          email: dto.companyEmail,
          phone: dto.companyPhone,
          address: dto.companyAddress,
        },
      });

      const user = await tx.user.create({
        data: {
          name: dto.adminName,
          email: dto.adminEmail,
          password: hashedPassword,
          role: Role.COMPANY_ADMIN,
          companyId: company.id,
        },
        include: { company: true },
      });

      return { company, user };
    });

    const tokens = await this.generateTokens(created.user);

    return {
      user: {
        id: created.user.id,
        email: created.user.email,
        name: created.user.name,
        role: created.user.role,
        companyId: created.user.companyId,
        company: {
          id: created.company.id,
          name: created.company.name,
        },
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: { company: true },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        company: { id: user.company.id, name: user.company.name },
      },
      ...tokens,
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const storedToken = await tx.refreshToken.findUnique({
        where: { token: refreshTokenDto.refreshToken },
        include: { user: { include: { company: true } } },
      });

      if (!storedToken || storedToken.revoked) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      if (storedToken.expiresAt < new Date()) {
        await tx.refreshToken.update({
          where: { id: storedToken.id },
          data: { revoked: true },
        });
        throw new UnauthorizedException('Refresh token expirado');
      }

      // Atomically revoke old token
      await tx.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });

      return storedToken;
    });

    const tokens = await this.generateTokens(result.user);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        companyId: result.user.companyId,
      },
      ...tokens,
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, token: refreshToken },
        data: { revoked: true },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true },
      });
    }

    return { message: 'Logout realizado com sucesso' };
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not configured');
    }

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    const refreshTokenValue = uuidv4();
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    const expiresAt = this.createRefreshExpiry(refreshExpiresIn);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    };
  }

  private createRefreshExpiry(ttl: string): Date {
    const match = /^(\d+)([mhdw])$/.exec(ttl);
    const expiresAt = new Date();

    if (!match) {
      expiresAt.setDate(expiresAt.getDate() + 7);
      return expiresAt;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'm':
        expiresAt.setMinutes(expiresAt.getMinutes() + value);
        break;
      case 'h':
        expiresAt.setHours(expiresAt.getHours() + value);
        break;
      case 'd':
        expiresAt.setDate(expiresAt.getDate() + value);
        break;
      case 'w':
        expiresAt.setDate(expiresAt.getDate() + value * 7);
        break;
      default:
        expiresAt.setDate(expiresAt.getDate() + 7);
        break;
    }

    return expiresAt;
  }
}
