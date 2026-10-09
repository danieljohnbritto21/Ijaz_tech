from django.db import models


class Project(models.Model):
    """Portfolio project model for case studies."""
    
    SERVICE_CHOICES = [
        ('ai-automation', 'AI & Automation'),
        ('software-development', 'Software Development'),
        ('web-mobile', 'Web & Mobile Applications'),
        ('it-consulting', 'IT Consulting & Support'),
    ]
    
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    industry = models.CharField(max_length=100)
    service_category = models.CharField(max_length=50, choices=SERVICE_CHOICES)
    thumbnail = models.ImageField(upload_to='projects/thumbnails/', blank=True)
    hero_image = models.ImageField(upload_to='projects/heroes/', blank=True)
    
    # Case study content
    short_description = models.TextField(max_length=300, help_text="Brief description for cards")
    challenge = models.TextField(help_text="Business challenge description")
    objectives = models.TextField(blank=True, help_text="Project objectives")
    solution = models.TextField(help_text="Solution approach description")
    implementation = models.TextField(blank=True, help_text="Implementation details")
    features = models.TextField(blank=True, help_text="Main features, one per line")
    technologies = models.CharField(max_length=500, help_text="Comma-separated technologies")
    outcomes = models.TextField(blank=True, help_text="Verified outcomes")
    lessons = models.TextField(blank=True, help_text="Lessons learned")
    
    # Display
    is_featured = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', '-created_at']
    
    def __str__(self):
        return self.title
    
    def get_features_list(self):
        if self.features:
            return [f.strip() for f in self.features.split('\n') if f.strip()]
        return []
    
    def get_technologies_list(self):
        if self.technologies:
            return [t.strip() for t in self.technologies.split(',') if t.strip()]
        return []


class ProjectImage(models.Model):
    """Additional screenshots/images for a project."""
    project = models.ForeignKey(Project, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='projects/gallery/')
    caption = models.CharField(max_length=200, blank=True)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.project.title} - Image {self.order}"
