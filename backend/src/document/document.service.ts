import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Document, DocumentStatus } from '@prisma/client';
import * as fs from 'fs';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  constructor(private prisma: PrismaService) {}

  async create(createDocumentDto: CreateDocumentDto): Promise<Document> {
    this.logger.log(
      `Attempting to create document record for: ${createDocumentDto.originalFilename}`,
    );
    const newDocument = await this.prisma.document.create({
      data: {
        ...createDocumentDto,
        status: DocumentStatus.PENDING,
        extractedText: null,
      },
    });
    this.logger.log(
      `Successfully created initial document record with ID: ${newDocument.id}`,
    );
    void this.extractTextAndUpdateStatus(newDocument);
    return newDocument;
  }

  private async extractTextAndUpdateStatus(document: Document): Promise<void> {
    this.logger.log(
      `Starting text extraction for document ID: ${document.id}, Path: ${document.storagePath}`,
    );
    let extractedText: string | null = null;
    let finalStatus: DocumentStatus = DocumentStatus.FAILED;

    try {
      if (!fs.existsSync(document.storagePath)) {
        throw new Error(`File not found at path: ${document.storagePath}`);
      }
      const dataBuffer: Buffer = fs.readFileSync(document.storagePath);

      if (document.mimeType === 'application/pdf') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const parseResult = await pdfParse(dataBuffer);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (parseResult && typeof parseResult.text === 'string') {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          extractedText = parseResult.text;
          finalStatus = DocumentStatus.COMPLETED;

          this.logger.log(
            `Successfully extracted text for document ID: ${document.id}. Text length: ${extractedText?.length}`,
          );
        } else {
          this.logger.error(
            `pdf-parse returned unexpected data structure for document ID: ${document.id}`,
          );
          throw new Error('pdf-parse did not return the expected text data.');
        }
      } else {
        this.logger.warn(
          `Text extraction not implemented for mimetype: ${document.mimeType}. Document ID: ${document.id}`,
        );
        finalStatus = DocumentStatus.FAILED;
      }
    } catch (error) {
      let errorMessage = 'Unknown error during text extraction';
      if (error instanceof Error) {
        errorMessage = error.message;
        this.logger.error(
          `Failed to extract text for document ID: ${document.id}. Error: ${errorMessage}`,
          error.stack,
        );
      } else {
        this.logger.error(
          `Failed to extract text for document ID: ${document.id}. Non-Error object thrown: ${String(error)}`,
        );
      }
      finalStatus = DocumentStatus.FAILED;
      extractedText = null;
    }

    try {
      await this.prisma.document.update({
        where: { id: document.id },
        data: {
          extractedText: extractedText,
          status: finalStatus,
        },
      });
      this.logger.log(
        `Successfully updated document ID: ${document.id} with status: ${finalStatus} and text extraction result.`,
      );
    } catch (updateError) {
      let updateErrorMessage =
        'Unknown error during database update after extraction';
      // --- CORREÇÃO AQUI ---
      let updateErrorStack: string | undefined = undefined;
      if (updateError instanceof Error) {
        updateErrorMessage = updateError.message;
        updateErrorStack = updateError.stack; // Agora a atribuição é válida
      }
      this.logger.error(
        `Failed to update document status/text for ID: ${document.id} after extraction attempt. Error: ${updateErrorMessage}`,
        updateErrorStack,
      );
    }
  }

  async findAll(): Promise<Document[]> {
    return this.prisma.document.findMany();
  }

  async findOne(id: number): Promise<Document | null> {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return document;
  }

  async remove(id: number): Promise<Document> {
    const document = await this.findOne(id);
    if (
      document &&
      document.storagePath &&
      fs.existsSync(document.storagePath)
    ) {
      try {
        fs.unlinkSync(document.storagePath);
        this.logger.log(`Successfully deleted file: ${document.storagePath}`);
      } catch (error) {
        let deleteErrorMessage = 'Unknown error during file deletion';
        // --- CORREÇÃO AQUI ---
        let deleteErrorStack: string | undefined = undefined;
        if (error instanceof Error) {
          deleteErrorMessage = error.message;
          deleteErrorStack = error.stack; // Agora a atribuição é válida
        }
        this.logger.error(
          `Error deleting file ${document.storagePath}: ${deleteErrorMessage}`,
          deleteErrorStack,
        );
      }
    }
    return this.prisma.document.delete({
      where: { id },
    });
  }
}
