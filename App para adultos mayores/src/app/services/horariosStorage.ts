import { HorarioTransporteData, HORARIOS_DEFAULT_AGDABUS } from '../components/HorariosCard';

const STORAGE_KEY_HORARIOS = 'offline_transporte_horarios';

/**
 * Guarda las franjas horarias en el almacenamiento local del teléfono (localStorage)
 * para permitir consultas sin conexión a internet (offline).
 */
export function persistirHorariosLocalmente(datos: HorarioTransporteData): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_HORARIOS, JSON.stringify(datos));
    }
  } catch (error) {
    console.warn('No se pudo guardar los horarios en el almacenamiento local:', error);
  }
}

/**
 * Obtiene las franjas horarias desde el almacenamiento local del teléfono.
 * Si no existen aún en el almacenamiento local, inicializa y guarda los datos
 * predeterminados para garantizar disponibilidad offline inmediata.
 */
export function obtenerHorariosLocales(): HorarioTransporteData {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const guardados = window.localStorage.getItem(STORAGE_KEY_HORARIOS);
      if (guardados) {
        const parsed = JSON.parse(guardados);
        if (parsed && Array.isArray(parsed.franjas) && parsed.franjas.length > 0) {
          return parsed;
        }
      }
    }
  } catch (error) {
    console.warn('Error al leer horarios locales:', error);
  }

  // Si no hay datos guardados previamente, guardar y devolver los predeterminados
  persistirHorariosLocalmente(HORARIOS_DEFAULT_AGDABUS);
  return HORARIOS_DEFAULT_AGDABUS;
}
