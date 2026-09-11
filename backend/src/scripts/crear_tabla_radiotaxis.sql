-- ==============================================================================
-- HU #53 - Tarea 2: Crear y estructurar la tabla en la base de datos relacionada
-- al servicio de radiotaxi y sus números de contacto.
-- Base de Datos: Supabase (PostgreSQL)
-- Descripción: Almacena las centrales de radiotaxis autorizadas de Limache,
--              sus números de teléfono para discado directo, dirección de base,
--              tarifa base estimada y horarios de atención.
-- ==============================================================================

-- 1. Crear tabla de centrales de radiotaxis autorizadas y números de contacto
CREATE TABLE IF NOT EXISTS public.servicio_radiotaxi (
    id_radiotaxi VARCHAR(50) PRIMARY KEY,
    nombre_central VARCHAR(150) NOT NULL,
    telefono VARCHAR(30) NOT NULL,            -- Formato E.164 para discado automático (+56332411111)
    telefono_formateado VARCHAR(50) NOT NULL, -- Formato legible para el adulto mayor "(33) 241 1111"
    direccion_base VARCHAR(255) NOT NULL,
    tarifa_base_estimada VARCHAR(50) NOT NULL DEFAULT '$2.500 - $3.000',
    horario_atencion VARCHAR(50) NOT NULL DEFAULT '24 Horas',
    autorizada BOOLEAN NOT NULL DEFAULT true,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar Row Level Security (RLS) y permitir lectura pública para clientes móviles
ALTER TABLE public.servicio_radiotaxi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura publica de centrales de radiotaxi"
    ON public.servicio_radiotaxi
    FOR SELECT
    USING (true);

-- 3. Índices para optimizar consultas rápidas
CREATE INDEX IF NOT EXISTS idx_radiotaxi_activo ON public.servicio_radiotaxi(activo);
CREATE INDEX IF NOT EXISTS idx_radiotaxi_autorizada ON public.servicio_radiotaxi(autorizada);

-- 4. Inserción de las centrales de radio taxi oficiales y autorizadas de Limache (CA-3.1 y CA-3.3)
INSERT INTO public.servicio_radiotaxi 
(id_radiotaxi, nombre_central, telefono, telefono_formateado, direccion_base, tarifa_base_estimada, horario_atencion, autorizada, activo)
VALUES
(
    'TAXI-LIM-01',
    'Radio Taxi Los Lagos Limache',
    '+56332411111',
    '(33) 241 1111',
    'Av. República #123, San Francisco, Limache',
    '$2.500 - $3.000',
    '24 Horas',
    true,
    true
),
(
    'TAXI-LIM-02',
    'Radio Taxi Estación Limache',
    '+56332412222',
    '(33) 241 2222',
    'Arturo Prat frente a Estación Limache',
    '$2.500 - $3.000',
    '24 Horas',
    true,
    true
),
(
    'TAXI-LIM-03',
    'Radio Taxi San Francisco',
    '+56332413333',
    '(33) 241 3333',
    'Palmira Romano Sur #450, Limache',
    '$2.500 - $3.200',
    '06:00 a 00:00 hrs',
    true,
    true
)
ON CONFLICT (id_radiotaxi) DO UPDATE
SET 
    nombre_central = EXCLUDED.nombre_central,
    telefono = EXCLUDED.telefono,
    telefono_formateado = EXCLUDED.telefono_formateado,
    direccion_base = EXCLUDED.direccion_base,
    tarifa_base_estimada = EXCLUDED.tarifa_base_estimada,
    horario_atencion = EXCLUDED.horario_atencion,
    autorizada = EXCLUDED.autorizada,
    activo = EXCLUDED.activo,
    updated_at = NOW();
