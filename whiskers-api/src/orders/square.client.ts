import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SquareClient, SquareEnvironment } from 'square';

@Injectable()
export class SquareClientProvider implements OnModuleInit {
  private readonly logger = new Logger(SquareClientProvider.name);
  private client!: SquareClient;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const token = this.config.get<string>('SQUARE_ACCESS_TOKEN');
    if (!token) {
      this.logger.warn(
        'SQUARE_ACCESS_TOKEN is not set; payment endpoints will fail until configured.',
      );
    }
    this.client = new SquareClient({
      token: token ?? 'sandbox-placeholder',
      environment:
        this.config.get<string>('SQUARE_ENVIRONMENT') === 'production'
          ? SquareEnvironment.Production
          : SquareEnvironment.Sandbox,
    });
  }

  getClient(): SquareClient {
    return this.client;
  }
}
