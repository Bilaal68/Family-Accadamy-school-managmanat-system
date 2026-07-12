from rest_framework import serializers

from .models import EnrollmentDocument, EnrollmentRequest, EnrollmentStatus


class EnrollmentDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    document_type_label = serializers.CharField(
        source="get_document_type_display", read_only=True
    )

    class Meta:
        model = EnrollmentDocument
        fields = [
            "id",
            "document_type",
            "document_type_label",
            "file_url",
            "uploaded_at",
        ]
        read_only_fields = ["id", "uploaded_at"]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


def _photo_url(obj, field_name, context):
    request = context.get("request")
    photo = getattr(obj, field_name, None)
    if photo and request:
        return request.build_absolute_uri(photo.url)
    return None


class EnrollmentDetailSerializer(serializers.ModelSerializer):
    documents = EnrollmentDocumentSerializer(many=True, read_only=True)
    reviewed_by_name = serializers.CharField(
        source="reviewed_by.full_name", read_only=True
    )
    approved_by_name = serializers.CharField(
        source="approved_by.full_name", read_only=True
    )
    full_name = serializers.SerializerMethodField()
    student_type = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()
    father_photo_url = serializers.SerializerMethodField()
    mother_photo_url = serializers.SerializerMethodField()
    fee_receipt_url = serializers.SerializerMethodField()
    student_id = serializers.CharField(source="student.student_id", read_only=True)

    class Meta:
        model = EnrollmentRequest
        fields = [
            # Basic Details
            "id",
            "admission_number",
            "status",
            "first_name",
            "middle_name",
            "last_name",
            "full_name",
            "student_type",
            "gender",
            "date_of_birth",
            "nationality",
            "photo_url",
            # Academic
            "academic_year",
            "grade_applying",
            "enrollment_date",
            "previous_school",
            "is_transfer",
            # Father
            "father_name",
            "father_phone",
            "father_occupation",
            "father_photo_url",
            # Mother
            "mother_name",
            "mother_phone",
            "mother_occupation",
            "mother_photo_url",
            # Guardian
            "guardian_name",
            "guardian_relationship",
            "guardian_phone",
            # Address
            "country",
            "region",
            "city",
            "sub_city",
            "full_address",
            # Emergency
            "emergency_contact_name",
            "emergency_contact_relationship",
            "emergency_contact_phone",
            # Payment
            "registration_fee_paid",
            "payment_status",
            "fee_receipt_url",
            # Workflow
            "cashier_notes",
            "reviewed_by_name",
            "reviewed_at",
            "approved_by_name",
            "approved_at",
            "rejection_reason",
            # Documents
            "documents",
            # Created student
            "student_id",
            # Timestamps
            "created_at",
            "updated_at",
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.middle_name} {obj.last_name}".strip()

    def get_student_type(self, obj):
        return "Transfer Student" if obj.is_transfer else "New Student"

    def get_photo_url(self, obj):
        return _photo_url(obj, "photo", self.context)

    def get_father_photo_url(self, obj):
        return _photo_url(obj, "father_photo", self.context)

    def get_mother_photo_url(self, obj):
        return _photo_url(obj, "mother_photo", self.context)

    def get_fee_receipt_url(self, obj):
        request = self.context.get("request")
        if obj.fee_receipt and request:
            return request.build_absolute_uri(obj.fee_receipt.url)
        return None


class EnrollmentListSerializer(serializers.ModelSerializer):
    documents = EnrollmentDocumentSerializer(many=True, read_only=True)
    full_name = serializers.SerializerMethodField()
    student_type = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()
    father_photo_url = serializers.SerializerMethodField()
    mother_photo_url = serializers.SerializerMethodField()
    fee_receipt_url = serializers.SerializerMethodField()

    class Meta:
        model = EnrollmentRequest
        fields = [
            "id",
            "admission_number",
            "first_name",
            "middle_name",
            "last_name",
            "full_name",
            "student_type",
            "gender",
            "date_of_birth",
            "place_of_birth",
            "nationality",
            "photo",
            "phone_number",
            "email",
            "academic_year",
            "grade_applying",
            "section_preference",
            "enrollment_date",
            "previous_school",
            "is_transfer",
            "father_name",
            "father_phone",
            "father_occupation",
            "mother_name",
            "mother_phone",
            "mother_occupation",
            "guardian_name",
            "guardian_relationship",
            "guardian_phone",
            "country",
            "region",
            "city",
            "sub_city",
            "full_address",
            "emergency_contact_name",
            "emergency_contact_relationship",
            "emergency_contact_phone",
            "registration_fee_paid",
            "tuition_plan",
            "scholarship_discount",
            "payment_status",
            "fee_receipt",
            "status",
            "reviewed_by",
            "reviewed_at",
            "cashier_notes",
            "approved_by",
            "approved_at",
            "rejection_reason",
            "created_at",
            "updated_at",
            "student",
            "documents",
            "photo_url",
            "father_photo_url",
            "mother_photo_url",
            "fee_receipt_url",
        ]
        read_only_fields = [
            "id",
            "admission_number",
            "enrollment_date",
            "status",
            "reviewed_by",
            "reviewed_at",
            "approved_by",
            "approved_at",
            "created_at",
            "updated_at",
            "student",
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.middle_name} {obj.last_name}".strip()

    def get_student_type(self, obj):
        return "Transfer Student" if obj.is_transfer else "New Student"

    def get_photo_url(self, obj):
        return _photo_url(obj, "photo", self.context)

    def get_father_photo_url(self, obj):
        return _photo_url(obj, "father_photo", self.context)

    def get_mother_photo_url(self, obj):
        return _photo_url(obj, "mother_photo", self.context)

    def get_fee_receipt_url(self, obj):
        request = self.context.get("request")
        if obj.fee_receipt and request:
            return request.build_absolute_uri(obj.fee_receipt.url)
        return None


class EnrollmentRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnrollmentRequest
        fields = [
            "first_name",
            "middle_name",
            "last_name",
            "gender",
            "date_of_birth",
            "place_of_birth",
            "nationality",
            "photo",
            "phone_number",
            "email",
            "academic_year",
            "grade_applying",
            "section_preference",
            "previous_school",
            "is_transfer",
            "father_name",
            "father_phone",
            "father_occupation",
            "father_photo",
            "mother_name",
            "mother_phone",
            "mother_occupation",
            "mother_photo",
            "guardian_name",
            "guardian_relationship",
            "guardian_phone",
            "country",
            "region",
            "city",
            "sub_city",
            "full_address",
            "emergency_contact_name",
            "emergency_contact_relationship",
            "emergency_contact_phone",
            "registration_fee_paid",
            "tuition_plan",
            "scholarship_discount",
            "payment_status",
            "fee_receipt",
            "cashier_notes",
        ]

    def validate(self, attrs):
        request = self.context.get("request")
        files = request.FILES if request else {}
        errors = {}

        text_required = {
            "first_name": "First name is required.",
            "middle_name": "Middle name is required.",
            "last_name": "Last name is required.",
            "gender": "Gender is required.",
            "date_of_birth": "Date of birth is required.",
            "academic_year": "Academic year is required.",
            "grade_applying": "Grade applying for is required.",
            "father_name": "Father name is required.",
            "father_phone": "Father phone number is required.",
            "father_occupation": "Father occupation is required.",
            "mother_name": "Mother name is required.",
            "mother_phone": "Mother phone number is required.",
            "mother_occupation": "Mother occupation is required.",
            "full_address": "Address is required.",
            "city": "City is required.",
            "emergency_contact_name": "Emergency contact name is required.",
            "emergency_contact_phone": "Emergency contact phone is required.",
        }

        if not (attrs.get("academic_year") or "").strip():
            attrs["academic_year"] = "2025/2026"

        for field, message in text_required.items():
            value = attrs.get(field)
            if value is None or (isinstance(value, str) and not value.strip()):
                errors[field] = message

        if not files.get("photo") and not attrs.get("photo"):
            errors["photo"] = "Student photo is required."
        if not files.get("father_photo") and not attrs.get("father_photo"):
            errors["father_photo"] = "Father photo is required."
        if not files.get("mother_photo") and not attrs.get("mother_photo"):
            errors["mother_photo"] = "Mother photo is required."

        is_transfer = attrs.get("is_transfer", False)
        if isinstance(is_transfer, str):
            is_transfer = is_transfer.lower() in ("true", "1", "yes")
            attrs["is_transfer"] = is_transfer

        if is_transfer:
            if not (attrs.get("previous_school") or "").strip():
                errors["previous_school"] = (
                    "Previous school is required for transfer students."
                )
            transfer_docs = {
                "birth_certificate": "Birth certificate is required.",
                "transcript": "Previous school report card is required.",
                "transfer_letter": "Transfer letter is required.",
            }
            for doc_key, message in transfer_docs.items():
                if not files.get(f"documents.{doc_key}"):
                    errors[doc_key] = message
        elif not files.get("documents.birth_certificate"):
            errors["birth_certificate"] = "Birth certificate is required."

        if errors:
            raise serializers.ValidationError(errors)

        return attrs


class EnrollmentReviewSerializer(serializers.Serializer):
    cashier_notes = serializers.CharField(required=False, allow_blank=True)
    payment_status = serializers.ChoiceField(
        choices=[("UNPAID", "Unpaid"), ("PARTIAL", "Partial"), ("PAID", "Paid")],
        required=False,
    )
    registration_fee_paid = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False
    )


class EnrollmentApproveSerializer(serializers.Serializer):
    pass


class EnrollmentRejectSerializer(serializers.Serializer):
    rejection_reason = serializers.CharField(required=True)


class EnrollmentStatsSerializer(serializers.Serializer):
    pending = serializers.IntegerField()
    reviewed = serializers.IntegerField()
    approved = serializers.IntegerField()
    rejected = serializers.IntegerField()
    total = serializers.IntegerField()
