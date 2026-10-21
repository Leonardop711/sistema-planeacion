-- ==============================================================================
-- SISTEMA DE PLANEACIÓN MUNICIPAL Y CARTERA DE INVERSIÓN PÚBLICA
-- Script 03: Datos Semilla Iniciales (Roles, Dependencias, Direcciones y Admin)
-- ==============================================================================

-- 1. Insertar Roles Fundamentales
INSERT INTO seguridad.roles (code, name, description, level, can_edit, can_approve, is_global) VALUES
('admin', 'Administrador General', 'Acceso irrestricto de lectura, edición y configuración global en todo el municipio', 100, true, true, true),
('revisor', 'Revisor / Dictaminador', 'Facultad de calificar, emitir observaciones y aprobar POA o proyectos CIP de dependencias', 80, true, true, false),
('editor', 'Operador de Captura', 'Usuario de dependencia o dirección con permisos de captura y edición de información propia', 50, true, false, false),
('viewer', 'Observador (Solo Lectura)', 'Perfil auditor o de consulta sin facultades de modificación ni captura', 10, false, false, true)
ON CONFLICT (code) DO UPDATE SET
name = EXCLUDED.name,
description = EXCLUDED.description,
level = EXCLUDED.level,
can_edit = EXCLUDED.can_edit,
can_approve = EXCLUDED.can_approve,
is_global = EXCLUDED.is_global;

-- 2. Insertar Secretaría de Planeación y sus 3 Direcciones
DO $$
DECLARE
    v_dep_planeacion_id UUID;
    v_dep_obras_id UUID;
    v_dep_contraloria_id UUID;
    v_role_admin_id UUID;
    v_role_editor_id UUID;
    v_role_revisor_id UUID;
    v_role_viewer_id UUID;
    v_dir_estrategica_id UUID;
    v_dir_inversion_id UUID;
    v_dir_seguimiento_id UUID;
