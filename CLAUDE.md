# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agricultural surveillance platform using YOLOv8 computer vision to detect intrusions on farms and alert agents in real-time via WebSocket streams.

**Key Technologies:**
- Backend: Django 5 + Django REST Framework + Django Channels (ASGI)
- Frontend: React 18 + Vite 5 + TailwindCSS
- AI: YOLOv8n with Redis caching layer
- Infrastructure: PostgreSQL, Redis, MinIO, Celery, Docker Compose

## Essential Commands

### Development Environment
```bash
make dev                    # Start in development mode with hot-reload
make build                  # Build Docker images
make up                     # Start all services
make down                   # Stop all services
make logs                   # View logs in real-time
```

### Database Operations
```bash
make migrate                # Create and apply migrations
make superuser              # Create Django superuser
make shell                  # Open Django shell
```

### Testing
```bash
make test                   # Run test suite with pytest
make coverage               # Generate coverage report
```

### Frontend Development
```bash
cd frontend
npm run dev                 # Start Vite dev server
npm run build              # Build for production
npm run lint               # Run ESLint
```

### Backend Management (inside container)
```bash
docker-compose exec backend python manage.py <command>
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend celery -A core worker -l info
```

## Architecture Overview

### Real-time Detection Pipeline

1. **Camera Capture** (`backend/camera/capture.py`): Threaded video capture using OpenCV
2. **YOLO Detection** (`backend/ai_engine/detector.py`): Singleton YOLODetector with Redis caching
3. **WebSocket Streaming** (`backend/camera/consumer.py`): Channels consumer sending frames to frontend
4. **Danger Scoring** (`backend/ai_engine/danger_scorer.py`): Maps detected objects to threat levels

The pipeline uses `backend/camera/stream_manager.py` to manage camera threads per camera_id.

### WebSocket Architecture

- **ASGI Application**: `backend/core/asgi.py` configures ProtocolTypeRouter
- **JWT Middleware**: `backend/core/ws_jwt_middleware.py` authenticates WebSocket connections
- **Camera Consumer**: `backend/camera/consumer.py` handles bidirectional communication
- **Channel Layer**: Redis-backed Channels for pub/sub messaging

Frontend connects via `ws://localhost/ws/surveillance/<camera_id>/` with JWT token in query params.

### AI Engine Caching

`backend/ai_engine/cache.py` implements intelligent frame similarity detection:
- Generates frame hash from shape + byte sample
- 30-second TTL (configurable via `YOLO_CACHE_TTL_SECONDS`)
- Reduces CPU load by ~70% for static/similar frames
- Cache key pattern: `yolo_detection:<frame_hash>`

### User Roles & Permissions

- **Maintenancier**: Manages agents, technicians, appointments, global supervision
- **Agent Agricole**: Real-time surveillance, detections, reports, alerts

Custom permission: `users.permissions.MustChangePasswordPermission` enforces password changes.

### Settings Architecture

Settings split into three files in `backend/core/settings/`:
- `base.py`: Shared configuration
- `dev.py`: Development overrides (DEBUG=True)
- `prod.py`: Production overrides (security, logging)

Set via `DJANGO_SETTINGS_MODULE` environment variable.

### API Structure

REST endpoints organized by app:
- `/api/users/` - User management, authentication
- `/api/surveillance/` - Cameras, detections, alerts, appointments
- `/api/reports/` - PDF report generation
- `/api/notifications/` - Alert notifications

ViewSets use `backend/core/router.py` (SafeFormatSuffixRouter) to avoid format suffix conflicts.

### Frontend Architecture

- **API Client**: `frontend/src/api/client.js` - Axios instance with JWT interceptors
- **Auth Hook**: `frontend/src/hooks/useAuth.js` - Authentication state management
- **Protected Routes**: `frontend/src/components/ProtectedRoute.jsx` and `RequireRole.jsx`
- **Real-time Feed**: `frontend/src/components/CameraFeed.jsx` - WebSocket video streaming

## Important Implementation Details

### YOLO Model Loading

YOLOv8n model auto-downloads on first run to `backend/ai_engine/models/yolov8n.pt`. Relevant detection classes defined in `detector.py` (person, bird, cat, dog, horse, sheep, cow).

### WebSocket Authentication

JWT tokens passed via query parameter, then validated by `JwtAuthMiddleware`. Users can only access cameras they own unless role is 'maintenancier' or superuser.

### Camera Threading

Each camera runs in a separate daemon thread via `CameraCapture`. StreamManager maintains a singleton registry of active streams. Threads auto-stop when WebSocket disconnects.

### Database Models

Core models split across files:
- `surveillance/models.py` - Camera, Detection, Alert, InstallationAppointment
- `surveillance/models_technician.py` - Technician
- `surveillance/models_perimeter.py` - FieldPerimeter
- `surveillance/models_subscription.py` - Subscription

All use UUID primary keys.

### Celery Tasks

`backend/ai_engine/tasks.py` contains async detection processing tasks. Celery Beat used for scheduled jobs. Broker/backend is Redis DB 0.

### Environment Configuration

Copy `.env.example` to `.env` before running. Critical variables:
- `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_SETTINGS_MODULE`
- `POSTGRES_*` - Database credentials
- `REDIS_PASSWORD` - Redis authentication
- `MINIO_*` - Object storage credentials
- `YOLO_CONFIDENCE_THRESHOLD`, `YOLO_CACHE_TTL_SECONDS`

## Testing Conventions

Tests located in `backend/<app>/tests/`. Run with pytest. Use `@database_sync_to_async` decorator for async database operations in Channel consumers.
