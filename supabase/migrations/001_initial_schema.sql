-- ============================================================
-- Progcompy: Migración inicial del esquema de base de datos
-- ============================================================
-- Esta migración crea todas las tablas, funciones, triggers,
-- políticas RLS y documenta la configuración de Storage.
-- ============================================================

-- ============================================================
-- EXTENSIÓN: Habilitar uuid-ossp para generar UUIDs v4
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: profiles
-- Extiende auth.users con datos públicos del perfil.
-- Se crea automáticamente al registrarse vía trigger.
-- ============================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Perfiles públicos de usuarios, extiende auth.users';
COMMENT ON COLUMN public.profiles.username IS 'Nombre de usuario único, generado a partir del email';

-- ============================================================
-- TABLA: rooms
-- Salas de estudio/competencia. Cada sala tiene un código
-- único de 6 caracteres para que otros puedan unirse.
-- Usa soft delete (is_deleted) en lugar de borrado físico.
-- ============================================================
CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    creator_id UUID NOT NULL REFERENCES public.profiles(id),
    member_limit INTEGER,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.rooms IS 'Salas de estudio/competencia';
COMMENT ON COLUMN public.rooms.code IS 'Código único de 6 caracteres alfanuméricos para unirse';
COMMENT ON COLUMN public.rooms.member_limit IS 'Límite de miembros. NULL = sin límite';
COMMENT ON COLUMN public.rooms.is_deleted IS 'Soft delete: true indica sala eliminada';

-- ============================================================
-- TABLA: room_members
-- Relación muchos-a-muchos entre rooms y profiles.
-- Registra el rol y las fechas de entrada/salida.
-- ============================================================
CREATE TABLE public.room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('creator', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    left_at TIMESTAMPTZ,
    UNIQUE(room_id, user_id)
);

COMMENT ON TABLE public.room_members IS 'Membresía de usuarios en salas';
COMMENT ON COLUMN public.room_members.role IS 'Rol del miembro: creator (dueño) o member';
COMMENT ON COLUMN public.room_members.left_at IS 'Fecha de salida. NULL = miembro activo';

-- Índice para búsquedas rápidas de salas por usuario activo
CREATE INDEX idx_room_members_user_active
    ON public.room_members(user_id, room_id)
    WHERE left_at IS NULL;

-- ============================================================
-- TABLA: problems
-- Problemas de programación competitiva asociados a una sala.
-- La letra es auto-secuencial (A, B, C...) por sala.
-- Las notas usan formato Markdown.
-- ============================================================
CREATE TABLE public.problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    letter TEXT NOT NULL,
    title TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (
        difficulty IN (
            'muy_facil', 'facil', 'medio_facil', 'medio',
            'medio_dificil', 'dificil', 'muy_dificil'
        )
    ),
    estimated_time_minutes INTEGER,
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (
        status IN ('pendiente', 'intentado', 'resuelto')
    ),
    notes TEXT NOT NULL DEFAULT '',
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(room_id, letter)
);

COMMENT ON TABLE public.problems IS 'Problemas de programación competitiva por sala';
COMMENT ON COLUMN public.problems.letter IS 'Letra identificadora auto-secuencial dentro de la sala (A, B, C...)';
COMMENT ON COLUMN public.problems.difficulty IS 'Nivel de dificultad (7 niveles)';
COMMENT ON COLUMN public.problems.estimated_time_minutes IS 'Tiempo estimado en minutos para resolver';
COMMENT ON COLUMN public.problems.status IS 'Estado: pendiente, intentado o resuelto';
COMMENT ON COLUMN public.problems.notes IS 'Notas colaborativas en formato Markdown';

-- Índice para ordenar/agrupar problemas por sala
CREATE INDEX idx_problems_room ON public.problems(room_id, letter);

-- ============================================================
-- TABLA: chat_messages
-- Mensajes del chat en tiempo real de cada sala.
-- Soporta mensajes de texto, archivos, o ambos.
-- ============================================================
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    file_path TEXT,
    file_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.chat_messages IS 'Mensajes del chat en tiempo real';
COMMENT ON COLUMN public.chat_messages.content IS 'Contenido del mensaje. NULL si solo se envía un archivo';
COMMENT ON COLUMN public.chat_messages.file_path IS 'Ruta del archivo en Supabase Storage (bucket chat-files)';
COMMENT ON COLUMN public.chat_messages.file_name IS 'Nombre original del archivo subido';

-- Índice para obtener los últimos N mensajes de una sala eficientemente
CREATE INDEX idx_chat_messages_room_time
    ON public.chat_messages(room_id, created_at DESC);

-- ============================================================
-- FUNCIÓN: generate_room_code()
-- Genera un código alfanumérico único de 6 caracteres en
-- mayúsculas para identificar salas.
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generar 6 caracteres alfanuméricos en mayúsculas
        new_code := upper(substring(md5(random()::text), 1, 6));

        -- Verificar que no exista ya en una sala activa
        SELECT EXISTS (
            SELECT 1 FROM public.rooms WHERE code = new_code
        ) INTO code_exists;

        EXIT WHEN NOT code_exists;
    END LOOP;

    RETURN new_code;
