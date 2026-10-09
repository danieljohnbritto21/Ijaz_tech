from django.urls import path
from . import views

urlpatterns = [
    path('', views.portfolio_list, name='portfolio'),
    path('<slug:slug>/', views.project_detail, name='project-detail'),
]
