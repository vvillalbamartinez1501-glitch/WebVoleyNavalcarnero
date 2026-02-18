import os
import json
import instaloader
import google.generativeai as genai
from datetime import datetime
import shutil # Para mover archivos de forma segura

# --- CONFIGURACIÓN ---
# 1. ¿A quién vamos a espiar? (El perfil público del club)
TARGET_USERNAME = "clubvoleibolnavalcarnero" 

# 2. ¿Quién soy yo? (Tu usuario, el que acabas de usar en la terminal)
LOGIN_USERNAME = "vvillalbamartinez1501"  # <--- ¡PON AQUÍ EL TUYO!

# Rutas de carpetas
CARPETA_IMAGENES = "imagenes"
CARPETA_NOTICIAS = "noticias"
ARCHIVO_JSON = "noticias.json"
PLANTILLA_HTML = "plantilla.html"

# Aseguramos que las carpetas existan
os.makedirs(CARPETA_IMAGENES, exist_ok=True)
os.makedirs(CARPETA_NOTICIAS, exist_ok=True)

# Configuración de la IA (Gemini)
api_key = os.environ.get("GENAI_API_KEY")

# Verificación de seguridad de la API Key
if not api_key:
    print("\n❌ ERROR CRÍTICO: No se encontró la API Key.")
    print("👉 En la terminal, antes de ejecutar el script, debes escribir:")
    print('   Windows: $env:GENAI_API_KEY="TU_CLAVE_AQUI"')
    print('   Mac/Linux: export GENAI_API_KEY="TU_CLAVE_AQUI"')
    exit()

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-1.5-flash')

def obtener_fecha_de_imagen(ruta_imagen, fecha_post_original):
    """
    Usa la IA para leer la fecha en la foto. Si no hay fecha, usa la del post.
    """
    print("   👁️  Analizando imagen en busca de fecha...")
    try:
        myfile = genai.upload_file(ruta_imagen)
        prompt = """
        Mira esta imagen. ¿Hay una fecha escrita en ella (texto superpuesto o en un cartel)?
        Si ves una fecha, devuélvela en formato DD/MM/YYYY.
        Si NO ves ninguna fecha, responde exactamente: NO_DATE
        """
        result = model.generate_content([myfile, prompt])
        texto = result.text.strip()
        
        if "NO_DATE" in texto:
            print("      -> No se ve fecha en la foto, usando fecha del post.")
            return fecha_post_original.strftime("%d/%m/%Y")
        
        print(f"      -> Fecha encontrada en imagen: {texto}")
        return texto
    except Exception as e:
        print(f"      -> Error analizando imagen: {e}. Usando fecha original.")
        return fecha_post_original.strftime("%d/%m/%Y")

def generar_contenido_ia(caption, es_video):
    """
    Genera el título y el cuerpo de la noticia usando la descripción de Instagram.
    """
    print("   🧠 Escribiendo noticia con IA...")
    tipo = "un video" if es_video else "una foto"
    
    prompt = f"""
    Actúa como un periodista digital experto.
    Tengo un post de Instagram que es {tipo}
    La descripción original del autor es: "{caption}"

    Necesito que generes dos cosas separadas por una barra vertical (|):
    1. Un TÍTULO atractivo y corto (máximo 10 palabras).
    2. El CUERPO de la noticia en formato HTML (usa <p>, <strong>, etc., pero NO uses <html> ni <body>). 
       El texto debe ser profesional, ampliando la información de la descripción para que parezca una noticia real.
    
    Formato de respuesta: TITULO | CUERPO_HTML
    """
    
    try:
        response = model.generate_content(prompt)
        texto = response.text
        if "|" in texto:
            parts = texto.split("|", 1)
            return parts[0].strip(), parts[1].strip()
        else:
            return "Nueva Publicación", texto
    except Exception as e:
        print(f"Error IA: {e}")
        return "Noticia de Instagram", f"<p>{caption}</p>"