END;
$$;

COMMENT ON FUNCTION public.generate_room_code() IS 'Genera un código único de 6 caracteres para salas';

-- ============================================================
-- FUNCIÓN + TRIGGER: handle_new_user()
-- Crea automáticamente un perfil cuando se registra un nuevo
-- usuario en auth.users. El username se genera a partir de la
-- parte local del email (lo que está antes del @).
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    base_username TEXT;
    final_username TEXT;
    counter INTEGER := 0;
BEGIN
    -- Extraer la parte local del email como base del username
    base_username := split_part(NEW.email, '@', 1);

    -- Intentar con el nombre base primero
    final_username := base_username;

    -- Si ya existe, agregar sufijo numérico hasta encontrar uno libre
    LOOP
        BEGIN
            INSERT INTO public.profiles (id, username)
            VALUES (NEW.id, final_username);
            EXIT;
        EXCEPTION
            WHEN unique_violation THEN
                counter := counter + 1;
                final_username := base_username || counter;
        END;
    END LOOP;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Crea automáticamente un perfil al registrar un nuevo usuario';

-- Trigger que se dispara al insertar en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Habilitar RLS en todas las tablas con datos de usuario
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- POLÍTICAS: profiles
-- ------------------------------------------------------------

-- Todos los usuarios autenticados pueden ver perfiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Un usuario solo puede insertar su propio perfil
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Un usuario solo puede actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ------------------------------------------------------------
-- POLÍTICAS: rooms
-- ------------------------------------------------------------

-- Solo los miembros activos de una sala pueden verla
DROP POLICY IF EXISTS "Rooms are visible to their active members" ON public.rooms;
CREATE POLICY "Rooms are visible to their active members"
    ON public.rooms
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.room_members
            WHERE room_members.room_id = rooms.id
              AND room_members.user_id = auth.uid()
              AND room_members.left_at IS NULL
        )
    );

-- Cualquier usuario autenticado puede crear salas
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.rooms;
CREATE POLICY "Authenticated users can create rooms"
    ON public.rooms
    FOR INSERT
    TO authenticated
    WITH CHECK (creator_id = auth.uid());

-- Solo el creador puede actualizar la sala
DROP POLICY IF EXISTS "Only creator can update rooms" ON public.rooms;
CREATE POLICY "Only creator can update rooms"
    ON public.rooms
    FOR UPDATE
    TO authenticated
    USING (creator_id = auth.uid())
    WITH CHECK (creator_id = auth.uid());

-- Solo el creador puede hacer soft-delete de la sala
-- (el borrado físico no está permitido vía RLS; se maneja con is_deleted)
DROP POLICY IF EXISTS "Only creator can soft-delete rooms" ON public.rooms;
CREATE POLICY "Only creator can soft-delete rooms"
    ON public.rooms
    FOR DELETE
    TO authenticated
    USING (creator_id = auth.uid());

-- NOTA: Las políticas de DELETE en rooms permiten el borrado físico,
-- pero la aplicación debe usar soft delete (UPDATE is_deleted = true).
-- Si se desea bloquear el DELETE físico completamente, eliminar esta política
-- y manejar el soft delete solo con la política de UPDATE.

-- ------------------------------------------------------------
-- POLÍTICAS: room_members
-- ------------------------------------------------------------

-- Los miembros pueden ver las membresías de las salas a las que pertenecen
DROP POLICY IF EXISTS "Members can see memberships of their rooms" ON public.room_members;
CREATE POLICY "Members can see memberships of their rooms"
    ON public.room_members
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.room_members AS my_membership
            WHERE my_membership.room_id = room_members.room_id
              AND my_membership.user_id = auth.uid()
              AND my_membership.left_at IS NULL
        )
    );

-- Usuarios autenticados pueden unirse a salas (INSERT)
-- con validaciones: sala no eliminada y límite de miembros respetado
-- La validación de límite y sala activa se hace en la aplicación;
-- esta política solo requiere autenticación.
DROP POLICY IF EXISTS "Authenticated users can join rooms" ON public.room_members;
CREATE POLICY "Authenticated users can join rooms"
    ON public.room_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- El usuario se une a sí mismo
        user_id = auth.uid()
        -- La sala no está eliminada
        AND EXISTS (
            SELECT 1 FROM public.rooms
            WHERE rooms.id = room_id
              AND rooms.is_deleted = false
        )
    );

-- Los miembros pueden actualizar su propia membresía (ej. establecer left_at al salir)
DROP POLICY IF EXISTS "Members can update their own membership" ON public.room_members;
CREATE POLICY "Members can update their own membership"
    ON public.room_members
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Los miembros pueden eliminar su propia membresía (salir de la sala)
-- No permitimos que el creador elimine a otros — eso se maneja vía soft delete de la sala
DROP POLICY IF EXISTS "Members can delete their own membership" ON public.room_members;
CREATE POLICY "Members can delete their own membership"
    ON public.room_members
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ------------------------------------------------------------
-- POLÍTICAS: problems
-- ------------------------------------------------------------

