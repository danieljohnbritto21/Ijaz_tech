from django import forms
from .models import Inquiry


class InquiryForm(forms.ModelForm):
    """Project inquiry form with validation."""
    
    class Meta:
        model = Inquiry
        fields = [
            'full_name', 'email', 'company', 'service',
            'requirements', 'budget', 'timeline',
            'contact_method', 'privacy_consent',
        ]
        widgets = {
            'full_name': forms.TextInput(attrs={
                'placeholder': 'Your full name',
                'autocomplete': 'name',
                'id': 'inquiry-name',
            }),
            'email': forms.EmailInput(attrs={
                'placeholder': 'your@email.com',
                'autocomplete': 'email',
                'id': 'inquiry-email',
            }),
            'company': forms.TextInput(attrs={
                'placeholder': 'Company name (optional)',
                'autocomplete': 'organization',
                'id': 'inquiry-company',
            }),
            'service': forms.Select(attrs={
                'id': 'inquiry-service',
            }),
            'requirements': forms.Textarea(attrs={
                'placeholder': 'Tell us about your project, goals, and any specific requirements...',
                'rows': 5,
                'id': 'inquiry-requirements',
            }),
            'budget': forms.Select(attrs={
                'id': 'inquiry-budget',
            }),
            'timeline': forms.Select(attrs={
                'id': 'inquiry-timeline',
            }),
            'contact_method': forms.Select(attrs={
                'id': 'inquiry-contact-method',
            }),
            'privacy_consent': forms.CheckboxInput(attrs={
                'id': 'inquiry-privacy',
            }),
        }
        labels = {
            'full_name': 'Full Name',
            'email': 'Business Email',
            'company': 'Company Name',
            'service': 'Service of Interest',
            'requirements': 'Project Requirements',
            'budget': 'Estimated Budget',
            'timeline': 'Desired Timeline',
            'contact_method': 'Preferred Contact Method',
            'privacy_consent': 'I agree to the privacy policy and consent to Ijaz_Solutions processing my information to respond to this inquiry.',
        }
    
    def clean_privacy_consent(self):
        consent = self.cleaned_data.get('privacy_consent')
        if not consent:
            raise forms.ValidationError('You must agree to the privacy policy to submit this form.')
        return consent
    
    def clean_requirements(self):
        requirements = self.cleaned_data.get('requirements', '')
        if len(requirements.strip()) < 20:
            raise forms.ValidationError('Please provide more detail about your project requirements (at least 20 characters).')
        return requirements
