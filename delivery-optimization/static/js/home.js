document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const navLinks = document.querySelectorAll('.nav-link');
    const themeToggle = document.getElementById('themeToggle');
    const backToTopBtn = document.getElementById('backToTop');
    const faqItems = document.querySelectorAll('.faq-item');
    const testimonialSlider = document.querySelector('.testimonials-slider');
    const testimonialSlides = document.querySelectorAll('.testimonial-slide');
    const testimonialDots = document.querySelectorAll('.dot');
    const prevButton = document.querySelector('.testimonial-arrow.prev');
    const nextButton = document.querySelector('.testimonial-arrow.next');
    const billingToggle = document.getElementById('billingToggle');
    const pricingCards = document.querySelectorAll('.pricing-card');
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterEmail = document.getElementById('newsletterEmail');
    const newsletterMessage = document.getElementById('newsletterMessage');
    const statNumbers = document.querySelectorAll('.stat-number');
    const videoPlaceholder = document.querySelector('.video-placeholder');
    
    // Initialize
    initTheme();
    initAnimations();
    
    // Event Listeners
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            if (targetId.startsWith('#')) {
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    // Close mobile menu if open
                    if (mainNav.classList.contains('active')) {
                        toggleMobileMenu();
                    }
                    
                    // Smooth scroll to target
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            } else {
                // Navigate to different page
                window.location.href = targetId;
            }
        });
    });
    
    themeToggle.addEventListener('click', toggleTheme);
    
    window.addEventListener('scroll', function() {
        // Show/hide back to top button
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
        
        // Add scroll animations
        animateOnScroll();
    });
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            // Close all FAQ items
            faqItems.forEach(faq => {
                faq.classList.remove('active');
                const answer = faq.querySelector('.faq-answer');
                answer.style.maxHeight = null;
            });
            
            // Open clicked item if it wasn't already open
            if (!isActive) {
                item.classList.add('active');
                const answer = item.querySelector('.faq-answer');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });
    
    // Testimonial slider
    let currentSlide = 0;
    
    function showSlide(index) {
        // Hide all slides
        testimonialSlides.forEach(slide => {
            slide.classList.remove('active');
        });
        
        // Remove active class from all dots
        testimonialDots.forEach(dot => {
            dot.classList.remove('active');
        });
        
        // Show the selected slide
        testimonialSlides[index].classList.add('active');
        testimonialDots[index].classList.add('active');
        currentSlide = index;
    }
    
    prevButton.addEventListener('click', function() {
        currentSlide = (currentSlide - 1 + testimonialSlides.length) % testimonialSlides.length;
        showSlide(currentSlide);
    });
    
    nextButton.addEventListener('click', function() {
        currentSlide = (currentSlide + 1) % testimonialSlides.length;
        showSlide(currentSlide);
    });
    
    testimonialDots.forEach(dot => {
        dot.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            showSlide(index);
        });
    });
    
    // Auto-advance testimonials
    let testimonialInterval = setInterval(function() {
        nextButton.click();
    }, 5000);
    
    // Pause auto-advance on hover
    testimonialSlider.addEventListener('mouseenter', function() {
        clearInterval(testimonialInterval);
    });
    
    testimonialSlider.addEventListener('mouseleave', function() {
        testimonialInterval = setInterval(function() {
            nextButton.click();
        }, 5000);
    });
    
    // Pricing toggle
    billingToggle.addEventListener('change', function() {
        document.body.classList.toggle('annual-billing');
        
        pricingCards.forEach(card => {
            const monthlyPrice = card.querySelector('.amount.monthly');
            const annualPrice = card.querySelector('.amount.annual');
            
            if (this.checked) {
                monthlyPrice.style.display = 'none';
                annualPrice.style.display = 'inline';
            } else {
                monthlyPrice.style.display = 'inline';
                annualPrice.style.display = 'none';
            }
        });
    });
    
    // Newsletter form
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = newsletterEmail.value.trim();
        
        if (!email) {
            showFormMessage(newsletterMessage, 'Please enter your email address', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showFormMessage(newsletterMessage, 'Please enter a valid email address', 'error');
            return;
        }
        
        // Simulate form submission
        showFormMessage(newsletterMessage, 'Subscribing...', 'info');
        
        setTimeout(function() {
            showFormMessage(newsletterMessage, 'Thank you for subscribing!', 'success');
            newsletterEmail.value = '';
        }, 1500);
    });
    
    // Video placeholder
    videoPlaceholder.addEventListener('click', function() {
        // In a real implementation, this would open a video modal or start playing a video
        alert('Video demo would play here in the actual implementation.');
    });
    
    // Functions
    function toggleMobileMenu() {
        mobileMenuToggle.classList.toggle('active');
        mainNav.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    }
    
    function toggleTheme() {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        
        // Update icon
        const icon = themeToggle.querySelector('i');
        if (isDarkMode) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }
    
    function initTheme() {
        // Check for saved theme preference
        const darkMode = localStorage.getItem('darkMode') === 'true';
        
        if (darkMode) {
            document.body.classList.add('dark-mode');
            themeToggle.querySelector('i').classList.remove('fa-moon');
            themeToggle.querySelector('i').classList.add('fa-sun');
        }
    }
    
    function initAnimations() {
        // Initialize truck animation
        animateTruck();
        
        // Initialize stat counters when visible
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (entry.target.classList.contains('stat-number')) {
                        animateCounter(entry.target);
                    } else if (entry.target.hasAttribute('data-aos')) {
                        entry.target.classList.add('aos-animate');
                    }
                }
            });
        }, observerOptions);
        
        // Observe stat numbers
        statNumbers.forEach(stat => {
            observer.observe(stat);
        });
        
        // Observe AOS elements
        document.querySelectorAll('[data-aos]').forEach(element => {
            observer.observe(element);
        });
    }
    
    function animateOnScroll() {
        // This function is called on scroll to trigger animations
        // It's a simplified version of AOS (Animate On Scroll)
        const elements = document.querySelectorAll('[data-aos]:not(.aos-animate)');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementPosition < windowHeight * 0.9) {
                element.classList.add('aos-animate');
            }
        });
    }
    
    function animateTruck() {
        const truck = document.querySelector('.truck-icon');
        const routeLine = document.querySelector('.route-line');
        
        if (!truck || !routeLine) return;
        
        // Set initial position
        truck.style.left = '10%';
        truck.style.top = '70%';
        
        // Animate truck along the route
        const keyframes = [
            { left: '10%', top: '70%' },
            { left: '30%', top: '40%' },
            { left: '50%', top: '60%' },
            { left: '70%', top: '30%' },
            { left: '90%', top: '50%' }
        ];
        
        let currentKeyframe = 0;
        
        function moveToNextPoint() {
            currentKeyframe = (currentKeyframe + 1) % keyframes.length;
            
            truck.animate([
                keyframes[currentKeyframe === 0 ? keyframes.length - 1 : currentKeyframe - 1],
                keyframes[currentKeyframe]
            ], {
                duration: 2000,
                easing: 'ease-in-out',
                fill: 'forwards'
            });
            
            setTimeout(moveToNextPoint, 2000);
        }
        
        moveToNextPoint();
    }
    
    function animateCounter(element) {
        const target = parseInt(element.getAttribute('data-count'));
        const duration = 2000; // ms
        const step = 30; // ms
        const increment = target / (duration / step);
        
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, step);
    }
    
    function showFormMessage(element, message, type) {
        element.textContent = message;
        element.className = 'form-message';
        
        if (type) {
            element.classList.add(type);
        }
    }
    
    function isValidEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
});