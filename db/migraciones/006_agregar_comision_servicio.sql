-- Migración para agregar campos de comisión a la tabla servicios
-- Fecha: 2024-12-07
-- Descripción: Agrega tipo_comision y valor_comision a servicios para manejar comisiones a nivel de servicio

-- Agregar columna tipo_comision
ALTER TABLE servicios 
ADD COLUMN IF NOT EXISTS tipo_comision VARCHAR(20) DEFAULT 'porcentaje';

-- Agregar columna valor_comision
ALTER TABLE servicios 
ADD COLUMN IF NOT EXISTS valor_comision DECIMAL(12, 2) DEFAULT 40;

-- Agregar constraint para tipo_comision
ALTER TABLE servicios 
ADD CONSTRAINT chk_tipo_comision CHECK (tipo_comision IN ('porcentaje', 'fijo'));

-- Agregar constraint para valor_comision positivo
ALTER TABLE servicios 
ADD CONSTRAINT chk_valor_comision_positivo CHECK (valor_comision >= 0);

-- Actualizar servicios existentes con valores por defecto
UPDATE servicios 
SET tipo_comision = 'porcentaje', valor_comision = 40 
WHERE tipo_comision IS NULL OR valor_comision IS NULL;
