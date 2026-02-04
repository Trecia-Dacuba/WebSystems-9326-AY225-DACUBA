// Main JavaScript - Shared functionality

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.nav-container')) {
                navMenu.classList.remove('active');
            }
        });

        // Close menu when clicking on a link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    const navHeight = navbar ? navbar.offsetHeight : 72;
                    const targetPosition = targetElement.offsetTop - navHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Number counter animation
    const animateCounter = (element) => {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const step = target / (duration / 16); // 60fps
        let current = 0;

        const updateCounter = () => {
            current += step;
            if (current < target) {
                element.textContent = Math.floor(current).toLocaleString();
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target.toLocaleString();
            }
        };

        updateCounter();
    };

    // Intersection Observer for counter animation
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                animateCounter(entry.target);
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);

    // Observe all counter elements
    document.querySelectorAll('[data-target]').forEach(counter => {
        observer.observe(counter);
    });

    // Modal functionality
    const initModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const overlay = modal.querySelector('.modal-overlay');
        const closeBtn = modal.querySelector('.modal-close');

        const openModal = () => {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const closeModal = () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (overlay) {
            overlay.addEventListener('click', closeModal);
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });

        return { openModal, closeModal };
    };

    // Initialize modals
    window.modalControllers = {
        campaign: initModal('campaignModal'),
        event: initModal('eventModal'),
        service: initModal('serviceModal'),
        success: initModal('successModal')
    };

    // Alert Modal
    const alertModal = document.getElementById('alertModal');
    if (alertModal) {
        const alertClose = document.getElementById('alertClose');
        if (alertClose) {
            alertClose.addEventListener('click', () => {
                alertModal.classList.remove('active');
            });
        }
    }

    window.showAlert = (title, message) => {
        if (!alertModal) return;
        
        const alertTitle = document.getElementById('alertTitle');
        const alertMessage = document.getElementById('alertMessage');
        
        if (alertTitle) alertTitle.textContent = title;
        if (alertMessage) alertMessage.textContent = message;
        
        alertModal.classList.add('active');
    };

    // Store form data in localStorage
    window.saveFormData = (formId, data) => {
        try {
            localStorage.setItem(formId, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    };

    window.getFormData = (formId) => {
        try {
            const data = localStorage.getItem(formId);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return null;
        }
    };

    window.clearFormData = (formId) => {
        try {
            localStorage.removeItem(formId);
            return true;
        } catch (e) {
            console.error('Error clearing localStorage:', e);
            return false;
        }
    };

    // Utility: Format date
    window.formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    // Utility: Validate email
    window.validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    // Utility: Validate phone
    window.validatePhone = (phone) => {
        const re = /^[\d\s\-\+\(\)]+$/;
        return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
    };

    // Form validation helper
    window.validateField = (input, validationRules) => {
        const formGroup = input.closest('.form-group');
        const errorMessage = formGroup.querySelector('.error-message');
        
        let isValid = true;
        let message = '';

        if (validationRules.required && !input.value.trim()) {
            isValid = false;
            message = 'This field is required';
        } else if (validationRules.email && input.value && !validateEmail(input.value)) {
            isValid = false;
            message = 'Please enter a valid email address';
        } else if (validationRules.phone && input.value && !validatePhone(input.value)) {
            isValid = false;
            message = 'Please enter a valid phone number';
        } else if (validationRules.min && input.value < validationRules.min) {
            isValid = false;
            message = `Minimum value is ${validationRules.min}`;
        } else if (validationRules.minLength && input.value.length < validationRules.minLength) {
            isValid = false;
            message = `Minimum length is ${validationRules.minLength} characters`;
        } else if (validationRules.custom && !validationRules.custom(input.value)) {
            isValid = false;
            message = validationRules.customMessage || 'Invalid input';
        }

        if (isValid) {
            formGroup.classList.remove('error');
            errorMessage.textContent = '';
        } else {
            formGroup.classList.add('error');
            errorMessage.textContent = message;
        }

        return isValid;
    };

    // Success message display
    window.showSuccess = (title, message, callback) => {
        const successModal = document.getElementById('successModal');
        if (!successModal) return;

        const successTitle = document.getElementById('successTitle');
        const successMessage = document.getElementById('successMessage');
        const successClose = document.getElementById('successClose');

        if (successTitle) successTitle.textContent = title;
        if (successMessage) successMessage.textContent = message;

        successModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const closeSuccess = () => {
            successModal.classList.remove('active');
            document.body.style.overflow = '';
            if (callback) callback();
        };

        if (successClose) {
            successClose.onclick = closeSuccess;
        }

        successModal.querySelector('.modal-overlay')?.addEventListener('click', closeSuccess);
    };

    // Loading state helper
    window.setLoadingState = (button, isLoading) => {
        if (!button) return;

        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = 'Please wait...';
            button.style.opacity = '0.6';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || 'Submit';
            button.style.opacity = '1';
        }
    };

    // Filter animation helper
    window.filterItems = (items, filterFn, animationDelay = 0) => {
        items.forEach((item, index) => {
            const shouldShow = filterFn(item);
            
            if (shouldShow) {
                setTimeout(() => {
                    item.style.display = '';
                    item.classList.add('visible');
                    // Add staggered animation
                    item.style.animation = `fadeInUp 0.5s ease ${index * 0.1}s both`;
                }, animationDelay);
            } else {
                item.style.display = 'none';
                item.classList.remove('visible');
            }
        });
    };

    console.log('Main JavaScript loaded successfully');
});