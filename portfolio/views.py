from django.shortcuts import render, get_object_or_404, redirect
from .models import Project


def portfolio_list(request):
    """Redirect Our Work page to Services."""
    return redirect('services')


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
