import os
import json
import instaloader
import google.generativeai as genai
from datetime import datetime
import time

# --- CONFIGURACIÓN ---
# Pon aquí tu usuario de Instagram (PÚBLICO)
IG_USERNAME = "clubvoleibolnavalcarnero"  # <--- ¡CÁMBIALO POR EL TUYO!

# Rutas de carpetas (No tocar si seguiste los pasos)
CARPETA_IMAGENES = "imagenes"
CARPETA_NOTICIAS = "noticias"
ARCHIVO_JSON = "noticias.json"
PLANTILLA_HTML = "plantilla.html"

# Configuración de la IA (Gemini)
api_key = os.environ.get("GENAI_API_KEY")
if not api_key:
    print("❌ ERROR: No encontré la API Key de Google. Asegúrate de configurar GENAI_API_KEY.")
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
    2. El CUERPO de la noticia en formato HTML (usa <p>, <strong>, etc., pero NO uses <html> ni <body>). El texto debe ser profesional, ampliando la información de la descripción para que parezca una noticia real de un medio digital.
    
    Formato de respuesta: TITULO | CUERPO_HTML
    """
    
    try:
        response = model.generate_content(prompt)
        texto = response.text
        if "|" in texto:
            titulo, cuerpo = texto.split("|", 1)
            return titulo.strip(), cuerpo.strip()
        else:
            return "Nueva Publicación", texto
    except Exception as e:
        print(f"Error IA: {e}")
        return "Noticia de Instagram", f"<p>{caption}</p>"

def main():
    print("--- 🚀 INICIANDO ROBOT PERIODISTA ---")
    
    # 1. Preparar Instaloader
    L = instaloader.Instaloader()
    # Cargamos el perfil
    try:
        profile = instaloader.Profile.from_username(L.context, IG_USERNAME)
    except Exception as e:
        print(f"❌ Error al acceder al perfil {IG_USERNAME}: {e}")
        return

    # 2. Cargar base de datos actual (JSON)
    noticias_existentes = []
    if os.path.exists(ARCHIVO_JSON):
        with open(ARCHIVO_JSON, 'r', encoding='utf-8') as f:
            noticias_existentes = json.load(f)
    
    ids_procesados = [n['id'] for n in noticias_existentes]

    # 3. Revisar el ÚLTIMO post (solo el más reciente para empezar)
    posts = profile.get_posts()
    post = next(posts) # Tomamos solo el primero

    shortcode = post.shortcode
    print(f"🔎 Analizando último post: {shortcode}")

    if shortcode in ids_procesados:
        print("✅ Este post ya existe en la web. Nada que hacer.")
        return

    # --- PROCESANDO NUEVO POST ---
    print("🆕 ¡Noticia nueva detectada! Procesando...")

    # A. Descargar imagen (si es foto)
    ruta_media_web = ""
    bloque_media_html = ""
    
    if post.is_video:
        print("   🎥 Es un video. Usaremos Embed.")
        # Usamos el embed de Instagram para no gastar ancho de banda en Vercel
        bloque_media_html = f'<div class="video-container"><iframe src="https://www.instagram.com/p/{shortcode}/embed" width="400" height="480" frameborder="0" scrolling="no" allowtransparency="true"></iframe></div>'
        fecha_final = post.date.strftime("%d/%m/%Y")
    else:
        print("   📸 Es una imagen. Descargando...")
        # Descargamos
        L.download_post(post, target="temp_downloads")
        
        # Buscar el archivo jpg descargado
        archivos = os.listdir("temp_downloads")
        jpg_file = next((f for f in archivos if f.endswith(".jpg")), None)
        
        if jpg_file:
            # Movemos y renombramos la foto
            nombre_foto = f"{shortcode}.jpg"
            origen = os.path.join("temp_downloads", jpg_file)
            destino = os.path.join(CARPETA_IMAGENES, nombre_foto)
            os.rename(origen, destino)
            
            # Limpieza carpeta temporal
            for f in archivos: os.remove(os.path.join("temp_downloads", f))
            os.rmdir("temp_downloads")
            
            ruta_media_web = f"/imagenes/{nombre_foto}"
            bloque_media_html = f'<img src="{ruta_media_web}" alt="Foto noticia">'
            
            # IA Vision para la fecha
            fecha_final = obtener_fecha_de_imagen(destino, post.date)
        else:
            fecha_final = post.date.strftime("%d/%m/%Y")

    # B. Generar Texto con IA
    caption = post.caption if post.caption else "Sin descripción"
    titulo_ia, cuerpo_ia = generar_contenido_ia(caption, post.is_video)

    # C. Crear el archivo HTML de la noticia
    with open(PLANTILLA_HTML, 'r', encoding='utf-8') as f:
        plantilla = f.read()

    html_final = plantilla.replace("{{TITULO}}", titulo_ia)
    html_final = html_final.replace("{{FECHA}}", fecha_final)
    html_final = html_final.replace("{{MEDIA}}", bloque_media_html)
    html_final = html_final.replace("{{CONTENIDO}}", cuerpo_ia)

    nombre_archivo_html = f"{shortcode}.html"
    ruta_noticia = os.path.join(CARPETA_NOTICIAS, nombre_archivo_html)
    
    with open(ruta_noticia, 'w', encoding='utf-8') as f:
        f.write(html_final)
    
    print(f"   📝 Archivo HTML creado: {ruta_noticia}")

    # D. Actualizar el índice JSON
    nueva_entrada = {
        "id": shortcode,
        "titulo": titulo_ia,
        "fecha":