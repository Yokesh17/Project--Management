from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime
import shutil, os
import schemas, models
from dependencies import get_db, get_current_user
from helpers import log_activity, create_notification, process_mentions

router = APIRouter()

@router.post("/projects/{project_id}/tasks/", response_model=schemas.Task)
def create_task(project_id: int, task: schemas.TaskCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != current_user.id and current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check task limits for free plan
    if current_user.plan == "free" or current_user.plan is None:
        # Count tasks in the project
        task_count = db.query(models.Task).filter(models.Task.project_id == project_id).count()
        if task_count >= 500:
            raise HTTPException(status_code=403, detail="Free plan is limited to 500 tasks per project.")

    db_task = models.Task(**task.dict(), project_id=project_id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    log_activity(db, project_id, f"Created task: {task.title}", user_id=current_user.id)
    
    if task.assignee_id and task.assignee_id != current_user.id:
        create_notification(db, task.assignee_id, f"You have been assigned to task '{task.title}' in project '{project.name}'")

    return db_task

@router.patch("/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, status: str = None, priority: str = None, assignee_id: int = None, due_date: datetime = None, title: str = None, description: str = None, stage_id: int = None, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    project = task.project
    if project.owner_id != current_user.id and current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if title is not None: task.title = title
    if description is not None: task.description = description

    if status is not None:
        old_status = task.status
        task.status = status
        if old_status != status:
            log_activity(db, project.id, f"Moved task '{task.title}' to {status}", user_id=current_user.id)
            if status == "DONE":
                task.completed_at = datetime.utcnow()
            elif old_status == "DONE":
                task.completed_at = None

    if priority is not None:
        task.priority = priority
        
    if assignee_id is not None:
        if assignee_id != task.assignee_id:
             task.assignee_id = assignee_id
             create_notification(db, assignee_id, f"You have been assigned to task '{task.title}'")
             log_activity(db, project.id, f"Assigned task '{task.title}' to user {assignee_id}", user_id=current_user.id)
    
    if due_date is not None:
        task.due_date = due_date
    
    if stage_id is not None:
        task.stage_id = stage_id

    db.commit()
    db.refresh(task)
    return task

@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    project = task.project
    if project.owner_id != current_user.id and current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}

@router.post("/tasks/{task_id}/attachments/", response_model=schemas.Attachment)
def upload_attachment(task_id: int, file: UploadFile = File(...), current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    project = task.project
    if project.owner_id != current_user.id and current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    file_location = f"uploads/{file.filename}"
    with open(file_location, "wb+") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_attachment = models.Attachment(filename=file.filename, file_path=file_location, task_id=task_id)
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    return db_attachment

@router.delete("/attachments/{attachment_id}")
def delete_attachment(attachment_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    attachment = db.query(models.Attachment).filter(models.Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    project = None
    if attachment.task_id:
        project = attachment.task.project
    elif attachment.project_id:
        project = attachment.project
        
    if not project:
         raise HTTPException(status_code=404, detail="Project not found associated with attachment")

    if project.owner_id != current_user.id and current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if os.path.exists(attachment.file_path):
        os.remove(attachment.file_path)
    
    db.delete(attachment)
    db.commit()
    return {"message": "Attachment deleted successfully"}

@router.post("/tasks/{task_id}/comments/", response_model=schemas.Comment)
def create_comment(task_id: int, comment: schemas.CommentCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    project = task.project
    if project.owner_id != current_user.id and current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_comment = models.Comment(**comment.dict(), task_id=task_id, user_id=current_user.id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    db_comment.user = current_user

    log_activity(db, project.id, f"Commented on task '{task.title}'", user_id=current_user.id)
    process_mentions(db, comment.content, project.id, task.title, current_user)
    
    if task.assignee_id and task.assignee_id != current_user.id:
        create_notification(db, task.assignee_id, f"New comment on task '{task.title}' by {current_user.full_name or current_user.email}")

    return db_comment

@router.delete("/comments/{comment_id}")
def delete_comment(comment_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.user_id != current_user.id:
        task = comment.task
        project = task.project
        if project.owner_id != current_user.id:
             raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted"}
