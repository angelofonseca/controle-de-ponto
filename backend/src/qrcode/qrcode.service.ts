import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQrCodeSessionDto } from './dto/create-qr-code-session.dto';

@Injectable()
export class QrcodeService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(dto: CreateQrCodeSessionDto, requestingUser: any) {
    const expirationMinutes =
      dto.expirationMinutes ||
      parseInt(process.env.QRCODE_EXPIRATION_MINUTES || '10');

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

    const session = await this.prisma.qrCodeSession.create({
      data: {
        allowedType: dto.allowedType,
        expiresAt,
        companyId: requestingUser.companyId,
      },
    });

    const qrCodeData = JSON.stringify({
      token: session.token,
      type: session.allowedType,
      expiresAt: session.expiresAt.toISOString(),
    });

    const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
    });

    return {
      id: session.id,
      token: session.token,
      allowedType: session.allowedType,
      expiresAt: session.expiresAt,
      qrCodeImage,
    };
  }

  async getCurrentSession(requestingUser: any) {
    const session = await this.prisma.qrCodeSession.findFirst({
      where: {
        companyId: requestingUser.companyId,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) {
      return { active: false };
    }

    const qrCodeData = JSON.stringify({
      token: session.token,
      type: session.allowedType,
      expiresAt: session.expiresAt.toISOString(),
    });

    const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
    });

    return {
      active: true,
      id: session.id,
      token: session.token,
      allowedType: session.allowedType,
      expiresAt: session.expiresAt,
      qrCodeImage,
    };
  }

  async getSessionHistory(requestingUser: any) {
    return this.prisma.qrCodeSession.findMany({
      where: { companyId: requestingUser.companyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async validateToken(token: string) {
    const session = await this.prisma.qrCodeSession.findUnique({
      where: { token },
    });

    if (!session) {
      throw new NotFoundException('QR code não encontrado');
    }

    return {
      valid: !session.used && session.expiresAt > new Date(),
      session: {
        id: session.id,
        allowedType: session.allowedType,
        expiresAt: session.expiresAt,
        used: session.used,
      },
    };
  }
}
