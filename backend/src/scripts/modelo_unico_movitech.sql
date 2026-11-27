-- ==============================================================================
-- MOVITECH - MODELO ÚNICO UNIFICADO DE BASE DE DATOS (SUPABASE / POSTGRESQL)
-- ==============================================================================
-- Propósito: Consolidar en un único esquema relacional todas las entidades del
-- sistema de movilidad para adultos mayores (Quilpué, Villa Alemana y Limache).
-- Reemplaza la dispersión previa de scripts sueltos manteniendo compatibilidad
-- total con los servicios NestJS y la réplica local de contingencia SQLite.
-- ==============================================================================

-- Extensión opcional para consultas geoespaciales avanzadas si está habilitada
-- CREATE EXTENSION IF NOT EXISTS cube;
-- CREATE EXTENSION IF NOT EXISTS earthdistance;

-- ------------------------------------------------------------------------------
-- 1. ENTIDAD MAESTRA: medio_transporte
-- Catálogo unificado de líneas y servicios (Microbús, Colectivo, Radio Taxi)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medio_transporte (
    id_transporte VARCHAR(50) PRIMARY KEY,
    nombre_linea VARCHAR(100) NOT NULL,
    tipo_transporte VARCHAR(30) NOT NULL CHECK (tipo_transporte IN ('Microbús', 'Colectivo', 'Radio Taxi')),
    empresa_operadora VARCHAR(150) NOT NULL DEFAULT 'TMV / Marga Marga',
    tarifa_general INTEGER NOT NULL DEFAULT 450 CHECK (tarifa_general >= 0),
    tarifa_adulto_mayor INTEGER NOT NULL DEFAULT 150 CHECK (tarifa_adulto_mayor >= 0),
    tarifa_escolar INTEGER NOT NULL DEFAULT 150 CHECK (tarifa_escolar >= 0),
    accesible_silla_ruedas BOOLEAN NOT NULL DEFAULT true,
    tipo_prestacion VARCHAR(150) NOT NULL DEFAULT 'Rampa de acceso y asientos preferenciales',
    frecuencia_estimada VARCHAR(50) NOT NULL DEFAULT 'Cada 10-15 min',
    pasa_hospital_quilpue BOOLEAN NOT NULL DEFAULT false,
    activo BOOLEAN NOT NULL DEFAULT true,
    verificado BOOLEAN NOT NULL DEFAULT false,
    fuente_url TEXT,
    evidencia_fuente TEXT,
    fecha_verificacion TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medio_tipo ON public.medio_transporte(tipo_transporte);
CREATE INDEX IF NOT EXISTS idx_medio_hospital ON public.medio_transporte(pasa_hospital_quilpue) WHERE pasa_hospital_quilpue = true;
CREATE INDEX IF NOT EXISTS idx_medio_activo ON public.medio_transporte(activo);

-- ------------------------------------------------------------------------------
-- 2. ENTIDAD: recorrido_transporte
-- Trazados de calles, sentido y destinos cubiertos por cada medio_transporte
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recorrido_transporte (
    id_recorrido VARCHAR(50) PRIMARY KEY,
    id_transporte VARCHAR(50) NOT NULL REFERENCES public.medio_transporte(id_transporte) ON DELETE CASCADE,
    nombre_recorrido VARCHAR(150) NOT NULL,
    sentido VARCHAR(40) NOT NULL DEFAULT 'Ida y Retorno',
    calles_principales TEXT NOT NULL,
    frecuencia VARCHAR(50) NOT NULL DEFAULT 'Regular',
    pasa_hospital_quilpue BOOLEAN NOT NULL DEFAULT false,
    activo BOOLEAN NOT NULL DEFAULT true,
    verificado BOOLEAN NOT NULL DEFAULT false,
    fuente_url TEXT,
    evidencia_fuente TEXT,
    fecha_verificacion TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recorrido_transporte_fk ON public.recorrido_transporte(id_transporte);
CREATE INDEX IF NOT EXISTS idx_recorrido_hospital ON public.recorrido_transporte(pasa_hospital_quilpue);

-- ------------------------------------------------------------------------------
-- 3. ENTIDAD: colectivo
-- Especialización operativa para líneas de taxis colectivos de Quilpué
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.colectivo (
    id_colectivo VARCHAR(50) PRIMARY KEY,
    id_transporte VARCHAR(50) NOT NULL REFERENCES public.medio_transporte(id_transporte) ON DELETE CASCADE,
    numero_linea VARCHAR(50) NOT NULL,
    nombre_linea VARCHAR(150) NOT NULL,
    comuna VARCHAR(100) NOT NULL DEFAULT 'Quilpué',
    origen VARCHAR(150) NOT NULL,
    destino VARCHAR(150) NOT NULL,
    trazado_ida TEXT NOT NULL,
    trazado_regreso TEXT NOT NULL,
    frecuencia_minutos INTEGER NOT NULL DEFAULT 5 CHECK (frecuencia_minutos > 0),
    horario_inicio VARCHAR(5) NOT NULL DEFAULT '06:00',
    horario_termino VARCHAR(5) NOT NULL DEFAULT '22:30',
    tarifa_diurna INTEGER NOT NULL DEFAULT 850 CHECK (tarifa_diurna >= 0),
    tarifa_nocturna INTEGER NOT NULL DEFAULT 1100 CHECK (tarifa_nocturna >= 0),
    tarifa_adulto_mayor INTEGER NOT NULL DEFAULT 600 CHECK (tarifa_adulto_mayor >= 0),
    accesible_adulto_mayor BOOLEAN NOT NULL DEFAULT true,
    paraderos_principales TEXT,
    pasa_hospital_quilpue BOOLEAN NOT NULL DEFAULT false,
    activo BOOLEAN NOT NULL DEFAULT true,
    verificado BOOLEAN NOT NULL DEFAULT false,
    fuente_url TEXT,
    evidencia_fuente TEXT,
    fecha_verificacion TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_colectivo_id_transporte ON public.colectivo(id_transporte);
CREATE INDEX IF NOT EXISTS idx_colectivo_comuna ON public.colectivo(comuna);
CREATE INDEX IF NOT EXISTS idx_colectivo_numero_linea ON public.colectivo(numero_linea);
CREATE INDEX IF NOT EXISTS idx_colectivo_activo ON public.colectivo(activo);

-- ------------------------------------------------------------------------------
-- 4. ENTIDAD: horario_servicio
-- Franjas de operación (primera y última salida) por tipo de día
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.horario_servicio (
    id_horario VARCHAR(50) PRIMARY KEY,
    id_transporte VARCHAR(50) NOT NULL REFERENCES public.medio_transporte(id_transporte) ON DELETE CASCADE,
    tipo_dia VARCHAR(20) NOT NULL CHECK (tipo_dia IN ('semana', 'sabado', 'domingo')),
    dias VARCHAR(50) NOT NULL,
    hora_inicio VARCHAR(5) NOT NULL,
    hora_termino VARCHAR(5) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_horario_transporte ON public.horario_servicio(id_transporte);
CREATE INDEX IF NOT EXISTS idx_horario_tipo_dia ON public.horario_servicio(tipo_dia);

-- ------------------------------------------------------------------------------
-- 5. ENTIDAD: parada
-- Paraderos georreferenciados (microbuses, colectivos y puntos seguros taxi)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parada (
    id_parada VARCHAR(50) PRIMARY KEY,
    codigo_parada VARCHAR(30),
    nombre VARCHAR(150) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    latitud NUMERIC(10, 7) NOT NULL CHECK (latitud BETWEEN -56.0 AND -17.0),
    longitud NUMERIC(10, 7) NOT NULL CHECK (longitud BETWEEN -76.0 AND -66.0),
    comuna VARCHAR(50) NOT NULL DEFAULT 'Quilpué',
    es_punto_seguro BOOLEAN NOT NULL DEFAULT true,
    tipo_parada VARCHAR(60) NOT NULL DEFAULT 'Microbús y Colectivo',
    lineas_asociadas TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    verificado BOOLEAN NOT NULL DEFAULT false,
    fuente_url TEXT,
    evidencia_fuente TEXT,
    fecha_verificacion TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parada_lat_lng ON public.parada(latitud, longitud);
CREATE INDEX IF NOT EXISTS idx_parada_comuna ON public.parada(comuna);
CREATE INDEX IF NOT EXISTS idx_parada_punto_seguro ON public.parada(es_punto_seguro);
CREATE INDEX IF NOT EXISTS idx_parada_activa ON public.parada(activo) WHERE activo = true;

-- ------------------------------------------------------------------------------
-- 6. ENTIDAD INTERMEDIA: recorrido_parada (Relación N:M Recorrido <-> Paradero)
-- Determina qué líneas pasan exactamente por cada paradero y en qué orden
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recorrido_parada (
    id_recorrido_parada VARCHAR(50) PRIMARY KEY,
    id_recorrido VARCHAR(50) NOT NULL REFERENCES public.recorrido_transporte(id_recorrido) ON DELETE CASCADE,
    id_parada VARCHAR(50) NOT NULL REFERENCES public.parada(id_parada) ON DELETE CASCADE,
    orden INTEGER NOT NULL DEFAULT 1 CHECK (orden > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (id_recorrido, id_parada, orden)
);

CREATE INDEX IF NOT EXISTS idx_recorrido_parada_fk ON public.recorrido_parada(id_recorrido, id_parada);
CREATE INDEX IF NOT EXISTS idx_recorrido_parada_parada ON public.recorrido_parada(id_parada);

-- ------------------------------------------------------------------------------
-- 7. ENTIDAD: servicio_radiotaxi
-- Centrales de radio taxi autorizadas (vinculadas opcionalmente a medio_transporte)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.servicio_radiotaxi (
    id_radiotaxi VARCHAR(50) PRIMARY KEY,
    id_transporte VARCHAR(50) REFERENCES public.medio_transporte(id_transporte) ON DELETE SET NULL,
    nombre_central VARCHAR(150) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    telefono_formateado VARCHAR(50) NOT NULL,
    direccion_base VARCHAR(255) NOT NULL,
    comuna VARCHAR(80) NOT NULL DEFAULT 'Quilpué',
    tarifa_base_estimada VARCHAR(50) NOT NULL DEFAULT 'No publicada',
    tarifa_minima INTEGER NOT NULL DEFAULT 0 CHECK (tarifa_minima >= 0),
    tarifa_por_km INTEGER NOT NULL DEFAULT 0 CHECK (tarifa_por_km >= 0),
    recargo_nocturno INTEGER NOT NULL DEFAULT 0 CHECK (recargo_nocturno >= 0),
    maletero_silla_ruedas BOOLEAN NOT NULL DEFAULT false,
    horario_atencion VARCHAR(50) NOT NULL DEFAULT 'No verificada',
    autorizada BOOLEAN NOT NULL DEFAULT false,
    activo BOOLEAN NOT NULL DEFAULT false,
    verificado BOOLEAN NOT NULL DEFAULT false,
    fuente_url TEXT,
    evidencia_fuente TEXT,
    fecha_verificacion TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radiotaxi_activo ON public.servicio_radiotaxi(activo);
CREATE INDEX IF NOT EXISTS idx_radiotaxi_autorizada ON public.servicio_radiotaxi(autorizada);

-- ------------------------------------------------------------------------------
-- 8. ENTIDAD DE AUDITORÍA Y ACTUALIZACIÓN: registro_actualizacion_datos
-- Trazabilidad de extracciones (Puppeteer/Cheerio/Gemini/Cron) y hash anti-duplicado
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.registro_actualizacion_datos (
    id_actualizacion VARCHAR(50) PRIMARY KEY,
    fuente_url VARCHAR(255) NOT NULL,
    metodo_extraccion VARCHAR(40) NOT NULL CHECK (metodo_extraccion IN ('puppeteer_gemini', 'cheerio_http', 'seed_manual', 'sync_sqlite')),
    hash_contenido VARCHAR(64) NOT NULL,
    registros_afectados INTEGER NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('exitoso', 'sin_cambios', 'error_contingencia')),
    detalle TEXT,
    ejecutado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. POLÍTICAS DE SEGURIDAD ROW LEVEL SECURITY (RLS) - LECTURA PÚBLICA CONTROLADA
-- ------------------------------------------------------------------------------
ALTER TABLE public.medio_transporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recorrido_transporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colectivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horario_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parada ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recorrido_parada ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicio_radiotaxi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registro_actualizacion_datos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lectura publica medio_transporte') THEN
        CREATE POLICY "Lectura publica medio_transporte" ON public.medio_transporte FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lectura publica recorrido_transporte') THEN
        CREATE POLICY "Lectura publica recorrido_transporte" ON public.recorrido_transporte FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lectura publica colectivo') THEN
        CREATE POLICY "Lectura publica colectivo" ON public.colectivo FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lectura publica horario_servicio') THEN
        CREATE POLICY "Lectura publica horario_servicio" ON public.horario_servicio FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lectura publica parada') THEN
        CREATE POLICY "Lectura publica parada" ON public.parada FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lectura publica recorrido_parada') THEN
        CREATE POLICY "Lectura publica recorrido_parada" ON public.recorrido_parada FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lectura publica servicio_radiotaxi') THEN
        CREATE POLICY "Lectura publica servicio_radiotaxi" ON public.servicio_radiotaxi FOR SELECT USING (true);
    END IF;
END $$;
