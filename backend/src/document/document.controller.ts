import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express'; // Importar
import { diskStorage } from 'multer'; // Importar para configurar armazenamento
import { extname } from 'path'; // Importar para pegar extensão do arquivo
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Controller('document')
export class DocumentController {
  private readonly logger = new Logger(DocumentController.name);

  constructor(private readonly documentService: DocumentService) {}

  // --- MODIFICAÇÃO AQUI ---
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      // 1. Usar FileInterceptor
      storage: diskStorage({
        // 2. Configurar onde e como salvar
        destination: './uploads', // 3. Salvar na pasta 'uploads'
        filename: (req, file, cb) => {
          // 4. Definir nome do arquivo salvo
          // Gere um nome único para evitar conflitos
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          // Use a extensão original do arquivo
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      // Opcional: Adicionar validações de tamanho/tipo aqui se necessário
      // fileFilter: (req, file, cb) => { ... }
      // limits: { fileSize: 1024 * 1024 * 5 } // Ex: Limite de 5MB
    }),
  )
  // 5. Injetar o arquivo com @UploadedFile e o DTO com @Body
  create(
    @UploadedFile() file: Express.Multer.File,
    // O DTO agora pode não ser mais necessário no Body,
    // pois pegaremos os dados do 'file'.
    // Remova @Body() se o frontend não enviar mais um JSON separado.
    // @Body() createDocumentDto: CreateDocumentDto
  ) {
    this.logger.log(
      `Received file: ${file.originalname}, size: ${file.size}, mimetype: ${file.mimetype}`,
    );
    this.logger.log(`File saved to: ${file.path}`); // Caminho onde foi salvo

    // 6. Criar o DTO a partir dos dados do arquivo recebido
    const createDocumentData: CreateDocumentDto = {
      originalFilename: file.originalname,
      storagePath: file.path, // Usar o caminho onde o multer salvou
      mimeType: file.mimetype,
      size: file.size,
    };

    // 7. Chamar o serviço com os dados extraídos do arquivo
    return this.documentService.create(createDocumentData);
  }
  // --- FIM DA MODIFICAÇÃO ---

  @Get()
  findAll() {
    return this.documentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    // Adicionado ParseIntPipe para validação/conversão
    return this.documentService.findOne(id);
  }

  // O método update precisaria de lógica similar para upload se fosse atualizar o arquivo
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    // Adicionado ParseIntPipe
    return this.documentService.remove(id);
  }
}
