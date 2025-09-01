/**
 * Portfolio Website - Main JavaScript
 * Modern, lightweight, accessible interactions
 */

(function() {
    'use strict';

    // ==========================================================================
    // Theme Management
    // ==========================================================================
    
    const ThemeManager = {
        init() {
            this.themeToggle = document.getElementById('theme-toggle');
            this.currentTheme = localStorage.getItem('theme') || this.getSystemTheme();
            
            this.setTheme(this.currentTheme);
            this.bindEvents();
        },

        getSystemTheme() {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        },

        setTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            this.currentTheme = theme;
            
            // Update toggle button aria-label
            if (this.themeToggle) {
                this.themeToggle.setAttribute('aria-label', 
                    theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
                );
            }
        },

        toggleTheme() {
            const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        },

        bindEvents() {
            if (this.themeToggle) {
                this.themeToggle.addEventListener('click', () => this.toggleTheme());
            }

            // Listen for system theme changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    };

    // ==========================================================================
    // Navigation Management
    // ==========================================================================
    
    const Navigation = {
        init() {
            this.nav = document.getElementById('navigation');
            this.navLinks = document.querySelectorAll('.nav__link');
            this.sections = document.querySelectorAll('section[id]');
            
            this.bindEvents();
            this.handleScroll();
        },

        bindEvents() {
            // Smooth scrolling for navigation links
            this.navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href').substring(1);
                    const targetSection = document.getElementById(targetId);
                    
                    if (targetSection) {
                        const navHeight = this.nav.offsetHeight;
                        const targetPosition = targetSection.offsetTop - navHeight - 20;
                        
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                });
            });

            // Handle scroll events
            let scrollTimeout;
            window.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => this.handleScroll(), 10);
            });
        },

        handleScroll() {
            const scrollY = window.scrollY;
            const navHeight = this.nav.offsetHeight;
            
            // Add/remove nav shadow based on scroll position
            if (scrollY > 10) {
                this.nav.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            } else {
                this.nav.style.boxShadow = 'none';
            }

            // Update active nav link based on current section
            let current = '';
            this.sections.forEach(section => {
                const sectionTop = section.offsetTop - navHeight - 50;
                const sectionHeight = section.offsetHeight;
                
                if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                    current = section.getAttribute('id');
                }
            });

            // Update active nav link styling
            this.navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        }
    };

    // ==========================================================================
    // Contact Form Management
    // ==========================================================================
    
    const ContactForm = {
        init() {
            this.form = document.getElementById('contact-form');
            this.status = document.getElementById('form-status');
            
            if (this.form) {
                this.bindEvents();
            }
        },

        bindEvents() {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            
            // Real-time form validation
            const inputs = this.form.querySelectorAll('.form-input');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearFieldError(input));
            });
        },

        async handleSubmit(e) {
            e.preventDefault();
            
            const formData = new FormData(this.form);
            const submitButton = this.form.querySelector('button[type="submit"]');
            
            // Disable submit button and show loading state
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';
            this.hideStatus();

            try {
                // Attempt to submit to Formspree
                const response = await fetch(this.form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    this.showStatus('success', 'Thank you! Your message has been sent.');
                    this.form.reset();
                } else {
                    throw new Error('Form submission failed');
                }
            } catch (error) {
                // Fallback to mailto if Formspree fails
                this.handleMailtoFallback(formData);
            } finally {
                // Reset submit button
                submitButton.disabled = false;
                submitButton.textContent = 'Send Message';
            }
        },

        handleMailtoFallback(formData) {
            const name = formData.get('name');
            const email = formData.get('email');
            const message = formData.get('message');
            
            const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
            const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
            const mailtoUrl = `mailto:hello@alexdoe.dev?subject=${subject}&body=${body}`;
            
            window.location.href = mailtoUrl;
            this.showStatus('success', 'Opening your email client...');
        },

        validateField(field) {
            const value = field.value.trim();
            let isValid = true;
            let message = '';

            // Remove existing error styling
            field.classList.remove('error');

            // Validate based on field type
            switch (field.type) {
                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (value && !emailRegex.test(value)) {
                        isValid = false;
                        message = 'Please enter a valid email address.';
                    }
                    break;
                case 'text':
                    if (field.hasAttribute('required') && !value) {
                        isValid = false;
                        message = 'This field is required.';
                    }
                    break;
                case 'textarea':
                    if (field.hasAttribute('required') && !value) {
                        isValid = false;
                        message = 'Please enter your message.';
                    }
                    break;
            }

            if (!isValid) {
                field.classList.add('error');
                this.showFieldError(field, message);
            }

            return isValid;
        },

        showFieldError(field, message) {
            // Remove existing error message
            const existingError = field.parentNode.querySelector('.field-error');
            if (existingError) {
                existingError.remove();
            }

            // Add new error message
            const errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.textContent = message;
            errorElement.style.cssText = `
                color: #dc2626;
                font-size: 0.875rem;
                margin-top: 4px;
            `;
            
            field.parentNode.appendChild(errorElement);
        },

        clearFieldError(field) {
            field.classList.remove('error');
            const errorElement = field.parentNode.querySelector('.field-error');
            if (errorElement) {
                errorElement.remove();
            }
        },

        showStatus(type, message) {
            this.status.textContent = message;
            this.status.className = `form-status ${type}`;
            this.status.style.opacity = '1';
            
            // Auto-hide status after 5 seconds
            setTimeout(() => this.hideStatus(), 5000);
        },

        hideStatus() {
            this.status.style.opacity = '0';
            setTimeout(() => {
                this.status.textContent = '';
                this.status.className = 'form-status';
            }, 300);
        }
    };

    // ==========================================================================
    // Animations & Interactions
    // ==========================================================================
    
    const Animations = {
        init() {
            this.observeElements();
            this.initScrollAnimations();
        },

        observeElements() {
            // Only initialize animations if user prefers motion
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                return;
            }

            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            // Observe elements for animation
            const animateElements = document.querySelectorAll('.project-card, .skill-group, .about__content, .about__image');
            animateElements.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
                observer.observe(el);
            });

            // Add CSS for animation
            const style = document.createElement('style');
            style.textContent = `
                .animate-in {
                    opacity: 1 !important;
                    transform: translateY(0) !important;
                }
            `;
            document.head.appendChild(style);
        },

        initScrollAnimations() {
            // Parallax effect for hero section (subtle)
            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                const hero = document.querySelector('.hero');
                if (hero) {
                    window.addEventListener('scroll', () => {
                        const scrolled = window.pageYOffset;
                        const rate = scrolled * -0.3;
                        hero.style.transform = `translateY(${rate}px)`;
                    });
                }
            }
        }
    };

    // ==========================================================================
    // Performance Optimization
    // ==========================================================================
    
    const Performance = {
        init() {
            this.lazyLoadImages();
            this.prefetchLinks();
        },

        lazyLoadImages() {
            // Native lazy loading fallback for older browsers
            if ('loading' in HTMLImageElement.prototype) {
                const images = document.querySelectorAll('img[data-src]');
                images.forEach(img => {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                });
            } else {
                // Intersection Observer fallback
                const imageObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            img.src = img.dataset.src;
                            img.classList.remove('lazy');
                            imageObserver.unobserve(img);
                        }
                    });
                });

                const lazyImages = document.querySelectorAll('img[data-src]');
                lazyImages.forEach(img => imageObserver.observe(img));
            }
        },

        prefetchLinks() {
            // Prefetch external links on hover
            const externalLinks = document.querySelectorAll('a[href^="http"]');
            externalLinks.forEach(link => {
                link.addEventListener('mouseenter', () => {
                    const prefetchLink = document.createElement('link');
                    prefetchLink.rel = 'prefetch';
                    prefetchLink.href = link.href;
                    document.head.appendChild(prefetchLink);
                }, { once: true });
            });
        }
    };

    // ==========================================================================
    // Accessibility Enhancements
    // ==========================================================================
    
    const Accessibility = {
        init() {
            this.handleFocusVisible();
            this.announceNavigationChanges();
            this.setupKeyboardShortcuts();
        },

        handleFocusVisible() {
            // Only show focus styles when navigating with keyboard
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    document.body.classList.add('keyboard-nav');
                }
            });

            document.addEventListener('mousedown', () => {
                document.body.classList.remove('keyboard-nav');
            });

            // Add CSS for focus-visible polyfill
            const style = document.createElement('style');
            style.textContent = `
                body:not(.keyboard-nav) *:focus {
                    outline: none;
                }
                
                .keyboard-nav *:focus {
                    outline: 2px solid var(--accent);
                    outline-offset: 2px;
                }
            `;
            document.head.appendChild(style);
        },

        announceNavigationChanges() {
            // Announce section changes to screen readers
            const createAnnouncer = () => {
                const announcer = document.createElement('div');
                announcer.setAttribute('aria-live', 'polite');
                announcer.setAttribute('aria-atomic', 'true');
                announcer.className = 'sr-only';
                document.body.appendChild(announcer);
                return announcer;
            };

            const announcer = createAnnouncer();
            let currentSection = '';

            window.addEventListener('scroll', () => {
                const sections = document.querySelectorAll('section[id]');
                const scrollPosition = window.scrollY + 100;

                sections.forEach(section => {
                    const sectionTop = section.offsetTop;
                    const sectionBottom = sectionTop + section.offsetHeight;

                    if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                        const sectionId = section.id;
                        if (sectionId !== currentSection) {
                            currentSection = sectionId;
                            const sectionTitle = section.querySelector('h1, h2, h3')?.textContent || sectionId;
                            announcer.textContent = `Navigated to ${sectionTitle} section`;
                        }
                    }
                });
            });
        },

        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Alt + T: Toggle theme
                if (e.altKey && e.key === 't') {
                    e.preventDefault();
                    ThemeManager.toggleTheme();
                }

                // Alt + 1-5: Quick navigation
                const shortcuts = {
                    '1': 'home',
                    '2': 'about',
                    '3': 'projects',
                    '4': 'skills',
                    '5': 'contact'
                };

                if (e.altKey && shortcuts[e.key]) {
                    e.preventDefault();
                    const section = document.getElementById(shortcuts[e.key]);
                    if (section) {
                        section.scrollIntoView({ behavior: 'smooth' });
                        section.focus({ preventScroll: true });
                    }
                }
            });
        }
    };

    // ==========================================================================
    // Error Handling & Fallbacks
    // ==========================================================================
    
    const ErrorHandler = {
        init() {
            this.setupGlobalErrorHandling();
            this.handleOfflineMode();
        },

        setupGlobalErrorHandling() {
            window.addEventListener('error', (e) => {
                console.error('JavaScript error:', e.error);
                // Don't break the user experience for non-critical errors
            });

            window.addEventListener('unhandledrejection', (e) => {
                console.error('Unhandled promise rejection:', e.reason);
                e.preventDefault();
            });
        },

        handleOfflineMode() {
            window.addEventListener('online', () => {
                console.log('Connection restored');
            });

            window.addEventListener('offline', () => {
                console.log('Connection lost - some features may not work');
            });
        }
    };

    // ==========================================================================
    // Initialization
    // ==========================================================================
    
    function init() {
        // Check if DOM is already loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeApp);
        } else {
            initializeApp();
        }
    }

    function initializeApp() {
        try {
            // Initialize all modules
            ThemeManager.init();
            Navigation.init();
            ContactForm.init();
            Animations.init();
            Performance.init();
            Accessibility.init();
            ErrorHandler.init();

            console.log('Portfolio website initialized successfully');
        } catch (error) {
            console.error('Error initializing portfolio:', error);
        }
    }

    // Start the application
    init();

})();