import os
import json
import requests
import google.generativeai as genai
from datetime import datetime
import shutil 
from PIL import Image 
from apify_client import ApifyClient

# --- CONFIGURACIÓN ---
TARGET_USERNAME = "clubvoleibolnavalcarnero" 

CARPETA_IMAGENES = "imagenes"
CARPETA_NOTICIAS = "noticias"
ARCHIVO_JSON = "noticias.json"
PLANTILLA_HTML = "plantilla.html"

os.makedirs(CARPETA_IMAGENES, exist_ok=True)
os.makedirs(CARPETA_NOTICIAS, exist_ok=True)

# 🔑 Cargamos las dos llaves maestras
api_key = os.environ.get("GENAI_API_KEY")
apify_token = os.environ.get("APIFY_API_TOKEN")

if not api_key or not apify_token:
    print("\n❌ ERROR CRÍTICO: Faltan las API Keys (Gemini o Apify).")
    exit()

genai.configure(api_key=api_key)
# Volvemos al modelo súper estable que tu cuenta reconoce sin problemas
model = genai.GenerativeModel('gemini-pro')

def obtener_fecha_de_imagen(ruta_imagen, fecha_post_original):
    print("   👁️  Analizando imagen en busca de fecha...")
    try:
        # Usamos el modelo de visión clásico y le pasamos la foto directamente
        modelo_vision = genai.GenerativeModel('gemini-pro-vision')
        img_pil = Image.open(ruta_imagen)
        
        prompt = """
        Mira esta imagen. ¿Hay una fecha escrita en ella (texto superpuesto o en un cartel)?
        Si ves una fecha, devuélvela en formato DD/MM/YYYY.
        Si NO ves ninguna fecha, responde exactamente: NO_DATE
        """
        result = modelo_vision.generate_content([prompt, img_pil])
        texto = result.text.strip()
        
        if "NO_DATE" in texto:
            print("      -> No se ve fecha en la foto, usando fecha del post.")
            return fecha_post_original.strftime("%d/%m/%Y")
        
        print(f"      -> Fecha encontrada en imagen: {texto}")
        return texto
    except Exception as e:
        print(f"      -> Error analizando imagen visualmente. Usando fecha del post.")
        return fecha_post_original.strftime("%d/%m/%Y")

def generar_contenido_ia(caption, es_video):
    print("   🧠 Escribiendo noticia EXTENSA con IA...")
    tipo = "un video" if es_video else "una galería de fotos"
    
    prompt = f"""
    Actúa como un periodista deportivo de alto nivel para un diario digital. 
    Tengo un post de Instagram que es {tipo}.
    La descripción original es: "{caption}"

    Necesito una noticia EXTENSA y profesional. 

    INSTRUCCIONES DE CONTENIDO:
    - Un TITULO impactante (máximo 10 palabras).
    - Un CUERPO en formato HTML puro (usa <p>, <strong>, etc., pero NO uses <html> ni <body> ni bloques de código markdown). 
    - Debe incluir una entradilla (párrafo corto en negrita).
    - Al menos 2 o 3 o 4 párrafos detallados desarrollando la información.
    - Incluye algo negativo si ha habido alguna derrota, especificando el esfuerzo, las ganas de mejorar y el camino por recorrer.
    - Usa <strong> para resaltar puntos clave a lo largo de todo el texto.
    - Termina con una conclusión motivadora.

    ESTRUCTURA OBLIGATORIA DE LA RESPUESTA (Separa el título del cuerpo EXACTAMENTE con los caracteres ###):
    TITULO DE LA NOTICIA
    ###
    <p><strong>Entradilla corta y potente.</strong></p>
    <p>Desarrollo detallado...</p>

    (IMPORTANTE: Devuelve SOLO el título, los ### y el HTML. No escribas la palabra "HTML" ni uses bloques de código).
    """
    try:
        # Mantenemos los filtros apagados para que no censure la jerga de voleibol
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
        ]
        
        response = model.generate_content(prompt, safety_settings=safety_settings)
        texto = response.text
        
        if "###" in texto:
            parts = texto.split("###", 1)
            return parts[0].strip(), parts[1].strip()
        else:
            print("⚠️ La IA no puso el separador ###. Intentando arreglarlo...")
            return "Actualidad del Club", texto.replace('```html', '').replace('```', '')
            
    except Exception as e:
        print(f"❌ Error crítico de IA: {e}")
        return "Noticia de Instagram", f"<p>{caption}</p>"

