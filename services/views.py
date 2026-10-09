from django.shortcuts import render


def services_overview(request):
    """Services overview page."""
    return render(request, 'services/overview.html')


def ai_automation(request):
    """AI & Automation service page."""
    return render(request, 'services/ai_automation.html')


def software_development(request):
    """Software Development service page."""
    return render(request, 'services/software_development.html')


def web_mobile(request):
    """Web & Mobile Applications service page."""
    return render(request, 'services/web_mobile.html')


def it_consulting(request):
    """IT Consulting & Support service page."""
    return render(request, 'services/it_consulting.html')
