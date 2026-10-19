import { Injectable, Logger, Optional, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiExtractorService } from './ai-extractor.service';
import { DatabaseManagerService } from '../database/database-manager.service';

@Injectable()
export class CronSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CronSyncService.name);
  private timer: NodeJS.Timeout | null = null;
  private readonly intervalMs: number;

  constructor(
    private readonly aiExtractor: AiExtractorService,
    private readonly databaseManager: DatabaseManagerService,
    @Optional() private readonly configService?: ConfigService,
  ) {
    // Intervalo de verificación configurable (por defecto cada 6 horas = 21600000 ms; o menor según .env)
    this.intervalMs = Number(
      this.configService?.get<string>('CRON_SYNC_INTERVAL_MS') ||
        process.env.CRON_SYNC_INTERVAL_MS ||
        6 * 60 * 60 * 1000,
    );
  }

  onModuleInit() {
    this.startPeriodicSync();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  public startPeriodicSync(): void {
    this.logger.log(`[CronSync] Inicializando verificación periódica cada ${this.intervalMs / 1000}s`);

    // Iniciar timer sin bloquear el arranque de NestJS
    this.timer = setInterval(async () => {
      await this.runVerificationAndSync();
    }, this.intervalMs);

    // Permitir que el proceso Node se cierre de forma limpia en pruebas
    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  /**
   * Tarea 4 (HU #6): Ejecuta la verificación condicional.
   * Primero verifica si los datos cambiaron o están desactualizados y solo extrae/guarda cuando corresponde.
   */
  async runVerificationAndSync(): Promise<{ checked: boolean; updated: boolean }> {
    this.logger.log('[CronSync] Ejecutando rutina periódica de verificación de datos...');
    try {
      // 1. Sincronizar Supabase -> SQLite como respaldo de contingencia (Nivel 3)
      await this.databaseManager.syncSupabaseToSqlite();

      // 2. Extraer datos de transporte solo cuando corresponda
      const sourceUrl = 'https://dtpr.mtt.gob.cl/';
      const structured = await this.aiExtractor.extractAndStructureWithAi(sourceUrl);

      if (structured) {
        const saved = await this.aiExtractor.saveIfChanged(structured);
        return { checked: true, updated: saved };
      }

      return { checked: true, updated: false };
    } catch (err: any) {
      // Respaldo Nivel 2: Ante fallos, mantener últimos datos guardados sin arrojar errores
      this.logger.error(`[CronSync] Error en ciclo de sincronización (${err.message}). Manteniendo últimos datos guardados.`);
      return { checked: false, updated: false };
    }
  }
}
