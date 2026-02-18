import os
import json
import instaloader
import google.generativeai as genai
from datetime import datetime
import shutil # Para mover archivos de forma segura

# --- CONFIGURACIÓN ---
# ⚠️ CAMBIA ESTO POR TU USUARIO REAL
# --- CONFIGURACIÓN ---
# 1. ¿A quién vamos a espiar? (El perfil público del club)
TARGET_USERNAME = "clubvoleibolnavalcarnero" 

# 2. ¿Quién soy yo? (Tu usuario, el que acabas de usar en la terminal)
LOGIN_USERNAME = "vvillalbamartinez1501"  # <--- ¡PON AQUÍ EL TUYO!

# Rutas de carpetas...
# (El resto sigue igual hasta llegar a la función main)

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
    
    # --- AQUÍ ESTABA EL ERROR, YA ESTÁ CORREGIDO (AÑADIDA LA LLAVE DE CIERRE) ---
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
        # Si falla, intentamos seguir como anónimo, pero es arriesgado
        pass 

    # B. Conectamos con el perfil OBJETIVO (El Club)
    try:
        print(f"🔎 Buscando perfil objetivo: {TARGET_USERNAME}...")
        profile = instaloader.Profile.from_username(L.context, TARGET_USERNAME)
    except Exception as e:
        print(f"❌ Error al encontrar al club: {e}")
        return

if __name__ == "__main__":
    main()