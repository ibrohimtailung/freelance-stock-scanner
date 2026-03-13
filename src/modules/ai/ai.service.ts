import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterChoice {
  message: { role: string; content: string };
  finish_reason: string;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: OpenRouterChoice[];
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private readonly provider: 'openrouter' | 'ollama';

  // OpenRouter config
  private readonly apiKey: string;
  private readonly orModel: string;
  private readonly orBaseUrl: string;

  // Ollama config
  private readonly ollamaModel: string;
  private readonly ollamaBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.provider = (this.configService.get<string>('aiProvider') as
      | 'openrouter'
      | 'ollama') ?? 'openrouter';

    // OpenRouter
    this.apiKey    = this.configService.get<string>('openrouter.apiKey') ?? '';
    this.orModel   = this.configService.get<string>('openrouter.model') ?? 'anthropic/claude-3.5-sonnet';
    this.orBaseUrl = this.configService.get<string>('openrouter.baseUrl') ?? 'https://openrouter.ai/api/v1';

    // Ollama (local)
    this.ollamaBaseUrl = this.configService.get<string>('ollama.baseUrl') ?? 'http://localhost:11434';
    this.ollamaModel   = this.configService.get<string>('ollama.model') ?? 'llama3';
  }

  /**
   * Send a chat completion request to the configured AI provider.
   * Returns the raw text content of the first choice.
   */
  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
    if (this.provider === 'ollama') {
      return this.chatWithOllama(messages, options);
    }

    return this.chatWithOpenRouter(messages, options);
  }

  private async chatWithOpenRouter(
    messages: ChatMessage[],
    options: ChatOptions = {},
  ): Promise<string> {
    const url = `${this.orBaseUrl}/chat/completions`;

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<OpenRouterResponse>(
          url,
          {
            model:       options.model ?? this.orModel,
            messages,
            temperature: options.temperature ?? 0.3,
            max_tokens:  options.maxTokens ?? 1000,
          },
          {
            headers: {
              Authorization:  `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://github.com/freelance-scanner',
              'X-Title':      'FreelanceBot',
            },
          },
        ),
      );

      const content = data.choices?.[0]?.message?.content?.trim() ?? '';

      this.logger.debug(
        `OpenRouter ← model=${data.model} tokens=${data.usage?.total_tokens ?? '?'}`,
      );

      return content;
    } catch (err) {
      const axErr = err as AxiosError;
      this.logger.error(
        `OpenRouter request failed: ${axErr.response?.status} ${JSON.stringify(axErr.response?.data)}`,
      );
      throw err;
    }
  }

  private async chatWithOllama(
    messages: ChatMessage[],
    options: ChatOptions = {},
  ): Promise<string> {
    const url = `${this.ollamaBaseUrl}/api/chat`;

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          url,
          {
            model:   options.model ?? this.ollamaModel,
            stream:  false,
            options: {
              temperature: options.temperature ?? 0.3,
              num_predict: options.maxTokens ?? 1000,
            },
            messages,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      // Ollama's /api/chat returns { message: { content: string } }
      const content: string = data?.message?.content?.trim?.() ?? '';

      this.logger.debug(
        `Ollama ← model=${options.model ?? this.ollamaModel}`,
      );

      return content;
    } catch (err) {
      const axErr = err as AxiosError;
      this.logger.error(
        `Ollama request failed: ${axErr.response?.status} ${JSON.stringify(axErr.response?.data)}`,
      );
      throw err;
    }
  }

  getModel(): string {
    return this.provider === 'ollama' ? this.ollamaModel : this.orModel;
  }
}
