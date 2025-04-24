import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    // Certifique-se de ter OPENAI_API_KEY no seu .env
    this.openai = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY'),
    });
  }

  async createChatCompletion(prompt: string, context: string): Promise<string | null> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Ou outro modelo
        messages: [
          {
            role: 'system',
            content: `Você é um assistente útil. Use o seguinte contexto para responder à pergunta do usuário:\n\nContexto:\n${context}\n\n---\n`,
          },
          { role: 'user', content: prompt },
        ],
      });
      return response.choices[0]?.message?.content;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      // Considerar lançar um erro específico ou retornar null/string vazia
      throw new Error('Failed to get response from AI');
    }
  }
}