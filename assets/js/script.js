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