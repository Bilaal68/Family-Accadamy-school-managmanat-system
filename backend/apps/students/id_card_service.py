import io
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
try:
    import qrcode
except ImportError:
    qrcode = None
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from django.conf import settings
from apps.enrollment.models import EnrollmentRequest

# Font paths
FONT_BOLD_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
]
FONT_REGULAR_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
]

def _get_font(candidates, size):
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()

def _get_template_paths():
    media_root = Path(settings.MEDIA_ROOT)
    front_path = media_root / "id_themplate" / "id_front_template.jpeg"
    back_path = media_root / "id_themplate" / "id_back_template.jpeg"
    if not front_path.exists():
        front_path = settings.BASE_DIR / "media" / "id_themplate" / "id_front_template.jpeg"
    if not back_path.exists():
        back_path = settings.BASE_DIR / "media" / "id_themplate" / "id_back_template.jpeg"
    return str(front_path), str(back_path)

def _get_student_parent_info(student):
    """
    Extract guardian name, relationship, emergency contact, and address
    from linked StudentParent or linked EnrollmentRequest.
    """
    guardian_name = ""
    relationship = ""
    emergency_contact = ""
    address = ""

    # 1. Try EnrollmentRequest first for detailed contacts
    enrollment = EnrollmentRequest.objects.filter(student=student).first()
    if enrollment:
        if enrollment.guardian_name:
            guardian_name = enrollment.guardian_name
            relationship = enrollment.guardian_relationship or "Guardian"
            emergency_contact = enrollment.guardian_phone or enrollment.emergency_contact_phone or enrollment.father_phone or enrollment.mother_phone
        elif enrollment.father_name:
            guardian_name = enrollment.father_name
            relationship = "Father / Abbaa"
            emergency_contact = enrollment.father_phone or enrollment.emergency_contact_phone
        elif enrollment.mother_name:
            guardian_name = enrollment.mother_name
            relationship = "Mother / Haadha"
            emergency_contact = enrollment.mother_phone or enrollment.emergency_contact_phone
        
        if not emergency_contact and enrollment.emergency_contact_phone:
            emergency_contact = enrollment.emergency_contact_phone

        address_parts = [p for p in [enrollment.city, enrollment.sub_city, enrollment.full_address] if p]
        if address_parts:
            address = ", ".join(address_parts)

    # 2. Fallback to StudentParent links
    if not guardian_name:
        link = student.parent_links.select_related("parent").first()
        if link and link.parent:
            guardian_name = link.parent.full_name
            relationship = link.relationship or "Parent"
            emergency_contact = link.parent.phone or ""

    return {
        "guardian_name": guardian_name or "Family Academy Parent",
        "relationship": relationship or "Guardian",
        "emergency_contact": emergency_contact or "+251 98 954 3580",
        "address": address or "Addis Ababa, Ethiopia",
    }

