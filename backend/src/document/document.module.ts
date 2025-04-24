import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Presumindo que você usa PrismaModule
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    PrismaModule, // Ou outros módulos necessários
    AiModule, // <<< --- VERIFIQUE SE AiModule ESTÁ AQUI NOS IMPORTS
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
  // Não precisa exportar nada aqui geralmente
})
export class DocumentModule {}
