from django.urls import path
from . import views

urlpatterns = [
    path('', views.services_overview, name='services'),
    path('ai-automation/', views.ai_automation, name='ai-automation'),
    path('software-development/', views.software_development, name='software-development'),
    path('web-mobile/', views.web_mobile, name='web-mobile'),
    path('it-consulting/', views.it_consulting, name='it-consulting'),
]
