from django.contrib import admin
from .models import Project, ProjectImage


class ProjectImageInline(admin.TabularInline):
    model = ProjectImage
    extra = 1


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'service_category', 'industry', 'is_featured', 'order']
    list_filter = ['service_category', 'is_featured']
    prepopulated_fields = {'slug': ('title',)}
    inlines = [ProjectImageInline]
    search_fields = ['title', 'industry', 'technologies']
