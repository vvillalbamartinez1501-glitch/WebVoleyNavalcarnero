document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. LÓGICA DEL MENÚ MÓVIL (HAMBURGUESA)
    // ==========================================
    const menuToggle = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a'); // Seleccionamos los enlaces

    // Verificamos que los elementos existan para evitar errores
    if (menuToggle && navMenu) {
        
        // Al hacer clic en la hamburguesa, mostramos/ocultamos el menú
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // EXTRA: Al hacer clic en un enlace, cerramos el menú automáticamente
        // Esto mejora mucho la experiencia en el móvil
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if(navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                }
            });
        });
    }

    // ==========================================
    // 2. ANIMACIÓN DE SECCIONES (AL HACER SCROLL)
    // ==========================================
    const sections = document.querySelectorAll('section');

    const observerOptions = {
        threshold: 0.15 // Se activa cuando el 15% de la sección es visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Hacemos visible la sección
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                // Dejamos de observar esa sección para ahorrar recursos
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        // Estilos iniciales (oculto y desplazado hacia abajo)
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        
        // Empezamos a vigilar la sección
        observer.observe(section);
    });

    // ==========================================
    // 3. PATROCINADORES (SCROLL INFINITO)
    // ==========================================
    // Esto duplica los logos para que la animación nunca se vea vacía
    const tracks = document.querySelectorAll('.sponsor-track');
    
    tracks.forEach(track => {
        const content = track.innerHTML;
        // Duplicamos el contenido 2 veces más
        track.innerHTML = content + content + content;
    });

    console.log("Web CV Navalcarnero: Scripts cargados correctamente.");
});

// ==========================================
    // 4. CARRUSEL HERO (Fondo cambiante)
    // ==========================================
    const slides = document.querySelectorAll('.hero-slide');
    let currentSlide = 0;
    const slideInterval = 5000; // Tiempo entre fotos: 5000ms = 5 segundos

    // Solo activamos si existen las slides (para evitar errores)
    if (slides.length > 0) {
        setInterval(() => {
            // 1. Quitamos la clase active de la foto actual
            slides[currentSlide].classList.remove('active');
            
            // 2. Calculamos cuál es la siguiente foto
            currentSlide = (currentSlide + 1) % slides.length;
            
            // 3. Ponemos la clase active a la siguiente foto
            slides[currentSlide].classList.add('active');
        }, slideInterval);
    }

    // ==========================================
    // 6. BUSCADOR INTERNO (JAVASCRIPT PURO)
    // ==========================================
    const searchTrigger = document.getElementById('search-trigger');
    const searchOverlay = document.getElementById('search-overlay');
    const closeSearch = document.getElementById('close-search');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');

    // 1. Abrir buscador
    if(searchTrigger) {
        searchTrigger.addEventListener('click', () => {
            searchOverlay.classList.add('active');
            searchInput.focus(); // Poner el cursor automáticamente
            // Evitar scroll en el cuerpo
            document.body.style.overflow = 'hidden';
        });
    }

    // 2. Cerrar buscador
    function closeSearchModal() {
        searchOverlay.classList.remove('active');
        searchInput.value = ''; // Limpiar texto
        resultsContainer.innerHTML = ''; // Limpiar resultados
        document.body.style.overflow = 'auto'; // Devolver scroll
    }

    if(closeSearch) {
        closeSearch.addEventListener('click', closeSearchModal);
    }

    // Cerrar con tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
            closeSearchModal();
        }
    });

    // 3. Lógica de Búsqueda (Al escribir)
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            resultsContainer.innerHTML = ''; // Limpiar anteriores

            if (searchTerm.length < 2) return; // No buscar si hay menos de 2 letras

            // Seleccionamos dónde buscar (títulos y párrafos del contenido principal)
            const searchableElements = document.querySelectorAll('.main-content h1, .main-content h2, .main-content h3, .main-content p, .event-card h3, .event-card p');
            
            let foundCount = 0;

            searchableElements.forEach(el => {
                const text = el.innerText;
                
                // Si el texto contiene lo que buscamos
                if (text.toLowerCase().includes(searchTerm)) {
                    foundCount++;
                    
                    // Creamos el resultado visual
                    const resultDiv = document.createElement('div');
                    resultDiv.classList.add('result-item');
                    
                    // Texto previo para contexto (cortado)
                    const snippet = text.length > 100 ? text.substring(0, 100) + '...' : text;

                    resultDiv.innerHTML = `
                        <h4>Encontrado en: ${el.tagName}</h4>
                        <p>${snippet}</p>
                    `;

                    // Al hacer clic, ir a ese elemento y cerrar buscador
                    resultDiv.addEventListener('click', () => {
                        closeSearchModal();
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Pequeño parpadeo para resaltar dónde aterrizamos
                        el.style.transition = 'background 0.5s';
                        el.style.backgroundColor = '#ffffcc'; // Amarillo suave
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