-- Helper: verificar si el usuario es miembro activo de la sala del problema
-- Se usa como subconsulta en todas las políticas de problems y chat_messages

-- Los miembros de la sala pueden ver los problemas
DROP POLICY IF EXISTS "Room members can read problems" ON public.problems;
CREATE POLICY "Room members can read problems"
    ON public.problems
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.room_members
            WHERE room_members.room_id = problems.room_id
              AND room_members.user_id = auth.uid()
              AND room_members.left_at IS NULL
        )
    );

-- Los miembros de la sala pueden crear problemas
DROP POLICY IF EXISTS "Room members can create problems" ON public.problems;
CREATE POLICY "Room members can create problems"
    ON public.problems
    FOR INSERT
    TO authenticated
    WITH CHECK (
        created_by = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM public.room_members
            WHERE room_members.room_id = problems.room_id
              AND room_members.user_id = auth.uid()
              AND room_members.left_at IS NULL
        )
    );

-- Los miembros de la sala pueden actualizar problemas
DROP POLICY IF EXISTS "Room members can update problems" ON public.problems;
CREATE POLICY "Room members can update problems"
    ON public.problems
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.room_members
            WHERE room_members.room_id = problems.room_id
              AND room_members.user_id = auth.uid()
              AND room_members.left_at IS NULL
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.room_members
            WHERE room_members.room_id = problems.room_id
              AND room_members.user_id = auth.uid()
              AND room_members.left_at IS NULL
        )
    );

-- Los miembros de la sala pueden eliminar problemas
DROP POLICY IF EXISTS "Room members can delete problems" ON public.problems;
CREATE POLICY "Room members can delete problems"
    ON public.problems
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.room_members
            WHERE room_members.room_id = problems.room_id
              AND room_members.user_id = auth.uid()
              AND room_members.left_at IS NULL
        )
    );

-- ------------------------------------------------------------
-- POLÍTICAS: chat_messages
-- ------------------------------------------------------------

-- Los miembros de la sala pueden leer los mensajes del chat
DROP POLICY IF EXISTS "Room members can read chat messages" ON public.chat_messages;
CREATE POLICY "Room members can read chat messages"
    ON public.chat_messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.room_members
            WHERE room_members.room_id = chat_messages.room_id
              AND room_members.user_id = auth.uid()
              AND room_members.left_at IS NULL
        )
    );

-- Los miembros de la sala pueden enviar mensajes
DROP POLICY IF EXISTS "Room members can insert chat messages" ON public.chat_messages;
CREATE POLICY "Room members can insert chat messages"
    ON public.chat_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM public.room_members
            WHERE room_members.room_id = chat_messages.room_id
              AND room_members.user_id = auth.uid()
              AND room_members.left_at IS NULL
        )
    );

-- ============================================================
-- FUNCIÓN: actualizar updated_at en rooms
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_rooms_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_rooms_updated_at ON public.rooms;
CREATE TRIGGER trigger_rooms_updated_at
    BEFORE UPDATE ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_rooms_updated_at();

-- ============================================================
-- FUNCIÓN: actualizar updated_at en problems
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_problems_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_problems_updated_at ON public.problems;
CREATE TRIGGER trigger_problems_updated_at
    BEFORE UPDATE ON public.problems
    FOR EACH ROW
    EXECUTE FUNCTION public.update_problems_updated_at();

-- ============================================================
-- CONFIGURACIÓN DE STORAGE (documentación)
-- ============================================================
--
-- Bucket: chat-files
-- ------------------
-- Este bucket almacena los archivos de código subidos en el chat.
-- Debe configurarse manualmente desde el Dashboard de Supabase
-- (Storage > New Bucket) o vía SQL si el entorno lo soporta.
--
-- Configuración:
--   - Nombre: chat-files
--   - Acceso: Privado (no público)
--   - Tamaño máximo de archivo: 5 MB (configurable en Dashboard)
--   - Tipos MIME permitidos: application/octet-stream, text/*
--
-- Estructura de rutas:
--   {room_id}/{user_id}/{timestamp}_{filename}
--
--   Ejemplo: abc123-def456.../xyz789-.../1718500000_solucion.cpp
--
-- Políticas RLS sugeridas para Storage (se configuran en el Dashboard
-- de Supabase, en Storage > Policies, o mediante SQL si se prefiere):
--
-- Lectura (SELECT / download):
--   Permitir a usuarios autenticados que sean miembros activos de la sala
--   correspondiente al room_id en la ruta del archivo.
--
-- Escritura (INSERT / upload):
--   Permitir a usuarios autenticados que sean miembros activos de la sala.
--   El archivo debe guardarse en una ruta que comience con {room_id}/{user_id}/
--   donde user_id coincida con auth.uid().
--
-- Las políticas de Storage se implementan típicamente con funciones helper
-- que extraen el room_id del path (usando storage.foldername()) y verifican
-- la membresía contra la tabla room_members.
--
-- ============================================================
