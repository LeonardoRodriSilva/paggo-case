import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  Body,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { AiService } from '../ai/ai.service';
import { CreateChatDto } from './dto/create-chat-dto';
import { DocumentStatus } from '@prisma/client'; // Importar o Enum se não estiver global

@Controller('documents')
export class DocumentController {
  private readonly logger = new Logger(DocumentController.name);

  constructor(
    private readonly documentService: DocumentService,
    private readonly aiService: AiService,
  ) {}

  @Get()
  async findAll() {
    return this.documentService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const document = await this.documentService.findOne(id);
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found.`);
    }
    return document;
  }

  @Post(':id/chat')
  async getDocumentExplanation(
    @Param('id', ParseIntPipe) id: number,
    @Body() createChatDto: CreateChatDto,
  ) {
    this.logger.log(`Received chat request for document ID: ${id}`);
    // O DTO e o ValidationPipe garantem que 'prompt' é string e não vazio aqui
    const { question } = createChatDto;

    try {
      const document = await this.documentService.findOne(id);
      if (!document) {
        throw new NotFoundException(`Document with ID ${id} not found.`);
      }

      // Usar o Enum importado para comparação mais segura
      if (document.status !== DocumentStatus.COMPLETED) {
        throw new HttpException(
          `Document ${id} is not yet processed. Status: ${document.status}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!document.extractedText) {
        this.logger.error(
          `Document ${id} is COMPLETED but has no extractedText.`,
        );
        throw new InternalServerErrorException(
          `Document ${id} is marked as completed, but extracted text is missing.`,
        );
      }

      this.logger.log(
        `Sending text (length: ${document.extractedText.length}) and prompt to AI Service.`,
      );

      // Chamada ao AiService - o tipo de retorno é Promise<string | null>
      const explanation: string | null = await this.aiService.createChatCompletion(
        question,
        document.extractedText,
      );

      // Verificação mais segura para null ou string de erro específica
      if (explanation === null) {
        this.logger.warn(
          `AI Service returned null explanation for document ${id}`,
        );
        throw new InternalServerErrorException(
          'Failed to get explanation from AI service.',
        );
      }
      // Verificar explicitamente se é uma string antes de usar métodos de string
      if (
        typeof explanation === 'string' &&
        explanation.startsWith('Desculpe, ocorreu um erro')
      ) {
        throw new InternalServerErrorException(explanation);
      }
      // Se chegou aqui e é uma string, é a resposta válida
      if (typeof explanation === 'string') {
        this.logger.log(`Successfully received explanation for document ${id}`);
        return { response: explanation };
      } else {
        // Caso inesperado se explanation não for string nem null nem a string de erro
        this.logger.error(
          `Unexpected type received from AI Service: ${typeof explanation}`,
        );
        throw new InternalServerErrorException(
          'Received an unexpected response format from AI service.',
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        // Se já for uma HttpException conhecida (NotFound, BadRequest, InternalServer...), apenas relance
        throw error;
      } else if (error instanceof Error) {
        // Se for um Error padrão, logue a mensagem e stack e lance um InternalServerError
        this.logger.error(
          `Error during chat request for document ${id}: ${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException(
          `An unexpected error occurred: ${error.message}`,
        );
      } else {
        // Para outros tipos de erros (embora menos comum em JS/TS)
        this.logger.error(
          `Unknown error type during chat request for document ${id}: ${JSON.stringify(error)}`,
        );
        throw new InternalServerErrorException('An unexpected error occurred.');
      }
    }
  }

  // Seu endpoint de upload...
  // @Post('upload')
  // ...
}
