// Home Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Services Data
    const servicesData = [
        {
            id: 1,
            icon: '🚨',
            title: 'Disaster Management',
            description: 'Rapid response and relief operations during natural disasters and emergencies.',
            category: 'disaster'
        },
        {
            id: 2,
            icon: '🏥',
            title: 'Health Services',
            description: 'Comprehensive health programs including ambulance services and medical assistance.',
            category: 'health'
        },
        {
            id: 3,
            icon: '🩸',
            title: 'Blood Services',
            description: 'Blood donation drives and maintaining blood banks for emergency needs.',
            category: 'blood'
        },
        {
            id: 4,
            icon: '🛡️',
            title: 'Safety Services',
            description: 'First aid training, water safety, and emergency preparedness programs.',
            category: 'safety'
        }
    ];

    // Campaigns Data
    const campaignsData = [
        {
            id: 1,
            title: 'Typhoon Relief Operations',
            description: 'Providing emergency aid and supplies to communities affected by recent typhoons.',
            category: 'disaster',
            icon: '🌀',
            goal: 5000000,
            raised: 3750000,
            urgent: true
        },
        {
            id: 2,
            title: 'Community Health Program',
            description: 'Mobile health clinics and medical missions in underserved communities.',
            category: 'health',
            icon: '💊',
            goal: 2000000,
            raised: 1200000,
            urgent: false
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
            urgent: true
        },
        {
            id: 4,
            title: 'First Aid Training Initiative',
            description: 'Free first aid and CPR training for communities and schools.',
            category: 'health',
            icon: '🏥',
            goal: 50000,
            raised: 32000,
            urgent: false
        },
        {
            id: 5,
            title: 'Disaster Preparedness Education',
            description: 'Teaching communities how to prepare for and respond to disasters.',
            category: 'disaster',
            icon: '📚',
            goal: 1000000,
            raised: 450000,
            urgent: false
        },
        {
            id: 6,
            title: 'Flood Relief Fund',
            description: 'Emergency relief for families displaced by severe flooding.',
            category: 'disaster',
            icon: '💧',
            goal: 3000000,
            raised: 2100000,
            urgent: true
        }
    ];

    // Render Services
    function renderServices() {
        const servicesGrid = document.getElementById('servicesGrid');
        if (!servicesGrid) return;

        servicesGrid.innerHTML = servicesData.map(service => `
            <div class="service-card" data-category="${service.category}">
                <div class="service-icon">${service.icon}</div>
                <h3>${service.title}</h3>
                <p>${service.description}</p>
            </div>
        `).join('');
    }

    // Render Campaigns
    function renderCampaigns(filter = 'all') {
        const campaignsGrid = document.getElementById('campaignsGrid');
        if (!campaignsGrid) return;

        const filteredCampaigns = filter === 'all' 
            ? campaignsData 
            : campaignsData.filter(c => c.category === filter);

        campaignsGrid.innerHTML = filteredCampaigns.map(campaign => {
            const percentage = campaign.isUnits 
                ? Math.round((campaign.raised / campaign.goal) * 100)
                : Math.round((campaign.raised / campaign.goal) * 100);

            const displayGoal = campaign.isUnits 
                ? `${campaign.goal.toLocaleString()} units`
                : `₱${(campaign.goal / 1000000).toFixed(1)}M`;

            const displayRaised = campaign.isUnits
                ? `${campaign.raised.toLocaleString()} units`
                : `₱${(campaign.raised / 1000000).toFixed(1)}M`;

            return `
                <div class="campaign-card" data-category="${campaign.category}" data-campaign-id="${campaign.id}">
                    <div class="campaign-image">
                        ${campaign.icon}
                    </div>
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

        // Add click handlers for campaign cards
        document.querySelectorAll('.campaign-card').forEach(card => {
            card.addEventListener('click', function() {
                const campaignId = parseInt(this.dataset.campaignId);
                showCampaignModal(campaignId);
            });
        });

        // Animate progress bars
        setTimeout(() => {
            document.querySelectorAll('.progress-fill').forEach(bar => {
                const width = bar.style.width;
                bar.style.width = '0';
                setTimeout(() => {
                    bar.style.width = width;
                }, 100);
            });
        }, 100);
    }

    // Campaign Filter
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Filter campaigns
            const filter = this.dataset.filter;
            renderCampaigns(filter);
        });
    });

    // Show Campaign Modal
    function showCampaignModal(campaignId) {
        const campaign = campaignsData.find(c => c.id === campaignId);
        if (!campaign) return;

        const percentage = campaign.isUnits 
            ? Math.round((campaign.raised / campaign.goal) * 100)
            : Math.round((campaign.raised / campaign.goal) * 100);

        const displayGoal = campaign.isUnits 
            ? `${campaign.goal.toLocaleString()} units`
            : `₱${(campaign.goal / 1000000).toFixed(1)}M`;

        const displayRaised = campaign.isUnits
            ? `${campaign.raised.toLocaleString()} units`
            : `₱${(campaign.raised / 1000000).toFixed(1)}M`;

        const modalBody = document.getElementById('modalBody');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div class="campaign-modal-content">
                <div class="campaign-modal-icon">${campaign.icon}</div>
                ${campaign.urgent ? '<span class="campaign-badge" style="margin-bottom: 16px;">URGENT</span>' : ''}
                <h2>${campaign.title}</h2>
                <p style="color: var(--text-medium); margin-bottom: 24px; line-height: 1.8;">
                    ${campaign.description}
                </p>
                <div class="campaign-progress" style="margin-bottom: 24px;">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <p class="progress-text">${displayRaised} raised of ${displayGoal} goal</p>
                </div>
                <div style="display: flex; gap: 16px; justify-content: center;">
                    <a href="volunteer.html#donate" class="btn btn-primary">Donate Now</a>
                    <a href="events.html" class="btn btn-secondary">Learn More</a>
                </div>
            </div>
        `;

        if (window.modalControllers && window.modalControllers.campaign) {
            window.modalControllers.campaign.openModal();
        }

        // Show alert for urgent campaigns
        if (campaign.urgent && window.showAlert) {
            setTimeout(() => {
                window.showAlert(
                    'Urgent Campaign',
                    `${campaign.title} needs immediate support. Your contribution can make a difference!`
                );
            }, 500);
        }
    }

    // Initialize
    renderServices();
    renderCampaigns();

    // Store campaign views in localStorage
    const campaignCards = document.querySelectorAll('.campaign-card');
    campaignCards.forEach(card => {
        card.addEventListener('click', function() {
            const campaignId = this.dataset.campaignId;
            const viewedCampaigns = JSON.parse(localStorage.getItem('viewedCampaigns') || '[]');
            
            if (!viewedCampaigns.includes(campaignId)) {
                viewedCampaigns.push(campaignId);
                localStorage.setItem('viewedCampaigns', JSON.stringify(viewedCampaigns));
            }
        });
    });

    console.log('Home page JavaScript loaded successfully');
});