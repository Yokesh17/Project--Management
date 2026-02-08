from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import schemas, models, auth
from dependencies import get_db, get_current_user

router = APIRouter()

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, full_name=user.full_name, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.get("/users/api-token", response_model=schemas.Token)
async def generate_api_token(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if user already has a token
    if current_user.api_token:
        # Verify if it's still valid (optional, but good practice). For now, return existing.
        # In a real app, you might want to decode it to check expiry.
        return {"access_token": current_user.api_token, "token_type": "bearer", "user": current_user}

    # Generate a long-lived token (e.g., 30 days) for API usage
    from datetime import timedelta
    access_token = auth.create_access_token(
        data={"sub": current_user.email},
        expires_delta=timedelta(days=30)
    )
    
    # Save token to user
    current_user.api_token = access_token
    db.commit()
    
    return {"access_token": access_token, "token_type": "bearer", "user": current_user}
