from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import shutil
import schemas, models
from dependencies import get_db, get_current_user
from helpers import log_activity

router = APIRouter()

@router.get("/projects/", response_model=List[schemas.Project])
def read_projects(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    all_projects = list(set(current_user.owned_projects + current_user.joined_projects))
    all_projects.sort(key=lambda x: x.created_at, reverse=True)
    return all_projects

@router.post("/projects/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check plan limits
    project_count = db.query(models.Project).filter(models.Project.owner_id == current_user.id).count()
    limit = 1 # Free plan default
    
    if current_user.plan == "paid":
        limit = 10
    elif current_user.plan and current_user.plan.startswith("custom_"):
        try:
             limit = int(current_user.plan.split("_")[1])
        except:
             limit = 1 # Fallback
    
    if project_count >= limit:
         raise HTTPException(status_code=403, detail=f"Project limit reached for your plan ({limit} projects).")

    db_project = models.Project(**project.dict(), owner_id=current_user.id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    log_activity(db, db_project.id, "Project initialized", user_id=current_user.id)
    return db_project

@router.get("/projects/{project_id}", response_model=schemas.Project)
def read_project(project_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != current_user.id and current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not authorized")
    return project

@router.delete("/projects/{project_id}")
def delete_project(project_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}

@router.post("/projects/{project_id}/invite")
def invite_user(project_id: int, email: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
         raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != current_user.id:
         raise HTTPException(status_code=403, detail="Only owner can invite")
    
    user_to_add = db.query(models.User).filter(models.User.email == email).first()
    if not user_to_add:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_to_add in project.members or user_to_add.id == project.owner_id:
        raise HTTPException(status_code=400, detail="User already in project")
        
    project.members.append(user_to_add)
    log_activity(db, project_id, f"Invited user {email}", user_id=current_user.id)
    db.commit()
    return {"message": "User invited"}

@router.delete("/projects/{project_id}/members/{user_id}")
def remove_member(project_id: int, user_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
         raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != current_user.id:
         raise HTTPException(status_code=403, detail="Only owner can remove members")
    
    user_to_remove = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_remove:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_to_remove not in project.members:
        raise HTTPException(status_code=400, detail="User not in project")
        
    project.members.remove(user_to_remove)
    log_activity(db, project_id, f"Removed user {user_to_remove.email}", user_id=current_user.id)
    db.commit()
    return {"message": "User removed"}

@router.get("/projects/{project_id}/activity", response_model=List[schemas.ActivityLog])
def get_activity_log(project_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != current_user.id and current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not authorized")
    return project.activity_logs

@router.post("/projects/{project_id}/attachments/", response_model=schemas.Attachment)
def upload_project_attachment(project_id: int, file: UploadFile = File(...), current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
         raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != current_user.id and current_user not in project.members:
         raise HTTPException(status_code=403, detail="Not authorized")
    
    file_location = f"uploads/{file.filename}"
    with open(file_location, "wb+") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_attachment = models.Attachment(filename=file.filename, file_path=file_location, project_id=project_id)
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    return db_attachment

@router.post("/projects/{project_id}/stages/", response_model=schemas.Stage)
def create_stage(project_id: int, stage: schemas.StageCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
         raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != current_user.id and current_user not in project.members:
         raise HTTPException(status_code=403, detail="Not authorized")

    # Check limits for free plan
    if current_user.plan == "free" or current_user.plan is None:
        stage_count = db.query(models.Stage).filter(models.Stage.project_id == project_id).count()
        if stage_count >= 10:
             raise HTTPException(status_code=403, detail="Free plan is limited to 10 stages.")
    
    db_stage = models.Stage(**stage.dict(), project_id=project_id)
    db.add(db_stage)
    db.commit()
    db.refresh(db_stage)
    return db_stage

@router.delete("/stages/{stage_id}")
def delete_stage(stage_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    stage = db.query(models.Stage).filter(models.Stage.id == stage_id).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")
    
    project = stage.project
    if project.owner_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(stage)
    db.commit()
    return {"message": "Stage deleted"}
