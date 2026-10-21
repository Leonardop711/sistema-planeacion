-- ==============================================================================
-- SISTEMA DE PLANEACIÓN MUNICIPAL Y CARTERA DE INVERSIÓN PÚBLICA
-- Script 01: Definición de Esquema y Tablas (DDL) con UUID y Jerarquía de Direcciones
-- ==============================================================================

-- Habilitar extensión para UUIDs criptográficos
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Esquemas lógicos para máxima organización y modularidad
CREATE SCHEMA IF NOT EXISTS seguridad;
CREATE SCHEMA IF NOT EXISTS poa;
CREATE SCHEMA IF NOT EXISTS cip;
CREATE SCHEMA IF NOT EXISTS auditoria;

-- ==============================================================================
-- 1. ESQUEMA: SEGURIDAD Y ESTRUCTURA ORGANIZACIONAL
-- ==============================================================================

-- Catálogo de Roles del Sistema
CREATE TABLE IF NOT EXISTS seguridad.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,      -- 'admin', 'viewer', 'editor', 'revisor'
    name VARCHAR(100) NOT NULL,            -- 'Administrador General', 'Observador (Solo Lectura)'
    description TEXT,
    level INTEGER DEFAULT 10,              -- 100=Admin, 80=Revisor, 50=Editor, 10=Viewer
    can_edit BOOLEAN DEFAULT false,        -- false para 'viewer', true para 'admin' y 'editor'
    can_approve BOOLEAN DEFAULT false,     -- true para 'admin' y 'revisor'
    is_global BOOLEAN DEFAULT false,       -- true para 'admin' y 'viewer' (visibilidad municipal)
    created_at TIMESTAMP DEFAULT now()
);

-- Dependencias Madre / Secretarías (Nivel 1 Organizacional)
CREATE TABLE IF NOT EXISTS seguridad.dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,            -- Ej: 'Secretaría de Planeación'
    abreviatura VARCHAR(30),                -- Ej: 'SEPLAN'
    titular VARCHAR(150),                   -- Secretario o Titular de la Dependencia
    email_contacto VARCHAR(150),
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now()
);

-- Direcciones de Área (Nivel 2 Organizacional - NUEVA ENTIDAD)
CREATE TABLE IF NOT EXISTS seguridad.direcciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dependency_id UUID NOT NULL REFERENCES seguridad.dependencies(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,            -- Ej: 'Dirección de Inversión Pública'
    abreviatura VARCHAR(30),                -- Ej: 'DIP'
    titular VARCHAR(150),                   -- Director de Área
    email_contacto VARCHAR(150),
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now()
);

-- Usuarios del Sistema
CREATE TABLE IF NOT EXISTS seguridad.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,            -- Nombre completo del funcionario
    email VARCHAR(150) UNIQUE NOT NULL,    -- Usuario de acceso / Correo
    password_hash TEXT NOT NULL,           -- Hash seguro con BCrypt
    role_id UUID NOT NULL REFERENCES seguridad.roles(id),
    
    -- Ubicación organizacional
    dependency_id UUID REFERENCES seguridad.dependencies(id) ON DELETE SET NULL,
    direccion_id UUID REFERENCES seguridad.direcciones(id) ON DELETE SET NULL,
    
    cargo VARCHAR(150),                    -- Ej: 'Director', 'Enlace Operativo'
    tipo_enlace VARCHAR(50) DEFAULT 'operativo', -- 'titular', 'enlace_general', 'operativo'
    permisos_menu JSONB DEFAULT '[]'::jsonb,     -- Permisos dinámicos de UI
    
    -- Seguridad de sesión activa
    session_token VARCHAR(255),            -- Token único de sesión para evitar suplantación
    acceso_restringido BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now()
);

