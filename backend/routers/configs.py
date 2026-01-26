from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime
import schemas, models
from dependencies import get_db, get_current_user

router = APIRouter()

@router.get("/projects/{project_id}/configs/", response_model=List[schemas.ConfigBoard])
def get_project_configs(project_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != current_user.id and current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not authorized")
    return project.configs

@router.post("/projects/{project_id}/configs/", response_model=schemas.ConfigBoard)
def create_config(project_id: int, config: schemas.ConfigBoardCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != current_user.id and current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_config = models.ConfigBoard(**config.dict(), project_id=project_id)
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config

@router.put("/configs/{config_id}", response_model=schemas.ConfigBoard)
def update_config(config_id: int, config_update: schemas.ConfigBoardUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_config = db.query(models.ConfigBoard).filter(models.ConfigBoard.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    project = db_config.project
    if project.owner_id != current_user.id and current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = config_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_config, key, value)
    
    db_config.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_config)
    return db_config

@router.delete("/configs/{config_id}")
def delete_config(config_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_config = db.query(models.ConfigBoard).filter(models.ConfigBoard.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    project = db_config.project
    if project.owner_id != current_user.id and current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(db_config)
    db.commit()
    return {"message": "Config deleted successfully"}

@router.post("/configs/{config_id}/share")
def share_config(config_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_config = db.query(models.ConfigBoard).filter(models.ConfigBoard.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    project = db_config.project
    if project.owner_id != current_user.id and current_user not in project.members:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_config.share_token = str(uuid.uuid4())[:8]
    db_config.is_public = 1
    db.commit()
    db.refresh(db_config)
    return {"share_token": db_config.share_token, "share_url": f"/shared/{db_config.share_token}"}

@router.get("/shared/{share_token}", response_model=schemas.ConfigBoard)
def get_shared_config(share_token: str, db: Session = Depends(get_db)):
    db_config = db.query(models.ConfigBoard).filter(
        models.ConfigBoard.share_token == share_token,
        models.ConfigBoard.is_public == 1
    ).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="Shared config not found")
    return db_config
