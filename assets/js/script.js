// ==========================================================================
// 1. CARGA DINÁMICA DE COMPONENTES (Header y Footer)
// ==========================================================================
async function cargarComponentes() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');

    if (headerPlaceholder) {
        try {
            const resp = await fetch('/components/header.html');
            headerPlaceholder.innerHTML = await resp.text();
        } catch (e) { console.error("Error cargando header:", e); }
    }

    if (footerPlaceholder) {
        try {
            const resp = await fetch('/components/footer.html');
            footerPlaceholder.innerHTML = await resp.text();
        } catch (e) { console.error("Error cargando footer:", e); }
    }
    
    // ¡LA MAGIA! Avisamos a todo el sistema de que el menú y el footer ya existen
    document.dispatchEvent(new Event('componentesCargados'));
}

// Ejecutamos la carga nada más leer el script
cargarComponentes();


// ==========================================================================
// 2. LÓGICA QUE DEPENDE DEL HEADER Y FOOTER (Espera al evento mágico)
// ==========================================================================
document.addEventListener('componentesCargados', () => {
    
    // --- MENÚ HAMBURGUESA ---
    const menuToggle = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const isActive = navMenu.classList.contains('active');
            menuToggle.innerHTML = isActive ? '✕' : '☰';
            document.body.style.overflow = isActive ? 'hidden' : 'auto';
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.innerHTML = '☰';
                document.body.style.overflow = 'auto';
            });
        });
    }

    // --- MODO OSCURO ---
    const themeToggle = document.querySelector('.theme-toggle') || document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        const htmlElement = document.documentElement;
        
        if (localStorage.getItem('theme') === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            htmlElement.setAttribute('data-theme', 'dark');
            if(icon) icon.classList.replace('fa-moon', 'fa-sun');
        }

        themeToggle.addEventListener('click', () => {
            const isDark = htmlElement.getAttribute('data-theme') === 'dark';
            const newTheme = isDark ? 'light' : 'dark';
            
            htmlElement.setAttribute('data-theme', newTheme);
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            if(icon) {
                icon.classList.replace(isDark ? 'fa-sun' : 'fa-moon', isDark ? 'fa-moon' : 'fa-sun');
            }
        });
    }

    // --- BUSCADOR ---
    const searchTrigger = document.getElementById('search-trigger');
    const searchOverlay = document.getElementById('search-overlay');
    const closeSearch = document.getElementById('close-search');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');

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
        if (e.key === 'Escape' && searchOverlay?.classList.contains('active')) closeSearchModal();
    });

    if(searchInput && resultsContainer) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            resultsContainer.innerHTML = ''; 
            if (term.length < 2) return; 

            const elements = document.querySelectorAll('.main-content h1, .main-content h2, .main-content h3, .main-content p, .team-card h3');
            let found = false;

            elements.forEach(el => {
                if (el.innerText.toLowerCase().includes(term)) {
                    found = true;
                    const div = document.createElement('div');
                    div.className = 'result-item';
                    div.innerHTML = `<h4>Encontrado:</h4><p>${el.innerText.substring(0, 80)}...</p>`;
                    div.addEventListener('click', () => {
                        closeSearchModal();
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.style.backgroundColor = 'rgba(200, 16, 46, 0.3)';
                        setTimeout(() => el.style.backgroundColor = 'transparent', 1500);
                    });
                    resultsContainer.appendChild(div);
                }
            });
            if (!found) resultsContainer.innerHTML = '<div class="result-item"><p>No se encontraron coincidencias.</p></div>';
        });
    }

    // --- SCROLL SPY & LINKS ---
    const allSpyLinks = document.querySelectorAll('.toc-link, .nav-menu a');
    const sectionsSpy = document.querySelectorAll('section');

    if (allSpyLinks.length > 0) {
        const spyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.target.id) {
                    allSpyLinks.forEach(link => {
                        // Compara si el href termina con el ID de la sección
                        link.classList.toggle('active', link.getAttribute('href').endsWith(`#${entry.target.id}`));
                    });
                }
            });
        }, { rootMargin: '-30% 0px -70% 0px' });
        
        sectionsSpy.forEach(s => spyObserver.observe(s));
        
        allSpyLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                // Si el enlace es a una sección de la misma página, hacemos scroll suave
                if(href?.includes('#') && (href.startsWith('#') || href.startsWith('/index.html#') || href.startsWith('index.html#'))) {
                    // Si estamos ya en el index, evitamos recargar
                    if(window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
                        e.preventDefault();
                        const targetId = href.split('#')[1];
                        const target = document.getElementById(targetId);
                        if(target) window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
                    }
                }
            });
        });
    }

    // --- FOOTER LINKS ---
    document.querySelectorAll('.interest-links a').forEach(link => {
        link.addEventListener('mouseenter', () => link.style.color = 'white');
        link.addEventListener('mouseleave', () => link.style.color = '#ccc');
    });

});


