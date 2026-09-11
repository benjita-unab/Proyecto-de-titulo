import {
  Controller,
  Post,
  Body,
  Headers,
  Query,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { TelegramService } from './telegram.service';
import {
  TelegramUpdateDto,
  TelegramWebhookResponseDto,
} from './telegram.dto';

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Body() update: TelegramUpdateDto,
    @Headers('x-telegram-bot-api-secret-token') secretHeader?: string,
    @Query('token') secretQuery?: string,
  ): TelegramWebhookResponseDto {
    const isValid = this.telegramService.validateSecretToken(
      secretHeader,
      secretQuery,
    );

    if (!isValid) {
      this.logger.warn(
        'Intento de acceso al webhook con token de seguridad inválido o ausente.',
      );
      throw new UnauthorizedException(
        'Acceso no autorizado: Token de webhook de Telegram inválido.',
      );
    }

    // Procesamiento asíncrono no bloqueante para asegurar respuesta inmediata en < 50ms
    // evitando reintentos masivos por parte de los servidores de Telegram
    this.telegramService
      .handleIncomingUpdate(update)
      .catch((err) => {
        this.logger.error(
          `Error procesando update entrante de Telegram (#${update?.update_id}): ${err?.message || err}`,
        );
      });

    return { status: 'ok' };
  }
}
