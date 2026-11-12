# CampusCore — Student Management System (SMS)
### Enterprise-Grade Full-Stack College Management Platform

CampusCore is a responsive, production-ready **Student Management System (SMS)** engineered with **React 19, Vite, Tailwind CSS, Node.js, Express.js, and MySQL (Sequelize ORM)**. It delivers separate portals for **Administrators** and **Students**, fortified with role-based access control (RBAC), Insecure Direct Object Reference (IDOR) protection, input validation, audit logging, and transactional database integrity.

---

## 🚀 Key Modules & Capabilities

### 👑 Administrator Portal
1. **Executive Dashboard:** Live metrics calculated directly from MySQL:
   - Total & active students, departments, courses, subjects.
   - Real-time overall college attendance average with shortage alerts.
   - Financial summaries: Assessed tuition, collected revenue, pending balances, and overdue count.
   - Interactive **Recharts** visualizations: Enrollment by Department, Academic Grade Distribution, and Fee Collection vs Outstanding.
   - Upcoming exams widget, recently enrolled students, and low attendance watchlist (<75%).
2. **Student Registry (CRUD + CSV):**
   - Paginated, searchable, and filterable table (by status, department, course, academic year).
   - Add new student with automatic unique ID generation (`CS2026001`), credentials seeding, and bcrypt hashing.
   - Complete 360° student profile with tabs for Bio, Attendance History, Examination Marks, and Fee Ledger.
   - Edit student information, deactivate/activate student status, and reset login credentials securely.
   - One-click CSV export of student directory.
3. **Curriculum & Academic Catalog:**
   - Departments, degree courses, semesters, and subjects with credit values and assigned faculty.
4. **Attendance Management:**
   - Subject-wise session logger with duplicate session prevention.
   - One-click "Mark All Present" with instant status adjustments (Present, Late, Absent, Excused).
   - Mandatory 75% attendance compliance report with shortage filtering and CSV export.
5. **Examinations & Marks:**
   - Schedule examinations (Internal Tests, Practicals, Midterms, Final Semester Exams).
   - Batch marks entry grid with real-time automatic grading (`A+`, `A`, `B+`, `B`, `C`, `D`, `FAIL`) and max marks bounds validation.
   - Result reports with CSV export.
6. **Finance & Accounts:**
   - Define course & semester fee structures with tuition, lab, library, and examination fees.
   - Create student fee assessments with scholarship/concession adjustments.
   - Record manual cash/bank/online fee payments with unique receipt number generation (`REC-2026-XXXXX`).
   - Printable institutional fee payment receipt modal with official seal layout.
7. **Class Timetables:**
   - Weekly interactive timetable grid (Monday - Saturday).
   - Automated conflict detection preventing double-booking of classrooms or concurrent class sections.
8. **Campus Notices & Announcements:**
   - Publish circulars with priority levels (Urgent, High, Normal) targeted by college, department, or degree program.
9. **Security Audit Trail:**
   - Immutable log capturing user, timestamp, IP address, target entity, and JSON state transitions (before/after diff).

---

### 🎓 Student Portal
1. **Personalized Dashboard:**
   - Welcome banner with student name, avatar, roll number, and degree program.
   - Real-time attendance gauge with attendance shortage warning banner if aggregate falls below 75%.
   - Academic aggregate score and fee balance status.
   - "Today's Schedule" widget showing today's class lecture slots, room numbers, and faculty.
   - Recent campus announcements and quick navigation shortcuts.
2. **My Profile & Digital ID Card:**
   - Official institutional student identity card with photo, roll ID, barcode, and print-ready layout (`window.print()`).
   - Detailed contact, admission, and emergency contact details.
3. **My Subjects:**
   - Enrolled subjects for current semester with credit breakdown and assigned instructors.
4. **My Attendance:**
   - Overall attendance percentage and subject-wise attendance bar chart with 75% benchmark line.
   - Attended vs conducted class lecture counts.
   - Chronological session-by-session history table with status filter (Present, Late, Absent, Excused).
5. **My Marks & Official Transcript:**
   - Detailed semester result reports with subject marks, maximum marks, percentage, grade, and pass/fail standing.
   - Subject score distribution bar chart.
   - Printable official academic transcript with registrar signature blocks.
6. **My Fees & Receipts:**
   - Breakdown of assessed tuition, scholarships, paid amount, and outstanding balance.
   - Transaction history with printable institutional fee receipt modal.
7. **My Timetable:**
   - Weekly interactive timetable with today's classes highlighted.
8. **Campus Circulars:**
   - Filterable notices with priority tags and valid expiry dates.
9. **Change Password:**
   - Self-service credential update with show/hide password toggle and password policy checks.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS 3.4, React Router 7, Axios, Recharts, Lucide React |
| **Backend** | Node.js, Express.js, JWT, bcryptjs, express-validator, express-rate-limit, CORS |
| **Database** | MySQL 8.0+, Sequelize ORM, connection pooling, ACID transactions, foreign keys |
| **Security** | Salting & Hashing (12 rounds bcrypt), Role-Based Access Control (RBAC), Insecure Direct Object Reference (IDOR) Ownership verification middleware, in-memory rate limiting, sanitized SQL through Sequelize parameterized queries |

---

## 📁 Repository Structure