// ==========================================================================
// 3. LÓGICA GENERAL DE LA PÁGINA (Carga normal)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {

    // --- GESTIÓN DE COOKIES Y CONTENIDO BLOQUEADO ---
    const banner = document.getElementById('cookie-banner');
    const acceptBtnBanner = document.getElementById('btn-accept-cookies'); 
    const rejectBtnBanner = document.getElementById('btn-reject-cookies'); 
    const acceptBtnWidget = document.getElementById('btn-accept-widget');  

    const loadRestrictedContent = () => {
        document.body.classList.add('cookies-accepted');

        // A. Cargar Scripts de Widgets (Elfsight, Instagram, etc.)
        const lazyWidgetScripts = document.querySelectorAll('script.lazy-widget-script');
        lazyWidgetScripts.forEach(script => {
            if (script.getAttribute('data-loaded') === 'true') return;
            
            const newScript = document.createElement('script');
            newScript.src = script.dataset.src;
            newScript.type = 'text/javascript';
            newScript.async = true;
            document.body.appendChild(newScript);
            script.setAttribute('data-loaded', 'true');
        });

        // B. Cargar Iframes (Mapas)
        const lazyIframes = document.querySelectorAll('.lazy-iframe');
        lazyIframes.forEach(iframe => {
            if (iframe.dataset.src) iframe.src = iframe.dataset.src;
        });

        // C. Verificar Elfsight (Fallback)
        setTimeout(() => {
            const containerWidget = document.getElementById('instagram-container');
            const containerFallback = document.getElementById('news-fallback');
            
            if (!containerWidget) return;

            const hasContent = containerWidget.querySelector('a') || containerWidget.innerText.length > 50;
            const containerHeight = containerWidget.offsetHeight;

            if (containerHeight < 100 || !hasContent) {
                console.warn('Elfsight falló. Activando Fallback.');
                containerWidget.style.display = 'none';
                if(containerFallback) containerFallback.style.display = 'block';
            } else {
                if(containerFallback) containerFallback.style.display = 'none';
            }
        }, 4000);
    };

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'accepted');
        if (banner) banner.classList.remove('show');
        loadRestrictedContent();
    };

    const consent = localStorage.getItem('cookieConsent');
    if (consent === 'accepted') {
        loadRestrictedContent();
    } else if (consent === 'rejected') {
        // Bloqueado
    } else {
        setTimeout(() => { if (banner) banner.classList.add('show'); }, 1000);
    }

    if (acceptBtnBanner) acceptBtnBanner.addEventListener('click', handleAccept);
    if (acceptBtnWidget) acceptBtnWidget.addEventListener('click', handleAccept);
    if (rejectBtnBanner) {
        rejectBtnBanner.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'rejected');
            if (banner) banner.classList.remove('show');
        });
    }

    // --- ANIMACIÓN SCROLL (FADE IN) ---
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

    // --- CARRUSELES INFINITOS ---
    const tracks = document.querySelectorAll('.sponsor-track, .mobile-track');
    tracks.forEach(track => {
        if (track.children.length < 10) { 
            const content = track.innerHTML;
            track.innerHTML = content + content + content;
        }
    });

    const heroTrack = document.querySelector('.hero-track');
    const heroSlides = document.querySelectorAll('.hero-slide');
    if (heroTrack && heroSlides.length > 0) {
        const firstClone = heroSlides[0].cloneNode(true);
        heroTrack.appendChild(firstClone);
        let currentSlide = 0;
        
        setInterval(() => {
            currentSlide++;
            heroTrack.style.transition = 'transform 1.5s cubic-bezier(0.25, 1, 0.5, 1)';
            heroTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
        }, 5000);

        heroTrack.addEventListener('transitionend', () => {
            if (currentSlide >= heroSlides.length) {
                heroTrack.style.transition = 'none';
                currentSlide = 0;
                heroTrack.style.transform = `translateX(0)`;
            }
        });
    }

    // --- ACORDEÓN ---
    document.querySelectorAll('.btn-toggle-services').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const desc = btn.nextElementSibling;
            const span = btn.querySelector('span');
            
            if (desc.style.maxHeight) {
                desc.style.maxHeight = null;
                if(span) span.textContent = "Ver Servicios";
            } else {
                desc.style.maxHeight = desc.scrollHeight + "px";
                if(span) span.textContent = "Cerrar Info";
            }
        });
    });

});

