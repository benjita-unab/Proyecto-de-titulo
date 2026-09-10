-- ==============================================================================
-- HU #22 - Tarea 3: Tabla de Horarios de Servicio de Transporte
-- Base de Datos: Supabase (PostgreSQL)
-- Descripción: Almacena los límites de horario de operación (primera y última salida)
--              para días de semana, sábados y domingos/festivos por línea/transporte.
-- ==============================================================================

-- 1. Crear tabla de horarios de servicio si no existe
CREATE TABLE IF NOT EXISTS public.horario_servicio (
    id_horario VARCHAR(50) PRIMARY KEY,
    id_transporte VARCHAR(50) REFERENCES public.medio_transporte(id_transporte) ON DELETE CASCADE,
    tipo_dia VARCHAR(20) NOT NULL CHECK (tipo_dia IN ('semana', 'sabado', 'domingo')),
    dias VARCHAR(50) NOT NULL,
    hora_inicio VARCHAR(5) NOT NULL,  -- Formato "HH:mm" (ej. "06:30")
    hora_termino VARCHAR(5) NOT NULL, -- Formato "HH:mm" (ej. "21:00")
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar Row Level Security (RLS) y permitir lectura pública (anon / authenticated)
ALTER TABLE public.horario_servicio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura publica de horarios"
    ON public.horario_servicio
    FOR SELECT
    USING (true);

-- 3. Índices para optimizar consultas por transporte y tipo de día
CREATE INDEX IF NOT EXISTS idx_horario_transporte ON public.horario_servicio(id_transporte);
CREATE INDEX IF NOT EXISTS idx_horario_tipo_dia ON public.horario_servicio(tipo_dia);

-- 4. Inserción de datos iniciales oficiales (Agdabus Limache - Olmué)
INSERT INTO public.horario_servicio (id_horario, id_transporte, tipo_dia, dias, hora_inicio, hora_termino, activo)
VALUES
    ('HOR-AGDA-SEM', 'TRANS-AGDA-01', 'semana', 'Lunes a Viernes', '06:30', '21:00', true),
    ('HOR-AGDA-SAB', 'TRANS-AGDA-01', 'sabado', 'Sábados', '07:00', '20:30', true),
    ('HOR-AGDA-DOM', 'TRANS-AGDA-01', 'domingo', 'Domingos y Festivos', '07:30', '20:00', true)
ON CONFLICT (id_horario) DO UPDATE
SET 
    dias = EXCLUDED.dias,
    hora_inicio = EXCLUDED.hora_inicio,
    hora_termino = EXCLUDED.hora_termino,
    activo = EXCLUDED.activo,
    updated_at = NOW();