def main():
    print("--- 🚀 INICIANDO ROBOT PERIODISTA ---")
    
    # 1. Preparar Instaloader
    L = instaloader.Instaloader()
    
    # A. Intentamos cargar TU sesión (tu pase VIP)
    try:
        print(f"🔑 Intentando cargar sesión de {LOGIN_USERNAME}...")
        L.load_session_from_file(LOGIN_USERNAME, filename=f"session-{LOGIN_USERNAME}")
        print("✅ ¡Sesión cargada! Entramos identificados.")
    except FileNotFoundError:
        print("⚠️ No tienes archivo de sesión. Instagram podría bloquearte (Error 429).")
        print(f"👉 Solución: Ejecuta en terminal: python -m instaloader --login={LOGIN_USERNAME}")
        pass 

    # B. Conectamos con el perfil OBJETIVO (El Club)
    try:
        print(f"🔎 Buscando perfil objetivo: {TARGET_USERNAME}...")
        profile = instaloader.Profile.from_username(L.context, TARGET_USERNAME)
    except Exception as e:
        print(f"❌ Error al encontrar al club: {e}")
        return

    # 2. Cargar base de datos actual (JSON)
    noticias_existentes = []
    if os.path.exists(ARCHIVO_JSON):
        try:
            with open(ARCHIVO_JSON, 'r', encoding='utf-8') as f:
                content = f.read()
                if content.strip():
                    noticias_existentes = json.loads(content)
        except json.JSONDecodeError:
            print("⚠️ El archivo JSON estaba dañado o vacío, se creará uno nuevo.")
            noticias_existentes = []
    
    ids_procesados = [n.get('id') for n in noticias_existentes]

    # 3. Revisar el ÚLTIMO post
    try:
        posts = profile.get_posts()
        post = next(posts) # Tomamos solo el primero
    except Exception as e:
        print(f"❌ Error descargando posts: {e}")
        return

    shortcode = post.shortcode
    print(f"🔎 Analizando último post: {shortcode}")

    if shortcode in ids_procesados:
        print("✅ Este post ya existe en la web. Nada que hacer.")
        return

    # --- PROCESANDO NUEVO POST ---
    print("🆕 ¡Noticia nueva detectada! Procesando...")

    ruta_media_web = ""
    bloque_media_html = ""
    fecha_final = post.date.strftime("%d/%m/%Y") 
    
    if post.is_video:
        print("   🎥 Es un video. Usaremos Embed.")
        bloque_media_html = f'<div class="video-container"><iframe src="https://www.instagram.com/p/{shortcode}/embed" width="400" height="480" frameborder="0" scrolling="no" allowtransparency="true"></iframe></div>'
    else:
        print("   📸 Es una imagen. Descargando...")
        try:
            L.download_post(post, target="temp_downloads")
            archivos = os.listdir("temp_downloads")
            jpg_file = next((f for f in archivos if f.endswith(".jpg")), None)
            
            if jpg_file:
                nombre_foto = f"{shortcode}.jpg"
                origen = os.path.join("temp_downloads", jpg_file)
                destino = os.path.join(CARPETA_IMAGENES, nombre_foto)
                shutil.move(origen, destino)
                shutil.rmtree("temp_downloads", ignore_errors=True)
                
                ruta_media_web = f"/imagenes/{nombre_foto}"
                bloque_media_html = f'<img src="{ruta_media_web}" alt="Foto noticia">'
                fecha_final = obtener_fecha_de_imagen(destino, post.date)
            else:
                shutil.rmtree("temp_downloads", ignore_errors=True)
        except Exception as e:
            print(f"⚠️ Error procesando la imagen: {e}")

    # B. Generar Texto con IA
    caption = post.caption if post.caption else "Sin descripción"
    titulo_ia, cuerpo_ia = generar_contenido_ia(caption, post.is_video)

    # C. Crear el archivo HTML de la noticia (¡AQUÍ ESTÁ TU MEJORA DEL NOMBRE!)
    fecha_archivo = post.date.strftime("%Y-%m-%d")
    nombre_archivo_html = f"{fecha_archivo}-noticia-{shortcode}.html"
    
    if os.path.exists(PLANTILLA_HTML):
        with open(PLANTILLA_HTML, 'r', encoding='utf-8') as f:
            plantilla = f.read()

        html_final = plantilla.replace("{{TITULO}}", titulo_ia)
        html_final = html_final.replace("{{FECHA}}", fecha_final)
        html_final = html_final.replace("{{MEDIA}}", bloque_media_html)
        html_final = html_final.replace("{{CONTENIDO}}", cuerpo_ia)

        ruta_noticia = os.path.join(CARPETA_NOTICIAS, nombre_archivo_html)
        
        with open(ruta_noticia, 'w', encoding='utf-8') as f:
            f.write(html_final)
        
        print(f"   📝 Archivo HTML creado: {ruta_noticia}")
    else:
        print(f"❌ ERROR: No se encuentra {PLANTILLA_HTML}. Crea ese archivo primero.")
        return

    # D. Actualizar el índice JSON
    nueva_entrada = {
        "id": shortcode,
        "titulo": titulo_ia,
        "fecha": fecha_final,
        "archivo": nombre_archivo_html,
        "imagen": ruta_media_web,
        "resumen": cuerpo_ia[:120].replace("<p>", "").replace("</p>", "") + "..."
    }
    
    noticias_existentes.append(nueva_entrada)
    with open(ARCHIVO_JSON, 'w', encoding='utf-8') as f:
        json.dump(noticias_existentes, f, indent=4, ensure_ascii=False)

    print("✅ ¡Proceso terminado con éxito!")

if __name__ == "__main__":
    main()