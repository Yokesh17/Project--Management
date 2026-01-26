from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
import schemas, models
from dependencies import get_db, get_current_user

router = APIRouter()

@router.get("/notifications/", response_model=List[schemas.Notification])
def get_notifications(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return current_user.notifications

@router.put("/notifications/read-all")
def mark_all_notifications_read(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(models.Notification).filter(models.Notification.user_id == current_user.id, models.Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All marked as read"}

@router.put("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    notification = db.query(models.Notification).filter(models.Notification.id == notification_id, models.Notification.user_id == current_user.id).first()
    if notification:
        notification.is_read = True
        db.commit()
    return {"message": "Marked as read"}
