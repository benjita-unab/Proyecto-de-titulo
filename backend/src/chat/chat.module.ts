import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { NlpModule } from '../nlp/nlp.module';
import { TransportModule } from '../transport/transport.module';
import { FormatterModule } from '../formatter/formatter.module';

@Module({
  imports: [NlpModule, TransportModule, FormatterModule],
  controllers: [ChatController],
})
export class ChatModule {}
