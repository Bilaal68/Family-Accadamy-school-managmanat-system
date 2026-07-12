from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.classes.models import SchoolClass
from apps.students.models import Student
from apps.teachers.models import Teacher


class GlobalSearchView(APIView):
    """
    Global search endpoint for admin dashboard.
    Searches across students, teachers, and classes.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        
        if not query:
            return Response({
                'students': [],
                'teachers': [],
                'classes': [],
                'total': 0
            })
        
        # Search students
        students = Student.objects.filter(
            Q(full_name__icontains=query) |
            Q(student_id__icontains=query)
        ).select_related('school_class')[:5]
        
        student_results = [{
            'id': str(s.id),
            'type': 'student',
            'title': s.full_name,
            'subtitle': f"{s.student_id} • {s.school_class.name if s.school_class else 'No Class'}",
            'url': f'/admin/students/{s.id}'
        } for s in students]
        
        # Search teachers
        teachers = Teacher.objects.filter(
            Q(user__full_name__icontains=query) |
            Q(staff_id__icontains=query) |
            Q(user__email__icontains=query)
        ).select_related('user', 'assigned_class')[:5]
        
        teacher_results = [{
            'id': str(t.id),
            'type': 'teacher',
            'title': t.user.full_name,
            'subtitle': f"{t.staff_id} • {t.assigned_class.name if t.assigned_class else 'No Class'}",
            'url': f'/admin/teachers/{t.id}'
        } for t in teachers]
        
        # Search classes
        classes = SchoolClass.objects.filter(
            Q(name__icontains=query) |
            Q(grade__icontains=query) |
            Q(section__icontains=query)
        )[:5]
        
        class_results = [{
            'id': str(c.id),
            'type': 'class',
            'title': c.name,
            'subtitle': f"{c.grade} • Section {c.section}",
            'url': f'/admin/classes/{c.id}'
        } for c in classes]
        
        total = len(student_results) + len(teacher_results) + len(class_results)
        
        return Response({
            'students': student_results,
            'teachers': teacher_results,
            'classes': class_results,
            'total': total
        })
