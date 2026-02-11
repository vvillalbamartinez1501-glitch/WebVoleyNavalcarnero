document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. MENÚ MÓVIL
    // ==========================================
    const menuToggle = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a'); 

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    // ==========================================
    // 2. ANIMACIÓN SCROLL
    // ==========================================
    const sections = document.querySelectorAll('section');
    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        sectionObserver.observe(section);
    });

    // ==========================================
    // 3. PATROCINADORES
    // ==========================================
    const tracks = document.querySelectorAll('.sponsor-track');
    tracks.forEach(track => {
        const content = track.innerHTML;
        track.innerHTML = content + content + content;
    });

    // ==========================================
    // 4. CARRUSEL HERO (CORREGIDO)
    // ==========================================
    const track = document.querySelector('.hero-track');
    const slides = document.querySelectorAll('.hero-slide');

    if (track && slides.length > 0) {
        const intervalTime = 5000;
        
        // Clonar primera imagen para efecto infinito
        const firstClone = slides[0].cloneNode(true);
        track.appendChild(firstClone);

        let currentSlide = 0;
        // Importante: Contar slides después de clonar
        const totalSlides = track.children.length; 

        const moveToNextSlide = () => {
            currentSlide++;
            track.style.transition = 'transform 1.5s cubic-bezier(0.25, 1, 0.5, 1)';
            track.style.transform = `translateX(-${currentSlide * 100}%)`;
        };

        track.addEventListener('transitionend', () => {
            // Si llega al clon (último slide), volver al primero sin animación
            if (currentSlide >= totalSlides - 1) {
                track.style.transition = 'none';
                currentSlide = 0;
                track.style.transform = `translateX(0)`;
            }
        });

        setInterval(moveToNextSlide, intervalTime);
    }

    // ==========================================
    // 5. MODO OSCURO
    // ==========================================
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        const currentTheme = localStorage.getItem('theme');
        
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            if(icon) icon.classList.replace('fa-moon', 'fa-sun');
        }

        themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                if(icon) icon.classList.replace('fa-sun', 'fa-moon');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                if(icon) icon.classList.replace('fa-moon', 'fa-sun');
            }
        });
    }

    // ==========================================
    // 6. BUSCADOR
    // ==========================================
    const searchTrigger = document.getElementById('search-trigger');
    const searchOverlay = document.getElementById('search-overlay');
    const closeSearch = document.getElementById('close-search');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');

    if(searchTrigger && searchOverlay) {
        searchTrigger.addEventListener('click', () => {
            searchOverlay.classList.add('active');
            if(searchInput) searchInput.focus();
            document.body.style.overflow = 'hidden';
        });
    }

    const closeSearchModal = () => {
        if(searchOverlay) searchOverlay.classList.remove('active');
        if(searchInput) searchInput.value = '';
        if(resultsContainer) resultsContainer.innerHTML = '';
        document.body.style.overflow = 'auto';
    };

    if(closeSearch) closeSearch.addEventListener('click', closeSearchModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay?.classList.contains('active')) {
            closeSearchModal();
        }
    });

    if(searchInput && resultsContainer) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            resultsContainer.innerHTML = ''; 
            if (searchTerm.length < 2) return; 

            const searchableElements = document.querySelectorAll('.main-content h1, .main-content h2, .main-content h3, .main-content p, .event-card h3');
            let foundCount = 0;

            searchableElements.forEach(el => {
                const text = el.innerText;
                if (text.toLowerCase().includes(searchTerm)) {
                    foundCount++;
                    const resultDiv = document.createElement('div');
                    resultDiv.classList.add('result-item');
                    const snippet = text.length > 100 ? text.substring(0, 100) + '...' : text;
                    resultDiv.innerHTML = `<h4>Resultado:</h4><p>${snippet}</p>`;
                    resultDiv.addEventListener('click', () => {
                        closeSearchModal();
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.style.transition = 'background-color 0.5s';
                        el.style.backgroundColor = 'rgba(255, 255, 0, 0.3)'; 
                        setTimeout(() => { el.style.backgroundColor = 'transparent'; }, 1500);
                    });
                    resultsContainer.appendChild(resultDiv);
                }
            });
            if (foundCount === 0) resultsContainer.innerHTML = '<p style="color:white;">No se encontraron coincidencias.</p>';
        });
    }

    // ==========================================
    // 7. HIGHLIGHT ÍNDICE (TOC)
    // ==========================================
    const sectionsToc = document.querySelectorAll('section');
    const allLinks = document.querySelectorAll('.toc-link, .nav-menu a');

    const tocObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                if (id) {
                    allLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            }
        });
    }, { rootMargin: '-30% 0px -70% 0px', threshold: 0 });

    sectionsToc.forEach(section => tocObserver.observe(section));

    allLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);
                if(targetSection){
                    window.scrollTo({ top: targetSection.offsetTop - 80, behavior: 'smooth' });
                    if (navMenu && navMenu.classList.contains('active')) navMenu.classList.remove('active');
                }
            }
        });
    });
});