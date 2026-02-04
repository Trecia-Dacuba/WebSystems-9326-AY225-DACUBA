// Events Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Upcoming Events Data
    const upcomingEventsData = [
        {
            id: 1,
            title: 'Blood Donation Drive - Makati',
            date: '2024-03-15',
            location: 'Metro Manila',
            description: 'Join us for our monthly blood donation drive at Ayala Center Makati.',
            type: 'blood'
        },
        {
            id: 2,
            title: 'First Aid Training Workshop',
            date: '2024-03-20',
            location: 'Quezon City',
            description: 'Free basic first aid and CPR training for community members.',
            type: 'training'
        },
        {
            id: 3,
            title: 'Disaster Preparedness Seminar',
            date: '2024-03-25',
            location: 'Metro Manila',
            description: 'Learn essential skills for disaster preparedness and response.',
            type: 'disaster'
        },
        {
            id: 4,
            title: 'Community Health Fair',
            date: '2024-04-05',
            location: 'Luzon',
            description: 'Free medical consultations and health screenings for the community.',
            type: 'health'
        },
        {
            id: 5,
            title: 'Youth Volunteer Orientation',
            date: '2024-04-10',
            location: 'Metro Manila',
            description: 'Introduction to Red Cross youth programs and volunteer opportunities.',
            type: 'volunteer'
        },
        {
            id: 6,
            title: 'Blood Donation Drive - Cebu',
            date: '2024-04-12',
            location: 'Visayas',
            description: 'Mobile blood donation event in partnership with local hospitals.',
            type: 'blood'
        },
        {
            id: 7,
            title: 'Water Safety Training',
            date: '2024-04-18',
            location: 'Luzon',
            description: 'Lifeguard and water rescue skills training for coastal communities.',
            type: 'training'
        },
        {
            id: 8,
            title: 'Emergency Response Drill',
            date: '2024-04-22',
            location: 'Mindanao',
            description: 'Simulation exercises for emergency response teams.',
            type: 'disaster'
        }
    ];

    // Active Campaigns Data
    const campaignsData = [
        {
            id: 1,
            title: 'Typhoon Relief Operations',
            description: 'Providing emergency aid and supplies to communities affected by recent typhoons.',
            category: 'disaster',
            icon: '🌀',
            goal: 5000000,
            raised: 3750000,
            urgent: true,
            startDate: '2024-01-15',
            status: 'Active'
        },
        {
            id: 2,
            title: 'Community Health Program',
            description: 'Mobile health clinics and medical missions in underserved communities.',
            category: 'health',
            icon: '💊',
            goal: 2000000,
            raised: 1200000,
            urgent: false,
            startDate: '2024-02-01',
            status: 'Active'
        },
        {
            id: 3,
            title: 'Blood Donation Drive',
            description: 'Urgent call for blood donors to replenish hospital blood banks nationwide.',
            category: 'blood',
            icon: '🩸',
            goal: 10000,
            raised: 6500,
            isUnits: true,
            urgent: true,
            startDate: '2024-02-15',
            status: 'Active'
        },
        {
            id: 4,
            title: 'Flood Relief Fund',
            description: 'Emergency relief for families displaced by severe flooding.',
            category: 'disaster',
            icon: '💧',
            goal: 3000000,
            raised: 2100000,
            urgent: true,
            startDate: '2024-03-01',
            status: 'Active'
        },
        {
            id: 5,
            title: 'School Supplies Campaign',
            description: 'Providing educational materials to students in remote areas.',
            category: 'community',
            icon: '📚',
            goal: 1500000,
            raised: 800000,
            urgent: false,
            startDate: '2024-01-20',
            status: 'Active'
        }
    ];

    // Past Events Data
    const pastEventsData = [
        {
            id: 101,
            title: 'National Blood Donors Month',
            date: '2024-01-31',
            year: '2024',
            description: 'Collected over 5,000 blood units during the month-long campaign.',
            participants: 5200,
            impact: '5,000+ blood units collected'
        },
        {
            id: 102,
            title: 'Earthquake Preparedness Summit',
            date: '2024-02-15',
            year: '2024',
            description: 'Regional summit on earthquake response and building resilience.',
            participants: 350,
            impact: '15 communities trained'
        },
        {
            id: 103,
            title: 'Volunteer Appreciation Day',
            date: '2023-12-10',
            year: '2023',
            description: 'Celebrating the dedication of our volunteers nationwide.',
            participants: 2000,
            impact: '2,000 volunteers recognized'
        },
        {
            id: 104,
            title: 'World First Aid Day',
            date: '2023-09-09',
            year: '2023',
            description: 'Free first aid training sessions across 50 chapters.',
            participants: 8000,
            impact: '8,000+ people trained'
        }
    ];

    // Tab Navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${targetTab}-tab`) {
                    content.classList.add('active');
                }
            });

            if (targetTab === 'upcoming') {
                renderUpcomingEvents();
            } else if (targetTab === 'campaigns') {
                renderCampaigns();
            } else if (targetTab === 'past') {
                renderPastEvents();
            }
        });
    });

    // Render functions
    function renderUpcomingEvents(monthFilter = 'all', locationFilter = 'all') {
        const eventsGrid = document.getElementById('upcomingEventsGrid');
        if (!eventsGrid) return;

        let filteredEvents = upcomingEventsData;

        if (monthFilter !== 'all') {
            filteredEvents = filteredEvents.filter(event => {
                const eventMonth = new Date(event.date).getMonth();
                return eventMonth === parseInt(monthFilter);
            });
        }

        if (locationFilter !== 'all') {
            filteredEvents = filteredEvents.filter(event => 
                event.location === locationFilter
            );
        }

        eventsGrid.innerHTML = filteredEvents.map(event => {
            const date = new Date(event.date);
            const day = date.getDate();
            const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

            return `
                <div class="event-card" data-event-id="${event.id}">
                    <div class="event-date">
                        <div class="event-day">${day}</div>
                        <div class="event-month">${month}</div>
                    </div>
                    <div class="event-content">
                        <h3>${event.title}</h3>
                        <p class="event-location">📍 ${event.location}</p>
                        <p>${event.description}</p>
                    </div>
                </div>
            `;
        }).join('');

        if (filteredEvents.length === 0) {
            eventsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <div style="font-size: 64px; margin-bottom: 16px;">📅</div>
                    <h3>No events found</h3>
                    <p style="color: var(--text-medium);">Check back later for upcoming events</p>
                </div>
            `;
        }

        document.querySelectorAll('.event-card').forEach(card => {
            card.addEventListener('click', function() {
                const eventId = parseInt(this.dataset.eventId);
                showEventModal(eventId);
            });
        });
    }

    const monthFilter = document.getElementById('monthFilter');
    const locationFilter = document.getElementById('locationFilter');

    if (monthFilter && locationFilter) {
        monthFilter.addEventListener('change', function() {
            renderUpcomingEvents(this.value, locationFilter.value);
        });

        locationFilter.addEventListener('change', function() {
            renderUpcomingEvents(monthFilter.value, this.value);
        });
    }

    function renderCampaigns(categoryFilter = 'all') {
        const campaignsGrid = document.getElementById('campaignsGrid');
        if (!campaignsGrid) return;

        let filteredCampaigns = categoryFilter === 'all' 
            ? campaignsData 
            : campaignsData.filter(c => c.category === categoryFilter);

        campaignsGrid.innerHTML = filteredCampaigns.map(campaign => {
            const percentage = Math.round((campaign.raised / campaign.goal) * 100);
            const displayGoal = campaign.isUnits 
                ? `${campaign.goal.toLocaleString()} units`
                : `₱${(campaign.goal / 1000000).toFixed(1)}M`;
            const displayRaised = campaign.isUnits
                ? `${campaign.raised.toLocaleString()} units`
                : `₱${(campaign.raised / 1000000).toFixed(1)}M`;

            return `
                <div class="campaign-card" data-category="${campaign.category}" data-campaign-id="${campaign.id}">
                    <div class="campaign-image">${campaign.icon}</div>
                    <div class="campaign-content">
                        ${campaign.urgent ? '<span class="campaign-badge">URGENT</span>' : ''}
                        <h3>${campaign.title}</h3>
                        <p>${campaign.description}</p>
                        <div class="campaign-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${percentage}%"></div>
                            </div>
                            <p class="progress-text">${displayRaised} raised of ${displayGoal} goal</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.campaign-card').forEach(card => {
            card.addEventListener('click', function() {
                const campaignId = parseInt(this.dataset.campaignId);
                showCampaignModal(campaignId);
            });
        });

        setTimeout(() => {
            document.querySelectorAll('.progress-fill').forEach(bar => {
                const width = bar.style.width;
                bar.style.width = '0';
                setTimeout(() => bar.style.width = width, 100);
            });
        }, 100);
    }

    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            renderCampaigns(this.dataset.category);
        });
    });

    function renderPastEvents(yearFilter = '2024') {
        const pastEventsGrid = document.getElementById('pastEventsGrid');
        if (!pastEventsGrid) return;

        const filteredEvents = pastEventsData.filter(event => event.year === yearFilter);

        pastEventsGrid.innerHTML = filteredEvents.map(event => {
            const date = new Date(event.date);
            const formattedDate = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

            return `
                <div class="event-card">
                    <div class="event-content">
                        <h3>${event.title}</h3>
                        <p class="event-location">📅 ${formattedDate}</p>
                        <p>${event.description}</p>
                        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                            <strong>Impact:</strong> ${event.impact}<br>
                            <strong>Participants:</strong> ${event.participants.toLocaleString()}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (filteredEvents.length === 0) {
            pastEventsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <div style="font-size: 64px; margin-bottom: 16px;">📂</div>
                    <h3>No past events for ${yearFilter}</h3>
                </div>
            `;
        }
    }

    const yearButtons = document.querySelectorAll('.year-btn');
    yearButtons.forEach(button => {
        button.addEventListener('click', function() {
            yearButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            renderPastEvents(this.dataset.year);
        });
    });

    function showEventModal(eventId) {
        const event = upcomingEventsData.find(e => e.id === eventId);
        if (!event) return;

        const modalBody = document.getElementById('modalBody');
        if (!modalBody) return;

        const date = new Date(event.date);
        const formattedDate = date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        modalBody.innerHTML = `
            <div class="event-modal-content">
                <h2 style="text-align: center; margin-bottom: 16px;">${event.title}</h2>
                <div style="text-align: center; color: var(--text-medium); margin-bottom: 32px;">
                    <p style="font-size: 18px;">📅 ${formattedDate}</p>
                    <p style="font-size: 18px;">📍 ${event.location}</p>
                </div>
                <div style="background: var(--bg-light); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
                    <p style="color: var(--text-dark); line-height: 1.8;">${event.description}</p>
                </div>
                <div style="display: flex; gap: 16px; justify-content: center;">
                    <button class="btn btn-primary" onclick="registerForEvent(${event.id})">Register Now</button>
                    <button class="btn btn-secondary" onclick="shareEvent(${event.id})">Share Event</button>
                </div>
            </div>
        `;

        if (window.modalControllers && window.modalControllers.event) {
            window.modalControllers.event.openModal();
        }
    }

    function showCampaignModal(campaignId) {
        const campaign = campaignsData.find(c => c.id === campaignId);
        if (!campaign) return;

        const modalBody = document.getElementById('modalBody');
        if (!modalBody) return;

        const percentage = Math.round((campaign.raised / campaign.goal) * 100);
        const displayGoal = campaign.isUnits 
            ? `${campaign.goal.toLocaleString()} units`
            : `₱${(campaign.goal / 1000000).toFixed(1)}M`;
        const displayRaised = campaign.isUnits
            ? `${campaign.raised.toLocaleString()} units`
            : `₱${(campaign.raised / 1000000).toFixed(1)}M`;

        modalBody.innerHTML = `
            <div class="campaign-modal-content">
                <div style="font-size: 80px; text-align: center; margin-bottom: 16px;">${campaign.icon}</div>
                ${campaign.urgent ? '<span class="campaign-badge" style="margin-bottom: 16px;">URGENT</span>' : ''}
                <h2 style="text-align: center; margin-bottom: 16px;">${campaign.title}</h2>
                <p style="text-align: center; color: var(--text-medium); margin-bottom: 32px; line-height: 1.8;">
                    ${campaign.description}
                </p>
                <div class="campaign-progress" style="margin-bottom: 24px;">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <p class="progress-text">${displayRaised} raised of ${displayGoal} goal</p>
                </div>
                <div style="display: flex; gap: 16px; justify-content: center;">
                    <a href="volunteer.html#donate" class="btn btn-primary">Support Campaign</a>
                    <button class="btn btn-secondary" onclick="shareCampaign(${campaign.id})">Share</button>
                </div>
            </div>
        `;

        if (window.modalControllers && window.modalControllers.event) {
            window.modalControllers.event.openModal();
        }

        if (campaign.urgent && window.showAlert) {
            setTimeout(() => {
                window.showAlert(
                    'Urgent Campaign',
                    'This campaign requires immediate attention. Your support can save lives!'
                );
            }, 500);
        }
    }

    window.registerForEvent = function(eventId) {
        localStorage.setItem('selectedEvent', eventId);
        window.location.href = 'volunteer.html';
    };

    window.shareEvent = function(eventId) {
        if (window.showSuccess) {
            window.showSuccess(
                'Share Event',
                'Event details copied! Share with your friends and family.'
            );
        }
    };

    window.shareCampaign = function(campaignId) {
        if (window.showSuccess) {
            window.showSuccess(
                'Share Campaign',
                'Campaign link copied! Help us spread the word.'
            );
        }
    };

    const pageViews = JSON.parse(localStorage.getItem('pageViews') || '{}');
    pageViews.events = (pageViews.events || 0) + 1;
    localStorage.setItem('pageViews', JSON.stringify(pageViews));

    renderUpcomingEvents();

    console.log('Events page JavaScript loaded successfully');
});