// ==========================================================================
// 4. SERVICE WORKER PWA
// ==========================================================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registrado correctamente.'))
            .catch(err => console.log('SW error:', err));
    });
}

// ==========================================================================
// 11. SISTEMA DE NOTICIAS DINÁMICAS (Lee desde noticias.json)
// ==========================================================================
async function cargarNoticiasDinámicas() {
    try {
        // 1. Descargar el archivo JSON que crea el robot
        const respuesta = await fetch('/noticias.json');
        if (!respuesta.ok) throw new Error('No se encontró noticias.json');
        
        const noticias = await respuesta.json();

        // 2. Ordenar por fecha (De más nueva a más vieja)
        // La fecha viene en DD/MM/YYYY, la giramos a YYYYMMDD para comparar bien
        noticias.sort((a, b) => {
            const fechaA = a.fecha.split('/').reverse().join('');
            const fechaB = b.fecha.split('/').reverse().join('');
            return fechaB.localeCompare(fechaA); 
        });

        // 3. Función para crear el diseño HTML de la tarjeta "Chikitin"
        const crearTarjeta = (noticia) => {
    const imagenSegura = noticia.imagen ? noticia.imagen : '/assets/img/equipo1.png';
    
    // Ahora el contenedor principal es un enlace <a>
    return `
        <a href="/noticias/${noticia.archivo}" class="event-card">
            <div class="card-image">
                <img src="${imagenSegura}" alt="${noticia.titulo}">
                <span class="event-date">${noticia.fecha}</span>
            </div>
            <div class="card-content" style="display: flex; flex-direction: column; justify-content: space-between; flex-grow: 1;">
                <div>
                    <h3 style="font-size: 1.2rem; margin-bottom: 10px; line-height: 1.3;">${noticia.titulo}</h3>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 15px;">
                        ${noticia.resumen}
                    </p>
                </div>
                <div style="margin-top: 15px; border-top: 1px solid var(--border-color); padding-top: 15px;">
                    <span class="link-text">Leer noticia completa <i class="fas fa-arrow-right"></i></span>
                </div>
            </div>
        </a>
    `;
};

        // 4. Inyectar en el INDEX (Solo las 3 últimas)
        const gridIndex = document.getElementById('ultimas-noticias-grid');
        if (gridIndex) {
            const ultimas3 = noticias.slice(0, 3);
            gridIndex.innerHTML = ultimas3.map(crearTarjeta).join('');
        }

        // 5. Inyectar en la página NOTICIAS.HTML (Todas)
        const gridTodas = document.getElementById('todas-noticias-grid');
        if (gridTodas) {
            gridTodas.innerHTML = noticias.map(crearTarjeta).join('');
        }

    } catch (error) {
        console.log("Aviso de noticias:", error.message);
        // Mensaje por si aún no hay noticias generadas
        const grids = [document.getElementById('ultimas-noticias-grid'), document.getElementById('todas-noticias-grid')];
        grids.forEach(grid => {
            if (grid) grid.innerHTML = '<p style="color: var(--text-muted);">Próximamente nuevas crónicas y noticias del club.</p>';
        });
    }
}

// Ejecutar la carga de noticias cuando cargue la página
document.addEventListener('DOMContentLoaded', cargarNoticiasDinámicas);