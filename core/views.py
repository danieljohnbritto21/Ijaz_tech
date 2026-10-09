from django.shortcuts import render
from portfolio.models import Project


def home(request):
    """Homepage view."""
    featured_projects = Project.objects.filter(is_featured=True)[:3]
    return render(request, 'core/home.html', {
        'featured_projects': featured_projects,
    })


def about(request):
    """About Us page."""
    return render(request, 'core/about.html')


def process(request):
    """Our Process page."""
    return render(request, 'core/process.html')


def insights(request):
    """Insights/Blog page."""
    return render(request, 'core/insights.html')


def privacy(request):
    """Privacy Policy page."""
    return render(request, 'core/privacy.html')


def custom_404(request, exception):
    """Custom 404 error page."""
    return render(request, 'core/404.html', status=404)
