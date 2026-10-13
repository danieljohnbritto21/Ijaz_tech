from django.db import models


class Inquiry(models.Model):
    """Contact/project inquiry model."""
    
    SERVICE_CHOICES = [
        ('', 'Select a service'),
        ('ai-automation', 'AI & Automation'),
        ('software-development', 'Software Development'),
        ('web-mobile', 'Web & Mobile Applications'),
        ('it-consulting', 'IT Consulting & Support'),
        ('not-sure', 'Not sure yet'),
    ]
    
    BUDGET_CHOICES = [
        ('', 'Select budget'),
        ('offer-399', 'First-time offer ₹399'),
        ('under-10k', 'Under ₹10,000'),
        ('10k-25k', '₹10,000 – ₹25,000'),
        ('25k-50k', '₹25,000 – ₹50,000'),
        ('50k-1-lakh', '₹50,000 – ₹1,00,000'),
        ('not-sure', 'Not sure yet'),
        # Backward compatibility for legacy database records in Django Admin
        ('under-50k', 'Under ₹50,000 (legacy)'),
        ('50k-2-lakh', '₹50,000 – ₹2,00,000 (legacy)'),
        ('2-5-lakh', '₹2,00,000 – ₹5,00,000 (legacy)'),
        ('5-10-lakh', '₹5,00,000 – ₹10,00,000 (legacy)'),
        ('10-lakh-plus', '₹10,00,000+ (legacy)'),
        ('discuss', 'Prefer to discuss (legacy)'),
        ('<25k', 'Under ₹25,000 (legacy)'),
        ('1l-2.5l', '₹1,00,000 - ₹2,50,000 (legacy)'),
        ('2.5l+', '₹2,50,000+ (legacy)'),
    ]
    
    TIMELINE_CHOICES = [
        ('', 'Select timeline (optional)'),
        ('asap', 'As soon as possible'),
        ('1-3-months', '1–3 months'),
        ('3-6-months', '3–6 months'),
        ('6-plus-months', '6+ months'),
        ('flexible', 'Flexible'),
    ]
    
    CONTACT_METHOD_CHOICES = [
        ('', 'Preferred contact method (optional)'),
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('video-call', 'Video Call'),
        ('any', 'Any method'),
    ]
    
    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    company = models.CharField(max_length=200, blank=True)
    service = models.CharField(max_length=50, choices=SERVICE_CHOICES)
    requirements = models.TextField(help_text="Describe your project requirements")
    budget = models.CharField(max_length=50, choices=BUDGET_CHOICES, blank=True)
    timeline = models.CharField(max_length=50, choices=TIMELINE_CHOICES, blank=True)
    contact_method = models.CharField(max_length=50, choices=CONTACT_METHOD_CHOICES, blank=True)
    privacy_consent = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    notes = models.TextField(blank=True, help_text="Internal notes")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Inquiries'
    
    def __str__(self):
        return f"{self.full_name} - {self.get_service_display()} ({self.created_at.strftime('%Y-%m-%d')})"
