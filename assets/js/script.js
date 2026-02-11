document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. LÓGICA DEL MENÚ MÓVIL (HAMBURGUESA)
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
                if(navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                }
            });
        });
    }

    // ==========================================
    // 2. ANIMACIÓN DE SECCIONES (SCROLL)
    // ==========================================
    const sections = document.querySelectorAll('section');

    const observerOptions = {
        threshold: 0.15 
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        observer.observe(section);
    });

    // ==========================================
    // 3. PATROCINADORES (SCROLL INFINITO)
    // ==========================================
    const tracks = document.querySelectorAll('.sponsor-track');
    
    tracks.forEach(track => {
        const content = track.innerHTML;
        track.innerHTML = content + content + content;
    });

// ==========================================
    // 4. CARRUSEL HERO (BUCLE INFINITO)
    // ==========================================
    const carouselTrack = document.querySelector('.hero-carousel');
    
    if (carouselTrack) {
        // 1. Eliminamos cualquier clase 'active' residual del HTML
        const slides = carouselTrack.querySelectorAll('.hero-slide');
        slides.forEach(slide => slide.classList.remove('active'));

        // 2. Duplicamos las imágenes para crear la ilusión de infinito
        // Clonamos todo el contenido actual del carrusel
        const carouselContent = carouselTrack.innerHTML;
        // Lo añadimos al final. Ahora tenemos: [Grupo A] + [Grupo A]
        carouselTrack.innerHTML = carouselContent + carouselContent;

        // NOTA: La animación se controla 100% desde CSS (scrollHorizontalHero)
        // No necesitamos setInterval aquí.
    }

    // ==========================================
    // 5. MODO OSCURO (ESTA ES LA PARTE QUE FALTABA)
    // ==========================================
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        
        // A. Comprobar si ya había un tema guardado de antes
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            if(icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        }

        // B. Al hacer clic en el botón
        themeToggle.addEventListener('click', () => {
            let theme = document.documentElement.getAttribute('data-theme');

            if (theme === 'dark') {
                // Cambiar a Claro
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                if(icon) {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                }
            } else {
                // Cambiar a Oscuro
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                if(icon) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                }
            }
        });
    }

    // ==========================================
    // 6. BUSCADOR INTERNO
    // ==========================================
    const searchTrigger = document.getElementById('search-trigger');
    const searchOverlay = document.getElementById('search-overlay');
    const closeSearch = document.getElementById('close-search');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');

    if(searchTrigger) {
        searchTrigger.addEventListener('click', () => {
            searchOverlay.classList.add('active');
            if(searchInput) searchInput.focus();
            document.body.style.overflow = 'hidden';
        });
    }

    function closeSearchModal() {
        if(searchOverlay) searchOverlay.classList.remove('active');
        if(searchInput) searchInput.value = '';
        if(resultsContainer) resultsContainer.innerHTML = '';
        document.body.style.overflow = 'auto';
    }

    if(closeSearch) {
        closeSearch.addEventListener('click', closeSearchModal);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay && searchOverlay.classList.contains('active')) {
            closeSearchModal();
        }
    });

    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            resultsContainer.innerHTML = ''; 

            if (searchTerm.length < 2) return; 

            const searchableElements = document.querySelectorAll('.main-content h1, .main-content h2, .main-content h3, .main-content p, .event-card h3, .event-card p');
            let foundCount = 0;

            searchableElements.forEach(el => {
                const text = el.innerText;
                if (text.toLowerCase().includes(searchTerm)) {
                    foundCount++;
                    const resultDiv = document.createElement('div');
                    resultDiv.classList.add('result-item');
                    const snippet = text.length > 100 ? text.substring(0, 100) + '...' : text;

                    resultDiv.innerHTML = `<h4>Encontrado en: ${el.tagName}</h4><p>${snippet}</p>`;

                    resultDiv.addEventListener('click', () => {
                        closeSearchModal();
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.style.transition = 'background 0.5s';
                        el.style.backgroundColor = 'rgba(255, 255, 0, 0.3)'; 
                        setTimeout(() => { el.style.backgroundColor = 'transparent'; }, 1500);
                    });

                    resultsContainer.appendChild(resultDiv);
                }
            });

            if (foundCount === 0) {
                resultsContainer.innerHTML = '<p style="color:white;">No se encontraron coincidencias.</p>';
            }
        });
    }

    console.log("Web CV Navalcarnero: Todos los sistemas cargados.");
});