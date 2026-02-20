import os
import json
import instaloader
import google.generativeai as genai
from datetime import datetime
import shutil 
from PIL import Image 

# --- CONFIGURACIÓN ---
LOGIN_USERNAME = "vvillalbamartinez1501"  # <--- ¡ASEGÚRATE DE QUE SEA EL TUYO!

CARPETA_IMAGENES = "imagenes"
CARPETA_NOTICIAS = "noticias"
ARCHIVO_JSON = "noticias.json"
PLANTILLA_HTML = "plantilla.html"

# Aseguramos que las carpetas existan
os.makedirs(CARPETA_IMAGENES, exist_ok=True)
os.makedirs(CARPETA_NOTICIAS, exist_ok=True)

# Configuración de la IA (Gemini)
api_key = os.environ.get("GENAI_API_KEY")

if not api_key:
    print("\n❌ ERROR CRÍTICO: No se encontró la API Key.")
    print("👉 En la terminal, antes de ejecutar el script, debes configurarla.")
    exit()

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-1.5-flash')

def obtener_fecha_de_imagen(ruta_imagen, fecha_post_original):
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
    print("   🧠 Escribiendo noticia EXTENSA con IA...")
    tipo = "un video" if es_video else "una galería de fotos"
    
    prompt = f"""
    Actúa como un periodista deportivo de alto nivel para un diario digital. 
    Tengo un post de Instagram que es {tipo}.
    La descripción original es: "{caption}"

    Necesito una noticia EXTENSA y profesional. Sigue esta estructura estricta separada por una barra vertical (|):
    1. Un TITULO impactante (máximo 10 palabras).
    2. Un CUERPO en formato HTML puro (usa <p>, <strong>, etc., pero NO uses <html> ni <body> ni bloques de código). 
        - Debe incluir una entradilla (párrafo corto en negrita).
        - Al menos 2 o 3 o 4 párrafos detallados desarrollando la información.
        - Incluye algo negativo si ha habido alguna derrota, especificando el esfuerzo, las ganas de mejorar, el camino por recorrer o algo parecido
        - Usa <strong> para resaltar puntos clave.
        - Termina con una conclusión motivadora.

    Formato de respuesta EXACTO: TITULO | CUERPO_HTML
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

def extraer_shortcode(url):
    """Extrae el ID del post desde una URL completa."""
    if "/p/" in url:
        return url.split("/p/")[1].split("/")[0]
    elif "/reel/" in url:
        return url.split("/reel/")[1].split("/")[0]
    return url.strip()

def generar_noticia_manual(shortcode):
    print(f"\n--- 🚀 INICIANDO CREADOR MANUAL (Post ID: {shortcode}) ---")
    
    # 1. Preparar Instaloader
    L = instaloader.Instaloader()
    
    # A. Intentamos cargar TU sesión
    try:
        print(f"🔑 Intentando cargar sesión de {LOGIN_USERNAME}...")
        L.load_session_from_file(LOGIN_USERNAME, filename=f"session-{LOGIN_USERNAME}")
        print("✅ ¡Sesión cargada! Entramos identificados.")
    except FileNotFoundError:
        print("⚠️ No tienes archivo de sesión. Instagram podría bloquearte (Error 429).")
        pass 

    # B. OBTENER EL POST ESPECÍFICO
    try:
        print(f"🔎 Buscando el post en Instagram...")
        post = instaloader.Post.from_shortcode(L.context, shortcode)
    except Exception as e:
        print(f"❌ Error al encontrar el post (¿es privado o no existe?): {e}")
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
    
    ids_procesados = [n.get('id') for n in noticias_existentes]

    if shortcode in ids_procesados:
        print("✅ Este post ya existe en la web. Nada que hacer.")
        return

    # --- PROCESANDO NUEVO POST ---
    print("🆕 Procesando post para generar noticia...")

    ruta_media_web = ""
    bloque_media_html = ""
    fecha_final = post.date.strftime("%d/%m/%Y") 
    
    if post.is_video:
        print("   🎥 Es un video. Usaremos Embed.")
        bloque_media_html = f'<div class="video-container"><iframe src="https://www.instagram.com/p/{shortcode}/embed" width="400" height="480" frameborder="0" scrolling="no" allowtransparency="true"></iframe></div>'
    else:
        print(f"   📸 Descargando galería de imágenes y procesando a PNG...")
        try:
            ruta_carpeta_especifica = os.path.join(CARPETA_IMAGENES, shortcode)
            os.makedirs(ruta_carpeta_especifica, exist_ok=True)
            
            L.download_post(post, target="temp_downloads")
            
            archivos = sorted(os.listdir("temp_downloads"))
            imagenes_html = []
            contador = 1
            
            for f in archivos:
                if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                    origen = os.path.join("temp_downloads", f)
                    nombre_png = f"{contador}.png"
                    destino = os.path.join(ruta_carpeta_especifica, nombre_png)
                    
                    img = Image.open(origen)
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGBA")
                    img.save(destino, "PNG")
                    
                    url_foto = f"/imagenes/{shortcode}/{nombre_png}"
                    imagenes_html.append(f'<img src="{url_foto}" alt="Imagen {contador} de la noticia" class="news-gallery-img">')
                    
                    if contador == 1:
                        fecha_final = obtener_fecha_de_imagen(destino, post.date)
                        ruta_media_web = url_foto
                    
                    contador += 1
            
            shutil.rmtree("temp_downloads", ignore_errors=True)
            bloque_media_html = '<div class="news-gallery">' + "".join(imagenes_html) + '</div>'
            
        except Exception as e:
            print(f"⚠️ Error procesando la galería: {e}")

    # B. Generar Texto con IA
    caption = post.caption if post.caption else "Sin descripción"
    titulo_ia, cuerpo_ia = generar_contenido_ia(caption, post.is_video)

# B. Generar Texto con IA
    caption = post.caption if post.caption else "Sin descripción"
    titulo_ia, cuerpo_ia = generar_contenido_ia(caption, post.is_video)

    # ✨ NUEVO: Convertimos la fecha (DD/MM/YYYY) al estándar informático (YYYY-MM-DD)
    try:
        # Intentamos convertir la fecha que sacó la IA o el post
        fecha_obj = datetime.strptime(fecha_final, "%d/%m/%Y")
        fecha_iso = fecha_obj.strftime("%Y-%m-%d")
    except ValueError:
        # Por si la IA se vuelve loca y devuelve un formato raro, usamos la del post
        fecha_iso = post.date.strftime("%Y-%m-%d")
        fecha_final = post.date.strftime("%d/%m/%Y")

    # C. Crear el archivo HTML de la noticia
    # ✨ NUEVO: Ahora el archivo se llama con la fecha real del evento
    nombre_archivo_html = f"{fecha_iso}-noticia-{shortcode}.html"
    
    if os.path.exists(PLANTILLA_HTML):
        with open(PLANTILLA_HTML, 'r', encoding='utf-8') as f:
            plantilla = f.read()

        html_final = plantilla.replace("{{TITULO}}", titulo_ia)
        html_final = html_final.replace("{{FECHA}}", fecha_final) # Se sigue mostrando en español
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
        "fecha": fecha_final,          # Para mostrar visualmente en la web (ej: 25/10/2023)
        "fecha_iso": fecha_iso,        # ✨ NUEVO: Para que Javascript pueda filtrar y ordenar (ej: 2023-10-25)
        "archivo": nombre_archivo_html,
        "imagen": ruta_media_web,
        "resumen": cuerpo_ia[:120].replace("<p>", "").replace("<strong>", "").replace("</p>", "").replace("</strong>", "") + "..."
    }
    
    noticias_existentes.append(nueva_entrada)
    with open(ARCHIVO_JSON, 'w', encoding='utf-8') as f:
        json.dump(noticias_existentes, f, indent=4, ensure_ascii=False)

    print("✅ ¡Proceso terminado con éxito!")

if __name__ == "__main__":
    print("="*50)
    print("   📰 CREADOR DE NOTICIAS MANUAL")
    print("="*50)
    
    url_introducida = input("Pega aquí la URL del post (o el ID) y pulsa Enter:\n> ")
    
    if url_introducida.strip() != "":
        id_post = extraer_shortcode(url_introducida)
        generar_noticia_manual(id_post)
    else:
        print("❌ No has introducido ninguna URL. Cancelando...")