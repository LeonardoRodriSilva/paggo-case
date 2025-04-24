import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Precisa importar ConfigModule
import { AiService } from './ai.service'; // Importa a classe do serviço

@Module({
  imports: [
    ConfigModule, // Importa o ConfigModule aqui porque AiService depende dele
  ],
  providers: [
    AiService, // Declara AiService como um provider deste módulo
  ],
  exports: [
    AiService, // Exporta AiService para que outros módulos possam injetá-lo
  ],
})
export class AiModule {}