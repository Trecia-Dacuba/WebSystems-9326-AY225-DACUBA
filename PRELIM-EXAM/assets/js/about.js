// About Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Timeline Data
    const timelineData = [
        {
            year: '1947',
            event: 'Philippine Red Cross was established by Republic Act No. 95, marking the beginning of organized humanitarian work in the Philippines.'
        },
        {
            year: '1960',
            event: 'Expanded blood services program nationwide, establishing blood banks in major cities to support medical needs.'
        },
        {
            year: '1980',
            event: 'Launched disaster preparedness training programs, equipping communities with lifesaving skills and knowledge.'
        },
        {
            year: '1991',
            event: 'Major response to Mt. Pinatubo eruption, providing relief to thousands of displaced families and communities.'
        },
        {
            year: '2013',
            event: 'Led international response efforts for Typhoon Haiyan (Yolanda), one of the strongest tropical cyclones ever recorded.'
        },
        {
            year: '2020',
            event: 'Mobilized COVID-19 response operations including testing, contact tracing, and community support services.'
        },
        {
            year: '2024',
            event: 'Continues to serve as the nation\'s premier humanitarian organization with 82 chapters and over 15,000 volunteers.'
        }
    ];

    // Principles Data
    const principlesData = [
        {
            title: 'Humanity',
            description: 'The International Red Cross and Red Crescent Movement, born of a desire to bring assistance without discrimination to the wounded on the battlefield, endeavors, in its international and national capacity, to prevent and alleviate human suffering wherever it may be found. Its purpose is to protect life and health and to ensure respect for the human being.'
        },
        {
            title: 'Impartiality',
            description: 'It makes no discrimination as to nationality, race, religious beliefs, class or political opinions. It endeavors to relieve the suffering of individuals, being guided solely by their needs, and to give priority to the most urgent cases of distress.'
        },
        {
            title: 'Neutrality',
            description: 'In order to continue to enjoy the confidence of all, the Movement may not take sides in hostilities or engage at any time in controversies of a political, racial, religious or ideological nature.'
        },
        {
            title: 'Independence',
            description: 'The Movement is independent. The National Societies, while auxiliaries in the humanitarian services of their governments and subject to the laws of their respective countries, must always maintain their autonomy so that they may be able at all times to act in accordance with the principles of the Movement.'
        },
        {
            title: 'Voluntary Service',
            description: 'It is a voluntary relief movement not prompted in any manner by desire for gain.'
        },
        {
            title: 'Unity',
            description: 'There can be only one Red Cross or Red Crescent Society in any one country. It must be open to all. It must carry on its humanitarian work throughout its territory.'
        },
        {
            title: 'Universality',
            description: 'The International Red Cross and Red Crescent Movement, in which all Societies have equal status and share equal responsibilities and duties in helping each other, is worldwide.'
        }
    ];

    // Leadership Data
    const leadershipData = [
        {
            name: 'Richard Gordon',
            position: 'Chairman',
            image: 'assets/images/richard-gordon.jpeg'
        },
        {
            name: 'Dr. Raul Dilgado',
            position: 'Secretary General',
            image: 'assets/images/raul-dilgado.jpg'
        },
        {
            name: 'Maria Santos',
            position: 'Director of Operations',
            image: 'assets/images/maria-santos.jpg'
        },
        {
            name: 'Rodolfo Reyes',
            position: 'Secretary/ Corporate Secretary',
            image: 'assets/images/rodolfo-reyes.jpeg'
        }
    ];


    // Render Timeline
    function renderTimeline() {
        const timeline = document.getElementById('timeline');
        if (!timeline) return;

        timeline.innerHTML = timelineData.map(item => `
            <div class="timeline-item">
                <div class="timeline-year">${item.year}</div>
                <p>${item.event}</p>
            </div>
        `).join('');
    }

    // Timeline Toggle
    const timelineToggle = document.getElementById('timelineToggle');
    const timelineSection = document.getElementById('timelineSection');
    
    if (timelineToggle && timelineSection) {
        timelineToggle.addEventListener('click', function() {
            const isVisible = timelineSection.style.display !== 'none';
            
            if (isVisible) {
                timelineSection.style.display = 'none';
                this.textContent = 'View Our Timeline';
            } else {
                timelineSection.style.display = 'block';
                this.textContent = 'Hide Timeline';
                renderTimeline();
                
                // Smooth scroll to timeline
                setTimeout(() => {
                    timelineSection.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'nearest' 
                    });
                }, 100);
            }
        });
    }

    // Render Principles Accordion
    function renderPrinciplesAccordion() {
        const accordion = document.getElementById('principlesAccordion');
        if (!accordion) return;

        accordion.innerHTML = principlesData.map((principle, index) => `
            <div class="accordion-item" data-index="${index}">
                <div class="accordion-header">
                    <h3>${principle.title}</h3>
                    <span class="accordion-icon">▼</span>
                </div>
                <div class="accordion-body">
                    <div class="accordion-content">
                        ${principle.description}
                    </div>
                </div>
            </div>
        `).join('');

        // Add accordion functionality
        accordion.querySelectorAll('.accordion-item').forEach(item => {
            const header = item.querySelector('.accordion-header');
            
            header.addEventListener('click', function() {
                const isActive = item.classList.contains('active');
                
                // Close all items
                accordion.querySelectorAll('.accordion-item').forEach(i => {
                    i.classList.remove('active');
                });
                
                // Open clicked item if it wasn't active
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        });

        // Auto-open first principle
        const firstItem = accordion.querySelector('.accordion-item');
        if (firstItem) {
            firstItem.classList.add('active');
        }
    }

    // Render Leadership
    function renderLeadership() {
    const leadershipGrid = document.getElementById('leadershipGrid');
    if (!leadershipGrid) return;

    leadershipGrid.innerHTML = leadershipData.map(leader => `
        <div class="leader-card">
            <img 
                src="${leader.image}" 
                alt="${leader.name}" 
                class="leader-avatar"
            >
            <h3>${leader.name}</h3>
            <p>${leader.position}</p>
        </div>
    `).join('');
}


    // Impact Numbers Animation
    const impactNumbers = document.querySelectorAll('.impact-number');
    if (impactNumbers.length > 0) {
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                    animateNumber(entry.target);
                    entry.target.classList.add('animated');
                }
            });
        }, observerOptions);

        impactNumbers.forEach(number => {
            observer.observe(number);
        });
    }

    function animateNumber(element) {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const updateNumber = () => {
            current += step;
            if (current < target) {
                element.textContent = Math.floor(current).toLocaleString();
                requestAnimationFrame(updateNumber);
            } else {
                element.textContent = target.toLocaleString();
            }
        };

        updateNumber();
    }

    // Save page visit to localStorage
    const pageViews = JSON.parse(localStorage.getItem('pageViews') || '{}');
    pageViews.about = (pageViews.about || 0) + 1;
    localStorage.setItem('pageViews', JSON.stringify(pageViews));

    // Initialize
    renderPrinciplesAccordion();
    renderLeadership();

    console.log('About page JavaScript loaded successfully');
});