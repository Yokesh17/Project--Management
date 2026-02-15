from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    plan: Optional[str] = "free"
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Comments
class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class Comment(CommentBase):
    id: int
    task_id: int
    user_id: int
    created_at: datetime
    user: User # Include user details for display
    class Config:
        from_attributes = True

# Attachments
class AttachmentBase(BaseModel):
    filename: str
    file_path: str

class Attachment(AttachmentBase):
    id: int
    created_at: datetime
    task_id: Optional[int]
    project_id: Optional[int]
    class Config:
        from_attributes = True

# Tasks
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "TODO"
    priority: Optional[str] = "MEDIUM"
    due_date: Optional[datetime] = None
    assignee_id: Optional[int] = None
    stage_id: Optional[int] = None

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    project_id: int
    attachments: List[Attachment] = []
    comments: List[Comment] = []
    assignee: Optional[User] = None
    class Config:
        from_attributes = True

# Config Board
class ConfigBoardBase(BaseModel):
    name: str
    content: Optional[str] = "{}"
    is_public: Optional[int] = 0

class ConfigBoardCreate(ConfigBoardBase):
    pass

class ConfigBoardUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    is_public: Optional[int] = None

class ConfigBoard(ConfigBoardBase):
    id: int
    project_id: int
    share_token: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# Activity Log
class ActivityLogBase(BaseModel):
    action: str
    details: Optional[str] = None

class ActivityLog(ActivityLogBase):
    id: int
    project_id: int
    user_id: Optional[int]
    created_at: datetime
    user: Optional[User] = None
    class Config:
        from_attributes = True

# Notifications
class NotificationBase(BaseModel):
    content: str
    type: str

class Notification(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime
    class Config:
        from_attributes = True

# Stages
class StageBase(BaseModel):
    name: str

class StageCreate(StageBase):
    pass

class Stage(StageBase):
    id: int
    project_id: int
    created_at: datetime
    tasks: List[Task] = []
    class Config:
        from_attributes = True

# Projects
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    owner_id: int
    owner: Optional[User] = None  # Include owner details
    created_at: datetime
    tasks: List[Task] = []
    members: List[User] = [] # Include members
    attachments: List[Attachment] = []
    stages: List[Stage] = []
    configs: List[ConfigBoard] = []
    class Config:
        from_attributes = True
