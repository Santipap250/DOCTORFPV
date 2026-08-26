# blueprints/downloads.py
from flask import Blueprint, abort, send_from_directory, render_template, current_app
import hashlib

bp = Blueprint('downloads', __name__)

def _file_sha256(path: str) -> str:
    try:
        with open(path, "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()[:16]
    except Exception:
        return "N/A"

@bp.route('/downloads/<fc>/<filename>')
def download_diff(fc, filename):
    if not (_is_safe_path_segment(fc) and _is_safe_path_segment(filename)):
        abort(404)
    base_root = os.path.realpath(os.path.join(current_app.root_path, 'static', 'downloads', 'diff_all'))
    # ... ต่อด้วย logic เดิม
    
