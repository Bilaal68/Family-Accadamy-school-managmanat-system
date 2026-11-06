# 🎓 Family Academy School Management System (SMS)

<div align="center">

![Family Academy SMS](https://img.shields.io/badge/Family%20Academy-SMS-1E3A8A?style=for-the-badge&logo=mortarboard&logoColor=white)
[![Django](https://img.shields.io/badge/Backend-Django%205.0%20%7C%20DRF-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind%20CSS%20v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20SQLite-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Celery & Redis](https://img.shields.io/badge/Async-Celery%20%7C%20Redis-CC0000?style=for-the-badge&logo=redis&logoColor=white)](https://docs.celeryq.dev/)

**An all-in-one, modern, role-based school management platform and public web portal tailored for Family Academy.**

[Key Features](#-key-features) • [System Architecture](#-system-architecture) • [Getting Started](#-getting-started) • [API Documentation](#-api-documentation) • [Environment Setup](#-environment-variables)

</div>

---

## 📖 About The Project

**Family Academy School Management System** is a modular enterprise solution designed to streamline educational administration and foster communication between school administrators, educators, financial staff, parents, and prospective students.

The system is organized into three primary modules within this repository:
- **`backend/`**: High-performance RESTful API service built with Django 5, DRF, SimpleJWT, Celery, and PostgreSQL/SQLite.
- **`family-sms-frontend/`**: Interactive, responsive single-page application (SPA) portal for Administrators, Teachers, and Cashiers.
- **`family-school-public/`**: Public-facing marketing, informational, and online admissions landing portal.

---

## 🏛 System Architecture

```mermaid
graph TD
    subgraph Clients["Users & Clients"]
        PublicUser["Public Visitors / Parents"]
        SchoolStaff["Admin / Teachers / Cashiers"]
    end

    subgraph Frontend["Frontend Layer (React 19 + Vite)"]
        PublicSite["family-school-public<br/>(Landing, Admissions, Info)"]
        AdminPortal["family-sms-frontend<br/>(Role-Based Dashboard Portal)"]
    end

    subgraph Backend["Backend API Layer (Django 5 + DRF)"]
        API["Django REST API Gateway<br/>/api/v1/*"]
        Auth["JWT Authentication & Permissions"]
        Apps["Domain Apps (Students, Teachers, Classes,<br/>Attendance, Grades, Behaviour, Reports, etc.)"]
    end

    subgraph Services["Data & Background Services"]
        DB[("PostgreSQL / SQLite")]
        RedisQueue["Redis Message Broker"]
        CeleryWorker["Celery Async Workers<br/>(Reports, Emails)"]
        Media["Media Storage / S3 / Local"]
    end

    PublicUser --> PublicSite
    SchoolStaff --> AdminPortal

    PublicSite -->|REST API / Inquiries| API
    AdminPortal -->|JWT Authenticated Requests| API

    API --> Auth
    API --> Apps
    Apps --> DB
    Apps --> RedisQueue
    RedisQueue --> CeleryWorker
    Apps --> Media
```

---

## ✨ Key Features

### 🔐 1. Authentication & Role-Based Access Control (RBAC)
- Strict multi-role permission separation: **Super Admin**, **Teacher**, and **Cashier**.
- Secure JSON Web Token (`SimpleJWT`) authentication with token refresh lifecycles.
- Profile management and role-specific navigation guards.

### 🧑‍🎓 2. Student & Academic Management
- **Student Information System (SIS):** Complete biographical profiles, medical information, emergency contacts, parent linkage, and document storage.
- **Student ID Card & QR Codes:** Automated generation of student ID cards with scannable QR verification codes.
- **Classes, Streams & Sections:** Flexible academic hierarchy including grade levels, divisions, and classroom room management.
- **Teacher Allocations:** Subject and class assignment matrices with schedule tracking.

### 📝 3. Attendance & Grading
- **Daily & Subject Attendance:** Fast attendance marking workflows for teachers with real-time absentee tracking and aggregation.
- **Examinations & Gradebook:** Dynamic grading scales, mark recording, automatic calculation of averages, term ranks, and pass/fail statuses.
- **Report Cards:** Automated PDF generation of official end-of-term student report cards powered by `ReportLab`.

### ⚖️ 4. Conduct & Discipline Tracking
- Incident logging system to monitor behavior, merits, demerits, interventions, and parent follow-ups.

### 💳 5. Financial & Cashier Operations
- Comprehensive fee management, invoice tracking, payment receipt generation, and transaction audits.
- Excel data export via `openpyxl` for financial reconciliation.

### 🌐 6. Public Landing Website & Online Enrollment
- Modern, mobile-responsive portal highlighting curriculum, facilities, news, and staff directories.
- Digital admission and enrollment intake pipelines.

---

## 📂 Repository Structure

```text
Family-Accadamy-school-managmanat-system/
│
├── backend/                       # Django REST API backend
│   ├── apps/
│   │   ├── accounts/              # User models, authentication & JWT
│   │   ├── attendance/            # Student and teacher attendance
│   │   ├── behaviour/             # Student disciplinary & merit tracking
│   │   ├── classes/               # Grades, subjects, sections, schedules
│   │   ├── enrollment/            # Applications & student registration
│   │   ├── grades/                # Assessments, marks, grading schemes
│   │   ├── notifications/         # Notification dispatches & emails
│   │   ├── reports/               # PDF/Excel report cards & analytics
│   │   ├── students/              # Student records & parent linkage
│   │   └── teachers/              # Teacher profiles & allocations
│   ├── config/                    # Project settings, URLs, WSGI, Celery
│   ├── manage.py                  # Django CLI entry point
│   ├── requirements.txt           # Python dependencies
│   └── .env.example               # Backend environment template
│
├── family-sms-frontend/           # Management Portal (React 19 + Vite)
│   ├── src/
│   │   ├── api/                   # Axios client & API interceptors
│   │   ├── features/              # Feature modules (admin, cashier, teacher, auth)
│   │   ├── components/            # Reusable UI component library (Radix UI)
│   │   ├── layouts/               # Dashboard shells and navigation bars
│   │   └── routes/                # Client-side protected routing
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── family-school-public/          # Public-Facing School Website (React 19 + Vite)
│   ├── src/
│   │   ├── components/            # Landing page UI components
│   │   ├── pages/                 # Home, Academics, Admissions, Contact
│   │   └── routes/                # Public page routing
│   ├── package.json
│   └── vite.config.js
│
├── create_subject_table.sql       # SQL migration helper script
└── README.md                      # Project documentation
```

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.10+, Django 5.x, Django REST Framework, SimpleJWT |
| **Database** | PostgreSQL (Production) / SQLite3 (Development) |
| **Async & Cache** | Celery, Redis |
| **Document Processing**| ReportLab (PDF), OpenPyXL (Excel), Pillow & qrcode (ID badges) |
| **API Docs** | DRF Spectacular (OpenAPI 3.0 / Swagger UI / Redoc) |
| **Management Portal** | React 19, Vite, TanStack Query v5, Radix UI, Tailwind CSS v4, Recharts, Zod |
| **Public Website** | React 19, Vite, Framer Motion, Tailwind CSS v4, Lucide Icons |

---

## 📋 Prerequisites

Before setting up the project, make sure you have:
- **Python**: `>= 3.10`
- **Node.js**: `>= 20.x` & **npm** `>= 10.x`
- **Git**
- **Redis Server** *(optional for local development, required if Celery tasks are asynchronous)*
- **PostgreSQL** *(optional for local dev; SQLite works out of the box)*

---

## 🚀 Getting Started

Clone the repository to your local machine:

```bash
git clone https://github.com/your-username/Family-Accadamy-school-managmanat-system.git
cd Family-Accadamy-school-managmanat-system
```

---

### 1️⃣ Backend Setup (`backend/`)

1. **Enter the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate

   # Windows (Command Prompt / PowerShell)
   python -m venv .venv
   .venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to configure your `SECRET_KEY`, `DATABASE_URL`, and other parameters.*

5. **Apply database migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Create an administrative user:**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start the Django development server:**
   ```bash
   python manage.py runserver 8000
   ```
   *API will be live at:* `http://localhost:8000`

---

### 2️⃣ Management Portal Setup (`family-sms-frontend/`)

1. **In a new terminal window, enter the portal directory:**
   ```bash
   cd family-sms-frontend
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment settings:**
   ```bash
   cp .env.example .env
   ```
   *Verify `VITE_API_URL=http://localhost:8000/api/v1` in `.env`.*

4. **Launch the development server:**
   ```bash
   npm run dev
   ```
   *Portal will be live at:* `http://localhost:5173`

---

### 3️⃣ Public Website Setup (`family-school-public/`)

1. **In a new terminal window, enter the public site directory:**
   ```bash
   cd family-school-public
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Launch the development server:**
   ```bash
   npm run dev
   ```
   *Public site will be live at:* `http://localhost:5174` *(or assigned Vite port)*

---

## ⚙️ Environment Variables

### Backend Configuration (`backend/.env`)

```ini
SECRET_KEY=your-super-secret-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database: Use sqlite for local quickstart or postgres for production
DATABASE_URL=sqlite:///family_sms.sqlite3
# DATABASE_URL=postgres://sms_user:password@localhost:5432/family_sms_db

# Redis & Celery
REDIS_URL=redis://127.0.0.1:6379/0
CELERY_BROKER_URL=redis://127.0.0.1:6379/1
CELERY_TASK_ALWAYS_EAGER=False

# Email SMTP Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Public Web / CORS Settings
PUBLIC_WEBSITE_URL=http://localhost:5174
```

### Portal Configuration (`family-sms-frontend/.env`)

```ini
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 📡 API Documentation & Endpoints

When running the backend, interactive API documentation is automatically generated by **DRF Spectacular**:

- **Swagger UI:** [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
- **Redoc:** [http://localhost:8000/api/redoc/](http://localhost:8000/api/redoc/)
- **OpenAPI 3.0 Schema:** [http://localhost:8000/api/schema/](http://localhost:8000/api/schema/)

### Core Endpoint Map

| Endpoint Prefix | Description |
|---|---|
| `POST /api/v1/auth/token/` | Obtain JWT access and refresh token pair |
| `POST /api/v1/auth/token/refresh/` | Refresh expired access token |
| `GET/POST /api/v1/students/` | List and create student records |
| `GET /api/v1/parents/` | Search parent and guardian directory |
| `GET/POST /api/v1/teachers/` | Teacher profiles and class subject assignments |
| `GET/POST /api/v1/classes/` | Academic classes, grades, sections, and subjects |
| `GET/POST /api/v1/attendance/` | Class and student daily attendance tracking |
| `GET/POST /api/v1/grades/` | Examinations, gradebook records, and grading rules |
| `GET/POST /api/v1/behaviour/` | Incident logging and student conduct tracking |
| `GET/POST /api/v1/enrollment/` | New student admissions and enrollment applications |
| `GET/POST /api/v1/notifications/` | Broadcast and targeted in-system notifications |

---

## ⚡ Background Workers (Celery & Redis)

Background workers handle non-blocking asynchronous jobs like PDF report card compilation and email delivery.

```bash
# Navigate to the backend directory
cd backend

# Start Celery worker
celery -A config worker --loglevel=info

# (Optional) Start Celery Beat scheduler
celery -A config beat --loglevel=info
```

> **Developer Note:** To run tasks synchronously without starting Redis during local testing, set `CELERY_TASK_ALWAYS_EAGER=True` in `backend/.env`.

---

## 🧪 Testing & Code Quality

### Backend
```bash
cd backend
python manage.py check
python manage.py test
```

### Frontend
```bash
# Admin Portal
cd family-sms-frontend
npm run lint
npm run build

# Public Website
cd ../family-school-public
npm run build
```

---

## 🤝 Contributing

Contributions make the open-source and educational community an amazing place to learn, inspire, and create.

1. **Fork the Project**
2. **Create your Feature Branch:** `git checkout -b feature/AmazingFeature`
3. **Commit your Changes:** `git commit -m "feat: Add AmazingFeature"`
4. **Push to the Branch:** `git push origin feature/AmazingFeature`
5. **Open a Pull Request**

---

## 📄 License

This project is proprietary software created for **Family Academy**. All rights reserved. Unauthorized reproduction or commercial distribution without written consent is prohibited.

<div align="center">
Made with ❤️ for <b>Family Academy</b>
</div>