-- Asignaciones Transversales (Para revisores/supervisores multi-dependencia)
CREATE TABLE IF NOT EXISTS seguridad.user_asignaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES seguridad.users(id) ON DELETE CASCADE,
    dependency_id UUID NOT NULL REFERENCES seguridad.dependencies(id) ON DELETE CASCADE,
    direccion_id UUID REFERENCES seguridad.direcciones(id) ON DELETE CASCADE,
    tipo_permiso VARCHAR(30) DEFAULT 'revisor', -- 'viewer', 'editor', 'revisor'
    asignado_por UUID REFERENCES seguridad.users(id),
    created_at TIMESTAMP DEFAULT now(),
    CONSTRAINT uq_user_dep_dir UNIQUE (user_id, dependency_id, direccion_id)
);

-- Control de Intentos Fallidos (Protección de Fuerza Bruta)
CREATE TABLE IF NOT EXISTS seguridad.intentos_fallidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(150) NOT NULL,
    fecha_intento TIMESTAMP DEFAULT now(),
    exitoso BOOLEAN DEFAULT false,
    ip VARCHAR(45)
);

-- ==============================================================================
-- 2. ESQUEMA: AUDITORÍA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS auditoria.logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT now(),
    accion VARCHAR(100) NOT NULL,          -- 'LOGIN', 'CREATE_LINEA', 'APPROVE_CIP', etc.
    user_id UUID REFERENCES seguridad.users(id) ON DELETE SET NULL,
    email VARCHAR(150),
    rol VARCHAR(50),
    detalles TEXT,
    ip VARCHAR(45),
    user_agent TEXT,
    exitoso BOOLEAN DEFAULT true
);

-- ==============================================================================
-- 3. ESQUEMA: POA (PROGRAMA OPERATIVO ANUAL / PLANEACIÓN)
-- ==============================================================================

-- Estrategias Institucionales
CREATE TABLE IF NOT EXISTS poa.strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dependency_id UUID NOT NULL REFERENCES seguridad.dependencies(id) ON DELETE CASCADE,
    direccion_id UUID REFERENCES seguridad.direcciones(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    pmd_eje VARCHAR(100),
    pmd_tema VARCHAR(100),
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now()
);

-- Líneas de Acción (Componentes del POA)
CREATE TABLE IF NOT EXISTS poa.planning_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL REFERENCES poa.strategies(id) ON DELETE CASCADE,
    dependency_id UUID NOT NULL REFERENCES seguridad.dependencies(id) ON DELETE CASCADE,
    direccion_id UUID REFERENCES seguridad.direcciones(id) ON DELETE SET NULL, -- Dirección responsable directa
    
    nomenclatura VARCHAR(50),
    lineas_accion TEXT NOT NULL,
    unidad_medida VARCHAR(100),
    ponderacion NUMERIC(5,2) DEFAULT 0.00,  -- Peso % de la línea en la dependencia
    linea_base NUMERIC(15,2) DEFAULT 0.00,
    meta_anual NUMERIC(15,2) DEFAULT 0.00,
    ejercicio INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    responsable VARCHAR(150),
    activa BOOLEAN DEFAULT true,
    estado VARCHAR(50) DEFAULT 'borrador', -- 'borrador', 'enviado', 'aprobado', 'observado'
    created_at TIMESTAMP DEFAULT now()
);

-- Metas y Avances Trimestrales (Q1, Q2, Q3, Q4)
CREATE TABLE IF NOT EXISTS poa.planning_trimestres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planning_id UUID NOT NULL REFERENCES poa.planning_templates(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL,
    trimestre INTEGER NOT NULL CHECK (trimestre BETWEEN 1 AND 4),
    tipo VARCHAR(50) NOT NULL,             -- 'programado', 'alcanzado', 'monto'
    valor NUMERIC(15,2) DEFAULT 0.00,
    observaciones TEXT,
    fecha_envio TIMESTAMP,
    updated_at TIMESTAMP DEFAULT now(),
    CONSTRAINT uq_plan_anio_trim_tipo UNIQUE (planning_id, anio, trimestre, tipo)
);

