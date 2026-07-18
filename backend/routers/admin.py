from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import models
from dependencies import get_db, get_current_user
import os

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")

def require_admin(current_user: models.User = Depends(get_current_user)):
    if not ADMIN_EMAIL or current_user.email != ADMIN_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), admin=Depends(require_admin)):
    total_users = db.query(models.User).count()
    paid_users = db.query(models.User).filter(models.User.plan == "paid").count()
    free_users = total_users - paid_users
    total_projects = db.query(models.Project).count()
    total_tasks = db.query(models.Task).count()
    total_logs = db.query(models.ActivityLog).count()
    return {
        "total_users": total_users,
        "paid_users": paid_users,
        "free_users": free_users,
        "total_projects": total_projects,
        "total_tasks": total_tasks,
        "total_logs": total_logs,
    }

@router.get("/users")
def get_all_users(db: Session = Depends(get_db), admin=Depends(require_admin)):
    users = db.query(models.User).order_by(models.User.created_at.desc()).all()
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "plan": u.plan,
            "project_count": len(u.owned_projects),
            "created_at": u.created_at,
        })
    return result

@router.get("/projects")
def get_all_projects(db: Session = Depends(get_db), admin=Depends(require_admin)):
    projects = db.query(models.Project).order_by(models.Project.created_at.desc()).all()
    result = []
    for p in projects:
        result.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "owner_name": p.owner.full_name if p.owner else "Unknown",
            "owner_email": p.owner.email if p.owner else "",
            "task_count": len(p.tasks),
            "member_count": len(p.members),
            "created_at": p.created_at,
        })
    return result

@router.get("/logs")
def get_all_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), admin=Depends(require_admin)):
    logs = (
        db.query(models.ActivityLog)
        .order_by(models.ActivityLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "action": log.action,
            "details": log.details,
            "project_name": log.project.name if log.project else "N/A",
            "user_name": log.user.full_name if log.user else "System",
            "user_email": log.user.email if log.user else "",
            "created_at": log.created_at,
        })
    return result
