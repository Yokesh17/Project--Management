# Project Management App

## Tech Stack
- Frontend: React, Tailwind, Redux, Framer Motion
- Backend: FastAPI, SQLAlchemy, Pydantic
- Database: MySQL

## Setup & Run

### Prerequisites
- MySQL Server running (Create a user `root` with password `yokesh2002` OR update `backend/database.py` and `backend/init_db.py` with your credentials).
- Node.js
- Python 3.8+

### Database Setup
The app attempts to create the database `pm_db` automatically.

### Running Backend
```bash
cd backend
python -m venv venv
./venv/Scripts/activate
pip install -r requirements.txt
python init_db.py  # Run once to create DB/Tables
uvicorn main:app --reload
```

### Running Frontend
```bash
cd frontend
npm install
npm run dev
```

### Usage
1. Sign up a new user.
2. Login.
3. Create a project.
4. Add tasks.
5. Upload attachments to tasks.
6. Invite other users (they must sign up first).
