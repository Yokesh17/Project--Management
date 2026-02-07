# Project Implementation Overview

This document provides a comprehensive overview of the **Project Management Application**, detailing the architecture, technology stack, and implemented features for both frontend and backend.

---

## 🏗️ Architecture & Tech Stack

### **Backend**
*   **Framework**: FastAPI (Python) - High-performance, async web framework.
*   **Database**: MySQL (via `pymysql` driver) - Relational database for persistent storage.
*   **ORM**: SQLAlchemy - Database interaction and object-relational mapping.
*   **Authentication**: JWT (JSON Web Tokens) with `python-jose` and `passlib` for password hashing.
*   **Server**: Uvicorn - ASI server for running FastAPI.
*   **Environment Management**: `python-dotenv` for loading secrets from `.env` file.

### **Frontend**
*   **Framework**: React (v19) with Vite (v7) - Modern, fast frontend build tool.
*   **Language**: JavaScript (ESM).
*   **Styling**: Tailwind CSS (v3) with Lucide React icons.
*   **State Management**: Redux Toolkit (implied by dependencies) / React Context.
*   **HTTP Client**: Axios - For API requests.
*   **Utilities**: `date-fns` (Date formatting), `clsx`/`tailwind-merge` (Class manipulation), `@hello-pangea/dnd` (Drag and drop).

### **Deployment / Hosting Setup**
*   **Single Origin**: The backend (`backend/main.py`) is configured to serve the built frontend static files (`frontend/dist`). This allows the entire app to be deployed as a single service (e.g., on PythonAnywhere).
*   **API URL**: Frontend is configured to use relative paths (`baseURL: ""`) in production to seamlessly talk to the backend on the same domain.

---

## �️ Implemented Features

### **Backend Features**
1.  **Authentication & Users**:
    *   User registration and login (JWT).
    *   Models for `User` storing email, hashed password, and full name.
    *   Dependencies to get current authenticated user (`get_current_user`).

2.  **Project Management**:
    *   CRUD operations for Projects (`routers/projects.py`).
    *   **Ownership**: Projects track their owner (`owner_id`) and invited members.
    *   **Validation**: Schema allows `owner` field to be optional to prevent data loading errors.
    *   **Activity Logs**: Tracks actions within a project (e.g., "Invited user", "Created Task").

3.  **Task Management**:
    *   CRUD operations for Tasks (`routers/tasks.py`).
    *   **Kanban Stages**: Tasks are organized by stages (e.g., TODO, DOING, DONE) and can be reordered.
    *   **Assignments**: Tasks can be assigned to project members (including the owner).
    *   **Attachments**: File upload support for tasks.
    *   **Comments**: Threaded comments on tasks with user attribution.

4.  **Notifications**:
    *   System for tracking user notifications (e.g., "You have been assigned to task...").
    *   Endpoints to mark notifications as read.

5.  **Configuration Boards**:
    *   Support for project-specific configurations (`routers/configs.py`).

### **Frontend Features**
1.  **Dashboard**:
    *   Overview of projects.
    *   Ability to create new projects.

2.  **Project Board (Kanban View)**:
    *   **Drag & Drop**: Tasks can be dragged between stages (columns).
    *   **Task Details**: Modal view to edit title, description, due date, and assignees.
    *   **Filtering**: Filter tasks by assignee, overdue status, etc.
    *   **Stage Management**: Add or delete custom stages.

3.  **Interactivity**:
    *   **Notifications**: Real-time(ish) notification center with mobile-responsive design.
    *   **Modals**: Dedicated modals for Planning, Analytics, Archived Tasks, and File Management.
    *   **Assignment**: Dropdown to assign tasks to any member, including the project owner.

4.  **Optimization**:
    *   **Mobile Responsive**: Notification center and board layout adapt to smaller screens.
    *   **Production Ready**: Configured to build optimized assets for deployment.

---

## 📂 Key File Structure

### **Backend (`/backend`)**
*   `main.py`: Entry point. Configures FastAPI app, CORS, Static Files serving (Frontend), and API routers.
*   `database.py`: Database connection settings (loads MySQL config from `.env`).
*   `models.py`: SQLAlchemy database models (`User`, `Project`, `Task`, etc.).
*   `schemas.py`: Pydantic models for request/response validation.
*   `routers/`: API endpoints grouped by feature (`auth.py`, `projects.py`, `tasks.py`, etc.).
*   `requirements.txt`: Python package dependencies.
*   `.env`: (Ignored by git) Contains database credentials (`SQLALCHEMY_DATABASE_URL`).

### **Frontend (`/frontend`)**
*   `src/components/`: Reusable UI components (`TaskDetailModal`, `NotificationCenter`, etc.).
*   `src/pages/`: Main views (`Dashboard.jsx`, `ProjectView.jsx`).
*   `src/utils/api.js`: Axios instance configuration (handles Auth headers and Base URL).
*   `src/index.css`: Global styles (Tailwind imports).
*   `vite.config.js`: Build configuration for Vite.
*   `package.json`: NPM dependencies and scripts.

---

## 🔄 Recent Critical Fixes (Log)
*   **Database**: Restored MySQL connection logic in `database.py` (removed SQLite fallback).
*   **Frontend Build**: Fixed `date-fns` dependency issue.
*   **Logic**: Fixed "Self-Assignment" by adding owner to project schema.
*   **UI**: Improved mobile layout for notifications.
*   **Deployment**: Updated API base URL strategy for platform-agnostic deployment.
*   **Authentication**: Implemented Axios interceptor to automatically log out users and redirect to login upon token expiration (401 errors).
*   **Logic**: Projects are now sorted by creation date (newest first).
*   **UI**: Added loading spinners for Dashboard and Config Board.
*   **UI**: Added "Show/Hide Archived" toggle in Project Board to allow viewing archived tasks in their original stages.
