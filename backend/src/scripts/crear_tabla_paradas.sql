-- ==============================================================================
-- HU #3 - Tarea 3: Tabla de Paradas e Índices Espaciales / Coordenadas
-- Base de Datos: Supabase (PostgreSQL)
-- Descripción: Almacena los paraderos de microbuses y colectivos, y puntos
--              de espera seguros para radiotaxis en Quilpué y Villa Alemana.
-- ==============================================================================

-- 1. Crear tabla parada si no existe
CREATE TABLE IF NOT EXISTS public.parada (
    id_parada VARCHAR(50) PRIMARY KEY,
    codigo_parada VARCHAR(30),                    -- Ej: 'PA-QLP-01' o código DTPR
    nombre VARCHAR(150) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    latitud NUMERIC(10, 7) NOT NULL,
    longitud NUMERIC(10, 7) NOT NULL,
    comuna VARCHAR(50) NOT NULL DEFAULT 'Quilpué',
    es_punto_seguro BOOLEAN NOT NULL DEFAULT true, -- Para adultos mayores y radiotaxi
    tipo_parada VARCHAR(50) NOT NULL DEFAULT 'Microbús y Colectivo',
    lineas_asociadas TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla intermedia recorrido_parada si no existe
CREATE TABLE IF NOT EXISTS public.recorrido_parada (
    id_recorrido_parada VARCHAR(50) PRIMARY KEY,
    id_recorrido VARCHAR(50) REFERENCES public.recorrido_transporte(id_recorrido) ON DELETE CASCADE,
    id_parada VARCHAR(50) REFERENCES public.parada(id_parada) ON DELETE CASCADE,
    orden INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar RLS y lectura pública
ALTER TABLE public.parada ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recorrido_parada ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura publica de paradas"
    ON public.parada
    FOR SELECT
    USING (true);

CREATE POLICY "Permitir lectura publica de recorrido_parada"
    ON public.recorrido_parada
    FOR SELECT
    USING (true);

-- 4. Índices espaciales / de coordenadas para optimizar consultas de radio (Haversine / Bounding Box)
CREATE INDEX IF NOT EXISTS idx_parada_lat_lng ON public.parada(latitud, longitud);
CREATE INDEX IF NOT EXISTS idx_parada_comuna ON public.parada(comuna);
CREATE INDEX IF NOT EXISTS idx_parada_punto_seguro ON public.parada(es_punto_seguro);
CREATE INDEX IF NOT EXISTS idx_recorrido_parada_fk ON public.recorrido_parada(id_recorrido, id_parada);
