// Volunteer Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Section Management
    const wayCards = document.querySelectorAll('.way-card');
    const sections = {
        volunteer: document.getElementById('volunteer-section'),
        donate: document.getElementById('donate-section'),
        blood: document.getElementById('blood-section')
    };

    function showSection(sectionName) {
        Object.values(sections).forEach(section => {
            if (section) section.style.display = 'none';
        });

        if (sections[sectionName]) {
            sections[sectionName].style.display = 'block';
            sections[sectionName].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    const hash = window.location.hash.substring(1);
    if (hash && sections[hash]) {
        showSection(hash);
    } else {
        showSection('volunteer');
    }

    wayCards.forEach(card => {
        const button = card.querySelector('.btn');
        if (button) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const section = card.dataset.section;
                showSection(section);
                window.location.hash = section;
            });
        }
    });

    // Age validation
    function validateAge(dateString) {
        const birthDate = new Date(dateString);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age >= 15 && age <= 80;
    }

    // Volunteer Form
    const volunteerForm = document.getElementById('volunteerForm');
    if (volunteerForm) {
        volunteerForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                birthdate: document.getElementById('birthdate').value,
                occupation: document.getElementById('occupation').value,
                skills: document.getElementById('skills').value,
                volunteerType: document.getElementById('volunteerType').value,
                availability: document.getElementById('availability').value,
                message: document.getElementById('message').value,
                terms: document.getElementById('terms').checked
            };

            let isValid = true;

            const requiredFields = [
                { id: 'firstName', rules: { required: true, minLength: 2 } },
                { id: 'lastName', rules: { required: true, minLength: 2 } },
                { id: 'email', rules: { required: true, email: true } },
                { id: 'phone', rules: { required: true, phone: true } },
                { id: 'address', rules: { required: true, minLength: 10 } },
                { id: 'birthdate', rules: { required: true, custom: validateAge, customMessage: 'You must be between 15 and 80 years old' } },
                { id: 'volunteerType', rules: { required: true } },
                { id: 'availability', rules: { required: true } },
                { id: 'message', rules: { required: true, minLength: 20 } }
            ];

            requiredFields.forEach(field => {
                const input = document.getElementById(field.id);
                if (!window.validateField(input, field.rules)) {
                    isValid = false;
                }
            });

            const termsCheckbox = document.getElementById('terms');
            const termsFormGroup = termsCheckbox.closest('.form-group');
            if (!termsCheckbox.checked) {
                isValid = false;
                termsFormGroup.classList.add('error');
                termsFormGroup.querySelector('.error-message').textContent = 'You must accept the terms and conditions';
            } else {
                termsFormGroup.classList.remove('error');
            }

            if (isValid) {
                const submitButton = volunteerForm.querySelector('button[type="submit"]');
                window.setLoadingState(submitButton, true);

                setTimeout(() => {
                    const volunteers = JSON.parse(localStorage.getItem('volunteers') || '[]');
                    volunteers.push({
                        ...formData,
                        id: Date.now(),
                        timestamp: new Date().toISOString()
                    });
                    localStorage.setItem('volunteers', JSON.stringify(volunteers));

                    window.setLoadingState(submitButton, false);
                    
                    window.showSuccess(
                        'Application Submitted!',
                        `Thank you ${formData.firstName}! We've received your volunteer application. Our team will contact you within 3-5 business days.`,
                        () => {
                            volunteerForm.reset();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    );
                }, 1500);
            }
        });

        volunteerForm.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('blur', function() {
                const fieldId = this.id;
                const requiredFields = [
                    { id: 'firstName', rules: { required: true, minLength: 2 } },
                    { id: 'lastName', rules: { required: true, minLength: 2 } },
                    { id: 'email', rules: { required: true, email: true } },
                    { id: 'phone', rules: { required: true, phone: true } },
                    { id: 'address', rules: { required: true, minLength: 10 } },
                    { id: 'birthdate', rules: { required: true, custom: validateAge, customMessage: 'You must be between 15 and 80 years old' } },
                    { id: 'volunteerType', rules: { required: true } },
                    { id: 'availability', rules: { required: true } },
                    { id: 'message', rules: { required: true, minLength: 20 } }
                ];
                const field = requiredFields.find(f => f.id === fieldId);
                if (field) {
                    window.validateField(this, field.rules);
                }
            });

            input.addEventListener('input', function() {
                const formGroup = this.closest('.form-group');
                if (formGroup.classList.contains('error')) {
                    formGroup.classList.remove('error');
                }
            });
        });
    }

    // Donation Form
    const donationForm = document.getElementById('donationForm');
    if (donationForm) {
        const amountButtons = document.querySelectorAll('.amount-btn');
        const donationAmountInput = document.getElementById('donationAmount');

        amountButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                amountButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');

                const amount = this.dataset.amount;
                if (amount !== 'custom') {
                    donationAmountInput.value = amount;
                    donationAmountInput.readOnly = true;
                } else {
                    donationAmountInput.value = '';
                    donationAmountInput.readOnly = false;
                    donationAmountInput.focus();
                }
            });
        });

        donationForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = {
                amount: document.getElementById('donationAmount').value,
                type: document.getElementById('donationType').value,
                name: document.getElementById('donorName').value,
                email: document.getElementById('donorEmail').value,
                phone: document.getElementById('donorPhone').value,
                recurring: document.getElementById('recurring').checked,
                anonymous: document.getElementById('anonymous').checked
            };

            let isValid = true;

            const donationFields = [
                { id: 'donationAmount', rules: { required: true, min: 100 } },
                { id: 'donationType', rules: { required: true } },
                { id: 'donorName', rules: { required: true, minLength: 3 } },
                { id: 'donorEmail', rules: { required: true, email: true } },
                { id: 'donorPhone', rules: { required: true, phone: true } }
            ];

            donationFields.forEach(field => {
                const input = document.getElementById(field.id);
                if (!window.validateField(input, field.rules)) {
                    isValid = false;
                }
            });

            if (isValid) {
                const submitButton = donationForm.querySelector('button[type="submit"]');
                window.setLoadingState(submitButton, true);

                setTimeout(() => {
                    const donations = JSON.parse(localStorage.getItem('donations') || '[]');
                    donations.push({
                        ...formData,
                        id: Date.now(),
                        timestamp: new Date().toISOString()
                    });
                    localStorage.setItem('donations', JSON.stringify(donations));

                    window.setLoadingState(submitButton, false);
                    
                    const recurringText = formData.recurring ? ' monthly recurring' : '';
                    window.showSuccess(
                        'Thank You for Your Donation!',
                        `Your${recurringText} donation of ₱${parseInt(formData.amount).toLocaleString()} will help us continue our humanitarian mission. A confirmation email has been sent to ${formData.email}.`,
                        () => {
                            donationForm.reset();
                            amountButtons[0].click();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    );
                }, 1500);
            }
        });

        donationForm.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('blur', function() {
                const fieldId = this.id;
                const donationFields = [
                    { id: 'donationAmount', rules: { required: true, min: 100 } },
                    { id: 'donationType', rules: { required: true } },
                    { id: 'donorName', rules: { required: true, minLength: 3 } },
                    { id: 'donorEmail', rules: { required: true, email: true } },
                    { id: 'donorPhone', rules: { required: true, phone: true } }
                ];
                const field = donationFields.find(f => f.id === fieldId);
                
                if (field) {
                    window.validateField(this, field.rules);
                }
            });

            input.addEventListener('input', function() {
                const formGroup = this.closest('.form-group');
                if (formGroup && formGroup.classList.contains('error')) {
                    formGroup.classList.remove('error');
                }
            });
        });
    }

    // Blood Donation Centers
    const bloodCenters = [
        { name: 'Manila Chapter Blood Center', address: 'Port Area, Manila', hours: '24/7' },
        { name: 'Quezon City Blood Center', address: 'Quezon Ave, QC', hours: '8AM - 5PM' },
        { name: 'Makati Blood Bank', address: 'Ayala Ave, Makati', hours: '9AM - 6PM' },
        { name: 'Cebu Chapter Blood Center', address: 'Cebu City', hours: '24/7' },
        { name: 'Davao Blood Services', address: 'Davao City', hours: '8AM - 5PM' }
    ];

    const bloodCentersContainer = document.getElementById('bloodCenters');
    if (bloodCentersContainer) {
        bloodCentersContainer.innerHTML = bloodCenters.map(center => `
            <div style="padding: 16px; background: var(--bg-light); border-radius: 8px; margin-bottom: 12px;">
                <h4 style="font-size: 18px; margin-bottom: 4px;">${center.name}</h4>
                <p style="color: var(--text-medium); margin-bottom: 4px;">📍 ${center.address}</p>
                <p style="color: var(--text-medium);">🕐 ${center.hours}</p>
            </div>
        `).join('');
    }

    const pageViews = JSON.parse(localStorage.getItem('pageViews') || '{}');
    pageViews.volunteer = (pageViews.volunteer || 0) + 1;
    localStorage.setItem('pageViews', JSON.stringify(pageViews));

    const selectedEvent = localStorage.getItem('selectedEvent');
    if (selectedEvent) {
        showSection('volunteer');
        if (window.showAlert) {
            window.showAlert(
                'Event Registration',
                'Complete the volunteer form below to register for the event.'
            );
        }
        localStorage.removeItem('selectedEvent');
    }

    console.log('Volunteer page JavaScript loaded successfully');
});