```text
Cloud_project/
├── .env.example                     # Environment template
├── README.md                        # Documentation
├── database/
│   └── schema.sql                   # Normalized 17-table relational schema
├── client/                          # React + Vite Frontend
│   ├── src/
│   │   ├── components/              # Sidebar, Navbar, StudentNavbar, StatCard, DataTable, Modal
│   │   ├── context/                 # AuthContext (JWT session), ToastContext (notifications)
│   │   ├── layouts/                 # PublicLayout, AdminLayout, StudentLayout
│   │   ├── pages/
│   │   │   ├── public/              # Login, ForgotPassword, ResetPassword
│   │   │   ├── admin/               # 13 Admin Management Pages
│   │   │   └── student/             # 9 Student Portal Pages
│   │   ├── services/                # api.js (Axios instance with Bearer interceptor)
│   │   ├── App.jsx                  # Main router wiring
│   │   ├── main.jsx                 # Vite entry point
│   │   └── index.css                # Tailwind CSS, custom scrollbars, print styles
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── server/                          # Express.js REST API Backend
    ├── src/
    │   ├── config/                  # Database connection pool (Sequelize)
    │   ├── controllers/             # 11 REST API controllers
    │   ├── database/                # seed.js (Pre-loads rich demo data)
    │   ├── middleware/              # auth.js, rbac.js, ownership.js, errorHandler.js, validators.js
    │   ├── models/                  # 17 Sequelize relational models & associations
    │   ├── routes/                  # Express REST routes
    │   ├── utils/                   # auditLogger.js
    │   ├── app.js                   # Express application configuration
    │   └── server.js                # Server entry point
    ├── tests/                       # run-tests.js (Automated 14-test regression suite)
    ├── .env                         # Backend environment configuration
    └── package.json
```

---

## ⚙️ Installation & Setup Guide

### Prerequisites
- **Node.js** (v18.x or v20.x+)
- **npm** (v9.x or v10.x+)
- **MySQL Server** (v8.0+ running on port `3306`)

### 1. Database Setup
Log into MySQL and execute the schema:
```sql
CREATE DATABASE IF NOT EXISTS sms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Or import `database/schema.sql` via MySQL CLI:
```bash
mysql -u root -p < database/schema.sql
```

### 2. Configure Environment Variables
Inside `server/.env`:
```env
PORT=5000
NODE_ENV=development

# MySQL Credentials
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=sms_db

# JWT Configuration
JWT_SECRET=sms_super_secret_jwt_key_2026_production_grade_security
JWT_EXPIRES_IN=24h

# Client URL (CORS)
CLIENT_URL=http://localhost:5173
```

### 3. Seed Database with Demo Accounts
Run the automated seed script to populate departments, courses, subjects, admin, students, 40+ attendance sessions, marks, and fees:
```bash
cd server
npm run seed
```

### 4. Run Backend Server
```bash
cd server
npm run dev
# Server will run on http://localhost:5000
```

### 5. Run Frontend Client
```bash
cd client
npm run dev
# Frontend will run on http://localhost:5173
```

---

## 🔑 Demo Login Credentials

The seed script initializes the following demo credentials:

| Role | Username / Email | Password | Details |
|---|---|---|---|
| **Administrator** | `admin@college.edu` | `Admin@12345` | Full administrative control |
| **Student (Regular)** | `CS2026001` or `rahul.sharma@college.edu` | `Student@12345` | B.Tech CS, Semester 4, High attendance (88%) |
| **Student (Regular)** | `CS2026002` or `priya.patel@college.edu` | `Student@12345` | B.Tech CS, Semester 4, Good academic standing |
| **Student (Shortage Alert)**| `CS2026003` or `amit.verma@college.edu` | `Student@12345` | B.Tech CS, Low attendance (<75% shortage alert) |

> 💡 **Tip:** The login page includes **1-Click Quick Demo Login Pills** to instantly populate credentials for Admin or Student.

---

## 🧪 Automated Test Suite

Run the end-to-end API test runner to verify 14 critical security and validation checks:
```bash
cd server
npm test
```

### Verified Test Cases:
1. `GET /api/health` — API liveness check
2. `POST /api/auth/login` — Administrator authentication
3. `POST /api/auth/login` — Reject incorrect password with 401
4. `POST /api/auth/login` — Student authentication with profile linkage
5. `GET /api/students` — Admin access to student registry
6. `GET /api/students` — RBAC: 403 Forbidden when student attempts admin endpoint
7. `GET /api/attendance/student/:id` — Student permitted to view own attendance
8. `GET /api/attendance/student/:otherId` — **IDOR Protection:** 403 Forbidden when student attempts other student's attendance
9. `GET /api/fees/student/:otherId` — **IDOR Protection:** 403 Forbidden when student attempts other student's fee ledger
10. `POST /api/marks/batch` — Rejects marks exceeding maximum marks (400 Bad Request)
11. `POST /api/attendance/sessions` — Records valid attendance session
12. `POST /api/attendance/sessions` — Prevents duplicate attendance session on same date & time (409 Conflict)
13. `GET /api/dashboard/admin` — Calculates real-time MySQL database statistics
14. `GET /api/dashboard/student` — Personalized student dashboard data isolation

---

## 🔒 Security Architecture Highlights

- **Bcrypt Password Encryption:** Passwords are hashed with 12 salt rounds before storage. Plaintext passwords and hashes are omitted from all queries (`attributes: { exclude: ['password_hash'] }`).
- **Strict Role-Based Authorization (RBAC):** Middleware validates roles (`authorize(['admin'])`) on all administrative mutation and inspection routes.
- **Insecure Direct Object Reference (IDOR) Defense:** Custom `verifyStudentOwnership` middleware checks the decoded JWT token. A student cannot view or alter another student's attendance, marks, or fees by tampering with URL parameters (`/api/students/:id`, `/api/attendance/student/:studentId`, `/api/fees/student/:studentId`).
- **Brute Force Protection:** Sensitive endpoints (`/api/auth/login`, `/api/auth/forgot-password`, `/api/auth/reset-password`) are safeguarded by rate limiting.
- **Audit Logging:** Every state change in student profiles, attendance, marks, fees, and timetable slots records an audit entry with user ID, action, entity, IP address, and JSON diffs.
