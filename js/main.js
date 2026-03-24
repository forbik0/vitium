/* ============================================
   VITIUM - Main JavaScript
   ============================================ */

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle menu
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close menu when link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideMenu = navMenu.contains(event.target);
        const isClickOnHamburger = hamburger.contains(event.target);
        
        if (!isClickInsideMenu && !isClickOnHamburger) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
});

// Performance Filtering
document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const performanceItems = document.querySelectorAll('.performance-item');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');

            const filterValue = this.getAttribute('data-filter');

            performanceItems.forEach(item => {
                if (filterValue === 'all') {
                    item.style.display = 'grid';
                    item.style.animation = 'fadeInUp 0.3s ease-out';
                } else {
                    item.style.display = 'none';
                }
            });

            // Show filtered items
            if (filterValue !== 'all') {
                performanceItems.forEach(item => {
                    const dateAttr = item.getAttribute('data-date');
                    if (filterValue === 'month' && dateAttr.startsWith('2026-04')) {
                        item.style.display = 'grid';
                        item.style.animation = 'fadeInUp 0.3s ease-out';
                    } else if (filterValue === 'may' && dateAttr.startsWith('2026-05')) {
                        item.style.display = 'grid';
                        item.style.animation = 'fadeInUp 0.3s ease-out';
                    }
                });
            }
        });
    });
});

// Smooth scroll for navigation links
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                const target = document.querySelector(href);
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Intersection Observer for fade-in animations
document.addEventListener('DOMContentLoaded', function() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.animation = 'fadeInUp 0.6s ease-out';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements
    const cards = document.querySelectorAll('.member-card, .repertoire-card, .stat-item');
    cards.forEach(card => {
        card.style.opacity = '0';
        observer.observe(card);
    });
});

// Contact Form (basic validation)
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('.contact-form form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = this.querySelector('input[type="text"]').value;
            const email = this.querySelector('input[type="email"]').value;
            const message = this.querySelector('textarea').value;
            
            // Basic validation
            if (name && email && message) {
                // Here you would normally send the form data to a server
                alert('Děkujeme za vaši zprávu! Brzy se vám ozvu.');
                this.reset();
            } else {
                alert('Prosím vyplňte všechna pole.');
            }
        });
    }
});

// Header scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 15px rgba(26, 79, 85, 0.15)';
    } else {
        navbar.style.boxShadow = '0 2px 8px rgba(26, 79, 85, 0.1)';
    }
});

// Add loading animation
window.addEventListener('load', function() {
    document.body.style.opacity = '1';
});

// Utility function for adding animation on scroll
function addScrollAnimations() {
    const elements = document.querySelectorAll('[data-animate]');
    
    elements.forEach(el => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        });
        observer.observe(el);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    addScrollAnimations();
});
