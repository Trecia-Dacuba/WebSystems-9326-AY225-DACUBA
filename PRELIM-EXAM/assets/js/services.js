// Services Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Comprehensive Services Data
    const servicesData = [
        {
            id: 1,
            title: 'Emergency Response',
            category: 'disaster',
            icon: '🚨',
            description: 'Immediate deployment of rescue teams and relief operations during disasters and emergencies.',
            details: '24/7 emergency hotline, rapid response teams, search and rescue operations, emergency medical services, and coordination with local government units.',
            coverage: 'Nationwide'
        },
        {
            id: 2,
            title: 'Relief Operations',
            category: 'disaster',
            icon: '📦',
            description: 'Distribution of food, water, and essential supplies to disaster-affected communities.',
            details: 'Pre-positioned relief goods, emergency supply distribution, temporary shelter provision, and post-disaster recovery support.',
            coverage: 'All 82 Chapters'
        },
        {
            id: 3,
            title: 'Ambulance Services',
            category: 'health',
            icon: '🚑',
            description: 'Emergency medical transport and pre-hospital care services available nationwide.',
            details: 'Fully-equipped ambulances, trained paramedics, 24/7 availability, inter-facility transfers, and emergency medical assistance.',
            coverage: 'Major Cities'
        },
        {
            id: 4,
            title: 'Blood Donation Program',
            category: 'blood',
            icon: '🩸',
            description: 'Collection, testing, and distribution of safe blood for hospitals and patients in need.',
            details: 'Regular blood donation drives, blood typing services, component separation, safe storage facilities, and hospital blood supply.',
            coverage: 'Nationwide'
        },
        {
            id: 5,
            title: 'Blood Bank Services',
            category: 'blood',
            icon: '🏥',
            description: 'Maintenance of blood reserves and 24/7 blood availability for emergency cases.',
            details: 'Blood storage facilities, emergency blood supply, cross-matching services, and blood component therapy.',
            coverage: '40 Blood Centers'
        },
        {
            id: 6,
            title: 'First Aid Training',
            category: 'safety',
            icon: '🩹',
            description: 'Comprehensive courses on basic and advanced first aid techniques for all ages.',
            details: 'CPR training, wound management, emergency response, accident prevention, and certification programs.',
            coverage: 'All Chapters'
        },
        {
            id: 7,
            title: 'Water Safety Program',
            category: 'safety',
            icon: '🏊',
            description: 'Swimming and lifesaving skills training to prevent drowning incidents.',
            details: 'Learn to swim programs, lifeguard training, water rescue techniques, and beach safety education.',
            coverage: 'Coastal Areas'
        },
        {
            id: 8,
            title: 'Community Health Services',
            category: 'health',
            icon: '💊',
            description: 'Mobile clinics and health programs reaching underserved communities.',
            details: 'Medical consultations, basic laboratory tests, health education, disease prevention, and referral services.',
            coverage: 'Remote Areas'
        },
        {
            id: 9,
            title: 'Disaster Preparedness Training',
            category: 'disaster',
            icon: '📚',
            description: 'Education programs teaching communities how to prepare for and respond to disasters.',
            details: 'Evacuation planning, emergency kits preparation, family preparedness plans, and community drills.',
            coverage: 'Nationwide'
        },
        {
            id: 10,
            title: 'Youth Programs',
            category: 'welfare',
            icon: '👥',
            description: 'Engaging young people in humanitarian work and leadership development.',
            details: 'Red Cross Youth chapters, volunteer opportunities, leadership training, and humanitarian education.',
            coverage: 'Schools & Universities'
        },
        {
            id: 11,
            title: 'Restoring Family Links',
            category: 'welfare',
            icon: '🔗',
            description: 'Helping families separated by conflict, disaster, or migration to reconnect.',
            details: 'Tracing services, message relay, family reunification, and documentation assistance.',
            coverage: 'International'
        },
        {
            id: 12,
            title: 'Occupational First Aid',
            category: 'safety',
            icon: '👷',
            description: 'Workplace safety training and first aid programs for businesses and organizations.',
            details: 'Customized training programs, workplace assessments, emergency response planning, and certification.',
            coverage: 'Metro Manila'
        }
    ];

    let currentFilter = 'all';
    let currentSearch = '';

    // Render Services
    function renderServices(filter = 'all', searchTerm = '') {
        const servicesGrid = document.getElementById('servicesGrid');
        if (!servicesGrid) return;

        let filteredServices = servicesData;

        // Apply category filter
        if (filter !== 'all') {
            filteredServices = filteredServices.filter(s => s.category === filter);
        }

        // Apply search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filteredServices = filteredServices.filter(s => 
                s.title.toLowerCase().includes(search) ||
                s.description.toLowerCase().includes(search) ||
                s.details.toLowerCase().includes(search)
            );
        }

        // Update results count
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            resultsCount.textContent = `Showing ${filteredServices.length} of ${servicesData.length} services`;
        }

        // Render services
        servicesGrid.innerHTML = filteredServices.map(service => `
            <div class="service-card visible" data-category="${service.category}" data-service-id="${service.id}">
                <div class="service-icon">${service.icon}</div>
                <h3>${service.title}</h3>
                <p>${service.description}</p>
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                    <small style="color: var(--text-medium);">Coverage: ${service.coverage}</small>
                </div>
            </div>
        `).join('');

        if (filteredServices.length === 0) {
            servicesGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <div style="font-size: 64px; margin-bottom: 16px;">🔍</div>
                    <h3>No services found</h3>
                    <p style="color: var(--text-medium);">Try adjusting your search or filter</p>
                </div>
            `;
        }

        // Add click handlers
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', function() {
                const serviceId = parseInt(this.dataset.serviceId);
                showServiceModal(serviceId);
            });
        });

        // Animate cards
        setTimeout(() => {
            document.querySelectorAll('.service-card').forEach((card, index) => {
                card.style.animation = `fadeInUp 0.5s ease ${index * 0.1}s both`;
            });
        }, 50);
    }

    // Category Filter
    const filterButtons = document.querySelectorAll('.filter-btn[data-category]');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            currentFilter = this.dataset.category;
            renderServices(currentFilter, currentSearch);
        });
    });

    // Search Functionality
    const searchInput = document.getElementById('serviceSearch');
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            
            searchTimeout = setTimeout(() => {
                currentSearch = this.value.trim();
                renderServices(currentFilter, currentSearch);
            }, 300); // Debounce for 300ms
        });

        // Clear search on ESC key
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                currentSearch = '';
                renderServices(currentFilter, currentSearch);
            }
        });
    }

    // Show Service Modal
    function showServiceModal(serviceId) {
        const service = servicesData.find(s => s.id === serviceId);
        if (!service) return;

        const modalBody = document.getElementById('modalBody');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div class="service-modal-content">
                <div class="service-modal-icon" style="font-size: 80px; text-align: center; margin-bottom: 24px;">
                    ${service.icon}
                </div>
                <h2 style="text-align: center; margin-bottom: 16px;">${service.title}</h2>
                <p style="text-align: center; color: var(--text-medium); margin-bottom: 32px;">
                    ${service.description}
                </p>
                <div style="background: var(--bg-light); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
                    <h3 style="font-size: 20px; margin-bottom: 12px;">Service Details</h3>
                    <p style="color: var(--text-medium); line-height: 1.8;">
                        ${service.details}
                    </p>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-light); border-radius: 8px; margin-bottom: 24px;">
                    <span style="font-weight: 500;">Service Area:</span>
                    <span style="color: var(--primary-red); font-weight: 600;">${service.coverage}</span>
                </div>
                <div style="display: flex; gap: 16px; justify-content: center;">
                    <a href="volunteer.html" class="btn btn-primary">Request Service</a>
                    <a href="tel:0287902300" class="btn btn-secondary">Call Hotline</a>
                </div>
            </div>
        `;

        if (window.modalControllers && window.modalControllers.service) {
            window.modalControllers.service.openModal();
        }

        // Track service views
        trackServiceView(serviceId);
    }

    // Track service views in localStorage
    function trackServiceView(serviceId) {
        const viewedServices = JSON.parse(localStorage.getItem('viewedServices') || '{}');
        viewedServices[serviceId] = (viewedServices[serviceId] || 0) + 1;
        localStorage.setItem('viewedServices', JSON.stringify(viewedServices));
    }

    // Get most viewed services
    function getMostViewedServices() {
        const viewedServices = JSON.parse(localStorage.getItem('viewedServices') || '{}');
        return Object.entries(viewedServices)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([id]) => parseInt(id));
    }

    // Highlight popular services
    function highlightPopularServices() {
        const popularIds = getMostViewedServices();
        
        document.querySelectorAll('.service-card').forEach(card => {
            const serviceId = parseInt(card.dataset.serviceId);
            if (popularIds.includes(serviceId)) {
                card.style.borderColor = 'var(--primary-red)';
                card.style.borderWidth = '2px';
            }
        });
    }

    // Save page visit
    const pageViews = JSON.parse(localStorage.getItem('pageViews') || '{}');
    pageViews.services = (pageViews.services || 0) + 1;
    localStorage.setItem('pageViews', JSON.stringify(pageViews));

    // Initialize
    renderServices();
    
    // Highlight popular services after a delay
    setTimeout(highlightPopularServices, 1000);

    console.log('Services page JavaScript loaded successfully');
});