def generate_id_card_front_image(student=None, academic_year=None, manual_data=None, photo_file=None):
    """
    Renders front of student ID card using PIL and returns PIL.Image.
    Supports either an existing Student model instance or manual_data dictionary:
    manual_data = {
        'full_name': '...',
        'student_id': '...',
        'class_name': '...',
        'academic_year': '...',
    }
    """
    front_template_path, _ = _get_template_paths()
    image = Image.open(front_template_path).convert("RGB")
    draw = ImageDraw.Draw(image)

    font_name = _get_font(FONT_BOLD_CANDIDATES, 66)
    font_class = _get_font(FONT_BOLD_CANDIDATES, 62)
    font_year = _get_font(FONT_BOLD_CANDIDATES, 62)

    brand_blue = (16, 2, 107)

    # Resolve values
    if manual_data:
        full_name = manual_data.get("full_name") or ""
        student_id = manual_data.get("student_id") or ""
        class_name = manual_data.get("class_name") or "Not Assigned"
        academic_year = manual_data.get("academic_year") or academic_year
    elif student:
        full_name = student.full_name or ""
        student_id = student.student_id or ""
        class_name = student.school_class.name if student.school_class else "Not Assigned"
    else:
        full_name = ""
        student_id = ""
        class_name = "Not Assigned"

    # 1. Student Photo
    photo_box = (200, 712, 760, 1400)
    photo_w = photo_box[2] - photo_box[0]
    photo_h = photo_box[3] - photo_box[1]

    raw_photo_img = None
    if photo_file:
        try:
            raw_photo_img = Image.open(photo_file).convert("RGB")
        except Exception:
            pass
    elif student and student.photo and hasattr(student.photo, "path") and os.path.exists(student.photo.path):
        try:
            raw_photo_img = Image.open(student.photo.path).convert("RGB")
        except Exception:
            pass

    if raw_photo_img:
        try:
            pw, ph = raw_photo_img.size
            target_ratio = photo_w / photo_h
            current_ratio = pw / ph
            if current_ratio > target_ratio:
                new_w = int(ph * target_ratio)
                offset = (pw - new_w) // 2
                raw_photo_img = raw_photo_img.crop((offset, 0, offset + new_w, ph))
            else:
                new_h = int(pw / target_ratio)
                offset = (ph - new_h) // 2
                raw_photo_img = raw_photo_img.crop((0, offset, pw, offset + new_h))
            raw_photo_img = raw_photo_img.resize((photo_w, photo_h), Image.Resampling.LANCZOS)
            image.paste(raw_photo_img, (photo_box[0], photo_box[1]))
        except Exception:
            pass

    # 2. Full Name (calibrated to sit directly above the line at y=796 like pen writing)
    name_text = full_name.strip()
    if len(name_text) > 30:
        font_name_dyn = _get_font(FONT_BOLD_CANDIDATES, 48)
        y_name = 738
    elif len(name_text) > 22:
        font_name_dyn = _get_font(FONT_BOLD_CANDIDATES, 56)
        y_name = 730
    else:
        font_name_dyn = font_name
        y_name = 722
    draw.text((1120, y_name), name_text, fill=brand_blue, font=font_name_dyn)

    # 3. Student ID in pill (clear area and draw crisp high-visibility container)
    # Clear the template's placeholder area to eliminate background ghost lines
    draw.rectangle([830, 890, 1850, 1025], fill=(255, 255, 255))

    font_label = _get_font(FONT_BOLD_CANDIDATES, 54)
    draw.text((850, 920), "Student ID", fill=(0, 0, 0), font=font_label)

    # High-contrast ID badge pill with subtle blue border
    pill_box = [1240, 905, 1840, 1015]
    draw.rounded_rectangle(pill_box, radius=24, fill=(240, 243, 252), outline=brand_blue, width=4)

    font_id_lg = _get_font(FONT_BOLD_CANDIDATES, 62)
    id_text = student_id or "STU-00001"
    bbox = draw.textbbox((0, 0), id_text, font=font_id_lg)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = pill_box[0] + (pill_box[2] - pill_box[0] - tw) // 2
    ty = pill_box[1] + (pill_box[3] - pill_box[1] - th) // 2 - 4
    draw.text((tx, ty), id_text, fill=brand_blue, font=font_id_lg)

    # 4. Class Name (calibrated to sit right on dashed line at y=1178 like pen writing)
    draw.text((1090, 1106), class_name, fill=brand_blue, font=font_class)

    # 5. Academic Year (calibrated to sit right on dashed line at y=1362 like pen writing)
    if not academic_year:
        year_now = student.enrolled_at.year if (student and student.enrolled_at) else 2026
        academic_year = f"{year_now} / {year_now + 1}"
    draw.text((1460, 1290), str(academic_year), fill=brand_blue, font=font_year)

    # 6. QR Code inside placeholder box [1900..2330, 800..1240]
    if qrcode is not None:
        try:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=10,
                border=1,
            )
            qr_content = f"ID:{student_id}|NAME:{full_name}|CLASS:{class_name}"
            qr.add_data(qr_content)
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="#10026B", back_color="white").convert("RGB")
            qr_img = qr_img.resize((410, 410), Image.Resampling.LANCZOS)
            # Clear template placeholder text
            draw.rectangle([1900, 800, 2330, 1240], fill=(255, 255, 255))
            image.paste(qr_img, (1910, 815))
        except Exception:
            pass

    return image

def generate_id_card_back_image(student=None, manual_data=None):
    """
    Renders back of student ID card using PIL and returns PIL.Image
    """
    _, back_template_path = _get_template_paths()
    image = Image.open(back_template_path).convert("RGB")
    draw = ImageDraw.Draw(image)

    font_bold = _get_font(FONT_BOLD_CANDIDATES, 54)
    brand_blue = (16, 2, 107)

    if manual_data:
        info = {
            "guardian_name": manual_data.get("guardian_name") or "Family Academy Parent",
            "relationship": manual_data.get("relationship") or "Guardian",
            "emergency_contact": manual_data.get("emergency_contact") or "+251 98 954 3580",
            "address": manual_data.get("address") or "Addis Ababa, Ethiopia",
        }
    elif student:
        info = _get_student_parent_info(student)
    else:
        info = {
            "guardian_name": "Family Academy Parent",
            "relationship": "Guardian",
            "emergency_contact": "+251 98 954 3580",
            "address": "Addis Ababa, Ethiopia",
        }

    # Guardian Name (dotted line y=726, text at y=650)
    draw.text((210, 650), info["guardian_name"], fill=brand_blue, font=font_bold)

    # Relationship (dotted line y=911, text at y=835)
    draw.text((210, 835), info["relationship"], fill=brand_blue, font=font_bold)

    # Emergency Contact (dotted line y=1096, text at y=1020)
    draw.text((210, 1020), info["emergency_contact"], fill=brand_blue, font=font_bold)

    # Address (dotted line y=1277, text at y=1205)
    addr = info["address"]
    if len(addr) > 50:
        font_addr = _get_font(FONT_BOLD_CANDIDATES, 44)
    else:
        font_addr = font_bold
    draw.text((210, 1205), addr, fill=brand_blue, font=font_addr)

    return image

