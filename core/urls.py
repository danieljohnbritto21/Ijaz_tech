from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('about/', views.about, name='about'),
    path('process/', views.process, name='process'),
    path('insights/', views.insights, name='insights'),
    path('privacy/', views.privacy, name='privacy'),
]
