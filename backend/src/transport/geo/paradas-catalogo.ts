export interface ParadaData {
  idParada: string;
  codigoParada: string;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  comuna: string;
  esPuntoSeguro: boolean;
  tipoParada: string;
  lineasAsociadas: string;
}

export const CATALOGO_PARADAS_MARGA_MARGA: ParadaData[] = [
  {
    idParada: 'PAR-QLP-01',
    codigoParada: 'PA-HOSP-01',
    nombre: 'Hospital de Quilpué (Acceso Principal)',
    direccion: 'San Martín #1270, Quilpué',
    latitud: -33.0520,
    longitud: -71.4480,
    comuna: 'Quilpué',
    esPuntoSeguro: true,
    tipoParada: 'Microbús, Colectivo y Punto Seguro Taxi',
    lineasAsociadas: 'Línea 111, C02, Línea 4 Colectivo, Radio Taxi Los Lagos',
  },
  {
    idParada: 'PAR-QLP-02',
    codigoParada: 'PA-PLAZA-01',
    nombre: 'Plaza Manuel Blanco Encalada (Centro Quilpué)',
    direccion: 'Plaza de Quilpué / Los Carrera',
    latitud: -33.0483,
    longitud: -71.4431,
    comuna: 'Quilpué',
    esPuntoSeguro: true,
    tipoParada: 'Microbús, Colectivo y Punto Seguro Taxi',
    lineasAsociadas: 'Líneas C02, C03, Q02, 108, Colectivos 1, 2, 3, 5',
  },
  {
    idParada: 'PAR-QLP-03',
    codigoParada: 'PA-METRO-QLP',
    nombre: 'Estación Metro Quilpué',
    direccion: 'Av. Irarrázaval con Balmaceda',
    latitud: -33.0465,
    longitud: -71.4445,
    comuna: 'Quilpué',
    esPuntoSeguro: true,
    tipoParada: 'Intermodal Metro, Microbús y Colectivo',
    lineasAsociadas: 'Tren Limache-Puerto, C02, C03, 111, Colectivos 1, 3, 6',
  },
  {
    idParada: 'PAR-QLP-04',
    codigoParada: 'PA-BELL-01',
    nombre: 'Feria El Belloto (Paradero Central)',
    direccion: 'Av. Centenario con Freire, El Belloto',
    latitud: -33.0510,
    longitud: -71.4330,
    comuna: 'Quilpué',
    esPuntoSeguro: true,
    tipoParada: 'Microbús y Colectivo',
    lineasAsociadas: 'Q02, C02, Línea 2 Colectivo Belloto Sur',
  },
  {
    idParada: 'PAR-QLP-05',
    codigoParada: 'PA-PINOS-01',
    nombre: 'Terminal / Plaza Los Pinos',
    direccion: 'Av. Marga Marga con Los Pinos',
    latitud: -33.0720,
    longitud: -71.4360,
    comuna: 'Quilpué',
    esPuntoSeguro: true,
    tipoParada: 'Microbús y Colectivo',
    lineasAsociadas: 'Línea C03, 111, Línea 3 Colectivo',
  },
  {
    idParada: 'PAR-VLM-01',
    codigoParada: 'PA-METRO-VLM',
    nombre: 'Estación Metro Villa Alemana',
    direccion: 'Av. Valparaíso con Calle Santiago, Villa Alemana',
    latitud: -33.0430,
    longitud: -71.3740,
    comuna: 'Villa Alemana',
    esPuntoSeguro: true,
    tipoParada: 'Intermodal Metro, Microbús y Punto Seguro Taxi',
    lineasAsociadas: 'Tren Limache-Puerto, C02, 108, Q02, 105-D, Radio Taxi Aracis Vía',
  },
  {
    idParada: 'PAR-VLM-02',
    codigoParada: 'PA-PEUMO-01',
    nombre: 'Sector El Peumo - Fundo El Litre',
    direccion: 'Av. Valparaíso paradero 11, Peumo',
    latitud: -33.0380,
    longitud: -71.3620,
    comuna: 'Villa Alemana',
    esPuntoSeguro: true,
    tipoParada: 'Microbús',
    lineasAsociadas: 'Línea C02, 108',
  },
  {
    idParada: 'PAR-VLM-03',
    codigoParada: 'PA-PENAB-01',
    nombre: 'Estación Metro Peñablanca',
    direccion: 'Av. Valparaíso con Baquedano, Peñablanca',
    latitud: -33.0400,
    longitud: -71.3500,
    comuna: 'Villa Alemana',
    esPuntoSeguro: true,
    tipoParada: 'Microbús y Punto Seguro Taxi',
    lineasAsociadas: '105-D, 108, Tren Limache-Puerto',
  },
];
