import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NlpService } from './nlp.service';
import { GeminiService } from './gemini.service';

@Module({
  imports: [ConfigModule],
  providers: [NlpService, GeminiService],
  exports: [NlpService, GeminiService],
})
export class NlpModule {}
