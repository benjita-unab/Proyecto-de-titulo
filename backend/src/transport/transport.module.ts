import { Module } from '@nestjs/common';
import { RutasService } from './rutas/rutas.service';
import { HorariosService } from './horarios/horarios.service';
import { TaxisService } from './taxis/taxis.service';

@Module({
  providers: [RutasService, HorariosService, TaxisService],
  exports: [RutasService, HorariosService, TaxisService],
})
export class TransportModule {}
