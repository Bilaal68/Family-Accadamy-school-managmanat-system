import uuid

from django.conf import settings
from django.db import models


class EnrollmentStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    REVIEWED = "REVIEWED", "Reviewed by Cashier"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


class EnrollmentRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    # Basic Details
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(
        max_length=10, choices=[("M", "Male"), ("F", "Female"), ("OTHER", "Other")]
    )
    date_of_birth = models.DateField()
    place_of_birth = models.CharField(max_length=200, blank=True)
    nationality = models.CharField(max_length=100, default="Ethiopian")
    photo = models.ImageField(upload_to="enrollment/photos/", null=True, blank=True)

    # Contact
    phone_number = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)

    # Academic
    admission_number = models.CharField(max_length=50, unique=True, blank=True)
    academic_year = models.CharField(max_length=20)
    grade_applying = models.CharField(max_length=50)
    section_preference = models.CharField(max_length=10, blank=True)
    enrollment_date = models.DateField(auto_now_add=True)
    previous_school = models.CharField(max_length=200, blank=True)
    is_transfer = models.BooleanField(default=False)

    # Father info
    father_name = models.CharField(max_length=200, blank=True)
    father_phone = models.CharField(max_length=20, blank=True)
    father_occupation = models.CharField(max_length=100, blank=True)
    father_photo = models.ImageField(
        upload_to="enrollment/parent_photos/", null=True, blank=True
    )

    # Mother info
    mother_name = models.CharField(max_length=200, blank=True)
    mother_phone = models.CharField(max_length=20, blank=True)
    mother_occupation = models.CharField(max_length=100, blank=True)
    mother_photo = models.ImageField(
        upload_to="enrollment/parent_photos/", null=True, blank=True
    )

    # Guardian info
    guardian_name = models.CharField(max_length=200, blank=True)
    guardian_relationship = models.CharField(max_length=100, blank=True)
    guardian_phone = models.CharField(max_length=20, blank=True)

    # Address
    country = models.CharField(max_length=100, default="Ethiopia")
    region = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    sub_city = models.CharField(max_length=100, blank=True)
    full_address = models.TextField(blank=True)

    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=200, blank=True)
    emergency_contact_relationship = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)

    # Fee Information
    registration_fee_paid = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )
    tuition_plan = models.CharField(max_length=100, blank=True)
    scholarship_discount = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    payment_status = models.CharField(
        max_length=20,
        choices=[("UNPAID", "Unpaid"), ("PARTIAL", "Partial"), ("PAID", "Paid")],
        default="UNPAID",
    )
    fee_receipt = models.FileField(
        upload_to="enrollment/receipts/", null=True, blank=True
    )

    # Status & Workflow
    status = models.CharField(
        max_length=20, choices=EnrollmentStatus.choices, default=EnrollmentStatus.PENDING
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reviewed_enrollments",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    cashier_notes = models.TextField(blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_enrollments",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    # Auto fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Link to created student after approval
    student = models.OneToOneField(
        "students.Student",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="enrollment_request",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.status}"

    def save(self, *args, **kwargs):
        if not self.admission_number:
            last = EnrollmentRequest.objects.order_by("-created_at").first()
            count = (
                int(last.admission_number.split("-")[1]) + 1
                if last and last.admission_number
                else 1
            )
            self.admission_number = f"ADM-{count:05d}"
        super().save(*args, **kwargs)


class EnrollmentDocument(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    enrollment = models.ForeignKey(
        EnrollmentRequest, on_delete=models.CASCADE, related_name="documents"
    )
    document_type = models.CharField(
        max_length=50,
        choices=[
            ("BIRTH_CERTIFICATE", "Birth Certificate"),
            ("TRANSCRIPT", "Previous School Report Card"),
            ("TRANSFER_LETTER", "Transfer Letter"),
            ("PHOTO", "Student Photo"),
            ("OTHER", "Other"),
        ],
    )
    file = models.FileField(upload_to="enrollment/documents/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.enrollment.first_name} - {self.document_type}"
