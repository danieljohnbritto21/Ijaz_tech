from django.shortcuts import render, get_object_or_404
from .models import Project


def portfolio_list(request):
    """Our Work page - all projects."""
    projects = Project.objects.all()
    service_filter = request.GET.get('service', '')
    if service_filter:
        projects = projects.filter(service_category=service_filter)
    return render(request, 'portfolio/list.html', {
        'projects': projects,
        'current_filter': service_filter,
    })


def project_detail(request, slug):
    """Individual project case study page."""
    project = get_object_or_404(Project, slug=slug)
    related_projects = Project.objects.filter(
        service_category=project.service_category
    ).exclude(pk=project.pk)[:2]
    return render(request, 'portfolio/detail.html', {
        'project': project,
        'related_projects': related_projects,
    })
