# LHC-CRS v3 — Project Map

## [TECH_STACK]

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript | 19.2.5 / 6.0.3 |
| Build | Vite | 8.0.10 |
| Backend | Express.js + TypeScript | 5.2.1 / 6.0.3 |
| Runtime | Node.js | 24.12.0 |
| ORM | Prisma | 5.22.0 |
| Database | PostgreSQL | (local) |
| Auth | JWT + bcrypt | 9.0.3 / 6.0.0 |
| Icons | Lucide React | 1.14.0 |
| Date | System date | 2026-06-13 |

## [SYSTEM_FLOW]

```
[Browser] → Vite Dev Server (:5173)
                ↓ fetch /api/*
        [Express Backend] (:5000)
                ↓ Prisma ORM
        [PostgreSQL] (lhc_crs_db)
```

### Auth Flow
```
POST /api/auth/login → JWT token → localStorage
Every request: Authorization: Bearer <token> → authMiddleware
```

### Core Domains
1. **Students** — registration, profiles, search (smartFilter)
2. **Courses / Diplomas** — CRUD, prerequisites, course-diploma mapping
3. **Sections** — scheduling, room+instructor assignment
4. **Subscriptions** — enroll student in course/diploma, auto-create installments
5. **Attendance & Grades** — per-session tracking, grade entry
6. **Finances** — receipts, payments, revenue split, installments
7. **HR** — employees, salaries, commissions, vacations
8. **Settlements** — revenue share with educational entities
9. **Admin** — users, permissions, audit log, entities, rooms, portals

## [ARCHITECTURE]

### Backend Structure (`backend/src/`)
```
src/
  index.ts              ← Express app bootstrap, route mounting
  middleware/
    auth.ts             ← JWT verification + permission check
    audit.ts            ← Audit logging middleware
  routes/
    auth.ts             ← Login/logout, user CRUD, permissions
    student.ts          ← Student CRUD + search + transfer
    course.ts           ← Course CRUD
    diploma.ts          ← Diploma CRUD
    section.ts          ← Section CRUD + student enrollment
    subscription.ts     ← Diploma/Course subscription + installment generation
    financial.ts        ← Transactions, summary, reports, receipt/payment
    installment.ts      ← Installment CRUD + payment
    attendance.ts       ← Attendance CRUD + bulk
    grades.ts           ← Grade management
    employee.ts         ← Employee CRUD
    salary.ts           ← Salary upsert
    instructor.ts       ← Instructor CRUD
    room.ts             ← Room CRUD
    educational-entity.ts ← Entity CRUD
    request-course.ts   ← Course requests
    audit.ts            ← Audit log viewer
    report-template.ts  ← Template CRUD
  utils/
    searchEngine.ts     ← Smart fuzzy filter engine
```

### Frontend Structure (`frontend/src/`)
```
src/
  App.tsx               ← Router setup
  main.tsx              ← React entry
  context/
    AuthContext.tsx      ← Auth state + API fetch wrapper
  pages/
    LoginPage.tsx
    AdminDashboardPage.tsx
    StudentsPage.tsx
    StudentFormPage.tsx
    StudentProfilePage.tsx
    CoursesPage.tsx
    DiplomasPage.tsx
    ... (~35 pages)
  components/
    ... (shared UI components)
  utils/
    ... (helpers)
```

### Database Models (30 models)
```
Core: User, Permission, UserPermission, AuditLog, LoginSession
Academics: Course, Diploma, DiplomaCourse, CoursePrerequisite, Section, Student
Enrollment: DiplomaSubscription, CourseSubscription, StudentSection
Attendance: Attendance
Grades: (embedded in StudentSection)
Finance: FinancialTransaction, Installment, Commission
HR: Employee, Salary, Vacation
Infra: EducationalEntity, Room, Instructor, RequestedCourse
Settlements: EntitySettlement, SettlementPayment
System: SystemSequence, ReportTemplate, PortalBackground
```

## [PK STRATEGY] (current → target)

| Model | Current PK | Target PK | Type |
|-------|-----------|-----------|------|
| Student | UUID | `systemId` (e.g. `2026061840004`) | String (business key) |
| Course | UUID | `code` (e.g. `C000001`) | String (business key) |
| Diploma | UUID | `code` (e.g. `D000001`) | String (business key) |
| Instructor | UUID | auto-increment | Int |
| Employee | UUID | auto-increment | Int |
| User | UUID | auto-increment | Int |
| EducationalEntity | UUID | auto-increment | Int |
| Room | UUID | auto-increment | Int |
| Section | UUID | auto-increment | Int |
| All others | UUID | auto-increment | Int |

### FK Type Changes Summary
- FKs to **Student**, **Course**, **Diploma**: remain `String` (their PKs stay String)
- FKs to **all other models**: change from `String` to `Int`

## [ORPHANS & PENDING]

- **Search Engine** (`searchEngine.ts`): has `id` in default fields; needs review after PK change
- **Attendance** `@@unique([sectionId, studentId, date])`: `sectionId` becomes Int, `studentId` stays String → composite unique still works
- **`assignedEntityIds`** on Employee: JSON string array of entity UUIDs → needs migration to Int array
- **DiplomaCourse** `@@unique([diplomaId, courseId])`: both stay String → no change
- **CoursePrerequisite** `@@unique([courseId, prerequisiteId])`: both stay String → no change
- **SystemSequence**: will be kept for generating Student systemId, Course code, Diploma code; other entities will use auto-increment

## [MILESTONES]

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Full project analysis | ✅ |
| 2 | Backend + Frontend boot | ✅ |
| 3 | PROJECT_MAP.md created | ✅ |
| 4 | Schema: UUID → meaningful/Int PKs | ⏳ |
| 5 | Routes: update ID types | ⏳ |
| 6 | Seed data update | ⏳ |
| 7 | Migration + verification | ⏳ |
