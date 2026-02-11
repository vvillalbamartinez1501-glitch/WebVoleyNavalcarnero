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
    // 4. CARRUSEL HERO (PAUSA Y DESLIZAMIENTO)
    // ==========================================
    const track = document.querySelector('.hero-carousel');
    const slides = document.querySelectorAll('.hero-slide');

    if (track && slides.length > 0) {
        // --- CONFIGURACIÓN ---
        const intervalTime = 5000; // Tiempo de PAUSA (5 segundos parada)
        
        // 1. Clonar la primera imagen y ponerla al final (para el bucle infinito)
        const firstClone = slides[0].cloneNode(true);
        firstClone.id = 'first-clone';
        track.appendChild(firstClone);

        // 2. Variables de control
        let currentSlide = 0;
        const totalSlides = document.querySelectorAll('.hero-slide').length; // Contamos de nuevo con el clon
        let slideInterval;

        // 3. Función para mover al siguiente slide
        const moveToNextSlide = () => {
            currentSlide++;
            track.style.transition = 'transform 1.5s cubic-bezier(0.25, 1, 0.5, 1)'; // Asegurar que hay animación
            track.style.transform = `translateX(-${currentSlide * 100}%)`;
        };

        // 4. Detectar cuando termina la transición para comprobar si hay que reiniciar (Bucle)
        track.addEventListener('transitionend', () => {
            // Si estamos en la imagen clonada (la última visualmente, que es igual a la primera)
            if (currentSlide === totalSlides - 1) {
                track.style.transition = 'none'; // Quitamos animación para el salto instantáneo
                currentSlide = 0; // Volvemos al índice 0
                track.style.transform = `translateX(0)`; // Movemos el track al principio
            }
        });

        // 5. Iniciar el bucle automático
        const startSlideShow = () => {
            slideInterval = setInterval(moveToNextSlide, intervalTime);
        };

        // Arrancar
        startSlideShow();

        // Opcional: Pausar si el usuario pasa el ratón por encima (puedes borrar esto si no lo quieres)
        /*
        track.addEventListener('mouseenter', () => { clearInterval(slideInterval); });
        track.addEventListener('mouseleave', startSlideShow);
        */
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