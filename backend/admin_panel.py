from sqladmin import Admin, ModelView
from models import User, Project, Stage, Task, Attachment, ConfigBoard, Comment, Notification, ActivityLog


class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.email, User.full_name, User.plan, User.created_at]
    name = "User"
    name_plural = "Users"
    icon = "fa-solid fa-users"
    can_create = True
    can_edit = True
    can_delete = True
    can_view_details = True

class ProjectAdmin(ModelView, model=Project):
    column_list = [Project.id, Project.name, Project.owner_id, Project.created_at]
    name = "Project"
    name_plural = "Projects"
    icon = "fa-solid fa-diagram-project"
    can_create = True
    can_edit = True
    can_delete = True
    can_view_details = True

class StageAdmin(ModelView, model=Stage):
    column_list = [Stage.id, Stage.name, Stage.project_id, Stage.created_at]
    name = "Stage"
    name_plural = "Stages"
    icon = "fa-solid fa-layer-group"
    can_create = True
    can_edit = True
    can_delete = True
    can_view_details = True

class TaskAdmin(ModelView, model=Task):
    column_list = [Task.id, Task.title, Task.status, Task.priority, Task.project_id, Task.assignee_id, Task.due_date]
    name = "Task"
    name_plural = "Tasks"
    icon = "fa-solid fa-list-check"
    can_create = True
    can_edit = True
    can_delete = True
    can_view_details = True

class AttachmentAdmin(ModelView, model=Attachment):
    column_list = [Attachment.id, Attachment.filename, Attachment.task_id, Attachment.project_id, Attachment.created_at]
    name = "Attachment"
    name_plural = "Attachments"
    icon = "fa-solid fa-paperclip"
    can_create = True
    can_edit = True
    can_delete = True
    can_view_details = True

class ConfigBoardAdmin(ModelView, model=ConfigBoard):
    column_list = [ConfigBoard.id, ConfigBoard.name, ConfigBoard.project_id, ConfigBoard.is_public, ConfigBoard.created_at]
    name = "Config Board"
    name_plural = "Config Boards"
    icon = "fa-solid fa-sliders"
    can_create = True
    can_edit = True
    can_delete = True
    can_view_details = True

class CommentAdmin(ModelView, model=Comment):
    column_list = [Comment.id, Comment.task_id, Comment.user_id, Comment.created_at]
    name = "Comment"
    name_plural = "Comments"
    icon = "fa-solid fa-comments"
    can_create = True
    can_edit = True
    can_delete = True
    can_view_details = True

class NotificationAdmin(ModelView, model=Notification):
    column_list = [Notification.id, Notification.user_id, Notification.type, Notification.is_read, Notification.created_at]
    name = "Notification"
    name_plural = "Notifications"
    icon = "fa-solid fa-bell"
    can_create = True
    can_edit = True
    can_delete = True
    can_view_details = True

class ActivityLogAdmin(ModelView, model=ActivityLog):
    column_list = [ActivityLog.id, ActivityLog.project_id, ActivityLog.user_id, ActivityLog.action, ActivityLog.created_at]
    name = "Activity Log"
    name_plural = "Activity Logs"
    icon = "fa-solid fa-clock-rotate-left"
    can_create = True
    can_edit = True
    can_delete = True
    can_view_details = True


def register_admin(app, engine):
    db_admin = Admin(app, engine, title="Project Management DB Admin")
    db_admin.add_view(UserAdmin)
    db_admin.add_view(ProjectAdmin)
    db_admin.add_view(StageAdmin)
    db_admin.add_view(TaskAdmin)
    db_admin.add_view(AttachmentAdmin)
    db_admin.add_view(ConfigBoardAdmin)
    db_admin.add_view(CommentAdmin)
    db_admin.add_view(NotificationAdmin)
    db_admin.add_view(ActivityLogAdmin)
    return db_admin
