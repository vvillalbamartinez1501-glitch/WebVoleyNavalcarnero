document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. GESTIÓN DE COOKIES (Lógica Unificada)
    // ==========================================
    const banner = document.getElementById('cookie-banner');
    const acceptBtnBanner = document.getElementById('btn-accept-cookies'); // Botón "Aceptar todas" del banner
    const rejectBtnBanner = document.getElementById('btn-reject-cookies'); // Botón "Rechazar" del banner
    const acceptBtnWidget = document.getElementById('btn-accept-widget');  // Botón "Aceptar y Ver Fotos" (Overlay)

    // Función principal para cargar todo el contenido bloqueado
    const loadRestrictedContent = () => {
        document.body.classList.add('cookies-accepted');

        // A. Cargar Scripts de Widgets (Elfsight, Instagram, etc.)
        const lazyWidgetScripts = document.querySelectorAll('script.lazy-widget-script');
        lazyWidgetScripts.forEach(script => {
            if (script.getAttribute('data-loaded') === 'true') return;
            
            console.log('Cargando widget:', script.dataset.src);
            const newScript = document.createElement('script');
            newScript.src = script.dataset.src;
            newScript.type = 'text/javascript';
            newScript.async = true;
            document.body.appendChild(newScript);
            script.setAttribute('data-loaded', 'true');
        });

        // B. Cargar Iframes (Mapas, vídeos)
        const lazyIframes = document.querySelectorAll('.lazy-iframe');
        lazyIframes.forEach(iframe => {
            if (iframe.dataset.src) iframe.src = iframe.dataset.src;
        });

        // C. Cargar otros scripts genéricos
        const lazyScripts = document.querySelectorAll('.lazy-script');
        lazyScripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            newScript.src = oldScript.dataset.src;
            newScript.type = 'text/javascript';
            newScript.async = true;
            oldScript.parentNode.insertBefore(newScript, oldScript);
            oldScript.remove();
        });
    };

    // Función para procesar la aceptación
    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'accepted');
        if (banner) banner.classList.remove('show');
        loadRestrictedContent();
    };

    // Lógica de inicio: Comprobar consentimiento previo
    const consent = localStorage.getItem('cookieConsent');
    if (consent === 'accepted') {
        loadRestrictedContent();
    } else if (consent === 'rejected') {
        // Se queda bloqueado
    } else {
        // Primera visita: Mostrar banner tras 1 seg
        setTimeout(() => {
            if (banner) banner.classList.add('show');
        }, 1000);
    }

    // Event Listeners para los botones de cookies
    if (acceptBtnBanner) acceptBtnBanner.addEventListener('click', handleAccept);
    if (acceptBtnWidget) acceptBtnWidget.addEventListener('click', handleAccept);
    
    if (rejectBtnBanner) {
        rejectBtnBanner.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'rejected');
            if (banner) banner.classList.remove('show');
        });
    }

    // ==========================================
    // 2. MENÚ HAMBURGUESA
    // ==========================================
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

    // ==========================================
    // 3. ANIMACIÓN SCROLL (FADE IN)
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
    // 4. CARRUSELES INFINITOS (Sponsors/Hero)
    // ==========================================
    // Sponsors
    const tracks = document.querySelectorAll('.sponsor-track, .mobile-track');
    tracks.forEach(track => {
        // Evitar duplicación si ya tiene contenido duplicado
        if (track.children.length < 10) { 
            const content = track.innerHTML;
            track.innerHTML = content + content + content;
        }
    });

    // Hero Slider
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

    // ==========================================
    // 5. MODO OSCURO
    // ==========================================
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

    // ==========================================
    // 6. BUSCADOR
    // ==========================================
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

    // ==========================================
    // 7. SCROLL SPY & LINKS
    // ==========================================
    const allSpyLinks = document.querySelectorAll('.toc-link, .nav-menu a');
    const sectionsSpy = document.querySelectorAll('section');

    if (allSpyLinks.length > 0) {
        const spyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.target.id) {
                    allSpyLinks.forEach(link => {
                        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
                    });
                }
            });
        }, { rootMargin: '-30% 0px -70% 0px' });
        
        sectionsSpy.forEach(s => spyObserver.observe(s));
        
        allSpyLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if(href?.startsWith('#')) {
                    e.preventDefault();
                    const target = document.getElementById(href.substring(1));
                    if(target) window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
                }
            });
        });
    }

    // ==========================================
    // 8. ACORDEÓN
    // ==========================================
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

    // ==========================================
    // 9. FOOTER LINKS
    // ==========================================
    document.querySelectorAll('.interest-links a').forEach(link => {
        link.addEventListener('mouseenter', () => link.style.color = 'white');
        link.addEventListener('mouseleave', () => link.style.color = '#ccc');
    });
});

// ==========================================
// 10. PWA (Fuera del DOMContentLoaded)
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registrado:', reg))
            .catch(err => console.log('SW error:', err));
    });
}

// Función principal para cargar todo el contenido bloqueado
    const loadRestrictedContent = () => {
        document.body.classList.add('cookies-accepted');

        // A. Cargar Scripts de Widgets (Elfsight)
        const lazyWidgetScripts = document.querySelectorAll('script.lazy-widget-script');
        lazyWidgetScripts.forEach(script => {
            if (script.getAttribute('data-loaded') === 'true') return;
            
            console.log('Cargando widget:', script.dataset.src);
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

        // ============================================================
        // C. VERIFICACIÓN DE ELFSIGHT (SISTEMA FALLBACK)
        // ============================================================
        // Esperamos 4 segundos para dar tiempo a Elfsight a cargar o fallar
        setTimeout(() => {
            const containerWidget = document.getElementById('instagram-container');
            const containerFallback = document.getElementById('news-fallback');
            
            if (!containerWidget) return;

            // Buscamos si Elfsight ha creado contenido real dentro del div
            // Elfsight suele crear clases que empiezan por 'eapps-' o 'elfsight-app' con contenido
            const hasContent = containerWidget.querySelector('a') || containerWidget.innerText.length > 50;
            
            // Verificamos la altura (si falla la cuota, suele quedarse pequeño o vacío)
            const containerHeight = containerWidget.offsetHeight;

            // CONDICIÓN: Si la altura es muy pequeña (<100px) O no parece haber contenido real
            if (containerHeight < 100 || !hasContent) {
                console.warn('Elfsight parece haber fallado. Activando Fallback.');
                
                // 1. Ocultamos SOLO el contenedor del widget
                containerWidget.style.display = 'none';
                
                // 2. Mostramos el contenedor de noticias estáticas
                if(containerFallback) {
                    containerFallback.style.display = 'block';
                }
            } else {
                console.log('Elfsight cargado correctamente.');
                // Nos aseguramos que el fallback esté oculto
                 if(containerFallback) {
                    containerFallback.style.display = 'none';
                }
            }

        }, 4000); // 4 segundos de espera
    };

    // ==========================================
// CARGA DINÁMICA DE HEADER Y FOOTER
// ==========================================
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
    
    // Disparamos un evento para que tu JS sepa que el menú ya existe
    document.dispatchEvent(new Event('componentesCargados'));
}

// Ejecutamos la función nada más empezar
cargarComponentes();