import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service'; // Certifique-se que o caminho está correto

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
