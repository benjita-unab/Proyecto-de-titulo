import { Injectable } from '@nestjs/common';

@Injectable()
export class FormatterService {
  formatRouteResponse(destination: string, routes: any[]) {
    if (!destination || !routes || routes.length === 0) {
      return {
        text: 'Lo siento, no pude reconocer su destino. 😌\n\n¿Podría decirme a qué calle o lugar de Limache desea llegar?\n\nPor ejemplo, puede decir: *\'Quiero ir al hospital\'* o *\'Cómo llego a la plaza\'*',
        options: []
      };
    }

    // Tarea #67: Limitar a máximo 2 alternativas
    const topRoutes = routes.slice(0, 2);
    
    // Tarea #67: Generador de Texto Accesible (párrafos cortos, viñetas y nombres en negrita)
    let text = `Aquí tiene ${topRoutes.length} opción(es) para llegar a ${destination}:\n\n`;
    
    topRoutes.forEach(route => {
      const emoji = route.tipo?.toLowerCase().includes('colectivo') ? '🚕' : '🚌';
      const tipo = route.tipo?.toLowerCase().includes('colectivo') ? 'Colectivo' : 'Micro';
      
      text += `${emoji} *${route.linea} (${tipo})*\n`;
      text += `Recorrido: ${route.recorrido}.\n\n`;
    });

    return {
      text: text.trimEnd(),
      options: topRoutes
    };
  }
}
