# Progcompy

Aplicación de apuntes colaborativos para programación competitiva. Los usuarios se organizan en **salas** (grupos de estudio/competencia), cada sala tiene un **chat en tiempo real** y un **listado de problemas** con notas compartidas.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite |
| Routing | React Router v7 |
| Estilos | Tailwind CSS v4 (`darkMode: 'class'`) |
| Íconos | Lucide React |
| Backend | Supabase (Auth, PostgreSQL, RLS, Realtime, Storage) |
| Deploy | GitHub Pages |

## Inicio rápido

```bash
npm install
cp .env.example .env   # Configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev            # http://localhost:5173
```

## Rutas

| Ruta | Descripción | Auth |
|------|-------------|------|
| `/` | AuthPage (Login / Register) | No |
| `/rooms` | RoomListPage — mis salas | Sí |
| `/rooms/:id` | RoomPage — problemas + chat | Sí + miembro |

## Estructura del proyecto

```
src/
├── main.jsx              # Entry point
├── App.jsx               # Router + providers
├── index.css             # Tailwind directives
├── lib/supabase.js       # Cliente Supabase
├── contexts/
│   ├── AuthContext.jsx    # Sesión, login, register, logout
│   └── ThemeContext.jsx   # Modo claro/oscuro
├── hooks/
│   ├── useRooms.js        # CRUD salas, unirse
│   ├── useProblems.js     # CRUD problemas, filtros
│   └── useChat.js         # Realtime chat, upload archivos
├── pages/
│   ├── AuthPage.jsx
│   ├── RoomListPage.jsx
│   └── RoomPage.jsx
└── components/
    ├── ui/                # Button, Modal, Input, Select, Badge
    ├── auth/              # LoginForm, RegisterForm
    ├── layout/            # TopNavbar (ThemeToggle, UserMenu), ProtectedRoute
    ├── rooms/             # RoomCard, CreateRoomModal, JoinRoomModal
    ├── problems/          # ProblemTable, ProblemRow, ProblemForm, FilterBar
    └── chat/              # ChatSidebar, MessageList, MessageInput, MessageBubble
```

## Base de datos (Supabase)

### Tablas

- `profiles` — extiende `auth.users`. Campos: `id`, `username`, `created_at`
- `rooms` — salas. Campos: `id`, `code` (6 chars único), `name`, `creator_id`, `member_limit`, `is_deleted`, `created_at`, `updated_at`
- `room_members` — membresía. Campos: `id`, `room_id`, `user_id`, `role` ('creator'|'member'), `joined_at`, `left_at`
- `problems` — problemas. Campos: `id`, `room_id`, `letter` (A,B,C...), `title`, `difficulty` (7 niveles), `estimated_time_minutes`, `status` (pendiente|intentado|resuelto), `notes` (markdown), `created_by`, timestamps
- `chat_messages` — mensajes. Campos: `id`, `room_id`, `user_id`, `content`, `file_path`, `file_name`, `created_at`

### Storage

- Bucket `chat-files` — archivos de código subidos en el chat

### Dificultades (7 niveles)

`muy_facil`, `facil`, `medio_facil`, `medio`, `medio_dificil`, `dificil`, `muy_dificil`

### Estados de problema

`pendiente`, `intentado`, `resuelto`

## Decisiones de diseño

- **Solo email/contraseña** para auth (sin OAuth, sin verificación de email)
- **Salas con código** único de 6 caracteres. Sin lista pública. Usuario puede estar en múltiples salas.
- **Roles**: solo `creator` (dueño) y `member`. Todos los miembros tienen los mismos permisos.
- **Soft delete** en salas (solo el creador puede eliminar).
- **Límite de miembros** configurable por sala.
- **Chat en tiempo real** vía Supabase Realtime. Solo últimos N mensajes.
- **Problemas**: cualquier miembro CRUD. Letra auto-secuencial. Nota compartida en markdown.
- **Tiempo estimado** en minutos, asignado por el creador del problema.
- **Filtros** por dificultad y estado. Ordenamiento por columnas.
- **Lista de salas**: solo donde el usuario es/era miembro. Muestra nombre + rol + última actividad.
- **Modo oscuro**: toggle en navbar, persistido en localStorage, respeta `prefers-color-scheme`.
