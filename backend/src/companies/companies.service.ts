import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto) {
    const existing = await this.prisma.company.findUnique({
      where: { email: createCompanyDto.email },
    });

    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }

    if (createCompanyDto.cnpj) {
      const existingCnpj = await this.prisma.company.findUnique({
        where: { cnpj: createCompanyDto.cnpj },
      });

      if (existingCnpj) {
        throw new ConflictException('CNPJ já cadastrado');
      }
    }

    return this.prisma.company.create({
      data: createCompanyDto,
    });
  }

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    await this.findOne(id);

    return this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.company.update({
      where: { id },
      data: { active: false },
    });
  }
}
