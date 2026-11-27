-- Las filas existentes quedan sin validar hasta que se revisen contra una fuente
-- oficial y se registren la URL, el fragmento probatorio y la fecha.
ALTER TABLE public.recorrido_transporte
  ADD COLUMN IF NOT EXISTS verificado BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fuente_url TEXT,
  ADD COLUMN IF NOT EXISTS evidencia_fuente TEXT,
  ADD COLUMN IF NOT EXISTS fecha_verificacion TIMESTAMPTZ;

ALTER TABLE public.colectivo
  ADD COLUMN IF NOT EXISTS verificado BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fuente_url TEXT,
  ADD COLUMN IF NOT EXISTS evidencia_fuente TEXT,
  ADD COLUMN IF NOT EXISTS fecha_verificacion TIMESTAMPTZ;

ALTER TABLE public.parada
  ADD COLUMN IF NOT EXISTS verificado BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fuente_url TEXT,
  ADD COLUMN IF NOT EXISTS evidencia_fuente TEXT,
  ADD COLUMN IF NOT EXISTS fecha_verificacion TIMESTAMPTZ;

ALTER TABLE public.servicio_radiotaxi
  ADD COLUMN IF NOT EXISTS comuna VARCHAR(80) NOT NULL DEFAULT 'Quilpué',
  ADD COLUMN IF NOT EXISTS tarifa_minima INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tarifa_por_km INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recargo_nocturno INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS maletero_silla_ruedas BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verificado BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fuente_url TEXT,
  ADD COLUMN IF NOT EXISTS evidencia_fuente TEXT,
  ADD COLUMN IF NOT EXISTS fecha_verificacion TIMESTAMPTZ;

ALTER TABLE public.servicio_radiotaxi
  ALTER COLUMN tarifa_base_estimada SET DEFAULT 'No publicada',
  ALTER COLUMN horario_atencion SET DEFAULT 'No verificada',
  ALTER COLUMN tarifa_minima SET DEFAULT 0,
  ALTER COLUMN tarifa_por_km SET DEFAULT 0,
  ALTER COLUMN recargo_nocturno SET DEFAULT 0,
  ALTER COLUMN maletero_silla_ruedas SET DEFAULT false,
  ALTER COLUMN autorizada SET DEFAULT false,
  ALTER COLUMN activo SET DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_recorrido_verificado
  ON public.recorrido_transporte(verificado) WHERE verificado = true;
CREATE INDEX IF NOT EXISTS idx_colectivo_verificado
  ON public.colectivo(verificado) WHERE verificado = true;
CREATE INDEX IF NOT EXISTS idx_parada_verificado
  ON public.parada(verificado) WHERE verificado = true;
CREATE INDEX IF NOT EXISTS idx_radiotaxi_verificado
  ON public.servicio_radiotaxi(verificado) WHERE verificado = true;
