import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ComparativeFlowService } from './comparative-flow.service';
import { NlpModule } from '../nlp/nlp.module';
import { TransportModule } from '../transport/transport.module';
import { FormatterModule } from '../formatter/formatter.module';

@Module({
  imports: [ConfigModule, NlpModule, TransportModule, FormatterModule],
  controllers: [ChatController],
  providers: [ComparativeFlowService],
  exports: [ComparativeFlowService],
})
export class ChatModule {}
