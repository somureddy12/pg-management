# PG Management System — Spring Boot Backend

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Java 17 |
| Framework | Spring Boot 3.2 |
| Build | Maven |
| Database | MySQL 8 |
| ORM | Spring Data JPA / Hibernate |
| Security | Spring Security + JWT (jjwt 0.12) |
| Validation | Jakarta Bean Validation |
| PDF | iText 5 |
| Boilerplate | Lombok |
| Mapping | MapStruct |

## Architecture

```
controller/          ← REST endpoints (@RestController)
   ↓ DTOs
service/             ← Interfaces (contracts)
service/impl/        ← Business logic (@Service, @Transactional)
   ↓ Entities
repository/          ← Spring Data JPA (@Repository)
   ↓
entity/              ← JPA entities (@Entity)
enums/               ← BedStatus, TenantStatus, RentStatus, ...
dto/request/         ← Inbound payloads (@Valid)
dto/response/        ← Outbound shapes
exception/           ← ResourceNotFoundException, BusinessException
                        GlobalExceptionHandler (@RestControllerAdvice)
security/            ← JwtUtil, JwtAuthenticationFilter, UserPrincipal
config/              ← SecurityConfig (CORS, stateless, method security)
```

## Setup

### 1. MySQL
```sql
CREATE DATABASE pg_management;
```

### 2. Configure
Edit `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/pg_management?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
app.jwt.secret=YOUR_256_BIT_SECRET_KEY_MINIMUM_32_CHARS_LONG
```

### 3. Run
```bash
mvn clean install
mvn spring-boot:run
# Server starts on http://localhost:8080
```

Tables are auto-created by Hibernate (`ddl-auto=update`).

## API Endpoints

### Auth (public)
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/owner/register` | Register owner |
| POST | `/api/auth/owner/login` | Owner login |
| POST | `/api/auth/tenant/login` | Tenant login (phone + phone-as-password) |

### Owner (ROLE_OWNER)
| Method | Path | Description |
|---|---|---|
| GET  | `/api/owner/dashboard` | Stats, occupancy, rent summary |
| POST | `/api/owner/pg` | Create PG house |
| GET  | `/api/owner/pg` | Get PG with full floor/room/bed hierarchy |
| POST | `/api/owner/floor` | Add floor |
| POST | `/api/owner/advance-booking` | Advance bed booking |

### Rooms (ROLE_OWNER)
| Method | Path | Description |
|---|---|---|
| POST   | `/api/rooms` | Create room (auto-creates beds A/B/C/D) |
| GET    | `/api/rooms?floorId=` | List rooms on a floor |
| GET    | `/api/rooms/{id}` | Room detail with beds |
| PATCH  | `/api/rooms/{id}` | Update room |
| DELETE | `/api/rooms/{id}` | Delete room |

### Tenants
| Method | Path | Role | Description |
|---|---|---|---|
| GET  | `/api/tenants/me` | TENANT | Own profile |
| GET  | `/api/tenants?pgId=&status=` | OWNER | List tenants |
| POST | `/api/tenants` | OWNER | Add tenant |
| GET  | `/api/tenants/{id}` | OWNER | Tenant detail |
| POST | `/api/tenants/{id}/vacate` | OWNER | Mark vacated |

### Rent
| Method | Path | Role | Description |
|---|---|---|---|
| GET  | `/api/rent/month/{month}/{year}?pgId=` | OWNER | Bills for month |
| POST | `/api/rent/generate` | OWNER | Auto-generate bills |
| POST | `/api/rent/pay` | OWNER | Record payment |
| GET  | `/api/rent/tenant/{id}` | BOTH | Tenant's bill history |
| GET  | `/api/rent/defaulters/{pgId}` | OWNER | Overdue bills |
| GET  | `/api/rent/receipt/{billId}` | BOTH | PDF receipt download |

### Menu
| Method | Path | Role | Description |
|---|---|---|---|
| GET  | `/api/menu/current/{pgId}` | BOTH | Current week menu |
| GET  | `/api/menu/today/{pgId}` | BOTH | Today's meals |
| POST | `/api/menu` | OWNER | Create/replace weekly menu |

### Communications
| Method | Path | Role | Description |
|---|---|---|---|
| GET    | `/api/communications/notices/{pgId}` | BOTH | All notices |
| POST   | `/api/communications/notices` | OWNER | Post notice |
| PATCH  | `/api/communications/notices/{id}` | OWNER | Pin/edit notice |
| DELETE | `/api/communications/notices/{id}` | OWNER | Delete notice |
| GET    | `/api/communications/lost-found/{pgId}` | BOTH | Lost & found |
| POST   | `/api/communications/lost-found` | OWNER | Add found item |
| PATCH  | `/api/communications/lost-found/{id}` | OWNER | Mark claimed |
| GET    | `/api/communications/complaints/{pgId}` | BOTH | List complaints |
| POST   | `/api/communications/complaints` | TENANT | Submit complaint |
| PATCH  | `/api/communications/complaints/{id}` | OWNER | Update status |

### Reports (ROLE_OWNER)
| Method | Path | Description |
|---|---|---|
| GET | `/api/reports/monthly/{pgId}/{month}/{year}` | Income/expense report |
| GET | `/api/reports/occupancy/{pgId}` | Occupancy by floor |

### Expenses (ROLE_OWNER)
| Method | Path | Description |
|---|---|---|
| GET    | `/api/expenses/{pgId}?month=&year=` | List expenses |
| POST   | `/api/expenses` | Add expense |
| DELETE | `/api/expenses/{id}` | Delete expense |

## JWT
All protected endpoints require:
```
Authorization: Bearer <token>
```
Token carries `sub` (user ID) and `role` (OWNER or TENANT).
Tenant default password = their phone number.
