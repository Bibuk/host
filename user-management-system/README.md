# User Management System

Production-ready user management system with authentication, authorization, and real-time features.

## Features

- 🔐 **Authentication**: JWT-based authentication with access and refresh tokens
- 👤 **User Management**: Full CRUD operations with soft delete
- 🛡️ **RBAC**: Role-based access control with permissions
- 📧 **Email Verification**: Email verification workflow
- 🔔 **Notifications**: In-app notifications system
- 📊 **Audit Logging**: Comprehensive audit trail
- 🚀 **Real-time**: WebSocket support for live updates
- 🐳 **Docker**: Full Docker infrastructure

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.0, Pydantic v2
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis 7
- **Background Jobs**: Celery 5
- **Container**: Docker, Docker Compose

## Quick Start

### Prerequisites

- Docker Desktop
- Docker Compose

### Setup

1. **Clone the repository**
   ```bash
   cd user-management-system
   ```

2. **Copy environment file**
   ```bash
   cp .env.example .env
   ```

3. **Generate secret key**
   ```bash
   python scripts/generate_secret.py
   # Copy the generated key to .env
   ```

4. **Start all services**
   ```bash
   docker-compose up -d
   ```

5. **Run migrations**
   ```bash
   docker-compose exec api alembic upgrade head
   ```

6. **Seed database (optional)**
   ```bash
   docker-compose exec api python scripts/seed_db.py
   ```

7. **Access the API**
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs
   - Flower (Celery): http://localhost:5555

## Project Structure

```
user-management-system/
├── app/
│   ├── api/v1/endpoints/    # API endpoints
│   ├── core/                # Core modules (config, db, security)
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   └── tasks/               # Celery tasks
├── alembic/                 # Database migrations
├── docker/                  # Docker files
├── scripts/                 # Utility scripts
├── tests/                   # Test suite
├── docker-compose.yml       # Docker Compose config
└── requirements.txt         # Python dependencies
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Users
- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/{id}` - Get user
- `PATCH /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

## Development

### Running Tests
```bash
docker-compose exec api pytest
```

### Running Migrations
```bash
# Create migration
docker-compose exec api alembic revision --autogenerate -m "description"

# Apply migrations
docker-compose exec api alembic upgrade head

# Rollback
docker-compose exec api alembic downgrade -1
```

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
```

## Default Admin

After seeding:
- **Email**: admin@example.com
- **Password**: Admin123!

## Environment Variables

See `.env.example` for all configuration options.

## License

MIT
