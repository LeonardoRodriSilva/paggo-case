import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'], // Descomente se quiser ver logs do Prisma
    });
    console.log('PrismaService initialized');
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('PrismaService connected to the database.');
    } catch (error) {
      console.error('PrismaService failed to connect to the database:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('PrismaService disconnected from the database.');
  }
}
