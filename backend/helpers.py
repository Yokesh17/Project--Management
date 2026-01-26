import models
from sqlalchemy.orm import Session

def create_notification(db: Session, user_id: int, content: str, type: str = "INFO"):
    notification = models.Notification(user_id=user_id, content=content, type=type)
    db.add(notification)
    db.commit()

def log_activity(db: Session, project_id: int, action: str, details: str = None, user_id: int = None):
    log = models.ActivityLog(project_id=project_id, user_id=user_id, action=action, details=details)
    db.add(log)
    db.commit()

def process_mentions(db: Session, text: str, project_id: int, task_title: str, current_user: models.User):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        return
        
    members = [project.owner] + project.members
    for member in members:
        name_mention = f"@{member.full_name.split(' ')[0]}" if member.full_name else f"@{member.email.split('@')[0]}"
        if name_mention in text or f"@{member.email}" in text:
            if member.id != current_user.id:
                create_notification(db, member.id, f"{current_user.full_name or 'User'} mentioned you in a comment on '{task_title}'")