def generate_single_student_id_pdf(student=None, academic_year=None, manual_data=None, photo_file=None):
    """
    Generates a printable A4 PDF (300 DPI equivalent) with Front and Back 
    of the Student ID Card side by side with cut marks and print guides.
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.utils import ImageReader

    front_img = generate_id_card_front_image(student, academic_year, manual_data=manual_data, photo_file=photo_file)
    back_img = generate_id_card_back_image(student, manual_data=manual_data)

    front_buf = io.BytesIO()
    # High resolution 300 DPI quality JPEG
    front_img.save(front_buf, format="JPEG", quality=95, optimize=True, dpi=(300, 300))
    front_buf.seek(0)

    back_buf = io.BytesIO()
    back_img.save(back_buf, format="JPEG", quality=95, optimize=True, dpi=(300, 300))
    back_buf.seek(0)

    pdf_buffer = io.BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=A4)
    page_w, page_h = A4

    # CR80 standard badge size in mm: 85.60 mm x 53.98 mm
    card_w = 85.60 * mm
    card_h = 53.98 * mm

    # Place Front and Back side by side centered on A4 sheet
    h_gap = 10 * mm
    total_w = (card_w * 2) + h_gap
    start_x = (page_w - total_w) / 2
    # Place in the upper third for convenient cutting / lamination
    start_y = page_h - 45 * mm - card_h

    # Draw Front & Back cards
    x_front = start_x
    x_back = start_x + card_w + h_gap

    c.drawImage(ImageReader(front_buf), x_front, start_y, width=card_w, height=card_h)
    c.drawImage(ImageReader(back_buf), x_back, start_y, width=card_w, height=card_h)

    # Cut guide borders (subtle clean cutting line only, no distracting text)
    c.setStrokeColor(colors.HexColor("#BBBBBB"))
    c.setLineWidth(0.5)
    c.rect(x_front, start_y, card_w, card_h)
    c.rect(x_back, start_y, card_w, card_h)

    c.showPage()
    c.save()
    pdf_buffer.seek(0)
    return pdf_buffer.getvalue()

def generate_multi_items_id_cards_pdf(items, academic_year=None):
    """
    Generates a printable A4 PDF at 300 DPI containing up to 5 items per A4 sheet
    (5 rows × 2 columns: Front & Back beside each other).
    Items can be Student model instances or dicts containing manual_data and optional photo_file.
    No under-card text labels or headers are printed, keeping the paper completely clean for use.
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.utils import ImageReader

    pdf_buffer = io.BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=A4)
    page_w, page_h = A4

    # CR80 standard badge size: 85.60 mm x 53.98 mm
    card_w = 85.60 * mm
    card_h = 53.98 * mm

    cards_per_page = 5
    h_gap = 10 * mm
    v_gap = 3.8 * mm

    total_w = (card_w * 2) + h_gap
    margin_x = (page_w - total_w) / 2
    margin_top = 8 * mm

    item_list = list(items)
    if not item_list:
        return b""

    for page_idx in range(0, len(item_list), cards_per_page):
        batch = item_list[page_idx : page_idx + cards_per_page]

        for row_idx, item in enumerate(batch):
            if isinstance(item, dict):
                # Manual item dict: { "manual_data": {...}, "photo_file": ... }
                manual_data = item.get("manual_data") or item
                photo_file = item.get("photo_file")
                front_img = generate_id_card_front_image(
                    student=None,
                    academic_year=academic_year or manual_data.get("academic_year"),
                    manual_data=manual_data,
                    photo_file=photo_file,
                )
                back_img = generate_id_card_back_image(student=None, manual_data=manual_data)
            else:
                # Student model
                front_img = generate_id_card_front_image(item, academic_year)
                back_img = generate_id_card_back_image(item)

            f_buf = io.BytesIO()
            front_img.save(f_buf, format="JPEG", quality=95, optimize=True, dpi=(300, 300))
            f_buf.seek(0)

            b_buf = io.BytesIO()
            back_img.save(b_buf, format="JPEG", quality=95, optimize=True, dpi=(300, 300))
            b_buf.seek(0)

            # Calculate row Y position (from top to bottom)
            y = page_h - margin_top - ((row_idx + 1) * card_h) - (row_idx * v_gap)
            x_front = margin_x
            x_back = margin_x + card_w + h_gap

            # Draw Front & Back beside each other
            c.drawImage(ImageReader(f_buf), x_front, y, width=card_w, height=card_h)
            c.drawImage(ImageReader(b_buf), x_back, y, width=card_w, height=card_h)

            # Draw precise clean cut guidelines (only light boundary lines)
            c.setStrokeColor(colors.HexColor("#CCCCCC"))
            c.setLineWidth(0.5)
            c.rect(x_front, y, card_w, card_h)
            c.rect(x_back, y, card_w, card_h)

        c.showPage()

    c.save()
    pdf_buffer.seek(0)
    return pdf_buffer.getvalue()

def generate_bulk_id_cards_pdf(students, academic_year=None):
    """
    Backwards-compatible wrapper around generate_multi_items_id_cards_pdf.
    """
    return generate_multi_items_id_cards_pdf(students, academic_year=academic_year)
