import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RutasService } from './rutas/rutas.service';
import { HorariosService } from './horarios/horarios.service';
import { TaxisService } from './taxis/taxis.service';
import { ColectivosService } from './colectivos/colectivos.service';
import { HaversineService } from './geo/haversine.service';
import { DatabaseManagerService } from './database/database-manager.service';
import { AiExtractorService } from './extraction/ai-extractor.service';
import { CronSyncService } from './extraction/cron-sync.service';

@Module({
  imports: [ConfigModule],
  providers: [
    RutasService,
    HorariosService,
    TaxisService,
    ColectivosService,
    HaversineService,
    DatabaseManagerService,
    AiExtractorService,
    CronSyncService,
  ],
  exports: [
    RutasService,
    HorariosService,
    TaxisService,
    ColectivosService,
    HaversineService,
    DatabaseManagerService,
    AiExtractorService,
    CronSyncService,
  ],
})
export class TransportModule {}
