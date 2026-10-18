-- ==============================================================================
-- HU #2 - Tarea 3: Modelar en Supabase campos de tarifa base y prestaciones
-- Agrega columnas a medio_transporte y servicio_radiotaxi para permitir
-- comparativas basadas en costos y accesibilidad.
-- ==============================================================================

-- 1. Agregar columnas de tarifas y prestaciones a medio_transporte (Microbuses y otros)
ALTER TABLE public.medio_transporte 
ADD COLUMN IF NOT EXISTS tarifa_general INTEGER DEFAULT 450,
ADD COLUMN IF NOT EXISTS tarifa_adulto_mayor INTEGER DEFAULT 150,
ADD COLUMN IF NOT EXISTS tarifa_escolar INTEGER DEFAULT 150,
ADD COLUMN IF NOT EXISTS accesible_silla_ruedas BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS tipo_prestacion VARCHAR(150) DEFAULT 'Rampa de acceso y asientos preferenciales',
ADD COLUMN IF NOT EXISTS frecuencia_estimada VARCHAR(50) DEFAULT 'Cada 10-15 min';

-- 2. Agregar columnas complementarias a servicio_radiotaxi
ALTER TABLE public.servicio_radiotaxi
ADD COLUMN IF NOT EXISTS tarifa_minima INTEGER DEFAULT 2500,
ADD COLUMN IF NOT EXISTS tarifa_por_km INTEGER DEFAULT 800,
ADD COLUMN IF NOT EXISTS recargo_nocturno INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS maletero_silla_ruedas BOOLEAN DEFAULT true;

-- 3. Actualizar valores predeterminados de microbuses oficiales de Quilpué y Villa Alemana
UPDATE public.medio_transporte
SET 
    tarifa_general = 450,
    tarifa_adulto_mayor = 150,
    accesible_silla_ruedas = true,
    tipo_prestacion = 'Rampa hidráulica y piso bajo para adultos mayores',
    frecuencia_estimada = 'Cada 10-12 min'
WHERE tipo_transporte = 'Microbús';
