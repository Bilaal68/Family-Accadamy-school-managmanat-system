from .models import EnrollmentDocument

DOCUMENT_KEY_MAP = {
    "birth_certificate": "BIRTH_CERTIFICATE",
    "transcript": "TRANSCRIPT",
    "transfer_letter": "TRANSFER_LETTER",
    "other": "OTHER",
}


def save_enrollment_documents(enrollment, files):
    """Save uploaded document files from multipart form keys like documents.birth_certificate."""
    if not files:
        return

    for key, uploaded_file in files.items():
        if not uploaded_file:
            continue

        doc_key = None
        if key.startswith("documents."):
            doc_key = key.split(".", 1)[1]
        elif key in DOCUMENT_KEY_MAP:
            doc_key = key

        doc_type = DOCUMENT_KEY_MAP.get(doc_key)
        if not doc_type:
            continue

        EnrollmentDocument.objects.create(
            enrollment=enrollment,
            document_type=doc_type,
            file=uploaded_file,
        )
