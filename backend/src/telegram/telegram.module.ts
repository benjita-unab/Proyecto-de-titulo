import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { FormatterModule } from '../formatter/formatter.module';
import { NlpModule } from '../nlp/nlp.module';
import { TransportModule } from '../transport/transport.module';

@Module({
  imports: [ConfigModule, FormatterModule, NlpModule, TransportModule],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
