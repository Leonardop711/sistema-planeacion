-- ==============================================================================
-- SISTEMA DE PLANEACIÓN MUNICIPAL Y CARTERA DE INVERSIÓN PÚBLICA
-- Script 02: Índices para Alto Rendimiento e Integridad Referencial
-- ==============================================================================

-- ==========================================
-- 1. ÍNDICES DE SEGURIDAD Y ORGANIZACIÓN
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_direcciones_dependency 
ON seguridad.direcciones(dependency_id);

CREATE INDEX IF NOT EXISTS idx_users_role 
ON seguridad.users(role_id);

CREATE INDEX IF NOT EXISTS idx_users_dependency 
ON seguridad.users(dependency_id);

CREATE INDEX IF NOT EXISTS idx_users_direccion 
ON seguridad.users(direccion_id);

CREATE INDEX IF NOT EXISTS idx_users_email_activo 
ON seguridad.users(email) WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_user_asignaciones_user 
ON seguridad.user_asignaciones(user_id);

CREATE INDEX IF NOT EXISTS idx_user_asignaciones_dep 
ON seguridad.user_asignaciones(dependency_id);

CREATE INDEX IF NOT EXISTS idx_user_asignaciones_dir 
ON seguridad.user_asignaciones(direccion_id);

CREATE INDEX IF NOT EXISTS idx_intentos_email_fecha 
ON seguridad.intentos_fallidos(email, fecha_intento DESC);

-- ==========================================
-- 2. ÍNDICES DE AUDITORÍA
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_fecha 
ON auditoria.logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_accion 
ON auditoria.logs(accion, created_at DESC);

-- ==========================================
-- 3. ÍNDICES DE POA / PLANEACIÓN
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_strategies_dependency 
ON poa.strategies(dependency_id);

CREATE INDEX IF NOT EXISTS idx_strategies_direccion 
ON poa.strategies(direccion_id);

CREATE INDEX IF NOT EXISTS idx_planning_templates_dependency 
ON poa.planning_templates(dependency_id);

CREATE INDEX IF NOT EXISTS idx_planning_templates_direccion 
ON poa.planning_templates(direccion_id);

CREATE INDEX IF NOT EXISTS idx_planning_templates_strategy 
ON poa.planning_templates(strategy_id);

CREATE INDEX IF NOT EXISTS idx_planning_templates_ejercicio_estado 
ON poa.planning_templates(ejercicio, estado);

CREATE INDEX IF NOT EXISTS idx_planning_trimestres_plan_anio 
ON poa.planning_trimestres(planning_id, anio, trimestre);

CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_template 
ON poa.fichas_tecnicas(planning_template_id);

CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_dep 
ON poa.fichas_tecnicas(dependency_id);

-- ==========================================
-- 4. ÍNDICES DE CIP (INVERSIÓN PÚBLICA)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_cip_proyectos_dependency 
ON cip.proyectos(dependency_id);

CREATE INDEX IF NOT EXISTS idx_cip_proyectos_direccion 
ON cip.proyectos(direccion_id);

CREATE INDEX IF NOT EXISTS idx_cip_proyectos_estado_ejercicio 
ON cip.proyectos(estado, ejercicio);

CREATE INDEX IF NOT EXISTS idx_cip_desglose_proyecto 
ON cip.desglose_presupuesto(proyecto_id);

CREATE INDEX IF NOT EXISTS idx_cip_calendario_proyecto 
ON cip.calendario(proyecto_id);

CREATE INDEX IF NOT EXISTS idx_cip_calendario_desglose 
ON cip.calendario(desglose_id);

CREATE INDEX IF NOT EXISTS idx_cip_metas_proyecto 
ON cip.metas(proyecto_id);

CREATE INDEX IF NOT EXISTS idx_cip_evidencias_proyecto 
ON cip.evidencias(proyecto_id);

CREATE INDEX IF NOT EXISTS idx_cip_historial_proyecto 
ON cip.historial_estados(proyecto_id, created_at DESC);

-- ==========================================
-- 5. ÍNDICES DE NOTIFICACIONES (RESUELVE CUELLO DE BOTELLA)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_leida 
ON seguridad.notifications(user_id, leida, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_dependency 
ON seguridad.notifications(dependency_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_direccion 
ON seguridad.notifications(direccion_id, created_at DESC);
