from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import CustomUser
from apps.attendance.models import AttendanceRecord
from apps.classes.models import SchoolClass
from apps.enrollment.models import EnrollmentRequest, EnrollmentStatus
from apps.grades.models import MarkEntry
from apps.students.models import Student, StudentParent
from apps.teachers.models import Teacher


class Command(BaseCommand):
    help = "Seed initial users for Family Academy (admin, teachers, parents)."

    def handle(self, *args, **options):
        with transaction.atomic():
            self._seed_admin()
            self._seed_cashier()
            self._seed_teachers()
            self._seed_parents()
            self._seed_classes_and_assignments()
            self._seed_students()
            self._seed_attendance()
            self._seed_marks()
            self._seed_enrollments()
        self.stdout.write(self.style.SUCCESS("Seed data created successfully."))

    def _seed_admin(self):
        email = "admin@family.com"
        if CustomUser.objects.filter(email=email).exists():
            self.stdout.write(f"  Skipped superadmin (exists): {email}")
            return
        CustomUser.objects.create_superuser(
            email=email,
            password="admin123",
            full_name="Family Academy Admin",
        )
        self.stdout.write(f"  Created superadmin: {email}")

    def _seed_cashier(self):
        email = "cashier@family.com"
        if CustomUser.objects.filter(email=email).exists():
            self.stdout.write(f"  Skipped cashier (exists): {email}")
            return
        CustomUser.objects.create_user(
            email=email,
            password="cashier123",
            full_name="Family Academy Cashier",
            role=CustomUser.Role.CASHIER,
        )
        self.stdout.write(f"  Created cashier: {email}")

    def _seed_teachers(self):
        teachers = [
            ("teacher1@family.com", "Teacher One"),
            ("teacher2@family.com", "Teacher Two"),
            ("teacher3@family.com", "Teacher Three"),
        ]
        for email, full_name in teachers:
            user, created = CustomUser.objects.get_or_create(
                email=email,
                defaults={
                    "full_name": full_name,
                    "role": CustomUser.Role.CLASS_TEACHER,
                    "is_staff": True,
                },
            )
            if created:
                user.set_password("teacher123")
                user.save()
                self.stdout.write(f"  Created teacher user: {email}")

            teacher, _ = Teacher.objects.get_or_create(
                user=user,
                defaults={"joined_at": date(2024, 1, 15)},
            )
            if not teacher.joined_at:
                teacher.joined_at = date(2024, 1, 15)
                teacher.save(update_fields=["joined_at"])

    def _seed_parents(self):
        parents = [
            ("+1234567890", "Parent One"),
            ("+0987654321", "Parent Two"),
        ]
        for phone, full_name in parents:
            if CustomUser.objects.filter(phone=phone).exists():
                continue
            CustomUser.objects.create_user(
                phone=phone,
                password="parent123",
                full_name=full_name,
                role=CustomUser.Role.PARENT,
            )
            self.stdout.write(f"  Created parent: {phone}")

    def _seed_classes_and_assignments(self):
        class_defs = [
            ("KG1-A", "KG1", "A", "teacher1@family.com"),
            ("KG2-A", "KG2", "A", "teacher2@family.com"),
            ("KG3-A", "KG3", "A", "teacher3@family.com"),
            ("Grade 1-A", "Grade 1", "A", "teacher1@family.com"),
            ("Grade 2-A", "Grade 2", "A", "teacher2@family.com"),
            ("Grade 3-A", "Grade 3", "A", "teacher3@family.com"),
            ("Grade 4-A", "Grade 4", "A", "teacher1@family.com"),
        ]
        for name, grade, section, teacher_email in class_defs:
            school_class, created = SchoolClass.objects.get_or_create(
                name=name,
                defaults={"grade": grade, "section": section},
            )
            if created:
                self.stdout.write(f"  Created class: {name}")

            # Only assign teacher to first 3 classes to avoid conflicts
            if name in ["KG1-A", "KG2-A", "KG3-A"]:
                teacher = Teacher.objects.select_related("user").get(
                    user__email=teacher_email
                )
                if teacher.assigned_class_id != school_class.id:
                    teacher.assigned_class = school_class
                    try:
                        teacher.save()
                    except Exception:
                        # Teacher already has a class assigned, skip
                        pass

        for user in CustomUser.objects.filter(role=CustomUser.Role.CLASS_TEACHER):
            teacher, created = Teacher.objects.get_or_create(
                user=user,
                defaults={"joined_at": date(2024, 1, 15)},
            )
            if created:
                self.stdout.write(
                    f"  Repaired missing teacher profile for {user.email}"
                )

    def _seed_students(self):
        parent_one = CustomUser.objects.get(phone="+1234567890")
        parent_two = CustomUser.objects.get(phone="+0987654321")
        kg1_a = SchoolClass.objects.get(name="KG1-A")
        kg2_a = SchoolClass.objects.get(name="KG2-A")
        kg3_a = SchoolClass.objects.get(name="KG3-A")
        grade_1a = SchoolClass.objects.get(name="Grade 1-A")
        grade_3a = SchoolClass.objects.get(name="Grade 3-A")

        student_defs = [
            ("Alice Johnson", date(2020, 3, 12), Student.Gender.FEMALE, kg1_a),
            ("Bob Smith", date(2020, 7, 8), Student.Gender.MALE, kg1_a),
            ("Charlie Brown", date(2019, 1, 20), Student.Gender.MALE, kg2_a),
            ("Diana Prince", date(2019, 11, 5), Student.Gender.FEMALE, kg3_a),
            ("Ethan Hunt", date(2018, 5, 15), Student.Gender.MALE, grade_1a),
            ("Fiona Green", date(2017, 9, 22), Student.Gender.FEMALE, grade_3a),
        ]

        created_students = []
        for full_name, dob, gender, school_class in student_defs:
            student, created = Student.objects.get_or_create(
                full_name=full_name,
                school_class=school_class,
                defaults={"date_of_birth": dob, "gender": gender},
            )
            if created:
                self.stdout.write(
                    f"  Created student: {student.student_id} {full_name}"
                )
            created_students.append(student)

        links = [
            (created_students[0], parent_one, "Mother", True),
            (created_students[1], parent_two, "Father", True),
        ]
        for student, parent, relationship, is_primary in links:
            StudentParent.objects.get_or_create(
                student=student,
                parent=parent,
                defaults={
                    "relationship": relationship,
                    "is_primary": is_primary,
                },
            )

    def _seed_attendance(self):
        admin = CustomUser.objects.filter(role=CustomUser.Role.SUPER_ADMIN).first()
        teacher1 = CustomUser.objects.get(email="teacher1@family.com")
        today = timezone.localdate()
        statuses = [
            AttendanceRecord.Status.PRESENT,
            AttendanceRecord.Status.ABSENT,
            AttendanceRecord.Status.LATE,
            AttendanceRecord.Status.PRESENT,
        ]

        count = 0
        for student in Student.objects.select_related("school_class"):
            class_teacher = Teacher.objects.filter(
                assigned_class=student.school_class
            ).first()
            marker = class_teacher.user if class_teacher else teacher1
            for day_offset in range(5):
                record_date = today - timedelta(days=day_offset)
                status = statuses[(count + day_offset) % len(statuses)]
                record, created = AttendanceRecord.objects.update_or_create(
                    student=student,
                    date=record_date,
                    defaults={
                        "school_class": student.school_class,
                        "status": status,
                        "marked_by": marker,
                    },
                )
                if day_offset >= 1:
                    record.submitted_at = timezone.now() - timedelta(days=day_offset)
                    record.save(update_fields=["submitted_at"])
                if day_offset >= 2:
                    record.approved_by = admin
                    record.approved_at = timezone.now() - timedelta(days=day_offset)
                    record.save(update_fields=["approved_by", "approved_at"])
                count += 1

        self.stdout.write("  Seeded attendance for last 5 days (all students)")

    def _seed_marks(self):
        admin = CustomUser.objects.filter(role=CustomUser.Role.SUPER_ADMIN).first()
        teacher1 = CustomUser.objects.get(email="teacher1@family.com")
        semester = "Term 1 2026"
        subjects = ["Mathematics", "English", "Science"]
        base_scores = [92, 88, 85, 78, 90, 86, 82, 95, 91, 87, 89, 93, 84, 88, 91, 87]

        for index, student in enumerate(
            Student.objects.select_related("school_class").order_by("student_id")
        ):
            class_teacher = Teacher.objects.filter(
                assigned_class=student.school_class
            ).first()
            submitter = class_teacher.user if class_teacher else teacher1
            for sub_index, subject in enumerate(subjects):
                score = base_scores[index % len(base_scores)] - sub_index * 3
                mark, _ = MarkEntry.objects.update_or_create(
                    student=student,
                    subject=subject,
                    semester=semester,
                    defaults={
                        "score": score,
                        "submitted_by": submitter,
                    },
                )
                mark.submitted_at = timezone.now()
                mark.save(update_fields=["submitted_at"])
                if (index + sub_index) % 2 == 0:
                    mark.approved_by = admin
                    mark.approved_at = timezone.now()
                    mark.save(update_fields=["approved_by", "approved_at"])

        self.stdout.write("  Seeded marks (3 subjects, mixed approval status)")

    def _seed_enrollments(self):
        cashier = CustomUser.objects.filter(role=CustomUser.Role.CASHIER).first()
        admin = CustomUser.objects.filter(role=CustomUser.Role.SUPER_ADMIN).first()
        
        # Create 3 sample enrollment requests
        enrollments = [
            {
                "first_name": "John",
                "middle_name": "Michael",
                "last_name": "Doe",
                "gender": "M",
                "date_of_birth": date(2018, 5, 15),
                "academic_year": "2024-2025",
                "grade_applying": "Grade 1",
                "phone_number": "+251911234567",
                "email": "parent1@example.com",
                "father_name": "Robert Doe",
                "father_phone": "+251911234568",
                "mother_name": "Jane Doe",
                "mother_phone": "+251911234569",
                "country": "Ethiopia",
                "city": "Addis Ababa",
                "full_address": "Bole Subcity, Addis Ababa",
                "emergency_contact_name": "Robert Doe",
                "emergency_contact_phone": "+251911234568",
                "registration_fee_paid": 500.00,
                "payment_status": "PAID",
                "status": EnrollmentStatus.PENDING,
            },
            {
                "first_name": "Sarah",
                "middle_name": "Elizabeth",
                "last_name": "Smith",
                "gender": "F",
                "date_of_birth": date(2017, 8, 20),
                "academic_year": "2024-2025",
                "grade_applying": "Grade 2",
                "phone_number": "+251922345678",
                "email": "parent2@example.com",
                "father_name": "William Smith",
                "father_phone": "+251922345679",
                "mother_name": "Emily Smith",
                "mother_phone": "+251922345680",
                "country": "Ethiopia",
                "city": "Addis Ababa",
                "full_address": "Kolfe Subcity, Addis Ababa",
                "emergency_contact_name": "William Smith",
                "emergency_contact_phone": "+251922345679",
                "registration_fee_paid": 500.00,
                "payment_status": "PAID",
                "status": EnrollmentStatus.REVIEWED,
                "reviewed_by": cashier,
                "reviewed_at": timezone.now(),
                "cashier_notes": "Fee receipt verified. All documents present.",
            },
            {
                "first_name": "David",
                "middle_name": "James",
                "last_name": "Wilson",
                "gender": "M",
                "date_of_birth": date(2016, 3, 10),
                "academic_year": "2024-2025",
                "grade_applying": "Grade 3",
                "phone_number": "+251933456789",
                "email": "parent3@example.com",
                "father_name": "Thomas Wilson",
                "father_phone": "+251933456790",
                "mother_name": "Maria Wilson",
                "mother_phone": "+251933456791",
                "country": "Ethiopia",
                "city": "Addis Ababa",
                "full_address": "Yeka Subcity, Addis Ababa",
                "emergency_contact_name": "Thomas Wilson",
                "emergency_contact_phone": "+251933456790",
                "registration_fee_paid": 500.00,
                "payment_status": "PAID",
                "status": EnrollmentStatus.APPROVED,
                "reviewed_by": cashier,
                "reviewed_at": timezone.now(),
                "cashier_notes": "Fee receipt verified. All documents present.",
                "approved_by": admin,
                "approved_at": timezone.now(),
            },
        ]

        for enrollment_data in enrollments:
            status = enrollment_data.pop("status")
            reviewed_by = enrollment_data.pop("reviewed_by", None)
            reviewed_at = enrollment_data.pop("reviewed_at", None)
            cashier_notes = enrollment_data.pop("cashier_notes", None)
            approved_by = enrollment_data.pop("approved_by", None)
            approved_at = enrollment_data.pop("approved_at", None)

            enrollment, created = EnrollmentRequest.objects.get_or_create(
                first_name=enrollment_data["first_name"],
                last_name=enrollment_data["last_name"],
                defaults=enrollment_data,
            )

            if created:
                enrollment.status = status
                if reviewed_by:
                    enrollment.reviewed_by = reviewed_by
                    enrollment.reviewed_at = reviewed_at
                if cashier_notes:
                    enrollment.cashier_notes = cashier_notes
                if approved_by:
                    enrollment.approved_by = approved_by
                    enrollment.approved_at = approved_at
                    # Create student for approved enrollment
                    # Assign to a default class based on grade_applying
                    default_class = SchoolClass.objects.first()
                    student = Student.objects.create(
                        full_name=f"{enrollment.first_name} {enrollment.middle_name} {enrollment.last_name}".strip(),
                        date_of_birth=enrollment.date_of_birth,
                        gender=enrollment.gender,
                        school_class=default_class,
                        enrolled_at=date.today(),
                    )
                    enrollment.student = student
                enrollment.save()
                self.stdout.write(f"  Created enrollment: {enrollment.admission_number} - {status}")
