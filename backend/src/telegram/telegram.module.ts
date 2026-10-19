import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { AudioTranscriptionService } from './audio-transcription.service';
import { FormatterModule } from '../formatter/formatter.module';
import { NlpModule } from '../nlp/nlp.module';
import { TransportModule } from '../transport/transport.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ConfigModule, FormatterModule, NlpModule, TransportModule, forwardRef(() => ChatModule)],
  controllers: [TelegramController],
  providers: [TelegramService, AudioTranscriptionService],
  exports: [TelegramService, AudioTranscriptionService],
})
export class TelegramModule {}
