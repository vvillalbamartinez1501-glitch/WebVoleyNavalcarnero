document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. MENÚ MÓVIL (HAMBURGUESA)
    // ==========================================
    const menuToggle = document.getElementById('mobile-menu') || document.querySelector('.menu-toggle');
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
    const tracks = document.querySelectorAll('.sponsor-track');
    tracks.forEach(track => {
        const content = track.innerHTML;
        track.innerHTML = content + content + content;
    });

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
            if (currentSlide >= totalSlides - 1) {
                heroTrack.style.transition = 'none';
                currentSlide = 0;
                heroTrack.style.transform = `translateX(0)`;
            }
        });

        setInterval(moveToNextSlide, intervalTime);
    }

    // ==========================================
    // 5. MODO OSCURO
    // ==========================================
    const themeToggle = document.querySelector('.theme-toggle') || document.getElementById('theme-toggle');
    
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        const htmlElement = document.documentElement;

        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            htmlElement.setAttribute('data-theme', 'dark');
            if(icon) icon.classList.replace('fa-moon', 'fa-sun');
        }

        themeToggle.addEventListener('click', () => {
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
        if (e.key === 'Escape' && searchOverlay?.classList.contains('active')) {
            closeSearchModal();
        }
    });

    if(searchInput && resultsContainer) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            resultsContainer.innerHTML = ''; 
            
            if (searchTerm.length < 2) return; 

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
    // 7. HIGHLIGHT ACTIVO
    // ==========================================
    const sectionsSpy = document.querySelectorAll('section');
    const allSpyLinks = document.querySelectorAll('.toc-link, .nav-menu a');

    if (allSpyLinks.length > 0) {
        const spyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    if (id) {
                        allSpyLinks.forEach(link => {
                            if (link.getAttribute('href') === `#${id}`) {
                                link.classList.add('active');
                            } else {
                                link.classList.remove('active');
                            }
                        });
                    }
                }
            });
        }, { rootMargin: '-30% 0px -70% 0px' });

        sectionsSpy.forEach(section => spyObserver.observe(section));
        
        allSpyLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if(href && href.startsWith('#')) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    const targetSection = document.getElementById(targetId);
                    if(targetSection){
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

    // ==========================================
    // 9. LÓGICA DE COOKIES (NUEVO)
    // ==========================================
    const cookieConsent = localStorage.getItem('cookieConsent');
    
    if (cookieConsent === 'accepted') {
        activateCookies(); 
    } else if (cookieConsent === 'rejected') {
        // No hacemos nada, se quedan bloqueados
    } else {
        // Mostrar Banner
        setTimeout(() => {
            const banner = document.getElementById('cookie-banner');
            if(banner) banner.classList.add('show');
        }, 1000);
    }
});

// FUNCIONES GLOBALES PARA COOKIES (Fuera del DOMContentLoaded)
// Así funcionan con onclick="..." en el HTML

function acceptAllCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    const banner = document.getElementById('cookie-banner');
    if(banner) banner.classList.remove('show');
    activateCookies();
}

function rejectCookies() {
    localStorage.setItem('cookieConsent', 'rejected');
    const banner = document.getElementById('cookie-banner');
    if(banner) banner.classList.remove('show');
}

function activateCookies() {
    // 1. Quitar las capas oscuras (overlay)
    document.body.classList.add('cookies-accepted');

    // 2. Activar IFRAMES (Mapas)
    const lazyIframes = document.querySelectorAll('.lazy-iframe');
    lazyIframes.forEach(iframe => {
        if (iframe.dataset.src) {
            iframe.src = iframe.dataset.src; 
        }
    });

    // 3. Activar SCRIPTS (Instagram/Elfsight)
    const lazyScripts = document.querySelectorAll('.lazy-script');
    lazyScripts.forEach(oldScript => {
        // Creamos un script nuevo y ejecutable
        const newScript = document.createElement('script');
        newScript.src = oldScript.dataset.src; 
        newScript.type = 'text/javascript'; // Ahora sí se ejecuta
        newScript.async = true;
        
        // Lo insertamos y borramos el viejo
        oldScript.parentNode.insertBefore(newScript, oldScript);
        oldScript.remove();
    });
}
// Asignar al objeto window para asegurar que el HTML los encuentre
window.acceptAllCookies = acceptAllCookies;
window.rejectCookies = rejectCookies;

// Gestión de efectos en enlaces de interés del footer
document.addEventListener('DOMContentLoaded', () => {
    const footerLinks = document.querySelectorAll('.interest-links a');
    
    footerLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            link.style.color = 'white';
        });
        link.addEventListener('mouseleave', () => {
            link.style.color = '#ccc';
        });
    });
});