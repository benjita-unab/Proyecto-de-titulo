import { Module } from '@nestjs/common';
import { RutasService } from './rutas/rutas.service';
import { HorariosService } from './horarios/horarios.service';
import { TaxisService } from './taxis/taxis.service';
import { ColectivosService } from './colectivos/colectivos.service';

@Module({
  providers: [RutasService, HorariosService, TaxisService, ColectivosService],
  exports: [RutasService, HorariosService, TaxisService, ColectivosService],
})
export class TransportModule {}
