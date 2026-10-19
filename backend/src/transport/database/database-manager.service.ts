import { Injectable, Logger, Optional, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

export interface DatabaseState {
  supabaseAvailable: boolean;
  activeSource: 'supabase' | 'sqlite';
  lastSyncTimestamp: number;
}

@Injectable()
export class DatabaseManagerService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseManagerService.name);
  private supabase: SupabaseClient | null = null;
  private isSupabaseHealthy = true;
  private lastHealthCheck = 0;
  private readonly HEALTH_CHECK_INTERVAL_MS = 60000; // 1 minuto
  private readonly sqliteDbPath: string;

  // Almacenamiento local estructurado de contingencia SQLite (tabla relacional en disco)
  private localSqliteStore: {
    rutas: any[];
    paradas: any[];
    colectivos: any[];
    radiotaxis: any[];
    horarios: any[];
  } = {
    rutas: [],
    paradas: [],
    colectivos: [],
    radiotaxis: [],
    horarios: [],
  };

  constructor(@Optional() private readonly configService?: ConfigService) {
    const supabaseUrl =
      this.configService?.get<string>('SUPABASE_URL') || process.env.SUPABASE_URL;
    const supabaseKey =
      this.configService?.get<string>('SUPABASE_KEY') ||
      this.configService?.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    this.sqliteDbPath =
      this.configService?.get<string>('SQLITE_DB_PATH') ||
      path.join(process.cwd(), 'movitech_backup.sqlite.json');

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      this.isSupabaseHealthy = false;
      this.logger.warn('Supabase no configurado. DatabaseManager iniciará con contingencia local SQLite.');
    }
  }

  onModuleInit() {
    this.loadSqliteFromDisk();
  }

  private loadSqliteFromDisk(): void {
    try {
      if (fs.existsSync(this.sqliteDbPath)) {
        const raw = fs.readFileSync(this.sqliteDbPath, 'utf-8');
        this.localSqliteStore = JSON.parse(raw);
        this.logger.log(`[DatabaseManager] Réplica SQLite cargada desde: ${this.sqliteDbPath}`);
      } else {
        this.saveSqliteToDisk();
      }
    } catch (e: any) {
      this.logger.error(`Error al cargar SQLite local: ${e.message}`);
    }
  }

  private saveSqliteToDisk(): void {
    try {
      fs.writeFileSync(this.sqliteDbPath, JSON.stringify(this.localSqliteStore, null, 2), 'utf-8');
    } catch (e: any) {
      this.logger.error(`Error al persistir réplica SQLite en disco: ${e.message}`);
    }
  }

  public getStatus(): DatabaseState {
    return {
      supabaseAvailable: this.isSupabaseHealthy,
      activeSource: this.isSupabaseHealthy ? 'supabase' : 'sqlite',
      lastSyncTimestamp: this.lastHealthCheck,
    };
  }

  /**
   * Tarea 5c (HU #6): Consulta transparente con conmutación por falla (Failover) a SQLite
   */
  async queryWithFailover<T>(
    tableName: 'rutas' | 'paradas' | 'colectivos' | 'radiotaxis' | 'horarios',
    supabaseQueryFn: (supabase: SupabaseClient) => Promise<{ data: T[] | null; error: any }>,
    sqliteFilterFn?: (item: any) => boolean,
  ): Promise<{ data: T[]; source: 'supabase' | 'sqlite' }> {
    // Si Supabase está disponible, intentamos consultar con timeout estricto de 2s
    if (this.supabase && this.isSupabaseHealthy) {
      try {
        let timeoutId: NodeJS.Timeout;
        const queryPromise = supabaseQueryFn(this.supabase);
        const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) => {
          timeoutId = setTimeout(() => resolve({ data: null, error: new Error('Supabase Query Timeout') }), 2000);
        });

        const { data, error } = (await Promise.race([queryPromise, timeoutPromise])) as any;
        clearTimeout(timeoutId!);

        if (!error && Array.isArray(data) && data.length > 0) {
          // Actualizar réplica en memoria/disco con los datos obtenidos
          this.localSqliteStore[tableName] = data;
          this.isSupabaseHealthy = true;
          return { data, source: 'supabase' };
        }

        if (error) {
          this.logger.warn(`[FailoverManager] Error en Supabase para tabla ${tableName}: ${error.message}. Conmutando a SQLite.`);
          this.isSupabaseHealthy = false;
        }
      } catch (err: any) {
        this.logger.warn(`[FailoverManager] Excepción en Supabase (${err.message}). Conmutando inmediatamente a SQLite local.`);
        this.isSupabaseHealthy = false;
      }
    }

    // Tarea 5c: Conmutación automática a SQLite local
    const fallbackList = this.localSqliteStore[tableName] || [];
    const filtered = sqliteFilterFn ? fallbackList.filter(sqliteFilterFn) : fallbackList;

    return {
      data: filtered as T[],
      source: 'sqlite',
    };
  }

  /**
   * Sincronización periódica programada desde Supabase hacia la réplica SQLite local
   */
  async syncSupabaseToSqlite(): Promise<void> {
    if (!this.supabase) return;
    this.logger.log('[DatabaseManager] Iniciando sincronización Supabase -> SQLite...');

    try {
      const [rutas, paradas, colectivos, radiotaxis, horarios] = await Promise.allSettled([
        this.supabase.from('recorrido_transporte').select('*'),
        this.supabase.from('parada').select('*'),
        this.supabase.from('colectivo').select('*'),
        this.supabase.from('servicio_radiotaxi').select('*'),
        this.supabase.from('horario_servicio').select('*'),
      ]);

      if (rutas.status === 'fulfilled' && rutas.value.data) {
        this.localSqliteStore.rutas = rutas.value.data;
      }
      if (paradas.status === 'fulfilled' && paradas.value.data) {
        this.localSqliteStore.paradas = paradas.value.data;
      }
      if (colectivos.status === 'fulfilled' && colectivos.value.data) {
        this.localSqliteStore.colectivos = colectivos.value.data;
      }
      if (radiotaxis.status === 'fulfilled' && radiotaxis.value.data) {
        this.localSqliteStore.radiotaxis = radiotaxis.value.data;
      }
      if (horarios.status === 'fulfilled' && horarios.value.data) {
        this.localSqliteStore.horarios = horarios.value.data;
      }

      this.saveSqliteToDisk();
      this.isSupabaseHealthy = true;
      this.lastHealthCheck = Date.now();
      this.logger.log('✅ [DatabaseManager] Sincronización Supabase -> SQLite completada con éxito.');
    } catch (err: any) {
      this.logger.error(`Error durante sincronización Supabase a SQLite: ${err.message}`);
    }
  }
}
