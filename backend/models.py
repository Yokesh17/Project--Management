from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Table, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime

# Association table for Project members (Many-to-Many)
project_members = Table(
    'project_members',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('project_id', Integer, ForeignKey('projects.id'))
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))
    full_name = Column(String(255))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    owned_projects = relationship("Project", back_populates="owner")
    joined_projects = relationship("Project", secondary=project_members, back_populates="members")
    tasks = relationship("Task", back_populates="assignee")
    comments = relationship("Comment", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    activity_logs = relationship("ActivityLog", back_populates="user")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    description = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    owner = relationship("User", back_populates="owned_projects")
    members = relationship("User", secondary=project_members, back_populates="joined_projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    configs = relationship("ConfigBoard", back_populates="project", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="project", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="project", cascade="all, delete-orphan")
    stages = relationship("Stage", back_populates="project", cascade="all, delete-orphan")

class Stage(Base):
    __tablename__ = "stages"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    project_id = Column(Integer, ForeignKey("projects.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    project = relationship("Project", back_populates="stages")
    tasks = relationship("Task", back_populates="stage", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True)
    description = Column(Text)
    status = Column(String(50), default="TODO") # TODO, IN_PROGRESS, DONE
    priority = Column(String(50), default="MEDIUM") # LOW, MEDIUM, HIGH
    project_id = Column(Integer, ForeignKey("projects.id"))
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    

    stage_id = Column(Integer, ForeignKey("stages.id"), nullable=True)
    
    project = relationship("Project", back_populates="tasks")
    stage = relationship("Stage", back_populates="tasks")
    assignee = relationship("User", back_populates="tasks")
    attachments = relationship("Attachment", back_populates="task", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan")

class Attachment(Base):
    __tablename__ = "attachments"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255))
    file_path = Column(String(500))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    
    task = relationship("Task", back_populates="attachments")
    project = relationship("Project", back_populates="attachments")

class ConfigBoard(Base):
    __tablename__ = "config_boards"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    content = Column(Text)
    is_public = Column(Integer, default=0)
    share_token = Column(String(100), nullable=True, unique=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    project = relationship("Project", back_populates="configs")

# New Models

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    task = relationship("Task", back_populates="comments")
    user = relationship("User", back_populates="comments")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String(500))
    type = Column(String(50), default="INFO") # INFO, WARNING, SUCCESS
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(255)) # e.g., "Created Task", "Moved Task"
    details = Column(Text, nullable=True) # Optional JSON or text details
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="activity_logs")
    user = relationship("User", back_populates="activity_logs")