-- Fichas Técnicas de Indicadores
CREATE TABLE IF NOT EXISTS poa.fichas_tecnicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planning_template_id UUID NOT NULL REFERENCES poa.planning_templates(id) ON DELETE CASCADE,
    dependency_id UUID NOT NULL REFERENCES seguridad.dependencies(id) ON DELETE CASCADE,
    direccion_id UUID REFERENCES seguridad.direcciones(id) ON DELETE SET NULL,
    nombre_indicador VARCHAR(200) NOT NULL,
    definicion TEXT,
    metodo_calculo TEXT,
    frecuencia_medicion VARCHAR(50),
    created_at TIMESTAMP DEFAULT now()
);

-- ==============================================================================
-- 4. ESQUEMA: CIP (CARTERA DE INVERSIÓN PÚBLICA)
-- ==============================================================================

-- Proyectos de Inversión Pública
CREATE TABLE IF NOT EXISTS cip.proyectos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dependency_id UUID NOT NULL REFERENCES seguridad.dependencies(id) ON DELETE CASCADE,
    direccion_id UUID REFERENCES seguridad.direcciones(id) ON DELETE SET NULL, -- Dirección que formula/ejecuta
    strategy_id UUID REFERENCES poa.strategies(id) ON DELETE SET NULL,
    
    folio VARCHAR(50) UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo_obra VARCHAR(100),
    ejercicio INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    
    monto_total NUMERIC(18,2) DEFAULT 0.00,
    estado VARCHAR(50) DEFAULT 'borrador', -- 'borrador', 'enviado', 'aprobado', 'rechazado'
    pdf_habilitado BOOLEAN DEFAULT false,
    
    creado_por UUID REFERENCES seguridad.users(id),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Desglose Presupuestal por Partida y Fuente
CREATE TABLE IF NOT EXISTS cip.desglose_presupuesto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID NOT NULL REFERENCES cip.proyectos(id) ON DELETE CASCADE,
    partida_codigo VARCHAR(20) NOT NULL,   -- Ej: '621101'
    fuente_financiamiento VARCHAR(150),    -- Ej: 'Ramo 33'
    monto_asignado NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT now()
);

-- Calendario Mensual de Ministración
CREATE TABLE IF NOT EXISTS cip.calendario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID NOT NULL REFERENCES cip.proyectos(id) ON DELETE CASCADE,
    desglose_id UUID NOT NULL REFERENCES cip.desglose_presupuesto(id) ON DELETE CASCADE,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    monto_programado NUMERIC(18,2) DEFAULT 0.00,
    monto_ejercido NUMERIC(18,2) DEFAULT 0.00,
    CONSTRAINT uq_cip_cal_desglose_mes UNIQUE (desglose_id, mes)
);

-- Metas Físicas del Proyecto
CREATE TABLE IF NOT EXISTS cip.metas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID NOT NULL REFERENCES cip.proyectos(id) ON DELETE CASCADE,
    concepto VARCHAR(200) NOT NULL,
    unidad_medida VARCHAR(100),
    meta_programada NUMERIC(15,2) DEFAULT 0.00,
    meta_alcanzada NUMERIC(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT now()
);

-- Evidencias y Documentos Probatorios
CREATE TABLE IF NOT EXISTS cip.evidencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID NOT NULL REFERENCES cip.proyectos(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,             -- 'foto', 'oficio', 'factura', 'tecnico'
    nombre_archivo VARCHAR(255) NOT NULL,
    url_archivo TEXT NOT NULL,
    subido_por UUID REFERENCES seguridad.users(id),
    created_at TIMESTAMP DEFAULT now()
);

-- Trazabilidad / Historial de Estados
CREATE TABLE IF NOT EXISTS cip.historial_estados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID NOT NULL REFERENCES cip.proyectos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.users(id),
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    comentarios TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- ==============================================================================
-- 5. ESQUEMA: NOTIFICACIONES (OPTIMIZADO Y SIN FUGAS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS seguridad.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES seguridad.users(id) ON DELETE CASCADE,
    dependency_id UUID REFERENCES seguridad.dependencies(id) ON DELETE CASCADE,
    direccion_id UUID REFERENCES seguridad.direcciones(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,             -- 'alerta', 'revision', 'envio_formal'
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    link VARCHAR(255),
    leida BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now()
);
