# blueprints/meta.py
from flask import Blueprint, jsonify, Response, current_app

@bp.route("/robots.txt")
def robots_txt():
    base_url = current_app.config.get('BASE_URL', 'https://obixconfig.doctor')
    content = (
        "User-agent: *\n"
        "Allow: /\n"
        f"Sitemap: {base_url}/sitemap.xml\n"
    )
    return Response(content, mimetype="text/plain")

@bp.route("/sitemap.xml")
def sitemap_xml():
    today = datetime.now().strftime("%Y-%m-%d")
    base_url = current_app.config.get('BASE_URL')
    # ใช้ current_app.config แทน _SITEMAP_CACHE หรือเก็บใน g
    
