import { Module } from '@nestjs/common';
import { FormatterService } from './formatter.service';
import { TelegramFormatterService } from './telegram-formatter.service';

@Module({
  providers: [FormatterService, TelegramFormatterService],
  exports: [FormatterService, TelegramFormatterService],
})
export class FormatterModule {}

