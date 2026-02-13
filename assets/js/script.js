document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. MENÚ MÓVIL (HAMBURGUESA)
    // ==========================================
    /* Asegúrate de que en tu HTML:
       - El icono de hamburguesa tenga id="mobile-menu" o class="menu-toggle"
       - El menú de navegación tenga class="nav-menu"
    */
    const menuToggle = document.getElementById('mobile-menu') || document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a');

    if (menuToggle && navMenu) {
        // Abrir / Cerrar menú al tocar el icono
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Cerrar menú automáticamente al hacer clic en un enlace
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    // ==========================================
    // 2. ANIMACIÓN DE APARICIÓN AL HACER SCROLL
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
    // 3. PATROCINADORES (SCROLL INFINITO)
    // ==========================================
    // Sidebar Vertical (PC)
    const tracks = document.querySelectorAll('.sponsor-track');
    tracks.forEach(track => {
        const content = track.innerHTML;
        // Triplicamos contenido para asegurar scroll fluido
        track.innerHTML = content + content + content;
    });

    // Barra Horizontal (Móvil)
    const mobileTrack = document.querySelector('.mobile-track');
    if (mobileTrack) {
        const mobileContent = mobileTrack.innerHTML;
        mobileTrack.innerHTML = mobileContent + mobileContent + mobileContent;
    }

    // ==========================================
    // 4. CARRUSEL HERO (INFINITO)
    // ==========================================
    const heroTrack = document.querySelector('.hero-track');
    const heroSlides = document.querySelectorAll('.hero-slide');

    if (heroTrack && heroSlides.length > 0) {
        const intervalTime = 5000;
        
        // Clonar primera imagen para efecto infinito
        const firstClone = heroSlides[0].cloneNode(true);
        heroTrack.appendChild(firstClone);

        let currentSlide = 0;
        const totalSlides = heroTrack.children.length; 

        const moveToNextSlide = () => {
            currentSlide++;
            heroTrack.style.transition = 'transform 1.5s cubic-bezier(0.25, 1, 0.5, 1)';
            heroTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
        };

        heroTrack.addEventListener('transitionend', () => {
            // Si llega al clon (último slide), volver al primero sin animación
            if (currentSlide >= totalSlides - 1) {
                heroTrack.style.transition = 'none';
                currentSlide = 0;
                heroTrack.style.transform = `translateX(0)`;
            }
        });

        setInterval(moveToNextSlide, intervalTime);
    }

    // ==========================================
    // 5. MODO OSCURO (DARK MODE)
    // ==========================================
    const themeToggle = document.querySelector('.theme-toggle') || document.getElementById('theme-toggle');
    
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        const body = document.documentElement; // Usamos <html> para data-theme

        // Recuperar tema guardado
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            body.setAttribute('data-theme', 'dark');
            if(icon) icon.classList.replace('fa-moon', 'fa-sun');
        }

        themeToggle.addEventListener('click', () => {
            const isDark = body.getAttribute('data-theme') === 'dark';
            
            if (isDark) {
                body.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                if(icon) icon.classList.replace('fa-sun', 'fa-moon');
            } else {
                body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                if(icon) icon.classList.replace('fa-moon', 'fa-sun');
            }
        });
    }

    // ==========================================
    // 6. BUSCADOR INTERACTIVO
    // ==========================================
    const searchTrigger = document.getElementById('search-trigger') || document.querySelector('.search-trigger');
    const searchOverlay = document.getElementById('search-overlay') || document.querySelector('.search-overlay');
    const closeSearch = document.getElementById('close-search') || document.querySelector('.close-search');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results') || document.querySelector('.search-results-container');

    const closeSearchModal = () => {
        if(searchOverlay) searchOverlay.classList.remove('active');
        if(searchInput) searchInput.value = '';
        if(resultsContainer) resultsContainer.innerHTML = '';
        document.body.style.overflow = 'auto';
    };

    if(searchTrigger && searchOverlay) {
        searchTrigger.addEventListener('click', () => {
            searchOverlay.classList.add('active');
            if(searchInput) searchInput.focus();
            document.body.style.overflow = 'hidden';
        });
    }

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

            // Elementos donde buscar (Títulos y párrafos)
            const searchableElements = document.querySelectorAll('.main-content h1, .main-content h2, .main-content h3, .main-content p, .team-card h3');
            let foundCount = 0;

            searchableElements.forEach(el => {
                const text = el.innerText;
                if (text.toLowerCase().includes(searchTerm)) {
                    foundCount++;
                    const resultDiv = document.createElement('div');
                    resultDiv.classList.add('result-item');
                    
                    // Crear un snippet corto del texto
                    const snippet = text.length > 80 ? text.substring(0, 80) + '...' : text;
                    
                    resultDiv.innerHTML = `<h4>Encontrado:</h4><p>${snippet}</p>`;
                    
                    // Al hacer click, ir al elemento
                    resultDiv.addEventListener('click', () => {
                        closeSearchModal();
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Efecto de resaltado temporal
                        el.style.transition = 'background-color 0.5s';
                        el.style.backgroundColor = 'rgba(200, 16, 46, 0.3)'; 
                        setTimeout(() => { el.style.backgroundColor = 'transparent'; }, 1500);
                    });
                    
                    resultsContainer.appendChild(resultDiv);
                }
            });
            
            if (foundCount === 0) {
                resultsContainer.innerHTML = '<div class="result-item"><p>No se encontraron coincidencias.</p></div>';
            }
        });
    }

    // ==========================================
    // 7. HIGHLIGHT ÍNDICE (SCROLL SPY)
    // ==========================================
    const sectionsToc = document.querySelectorAll('section');
    const tocLinks = document.querySelectorAll('.toc-link');

    if (tocLinks.length > 0) {
        const tocObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    if (id) {
                        tocLinks.forEach(link => {
                            link.classList.remove('active');
                            if (link.getAttribute('href') === `#${id}`) {
                                link.classList.add('active');
                            }
                        });
                    }
                }
            });
        }, { rootMargin: '-30% 0px -70% 0px' });

        sectionsToc.forEach(section => tocObserver.observe(section));
        
        // Suavizar scroll al hacer click en links del TOC
        tocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                if(targetSection){
                    window.scrollTo({ top: targetSection.offsetTop - 80, behavior: 'smooth' });
                }
            });
        });
    }

    // ==========================================
    // 8. ACORDEÓN PATROCINADORES
    // ==========================================
    const sponsorButtons = document.querySelectorAll('.btn-toggle-services');

    sponsorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const description = btn.nextElementSibling; // El div .sponsor-description

            if (description.style.maxHeight) {
                description.style.maxHeight = null;
                const spanText = btn.querySelector('span');
                if(spanText) spanText.textContent = "Ver Servicios";
            } else {
                description.style.maxHeight = description.scrollHeight + "px";
                const spanText = btn.querySelector('span');
                if(spanText) spanText.textContent = "Cerrar Info";
            }
        });
    });

});
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. MENÚ MÓVIL (HAMBURGUESA)
    // ==========================================
    const menuToggle = document.getElementById('mobile-menu') || document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a');

    if (menuToggle && navMenu) {
        // Abrir / Cerrar menú al tocar el icono
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Cerrar menú automáticamente al hacer clic en un enlace
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    // ==========================================
    // 2. ANIMACIÓN DE APARICIÓN AL HACER SCROLL
    // ==========================================
    const sectionsFade = document.querySelectorAll('section');
    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    sectionsFade.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        sectionObserver.observe(section);
    });

    // ==========================================
    // 3. PATROCINADORES (SCROLL INFINITO)
    // ==========================================
    // Sidebar Vertical (PC)
    const tracks = document.querySelectorAll('.sponsor-track');
    tracks.forEach(track => {
        const content = track.innerHTML;
        // Triplicamos contenido para asegurar scroll fluido sin cortes
        track.innerHTML = content + content + content;
    });

    // Barra Horizontal (Móvil)
    const mobileTrack = document.querySelector('.mobile-track');
    if (mobileTrack) {
        const mobileContent = mobileTrack.innerHTML;
        mobileTrack.innerHTML = mobileContent + mobileContent + mobileContent;
    }

    // ==========================================
    // 4. CARRUSEL HERO (INFINITO)
    // ==========================================
    const heroTrack = document.querySelector('.hero-track');
    const heroSlides = document.querySelectorAll('.hero-slide');

    if (heroTrack && heroSlides.length > 0) {
        const intervalTime = 5000;
        
        // Clonar primera imagen para efecto infinito
        const firstClone = heroSlides[0].cloneNode(true);
        heroTrack.appendChild(firstClone);

        let currentSlide = 0;
        const totalSlides = heroTrack.children.length; 

        const moveToNextSlide = () => {
            currentSlide++;
            heroTrack.style.transition = 'transform 1.5s cubic-bezier(0.25, 1, 0.5, 1)';
            heroTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
        };

        heroTrack.addEventListener('transitionend', () => {
            // Si llega al clon (último slide), volver al primero sin animación
            if (currentSlide >= totalSlides - 1) {
                heroTrack.style.transition = 'none';
                currentSlide = 0;
                heroTrack.style.transform = `translateX(0)`;
            }
        });

        setInterval(moveToNextSlide, intervalTime);
    }

    // ==========================================
    // 5. MODO OSCURO (DARK MODE)
    // ==========================================
    const themeToggle = document.querySelector('.theme-toggle') || document.getElementById('theme-toggle');
    
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        const htmlElement = document.documentElement; // Usamos <html> para data-theme

        // Recuperar tema guardado
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.setAttribute('data-theme', 'dark'); // A veces se usa body
            htmlElement.setAttribute('data-theme', 'dark');   // A veces html
            if(icon) icon.classList.replace('fa-moon', 'fa-sun');
        }

        themeToggle.addEventListener('click', () => {
            // Chequeamos atributo en html o body
            const isDark = htmlElement.getAttribute('data-theme') === 'dark' || document.body.getAttribute('data-theme') === 'dark';
            
            if (isDark) {
                htmlElement.setAttribute('data-theme', 'light');
                document.body.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                if(icon) icon.classList.replace('fa-sun', 'fa-moon');
            } else {
                htmlElement.setAttribute('data-theme', 'dark');
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                if(icon) icon.classList.replace('fa-moon', 'fa-sun');
            }
        });
    }

    // ==========================================
    // 6. BUSCADOR INTERACTIVO
    // ==========================================
    const searchTrigger = document.getElementById('search-trigger') || document.querySelector('.search-trigger');
    const searchOverlay = document.getElementById('search-overlay') || document.querySelector('.search-overlay');
    const closeSearch = document.getElementById('close-search') || document.querySelector('.close-search');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results') || document.querySelector('.search-results-container');

    const closeSearchModal = () => {
        if(searchOverlay) searchOverlay.classList.remove('active');
        if(searchInput) searchInput.value = '';
        if(resultsContainer) resultsContainer.innerHTML = '';
        document.body.style.overflow = 'auto';
    };

    if(searchTrigger && searchOverlay) {
        searchTrigger.addEventListener('click', () => {
            searchOverlay.classList.add('active');
            if(searchInput) searchInput.focus();
            document.body.style.overflow = 'hidden';
        });
    }

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

            // Elementos donde buscar
            const searchableElements = document.querySelectorAll('.main-content h1, .main-content h2, .main-content h3, .main-content p, .team-card h3');
            let foundCount = 0;

            searchableElements.forEach(el => {
                const text = el.innerText;
                if (text.toLowerCase().includes(searchTerm)) {
                    foundCount++;
                    const resultDiv = document.createElement('div');
                    resultDiv.classList.add('result-item');
                    const snippet = text.length > 80 ? text.substring(0, 80) + '...' : text;
                    resultDiv.innerHTML = `<h4>Encontrado:</h4><p>${snippet}</p>`;
                    
                    resultDiv.addEventListener('click', () => {
                        closeSearchModal();
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.style.transition = 'background-color 0.5s';
                        el.style.backgroundColor = 'rgba(200, 16, 46, 0.3)'; 
                        setTimeout(() => { el.style.backgroundColor = 'transparent'; }, 1500);
                    });
                    
                    resultsContainer.appendChild(resultDiv);
                }
            });
            
            if (foundCount === 0) {
                resultsContainer.innerHTML = '<div class="result-item"><p>No se encontraron coincidencias.</p></div>';
            }
        });
    }

    // ==========================================
    // 7. HIGHLIGHT ACTIVO (NAV SUPERIOR + SIDEBAR)
    // ==========================================
    const sectionsSpy = document.querySelectorAll('section');
    
    // Seleccionamos TODOS los enlaces: los del Sidebar (.toc-link) Y los del Nav Superior (.nav-menu a)
    const allSpyLinks = document.querySelectorAll('.toc-link, .nav-menu a');

    if (allSpyLinks.length > 0) {
        const spyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Obtenemos el ID de la sección que se ve en pantalla
                    const id = entry.target.getAttribute('id');
                    
                    if (id) {
                        // Recorremos TODOS los enlaces para actualizar su estado
                        allSpyLinks.forEach(link => {
                            // Quitamos la clase active de todos primero (o verificamos uno a uno)
                            // Verificamos si este link apunta a la sección actual
                            if (link.getAttribute('href') === `#${id}`) {
                                link.classList.add('active');
                            } else {
                                link.classList.remove('active');
                            }
                        });
                    }
                }
            });
        }, { rootMargin: '-30% 0px -70% 0px' }); // Ajuste para que detecte la sección al medio de la pantalla

        sectionsSpy.forEach(section => spyObserver.observe(section));
        
        // Suavizar scroll al hacer click en cualquiera de estos links
        allSpyLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if(href && href.startsWith('#')) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    const targetSection = document.getElementById(targetId);
                    if(targetSection){
                        // Descontamos la altura del header (aprox 80px)
                        window.scrollTo({ top: targetSection.offsetTop - 80, behavior: 'smooth' });
                    }
                }
            });
        });
    }

    // ==========================================
    // 8. ACORDEÓN PATROCINADORES
    // ==========================================
    const sponsorButtons = document.querySelectorAll('.btn-toggle-services');

    sponsorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const description = btn.nextElementSibling;

            if (description.style.maxHeight) {
                description.style.maxHeight = null;
                const spanText = btn.querySelector('span');
                if(spanText) spanText.textContent = "Ver Servicios";
            } else {
                description.style.maxHeight = description.scrollHeight + "px";
                const spanText = btn.querySelector('span');
                if(spanText) spanText.textContent = "Cerrar Info";
            }
        });
    });

});