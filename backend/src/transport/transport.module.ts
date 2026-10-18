import { Module } from '@nestjs/common';
import { RutasService } from './rutas/rutas.service';
import { HorariosService } from './horarios/horarios.service';
import { TaxisService } from './taxis/taxis.service';
import { ColectivosService } from './colectivos/colectivos.service';
import { HaversineService } from './geo/haversine.service';

@Module({
  providers: [RutasService, HorariosService, TaxisService, ColectivosService, HaversineService],
  exports: [RutasService, HorariosService, TaxisService, ColectivosService, HaversineService],
})
export class TransportModule {}
