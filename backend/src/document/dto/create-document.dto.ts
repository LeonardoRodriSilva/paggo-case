import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateDocumentDto {
  @IsString({ message: 'O nome original do arquivo deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome original do arquivo não pode estar vazio.' })
  originalFilename: string;

  @IsString({ message: 'O caminho de armazenamento deve ser um texto.' })
  @IsNotEmpty({ message: 'O caminho de armazenamento não pode estar vazio.' })
  storagePath: string;

  @IsString({ message: 'O tipo MIME deve ser um texto.' })
  @IsNotEmpty({ message: 'O tipo MIME não pode estar vazio.' })
  mimeType: string;

  @IsNumber({}, { message: 'O tamanho deve ser um número.' })
  @Min(0, { message: 'O tamanho não pode ser negativo.' })
  size: number;
}