BEGIN
    -- Obtener IDs de Roles
    SELECT id INTO v_role_admin_id FROM seguridad.roles WHERE code = 'admin';
    SELECT id INTO v_role_editor_id FROM seguridad.roles WHERE code = 'editor';
    SELECT id INTO v_role_revisor_id FROM seguridad.roles WHERE code = 'revisor';
    SELECT id INTO v_role_viewer_id FROM seguridad.roles WHERE code = 'viewer';

    -- Insertar Dependencia Madre: Secretaría de Planeación
    INSERT INTO seguridad.dependencies (name, abreviatura, titular, email_contacto)
    VALUES ('Secretaría de Planeación', 'SEPLAN', 'Titular de Planeación', 'planeacion@municipio.gob.mx')
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_dep_planeacion_id FROM seguridad.dependencies WHERE name = 'Secretaría de Planeación';

    -- Insertar las 3 Direcciones de la Secretaría de Planeación
    IF v_dep_planeacion_id IS NOT NULL THEN
        -- 1. Planeación Estratégica
        INSERT INTO seguridad.direcciones (dependency_id, name, abreviatura, titular, email_contacto)
        VALUES (v_dep_planeacion_id, 'Dirección de Planeación Estratégica', 'DPE', 'Director(a) de Estratégica', 'estrategica@municipio.gob.mx')
        ON CONFLICT DO NOTHING;

        -- 2. Inversión Pública
        INSERT INTO seguridad.direcciones (dependency_id, name, abreviatura, titular, email_contacto)
        VALUES (v_dep_planeacion_id, 'Dirección de Inversión Pública', 'DIP', 'Director(a) de Inversión Pública', 'inversion@municipio.gob.mx')
        ON CONFLICT DO NOTHING;

        -- 3. Seguimiento y Evaluación
        INSERT INTO seguridad.direcciones (dependency_id, name, abreviatura, titular, email_contacto)
        VALUES (v_dep_planeacion_id, 'Dirección de Seguimiento y Evaluación', 'DSE', 'Director(a) de Seguimiento', 'seguimiento@municipio.gob.mx')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Insertar Otras Dependencias Municipales Clave
    INSERT INTO seguridad.dependencies (name, abreviatura, titular, email_contacto)
    VALUES 
    ('Secretaría de Obras Públicas', 'SOP', 'Ing. Titular de Obras', 'obras@municipio.gob.mx'),
    ('Contraloría Municipal', 'CM', 'Lic. Contralor Municipal', 'contraloria@municipio.gob.mx')
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_dep_obras_id FROM seguridad.dependencies WHERE name = 'Secretaría de Obras Públicas';
    SELECT id INTO v_dep_contraloria_id FROM seguridad.dependencies WHERE name = 'Contraloría Municipal';

    -- Insertar Direcciones para Obras Públicas
    IF v_dep_obras_id IS NOT NULL THEN
        INSERT INTO seguridad.direcciones (dependency_id, name, abreviatura, titular)
        VALUES 
        (v_dep_obras_id, 'Dirección de Proyectos y Costos', 'DPC', 'Director de Costos'),
        (v_dep_obras_id, 'Dirección de Obras Viales', 'DOV', 'Director de Vialidad')
        ON CONFLICT DO NOTHING;
    END IF;

    -- 3. Insertar Usuario Administrador por Defecto
    -- Contraseña inicial: 'Admin123!' (BCrypt Hash)
    INSERT INTO seguridad.users (name, email, password_hash, role_id, dependency_id, cargo, tipo_enlace)
    VALUES (
        'Administrador del Sistema',
        'admin@planeacion.gob.mx',
        '$2b$10$YqGTl/.nlJ1QO86Qpr8lDu/d8nCq2GnBalYiHsTFZodAauGvj.w4q',
        v_role_admin_id,
        v_dep_planeacion_id,
        'Administrador General',
        'titular'
    )
    ON CONFLICT (email) DO NOTHING;

    -- 4. Insertar Usuario Viewer de Prueba (Contraloría)
    -- Contraseña inicial: 'Admin123!'
    INSERT INTO seguridad.users (name, email, password_hash, role_id, dependency_id, cargo, tipo_enlace)
    VALUES (
        'Auditor General (Viewer)',
        'auditor@municipio.gob.mx',
        '$2b$10$YqGTl/.nlJ1QO86Qpr8lDu/d8nCq2GnBalYiHsTFZodAauGvj.w4q',
        v_role_viewer_id,
        v_dep_contraloria_id,
        'Auditor de Control Interno',
        'titular'
    )
    ON CONFLICT (email) DO NOTHING;

    -- 5. Insertar Usuario Revisor de Inversión Pública (SEPLAN)
    -- Contraseña inicial: 'Admin123!'
    INSERT INTO seguridad.users (name, email, password_hash, role_id, dependency_id, direccion_id, cargo, tipo_enlace)
    VALUES (
        'Lic. Evaluador de Inversión',
        'inversion@planeacion.gob.mx',
        '$2b$10$YqGTl/.nlJ1QO86Qpr8lDu/d8nCq2GnBalYiHsTFZodAauGvj.w4q',
        v_role_revisor_id,
        v_dep_planeacion_id,
        v_dir_inversion_id,
        'Dictaminador de Proyectos CIP',
        'operativo'
    )
    ON CONFLICT (email) DO NOTHING;

    -- 6. Insertar Usuario Operador de Captura (Obras Públicas)
    -- Contraseña inicial: 'Admin123!'
    INSERT INTO seguridad.users (name, email, password_hash, role_id, dependency_id, direccion_id, cargo, tipo_enlace, permisos_menu)
    VALUES (
        'Ing. Capturista Obras Viales',
        'obras@municipio.gob.mx',
        '$2b$10$YqGTl/.nlJ1QO86Qpr8lDu/d8nCq2GnBalYiHsTFZodAauGvj.w4q',
        v_role_editor_id,
        v_dep_obras_id,
        (SELECT id FROM seguridad.direcciones WHERE name = 'Dirección de Obras Viales' LIMIT 1),
        'Enlace Operativo POA / CIP',
        'operativo',
        '["cip", "arboles", "estrategias", "lineas_accion", "notificaciones_dep"]'::jsonb
    )
    ON CONFLICT (email) DO NOTHING;

END $$;
