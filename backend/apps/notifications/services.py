from django.conf import settings
from django.core.mail import send_mail

from apps.accounts.models import CustomUser
from apps.notifications.models import Notification
from apps.students.models import StudentParent


def notify_admins(title: str, message: str):
    admins = CustomUser.objects.filter(
        role=CustomUser.Role.SUPER_ADMIN, is_active=True
    )
    Notification.objects.bulk_create(
        [
            Notification(user=admin, title=title, message=message)
            for admin in admins
        ]
    )


def send_notification(recipient, message):
    """Send notification via email or SMS (SMS integration for Phase 2)"""
    if '@' in str(recipient):
        send_mail(
            subject='Family Academy Notification',
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[recipient],
            fail_silently=True,
        )
    # Phone SMS integration comes in Phase 2


def notify_parent_absence(student, date):
    """When a student is marked ABSENT, automatically send notification to the linked parent"""
    parents = StudentParent.objects.filter(student=student)
    for sp in parents:
        parent = sp.parent
        message = f"Dear {sp.relationship}, {student.full_name} was marked absent on {date}. Please contact the school for more information."
        send_notification(parent.email or parent.phone, message)


def notify_parent_marks_approved(student, subject, semester):
    """When admin approves marks, notify parents"""
    parents = StudentParent.objects.filter(student=student)
    for sp in parents:
        parent = sp.parent
        message = f"Dear {sp.relationship}, {student.full_name}'s {subject} marks for {semester} have been released. Please contact the school for details."
        send_notification(parent.email or parent.phone, message)


def notify_all_parents(message, class_id=None):
    """When admin sends announcement, notify all parents"""
    if class_id:
        parents = StudentParent.objects.filter(student__school_class_id=class_id)
    else:
        parents = StudentParent.objects.all()
    for sp in parents.distinct('parent'):
        send_notification(sp.parent.email or sp.parent.phone, message)
