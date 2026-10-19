-- ==============================================================================
-- HU #5 - Tarea 1: Modelar tabla colectivo en Supabase (PostgreSQL)
-- Especialización de medio_transporte: línea, recorridos, tarifas, frecuencia,
-- prestaciones para adulto mayor y horarios de servicio de Quilpué.
-- ==============================================================================

-- 1. Crear tabla colectivo si no existe
CREATE TABLE IF NOT EXISTS public.colectivo (
    id_colectivo VARCHAR(50) PRIMARY KEY,
    id_transporte VARCHAR(50) REFERENCES public.medio_transporte(id_transporte) ON DELETE CASCADE,
    numero_linea VARCHAR(50) NOT NULL,
    nombre_linea VARCHAR(150) NOT NULL,
    comuna VARCHAR(100) NOT NULL DEFAULT 'Quilpué',
    origen VARCHAR(150) NOT NULL,
    destino VARCHAR(150) NOT NULL,
    trazado_ida TEXT NOT NULL,
    trazado_regreso TEXT NOT NULL,
    frecuencia_minutos INTEGER NOT NULL DEFAULT 5,
    horario_inicio VARCHAR(5) NOT NULL DEFAULT '06:00',
    horario_termino VARCHAR(5) NOT NULL DEFAULT '22:30',
    tarifa_diurna INTEGER NOT NULL DEFAULT 850,
    tarifa_nocturna INTEGER NOT NULL DEFAULT 1100,
    tarifa_adulto_mayor INTEGER NOT NULL DEFAULT 650,
    accesible_adulto_mayor BOOLEAN NOT NULL DEFAULT true,
    paraderos_principales TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS y lectura pública
ALTER TABLE public.colectivo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura publica de colectivos"
    ON public.colectivo
    FOR SELECT
    USING (true);

-- 3. Índices de optimización
CREATE INDEX IF NOT EXISTS idx_colectivo_id_transporte ON public.colectivo(id_transporte);
CREATE INDEX IF NOT EXISTS idx_colectivo_comuna ON public.colectivo(comuna);
CREATE INDEX IF NOT EXISTS idx_colectivo_numero_linea ON public.colectivo(numero_linea);
CREATE INDEX IF NOT EXISTS idx_colectivo_activo ON public.colectivo(activo);
