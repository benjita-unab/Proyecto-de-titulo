import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { NlpModule } from './nlp/nlp.module';
import { TransportModule } from './transport/transport.module';
import { FormatterModule } from './formatter/formatter.module';

@Module({
  imports: [ChatModule, NlpModule, TransportModule, FormatterModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
