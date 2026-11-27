import { AiExtractorService, StructuredTransportPayload } from './ai-extractor.service';

describe('AiExtractorService source evidence validation', () => {
  let service: AiExtractorService;

  beforeEach(() => {
    service = new AiExtractorService();
  });

  const sourceUrl = 'https://dtpr.gob.cl/pe/gran-valparaiso/';
  const evidence = 'Línea 111 Hospital de Quilpué, recorrido por Avenida Central, frecuencia cada 10 minutos';
  const payload: StructuredTransportPayload = {
    fuenteUrl: sourceUrl,
    fechaExtraccion: '2026-11-27T00:00:00.000Z',
    rutas: [{
      idRecorrido: 'REC-111',
      idTransporte: 'TRANS-111',
      nombreRecorrido: 'Línea 111 Hospital de Quilpué',
      sentido: 'Ida',
      callesPrincipales: 'Avenida Central',
      frecuencia: 'cada 10 minutos',
      evidenciaFuente: evidence,
      pasaHospitalQuilpue: true,
    }],
    paradas: [],
    tarifas: [],
  };

  it('acepta los datos sólo si cada campo está respaldado por texto literal de una fuente oficial', () => {
    const result = service.validateAndNormalizePayload(payload, evidence, sourceUrl);

    expect(result.rutas).toHaveLength(1);
    expect(result.rutas[0].pasaHospitalQuilpue).toBe(true);
    expect(result.fuenteUrl).toBe(sourceUrl);
  });

  it('descarta rutas cuyo fragmento probatorio no aparece en la fuente', () => {
    const result = service.validateAndNormalizePayload(
      payload,
      'La fuente oficial no contiene datos de la línea consultada.',
      sourceUrl,
    );

    expect(result.rutas).toEqual([]);
  });

  it('rechaza fuentes no oficiales aunque el texto y la respuesta coincidan', () => {
    const result = service.validateAndNormalizePayload(
      payload,
      evidence,
      'https://example.com/transporte',
    );

    expect(result.rutas).toEqual([]);
    expect(result.paradas).toEqual([]);
    expect(result.tarifas).toEqual([]);
  });
});