def main():
    print("--- 🚀 INICIANDO ROBOT PERIODISTA (Vía APIFY) ---")
    
    # 1. Llamamos a Apify para que haga el trabajo sucio en Instagram
    print(f"🔎 Mandando a los mercenarios de Apify a espiar a {TARGET_USERNAME}...")
    client = ApifyClient(apify_token)
    
    try:
        run_input = {
            "directUrls": [f"https://www.instagram.com/{TARGET_USERNAME}/"],
            "resultsType": "posts",
            "resultsLimit": 1
        }
        
        run = client.actor("apify/instagram-scraper").call(run_input=run_input)
        items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
        
        if not items:
            print("❌ No se encontró ningún post público.")
            return
            
        post = items[0]
        
    except Exception as e:
        print(f"❌ Error al conectar con Apify: {e}")
        return

    shortcode = post.get('shortCode')
    caption = post.get('caption', 'Sin descripción')
    is_video = post.get('isVideo', False)
    
    timestamp = post.get('timestamp') 
    if timestamp:
        fecha_obj_post = datetime.strptime(timestamp[:10], "%Y-%m-%d")
    else:
        fecha_obj_post = datetime.now()
        
    print(f"✅ ¡Datos interceptados! Analizando post: {shortcode}")

    noticias_existentes = []
    if os.path.exists(ARCHIVO_JSON):
        try:
            with open(ARCHIVO_JSON, 'r', encoding='utf-8') as f:
                content = f.read()
                if content.strip():
                    noticias_existentes = json.loads(content)
        except json.JSONDecodeError:
            noticias_existentes = []
    
    ids_procesados = [n.get('id') for n in noticias_existentes]

    if shortcode in ids_procesados:
        print("✅ Este post ya existe en la web. Apagando sistemas. Nada que hacer.")
        return

    print("🆕 ¡Noticia nueva detectada! Procesando descargas y redacción...")

    ruta_media_web = ""
    bloque_media_html = ""
    fecha_final = fecha_obj_post.strftime("%d/%m/%Y") 
    
    if is_video:
        print("   🎥 Es un video. Usaremos Embed.")
        bloque_media_html = f'<div class="video-container"><iframe src="https://www.instagram.com/p/{shortcode}/embed" width="400" height="480" frameborder="0" scrolling="no" allowtransparency="true"></iframe></div>'
    else:
        print(f"   📸 Descargando imágenes directamente desde los servidores CDN...")
        try:
            ruta_carpeta_especifica = os.path.join(CARPETA_IMAGENES, shortcode)
            os.makedirs(ruta_carpeta_especifica, exist_ok=True)
            os.makedirs("temp_downloads", exist_ok=True)
            
            urls_imagenes = []
            if post.get('childPosts'):
                urls_imagenes = [child.get('displayUrl') for child in post.get('childPosts') if child.get('displayUrl')]
            elif post.get('displayUrl'):
                urls_imagenes = [post.get('displayUrl')]
            
            imagenes_html = []
            contador = 1
            
            for url in urls_imagenes:
                resp = requests.get(url, stream=True)
                if resp.status_code == 200:
                    origen = os.path.join("temp_downloads", f"temp_{contador}.jpg")
                    with open(origen, 'wb') as f:
                        shutil.copyfileobj(resp.raw, f)
                        
                    nombre_png = f"{contador}.png" 
                    destino = os.path.join(ruta_carpeta_especifica, nombre_png)
                    
                    img = Image.open(origen)
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGBA")
                    img.save(destino, "PNG") 
                    
                    url_foto = f"/imagenes/{shortcode}/{nombre_png}" 
                    imagenes_html.append(f'<img src="{url_foto}" alt="Imagen {contador} de la noticia" class="news-gallery-img">')
                    
                    if contador == 1:
                        fecha_final = obtener_fecha_de_imagen(destino, fecha_obj_post)
                        ruta_media_web = url_foto
                    
                    contador += 1
            
            shutil.rmtree("temp_downloads", ignore_errors=True)
            bloque_media_html = '<div class="news-gallery">' + "".join(imagenes_html) + '</div>'
            
        except Exception as e:
            print(f"⚠️ Error procesando la galería: {e}")

    titulo_ia, cuerpo_ia = generar_contenido_ia(caption, is_video)
    resumen_texto = cuerpo_ia[:120].replace("<p>", "").replace("<strong>", "").replace("</p>", "").replace("</strong>", "") + "..."

    try:
        fecha_obj = datetime.strptime(fecha_final, "%d/%m/%Y")
        fecha_iso = fecha_obj.strftime("%Y-%m-%d")
    except ValueError:
        fecha_iso = fecha_obj_post.strftime("%Y-%m-%d")
        fecha_final = fecha_obj_post.strftime("%d/%m/%Y")

    nombre_archivo_html = f"{fecha_iso}-noticia-{shortcode}.html"
    
    if os.path.exists(PLANTILLA_HTML):
        with open(PLANTILLA_HTML, 'r', encoding='utf-8') as f:
            plantilla = f.read()

        html_final = plantilla.replace("{{TITULO}}", titulo_ia)
        html_final = html_final.replace("{{FECHA}}", fecha_final)
        html_final = html_final.replace("{{MEDIA}}", bloque_media_html)
        html_final = html_final.replace("{{CONTENIDO}}", cuerpo_ia)
        html_final = html_final.replace("{{RESUMEN}}", resumen_texto)
        html_final = html_final.replace("{{IMAGEN_OG}}", ruta_media_web)

        ruta_noticia = os.path.join(CARPETA_NOTICIAS, nombre_archivo_html)
        
        with open(ruta_noticia, 'w', encoding='utf-8') as f:
            f.write(html_final)
        
        print(f"   📝 Archivo HTML creado: {ruta_noticia}")
    else:
        print(f"❌ ERROR: No se encuentra {PLANTILLA_HTML}. Crea ese archivo primero.")
        return

    nueva_entrada = {
        "id": shortcode,
        "titulo": titulo_ia,
        "fecha": fecha_final,          
        "fecha_iso": fecha_iso,        
        "archivo": nombre_archivo_html,
        "imagen": ruta_media_web,
        "resumen": resumen_texto
    }
    
    noticias_existentes.append(nueva_entrada)
    with open(ARCHIVO_JSON, 'w', encoding='utf-8') as f:
        json.dump(noticias_existentes, f, indent=4, ensure_ascii=False)

    print("✅ ¡Proceso terminado con éxito!")

if __name__ == "__main__":
    main()