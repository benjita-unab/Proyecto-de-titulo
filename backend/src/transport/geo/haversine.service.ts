import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CATALOGO_PARADAS_MARGA_MARGA, ParadaData } from './paradas-catalogo';

export interface ParadaCercanaResultado {
  parada: ParadaData;
  distanciaMetros: number;
  radioAplicadoMetros: number;
  radioAmpliado: boolean;
  googleMapsUrl: string;
  googleMapsDirectionsUrl: string;
}

@Injectable()
export class HaversineService {
  private readonly logger = new Logger(HaversineService.name);
  private supabase: SupabaseClient | null = null;
  private readonly RADIO_TIERRA_METROS = 6371000; // Radio medio de la Tierra

  constructor(@Optional() private readonly configService?: ConfigService) {
    const supabaseUrl =
      this.configService?.get<string>('SUPABASE_URL') || process.env.SUPABASE_URL;
    const supabaseKey =
      this.configService?.get<string>('SUPABASE_KEY') ||
      this.configService?.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Tarea 2 (HU #3): Función pura de Haversine para cálculo de distancia geodésica.
   * Precisión estricta con error < 10m respecto a coordenadas de referencia.
   */
  public calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = (value: number) => (value * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const radLat1 = toRad(lat1);
    const radLat2 = toRad(lat2);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = this.RADIO_TIERRA_METROS * c;

    return Math.round(distance * 10) / 10; // Precisión con 1 decimal
  }

  /**
   * Tarea 6 (HU #3): Validación estricta de coordenadas geográficas.
   * Rechaza coordenadas fuera de rangos válidos o fuera de la región.
   */
  public validateCoordinates(latitude: any, longitude: any): boolean {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
      return false;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return false;
    }

    // Validación de zona geográfica correspondiente a Chile Central (Valparaíso - Marga Marga)
    // Permite uso de pruebas y ubicaciones razonables en Chile (-17 a -56 latitud, -76 a -66 longitud)
    const enChile = lat >= -56 && lat <= -17 && lng >= -76 && lng <= -66;
    return enChile;
  }

  /**
   * Genera el enlace a Google Maps nativo (no consume API de Google Maps, solo URLs de protocolo).
   */
  public generateGoogleMapsLink(lat: number, lng: number): string {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  /**
   * Genera enlace de navegación a pie hacia la parada para la app nativa
   */
  public generateWalkingDirectionsLink(
    userLat: number,
    userLng: number,
    destLat: number,
    destLng: number,
  ): string {
    return `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destLat},${destLng}&travelmode=walking`;
  }

  /**
   * Obtiene la lista de paradas desde Supabase o el catálogo de contingencia
   */
  async getParadasList(): Promise<ParadaData[]> {
    if (this.supabase) {
      try {
        let timeoutId: NodeJS.Timeout;
        const fetchPromise = this.supabase
          .from('parada')
          .select('*')
          .eq('activo', true);

        const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) => {
          timeoutId = setTimeout(() => resolve({ data: null, error: new Error('Timeout Supabase') }), 1200);
        });

        const { data, error } = (await Promise.race([fetchPromise, timeoutPromise])) as any;
        clearTimeout(timeoutId!);

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((p) => ({
            idParada: p.id_parada,
            codigoParada: p.codigo_parada || p.id_parada,
            nombre: p.nombre,
            direccion: p.direccion,
            latitud: Number(p.latitud),
            longitud: Number(p.longitud),
            comuna: p.comuna,
            esPuntoSeguro: Boolean(p.es_punto_seguro),
            tipoParada: p.tipo_parada,
            lineasAsociadas: p.lineas_asociadas,
          }));
        }
      } catch (err) {
        this.logger.warn(`Error al consultar paradas en Supabase: ${err}. Usando contingencia local.`);
      }
    }

    return CATALOGO_PARADAS_MARGA_MARGA;
  }

  /**
   * Tareas 2, 5 y 7 (HU #3): Encuentra la parada más cercana con radio progresivo (500m inicial).
   * Si no hay en 500m, amplía progresivamente sin error.
   * Si es para radiotaxi (soloPuntosSeguros: true), prioriza puntos seguros de espera.
   */
  async findClosestStop(
    userLat: number,
    userLng: number,
    options: {
      radioInicialMetros?: number;
      soloPuntosSeguros?: boolean;
    } = {},
  ): Promise<ParadaCercanaResultado | null> {
    if (!this.validateCoordinates(userLat, userLng)) {
      throw new Error('Coordenadas geográficas inválidas o fuera de rango.');
    }

    const paradas = await this.getParadasList();
    const candidatas = options.soloPuntosSeguros
      ? paradas.filter((p) => p.esPuntoSeguro)
      : paradas;

    if (candidatas.length === 0) {
      return null;
    }

    // Calcular distancias exactas para todas las paradas
    const conDistancia = candidatas.map((p) => ({
      parada: p,
      distanciaMetros: this.calculateDistance(userLat, userLng, p.latitud, p.longitud),
    }));

    conDistancia.sort((a, b) => a.distanciaMetros - b.distanciaMetros);

    const masCercana = conDistancia[0];
    const radioInicial = options.radioInicialMetros || 500;

    const estaEnRadioInicial = masCercana.distanciaMetros <= radioInicial;
    const radioFinalAplicado = estaEnRadioInicial
      ? radioInicial
      : Math.ceil(masCercana.distanciaMetros / 500) * 500;

    return {
      parada: masCercana.parada,
      distanciaMetros: masCercana.distanciaMetros,
      radioAplicadoMetros: radioFinalAplicado,
      radioAmpliado: !estaEnRadioInicial,
      googleMapsUrl: this.generateGoogleMapsLink(
        masCercana.parada.latitud,
        masCercana.parada.longitud,
      ),
      googleMapsDirectionsUrl: this.generateWalkingDirectionsLink(
        userLat,
        userLng,
        masCercana.parada.latitud,
        masCercana.parada.longitud,
      ),
    };
  }
}
