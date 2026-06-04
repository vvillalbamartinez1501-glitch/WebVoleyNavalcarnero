import os
import json
import instaloader
from datetime import datetime
import shutil 
from PIL import Image 

# 🚀 NUEVAS IMPORTACIONES DE GOOGLE GEMINI
from google import genai
from google.genai import types

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

# Inicializamos el NUEVO cliente de Gemini
gemini_client = genai.Client(api_key=api_key)

# --- 🕵️‍♂️ MODO SUPERVIVENCIA: AUTODETECCIÓN FORZADA ---
modelo_texto = 'gemini-2.5-flash' 
modelo_vision = 'gemini-2.5-flash' 

try:
    print("🔎 Preguntando a Google qué IAs tienes disponibles en tu cuenta...")
    modelos_info = gemini_client.models.list()
    disponibles = [m.name for m in modelos_info if 'gemini' in m.name.lower()]
    print(f"   -> IAs Encontradas (filtradas): {disponibles[:5]} ...")
    
    if disponibles:
        modelo_texto = disponibles[0] 
        
        for m in disponibles:
            if 'flash' in m:
                modelo_texto = m
                break
        
        if any(v in modelo_texto for v in ['1.5', '2.0', '2.5', '3']):
            modelo_vision = modelo_texto
        else:
            for m in disponibles:
                if 'vision' in m:
                    modelo_vision = m
                    break
                    
        print(f"✅ MODO SUPERVIVENCIA ACTIVADO. Usando: {modelo_texto} (Texto) y {modelo_vision} (Visión)")
    else:
        print("❌ ATENCIÓN: Google dice que tu API Key no tiene acceso a NINGÚN modelo.")
except Exception as e:
    print(f"⚠️ Error en la autodetección: {e}")

def obtener_fecha_de_imagen(ruta_imagen, fecha_post_original):
    print("   👁️  Analizando imagen en busca de fecha...")
    try:
        img_pil = Image.open(ruta_imagen)
        
        prompt = """
        Mira esta imagen. ¿Hay una fecha escrita en ella (texto superpuesto o en un cartel)?
        Si ves una fecha, devuélvela en formato DD/MM/YYYY.
        Si NO ves ninguna fecha, responde exactamente: NO_DATE
        """
        
        # Nueva sintaxis multimodal de google-genai
        response = gemini_client.models.generate_content(
            model=modelo_vision,
            contents=[img_pil, prompt]
        )
        
        texto = response.text.strip()
        
        if "NO_DATE" in texto:
            print("      -> No se ve fecha en la foto, usando fecha del post.")
            return fecha_post_original.strftime("%d/%m/%Y")
        
        print(f"      -> Fecha encontrada en imagen: {texto}")
        return texto
    except Exception as e:
        print(f"      -> Error analizando imagen visualmente: {e}. Usando fecha del post.")
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
        # Nueva sintaxis de configuración de seguridad
        config = types.GenerateContentConfig(
            safety_settings=[
                types.SafetySetting(category=types.HarmCategory.HARM_CATEGORY_HARASSMENT, threshold=types.HarmBlockThreshold.BLOCK_NONE),
                types.SafetySetting(category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold=types.HarmBlockThreshold.BLOCK_NONE),
                types.SafetySetting(category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold=types.HarmBlockThreshold.BLOCK_NONE),
                types.SafetySetting(category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold=types.HarmBlockThreshold.BLOCK_NONE)
            ]
        )
        
        response = gemini_client.models.generate_content(
            model=modelo_texto,
            contents=prompt,
            config=config
        )
        
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
    
    # Inyectamos la cookie de sesión de forma manual
    try:
        print(f"🔑 Inyectando cookie de sesión maestra...")
        
        # --- ¡ATENCIÓN! --- Esta cookie caduca cada ciertos meses. 
        # Si de repente el script lanza error 401, tendrás que actualizar este valor.
        session_id = '49224113245%3AFDlHCpOz5k35u3%3A18%3AAYiAGDTFIu4zSnNAHzUDdBN5bYUVMCsGjIGliZD1lQ' 
        
        L.context._session.cookies.set('sessionid', session_id, domain='.instagram.com')
        L.context.get_json('graphql/query', params={}) 
        print("✅ ¡Cookie aceptada! Entramos identificados.")
    except Exception as e:
        print(f"⚠️ Error inyectando cookie: {e}")
        print("👉 Revisa que hayas puesto tu session_id correcto entre las comillas simples o si ha caducado.")

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
            
    # Eliminamos cualquier rastro de la prueba anterior para no duplicar datos
    noticias_existentes = [n for n in noticias_existentes if n.get('id') != shortcode]

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

    resumen_texto = cuerpo_ia[:120].replace("<p>", "").replace("<strong>", "").replace("</p>", "").replace("</strong>", "") + "..."

    # Convertimos la fecha al estándar ISO
    try:
        fecha_obj = datetime.strptime(fecha_final, "%d/%m/%Y")
        fecha_iso = fecha_obj.strftime("%Y-%m-%d")
    except ValueError:
        fecha_iso = post.date.strftime("%Y-%m-%d")
        fecha_final = post.date.strftime("%d/%m/%Y")

    # C. Crear el archivo HTML de la noticia
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
        
        print(f"   📝 Archivo HTML creado perfectamente: {ruta_noticia}")
    else:
        print(f"❌ ERROR: No se encuentra {PLANTILLA_HTML}. Crea ese archivo primero.")
        return

    # D. Actualizar el índice JSON
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
    print("="*50)
    print("   📰 CREADOR DE NOTICIAS MANUAL")
    print("="*50)
    
    url_introducida = input("Pega aquí la URL del post (o el ID) y pulsa Enter:\n> ")
    
    if url_introducida.strip() != "":
        id_post = extraer_shortcode(url_introducida)
        generar_noticia_manual(id_post)
    else:
        print("❌ No has introducido ninguna URL. Cancelando...")