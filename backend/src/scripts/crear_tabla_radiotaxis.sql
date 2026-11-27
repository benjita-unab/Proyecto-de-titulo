-- ==============================================================================
-- Estructurar la tabla de radiotaxis y sus números de contacto.
-- Base de Datos: Supabase (PostgreSQL)
-- Los candidatos se mantienen inactivos hasta verificar fuente y autorización.
-- ==============================================================================

-- 1. Crear tabla de centrales de radiotaxis y números de contacto
CREATE TABLE IF NOT EXISTS public.servicio_radiotaxi (
    id_radiotaxi VARCHAR(50) PRIMARY KEY,
    id_transporte VARCHAR(50),
    nombre_central VARCHAR(150) NOT NULL,
    telefono VARCHAR(30) NOT NULL,            -- Formato E.164 para discado automático (+56332411111)
    telefono_formateado VARCHAR(50) NOT NULL, -- Formato legible para el adulto mayor "(33) 241 1111"
    direccion_base VARCHAR(255) NOT NULL,
    comuna VARCHAR(80) NOT NULL DEFAULT 'Quilpué',
    tarifa_base_estimada VARCHAR(50) NOT NULL DEFAULT 'No publicada',
    tarifa_minima INTEGER NOT NULL DEFAULT 0,
    tarifa_por_km INTEGER NOT NULL DEFAULT 0,
    recargo_nocturno INTEGER NOT NULL DEFAULT 0,
    maletero_silla_ruedas BOOLEAN NOT NULL DEFAULT false,
    horario_atencion VARCHAR(100) NOT NULL DEFAULT 'No verificada',
    autorizada BOOLEAN NOT NULL DEFAULT false,
    activo BOOLEAN NOT NULL DEFAULT false,
    verificado BOOLEAN NOT NULL DEFAULT false,
    fuente_url TEXT,
    evidencia_fuente TEXT,
    fecha_verificacion TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS y lectura pública de la tabla.
ALTER TABLE public.servicio_radiotaxi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura publica de centrales de radiotaxi"
    ON public.servicio_radiotaxi
    FOR SELECT
    USING (true);

-- 3. Índices para optimizar consultas rápidas
CREATE INDEX IF NOT EXISTS idx_radiotaxi_activo ON public.servicio_radiotaxi(activo);
CREATE INDEX IF NOT EXISTS idx_radiotaxi_autorizada ON public.servicio_radiotaxi(autorizada);
