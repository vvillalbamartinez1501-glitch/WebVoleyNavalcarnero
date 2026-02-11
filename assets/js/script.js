document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. MENÚ MÓVIL (HAMBURGUESA)
    // ==========================================
    const menuToggle = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a'); 

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Cerrar menú al hacer clic en un enlace
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    // ==========================================
    // 2. ANIMACIÓN DE SECCIONES (FADE IN AL SCROLL)
    // ==========================================
    const sections = document.querySelectorAll('section');

    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target); // Dejar de observar una vez animado
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        sectionObserver.observe(section);
    });

    // ==========================================
    // 3. PATROCINADORES (SCROLL INFINITO)
    // ==========================================
    const tracks = document.querySelectorAll('.sponsor-track');
    
    tracks.forEach(track => {
        // Duplicamos el contenido para asegurar que el scroll CSS sea continuo
        const content = track.innerHTML;
        track.innerHTML = content + content + content;
    });

    // ==========================================
    // 4. CARRUSEL HERO (LOGICA DE BUCLE Y PAUSA)
    // ==========================================
    const heroTrack = document.querySelector('.hero-carousel');
    const heroSlides = document.querySelectorAll('.hero-slide');

    if (heroTrack && heroSlides.length > 0) {
        const intervalTime = 5000; // 5 segundos de pausa
        
        // Clonamos la primera imagen y la ponemos al final
        const firstClone = heroSlides[0].cloneNode(true);
        heroTrack.appendChild(firstClone);

        let currentSlide = 0;
        // Contamos slides de nuevo incluyendo el clon
        const totalSlides = document.querySelectorAll('.hero-slide').length; 

        const moveToNextSlide = () => {
            currentSlide++;
            heroTrack.style.transition = 'transform 1.5s cubic-bezier(0.25, 1, 0.5, 1)';
            heroTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
        };

        // Detectar fin de transición para reiniciar el bucle sin que se note
        heroTrack.addEventListener('transitionend', () => {
            if (currentSlide >= totalSlides - 1) {
                heroTrack.style.transition = 'none'; // Quitamos animación
                currentSlide = 0; // Volvemos al principio
                heroTrack.style.transform = `translateX(0)`; // Movemos posición
            }
        });

        // Iniciar el bucle
        setInterval(moveToNextSlide, intervalTime);
    }

    // ==========================================
    // 5. MODO OSCURO
    // ==========================================
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        
        // A. Cargar tema guardado
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            if(icon) {
                icon.classList.replace('fa-moon', 'fa-sun');
            }
        }

        // B. Alternar tema al hacer clic
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
    // 6. BUSCADOR INTERNO
    // ==========================================
    const searchTrigger = document.getElementById('search-trigger');
    const searchOverlay = document.getElementById('search-overlay');
    const closeSearch = document.getElementById('close-search');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');

    // Abrir buscador
    if(searchTrigger && searchOverlay) {
        searchTrigger.addEventListener('click', () => {
            searchOverlay.classList.add('active');
            if(searchInput) searchInput.focus();
            document.body.style.overflow = 'hidden'; // Evitar scroll
        });
    }

    // Función cerrar buscador
    const closeSearchModal = () => {
        if(searchOverlay) searchOverlay.classList.remove('active');
        if(searchInput) searchInput.value = '';
        if(resultsContainer) resultsContainer.innerHTML = '';
        document.body.style.overflow = 'auto'; // Permitir scroll
    };

    if(closeSearch) closeSearch.addEventListener('click', closeSearchModal);

    // Cerrar con tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay?.classList.contains('active')) {
            closeSearchModal();
        }
    });

    // Lógica de búsqueda
    if(searchInput && resultsContainer) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            resultsContainer.innerHTML = ''; 

            if (searchTerm.length < 2) return; 

            // Elementos donde buscar texto
            const searchableElements = document.querySelectorAll('.main-content h1, .main-content h2, .main-content h3, .main-content p, .event-card h3, .event-card p, .team-card h3');
            let foundCount = 0;

            searchableElements.forEach(el => {
                const text = el.innerText;
                if (text.toLowerCase().includes(searchTerm)) {
                    foundCount++;
                    const resultDiv = document.createElement('div');
                    resultDiv.classList.add('result-item');
                    // Recortar texto si es muy largo
                    const snippet = text.length > 100 ? text.substring(0, 100) + '...' : text;

                    resultDiv.innerHTML = `<h4>${el.tagName === 'P' ? 'Texto' : 'Título'}:</h4><p>${snippet}</p>`;

                    // Ir al elemento al hacer clic
                    resultDiv.addEventListener('click', () => {
                        closeSearchModal();
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Efecto de resaltado temporal
                        el.style.transition = 'background-color 0.5s';
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
// ==========================================
    // 7. HIGHLIGHT AUTOMÁTICO (MENÚ LATERAL Y SUPERIOR)
    // ==========================================
    
    // 1. Seleccionamos las secciones y TODOS los enlaces (lateral y arriba)
    const sections = document.querySelectorAll('section');
    // AQUÍ ESTÁ EL CAMBIO CLAVE: Seleccionamos ambos tipos de enlaces
    const allLinks = document.querySelectorAll('.toc-link, .nav-menu a');

    // 2. Opciones del observador
    const observerOptions = {
        root: null,
        // Esto define la "línea de lectura". Se activa cuando la sección
        // pasa por el 30% superior de la pantalla.
        rootMargin: '-30% 0px -70% 0px', 
        threshold: 0
    };

    // 3. Creamos el observador
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Obtenemos el ID de la sección visible
                const id = entry.target.getAttribute('id');

                if (id) {
                    // Recorremos TODOS los enlaces (arriba y lado)
                    allLinks.forEach(link => {
                        // Quitamos la clase active de todos
                        link.classList.remove('active');
                        
                        // Si el href del enlace coincide con el ID de la sección (#inicio == #inicio)
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            }
        });
    }, observerOptions);

    // 4. Activamos el observador en cada sección
    sections.forEach(section => {
        observer.observe(section);
    });

    // 5. Scroll suave para todos los enlaces
    allLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Solo aplicamos scroll suave si es un enlace interno (empieza por #)
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);
                
                if(targetSection){
                    window.scrollTo({
                        top: targetSection.offsetTop - 80, // Compensar la altura del header fijo
                        behavior: 'smooth'
                    });
                    
                    // Si estamos en móvil y pulsamos un enlace del menú, lo cerramos
                    const navMenu = document.querySelector('.nav-menu');
                    if (navMenu && navMenu.classList.contains('active')) {
                        navMenu.classList.remove('active');
                    }
                }
            }
        });
    });
});