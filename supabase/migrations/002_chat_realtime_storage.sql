-- ============================================================
-- Progcompy: Migración para Chat Realtime + Storage RLS
-- ============================================================
-- Esta migración:
--   1. Habilita Realtime para la tabla chat_messages
--   2. Configura REPLICA IDENTITY FULL para que los eventos
--      de broadcast incluyan el registro completo
--   3. Crea la función helper is_active_member_of_room() para
--      usar en las políticas de Storage
--   4. Define las políticas RLS para el bucket chat-files
-- ============================================================

-- ============================================================
-- 1. HABILITAR REALTIME PARA chat_messages
-- ============================================================
-- Agrega la tabla a la publicación supabase_realtime para que
-- los cambios (INSERT, UPDATE, DELETE) se transmitan en tiempo
-- real a los clientes suscritos vía Supabase Realtime.
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- ============================================================
-- 2. CONFIGURAR REPLICA IDENTITY FULL
-- ============================================================
-- Por defecto PostgreSQL usa REPLICA IDENTITY DEFAULT (solo la
-- primary key). Con FULL, el WAL incluye todas las columnas de la
-- fila, lo que permite que Supabase Realtime envíe el registro
-- completo en los eventos de broadcast (necesario para mostrar
-- mensajes sin tener que re-fetchear).
ALTER TABLE chat_messages REPLICA IDENTITY FULL;

-- ============================================================
-- 3. FUNCIÓN HELPER: is_active_member_of_room(room_uuid)
-- ============================================================
-- Verifica si el usuario autenticado (auth.uid()) es miembro
-- activo de la sala especificada. Se usa en las políticas RLS
-- del bucket chat-files de Storage.
--
-- Es SECURITY DEFINER para que la función pueda consultar la
-- tabla room_members aunque el caller (Storage) no tenga acceso
-- directo a las tablas del esquema public.
CREATE OR REPLACE FUNCTION public.is_active_member_of_room(room_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.room_members
        WHERE room_id = room_uuid
          AND user_id = auth.uid()
          AND left_at IS NULL
    );
$$;

COMMENT ON FUNCTION public.is_active_member_of_room(UUID)
IS 'Verifica si el usuario autenticado es miembro activo de la sala. Usado en políticas Storage.';

-- ============================================================
-- 4. POLÍTICAS RLS PARA STORAGE: bucket chat-files
-- ============================================================
--
-- Estas políticas se ejecutan en el esquema storage y usan la
-- función helper is_active_member_of_room() definida arriba.
--
-- Estructura de paths en el bucket:
--   {room_id}/{user_id}/{timestamp}_{filename}
--
-- Ejemplo:
--   d7b8c9e0-1234-4def-abcd-5678abcdef01/
--   a1b2c3d4-5678-4efg-hijk-90abcdef1234/
--   1718500000_solucion.cpp
--
-- Extraemos el primer segmento del path (room_id) usando
-- SPLIT_PART(name, '/', 1). name es la columna de storage.objects
-- que contiene la ruta completa del archivo.

-- ----------------------------------------------------------
-- 4a. Política SELECT (descarga de archivos)
-- ----------------------------------------------------------
-- Solo miembros activos de la sala pueden descargar archivos
-- de esa sala. El room_id es el primer segmento del path.
DROP POLICY IF EXISTS "Room members can download chat files" ON storage.objects;
CREATE POLICY "Room members can download chat files"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'chat-files'
        AND public.is_active_member_of_room(
            (SPLIT_PART(name, '/', 1))::UUID
        )
    );

-- ----------------------------------------------------------
-- 4b. Política INSERT (subida de archivos)
-- ----------------------------------------------------------
-- Solo miembros activos de la sala pueden subir archivos.
-- Además, el archivo debe guardarse en una ruta que comience
-- con {room_id}/{auth.uid()}/ para que el usuario solo pueda
-- escribir en su propio subdirectorio dentro de la sala.
DROP POLICY IF EXISTS "Room members can upload chat files" ON storage.objects;
CREATE POLICY "Room members can upload chat files"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'chat-files'
        AND public.is_active_member_of_room(
            (SPLIT_PART(name, '/', 1))::UUID
        )
        -- El segundo segmento del path debe ser el user_id del uploader
        AND (SPLIT_PART(name, '/', 2))::UUID = auth.uid()
    );

-- ----------------------------------------------------------
-- 4c. Política DELETE (eliminación de archivos)
-- ----------------------------------------------------------
-- Solo el usuario que subió el archivo puede eliminarlo.
-- El user_id es el segundo segmento del path.
DROP POLICY IF EXISTS "Users can delete their own chat files" ON storage.objects;
CREATE POLICY "Users can delete their own chat files"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'chat-files'
        -- El segundo segmento del path debe coincidir con auth.uid()
        AND (SPLIT_PART(name, '/', 2))::UUID = auth.uid()
    );

-- ============================================================
-- CONFIGURACIÓN MANUAL DEL BUCKET chat-files
-- ============================================================
--
-- Las políticas SQL de Storage requieren que el bucket exista
-- previamente. Los buckets no pueden crearse vía migración SQL
-- en Supabase; deben crearse manualmente desde el Dashboard:
--
--   Supabase Dashboard > Storage > New Bucket
--
-- Configuración requerida:
--   - Nombre: chat-files
--   - Acceso público: DESMARCADO (bucket privado)
--   - Tamaño máximo de archivo: 5 MB (opcional, configurable)
--   - Tipos MIME permitidos: application/octet-stream, text/*
--     (opcional, configurable en las políticas del bucket)
--
-- Una vez creado el bucket, las políticas definidas en esta
-- migración se aplicarán automáticamente cuando se ejecute
-- la migración (o al hacer "Apply migration" desde el panel
-- SQL Editor de Supabase).
--
-- Para aplicar esta migración:
--   1. Crear el bucket chat-files desde el Dashboard
--   2. Ejecutar este archivo SQL en el SQL Editor de Supabase
--      o mediante supabase migration up
-- ============================================================
