from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib import messages
from .forms import InquiryForm


def contact(request):
    """Contact page with project inquiry form."""
    if request.method == 'POST':
        form = InquiryForm(request.POST)
        if form.is_valid():
            form.save()
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'message': 'Thank you! Your inquiry has been submitted. We will review your requirements and get back to you soon.'
                })
            messages.success(request, 'Thank you! Your inquiry has been submitted successfully. We will review your requirements and get back to you soon.')
            return redirect('contact')
        else:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'errors': form.errors,
                }, status=400)
    else:
        form = InquiryForm()
    return render(request, 'contact/contact.html', {'form': form})
