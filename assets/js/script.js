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
    // 3. PATROCINADORES (SCROLL INFINITO)
    // ==========================================
    const tracks = document.querySelectorAll('.sponsor-track');
    tracks.forEach(track => {
        const content = track.innerHTML;
        track.innerHTML = content + content + content;
    });

    // --- NUEVO: LÓGICA PARA LA BARRA MÓVIL HORIZONTAL ---
    const mobileTrack = document.querySelector('.mobile-track');
    if (mobileTrack) {
        const mobileContent = mobileTrack.innerHTML;
        // Duplicamos el contenido para crear el bucle infinito
        mobileTrack.innerHTML = mobileContent + mobileContent;
    }

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

// ==========================================
    // 8. ACORDEÓN PATROCINADORES (Ver Servicios)
    // ==========================================
    const sponsorButtons = document.querySelectorAll('.btn-toggle-services');

    sponsorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 1. Alternar clase activa en el botón (para girar flecha)
            btn.classList.toggle('active');

            // 2. Seleccionar el panel de descripción siguiente
            const description = btn.nextElementSibling;

            // 3. Lógica de altura (max-height) para animación suave
            if (description.style.maxHeight) {
                // Si está abierto, lo cerramos
                description.style.maxHeight = null;
                btn.querySelector('span').textContent = "Ver Servicios";
            } else {
                // Si está cerrado, lo abrimos calculando su altura real
                description.style.maxHeight = description.scrollHeight + "px";
                btn.querySelector('span').textContent = "Cerrar Info";
            }
        });
    });

    document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. MENÚ MÓVIL ---
    const menuToggle = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => navMenu.classList.toggle('active'));
        // Cerrar menú al hacer clic en un enlace
        navLinks.forEach(link => {
            link.addEventListener('click', () => navMenu.classList.remove('active'));
        });
    }

    // --- 2. CARRUSEL HERO INFINITO ---
    const track = document.querySelector('.hero-track');
    const slides = document.querySelectorAll('.hero-slide');
    
    if (track && slides.length > 0) {
        const firstClone = slides[0].cloneNode(true);
        track.appendChild(firstClone); // Clonamos la primera imagen al final
        
        let i = 0;
        const totalSlides = track.children.length; 
        
        setInterval(() => {
            i++;
            track.style.transition = 'transform 1s ease-in-out';
            track.style.transform = `translateX(-${i * 100}%)`;

            // Cuando llegamos al clon, reseteamos instantáneamente al principio
            track.addEventListener('transitionend', () => {
                if (i >= totalSlides - 1) {
                    track.style.transition = 'none';
                    i = 0;
                    track.style.transform = `translateX(0)`;
                }
            }, { once: true });
        }, 4000); // Cambia cada 4 segundos
    }

    // --- 3. ACORDEÓN PATROCINADORES ---
    const buttons = document.querySelectorAll('.btn-toggle-services');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const content = btn.nextElementSibling;
            
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
                btn.querySelector('span').textContent = 'Ver Servicios';
            } else {
                content.style.maxHeight = content.scrollHeight + 'px';
                btn.querySelector('span').textContent = 'Ocultar';
            }
        });
    });

    // --- 4. SCROLL INFINITO SPONSORS ---
    const sTracks = document.querySelectorAll('.sponsor-track, .mobile-track');
    sTracks.forEach(t => {
        t.innerHTML += t.innerHTML; // Duplicar contenido para efecto infinito
    });

    // --- 5. BUSCADOR INTERACTIVO ---
    const searchBtn = document.getElementById('search-trigger');
    const overlay = document.getElementById('search-overlay');
    const closeBtn = document.getElementById('close-search');
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');

    if (searchBtn && overlay) {
        searchBtn.addEventListener('click', () => {
            overlay.classList.add('active');
            input.focus();
            document.body.style.overflow = 'hidden';
        });

        const closeSearch = () => {
            overlay.classList.remove('active');
            input.value = '';
            results.innerHTML = '';
            document.body.style.overflow = 'auto';
        };

        closeBtn.addEventListener('click', closeSearch);
        
        // Buscar texto en la página
        input.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            results.innerHTML = '';
            if (val.length < 2) return;

            // Buscamos en títulos y párrafos
            const targets = document.querySelectorAll('h1, h2, h3, p');
            let found = false;

            targets.forEach(el => {
                if (el.textContent.toLowerCase().includes(val)) {
                    found = true;
                    const div = document.createElement('div');
                    div.className = 'result-item';
                    div.innerText = `Encontrado: ${el.textContent.substring(0, 50)}...`;
                    div.onclick = () => {
                        closeSearch();
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.style.backgroundColor = '#ffeb3b'; // Highlight temporal
                        setTimeout(() => el.style.backgroundColor = 'transparent', 1500);
                    };
                    results.appendChild(div);
                }
            });

            if (!found) results.innerHTML = '<p>No hay resultados</p>';
        });
    }

    // --- 6. MODO OSCURO ---
    const themeBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (savedTheme === 'dark') themeBtn.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    }

    themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const icon = themeBtn.querySelector('i');
        if (newTheme === 'dark') {
            icon.classList.replace('fa-moon', 'fa-sun');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
        }
    });

    // --- 7. ÍNDICE LATERAL ACTIVO (Scroll Spy) ---
    const sections = document.querySelectorAll('section');
    const navLinksToc = document.querySelectorAll('.toc-link');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (pageYOffset >= sectionTop - 150) {
                current = section.getAttribute('id');
            }
        });

        navLinksToc.forEach(li => {
            li.classList.remove('active');
            if (li.getAttribute('href').includes(current)) {
                li.classList.add('active');
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Capturamos el botón y el cuerpo
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    
    // 2. Comprobamos si el usuario ya tenía una preferencia guardada
    const savedTheme = localStorage.getItem('theme');
    
    // Si había guardado 'dark', lo activamos directamente
    if (savedTheme === 'dark') {
        body.setAttribute('data-theme', 'dark');
        // Opcional: Cambiar el icono si usas FontAwesome
        if(themeToggle) themeToggle.classList.replace('fa-moon', 'fa-sun');
    }

    // 3. Función al hacer clic en el botón
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            
            // Comprobamos si está activo actualmente
            const isDark = body.getAttribute('data-theme') === 'dark';
            
            if (isDark) {
                // Desactivar modo oscuro
                body.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                // Cambiar icono a Luna
                themeToggle.classList.replace('fa-sun', 'fa-moon');
            } else {
                // Activar modo oscuro
                body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                // Cambiar icono a Sol
                themeToggle.classList.replace('fa-moon', 'fa-sun');
            }
        });
    }
});