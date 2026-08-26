# blueprints/downloads.py
# ── Diff-file downloads listing + hardened path-traversal-safe file serve.
#    Imports app (for app.root_path) and _file_sha256 (cached hashing
#    helper) from app.py, which owns the SHA-256 cache as a module-level
#    dict shared across requests. ──────────────────────────────────────────
import os

from flask import Blueprint, abort, send_from_directory, render_template

from app import app, _file_sha256

bp = Blueprint('downloads', __name__)


def _is_safe_path_segment(segment):
    """Reject path-traversal / separator characters in a single path segment.

    Unlike werkzeug's secure_filename(), this does NOT mangle legitimate
    characters (spaces, parentheses, Unicode/Thai text) — it only rejects
    segments that could escape the target directory. The real containment
    guarantee still comes from the os.path.realpath(...).startswith(...)
    checks below; this is a fast pre-filter.
    """
    if not segment or segment in ('.', '..'):
        return False
    if '/' in segment or '\\' in segment:
        return False
    if '\x00' in segment:
        return False
    return True


@bp.route('/downloads/<fc>/<filename>')
def download_diff(fc, filename):
    if not (_is_safe_path_segment(fc) and _is_safe_path_segment(filename)):
        abort(404)
    base_root = os.path.realpath(os.path.join(app.root_path, 'static', 'downloads', 'diff_all'))
    candidate_fc_dir = os.path.realpath(os.path.join(base_root, fc))
    if not (candidate_fc_dir.startswith(base_root + os.sep) and os.path.isdir(candidate_fc_dir)):
        abort(404)
    file_path = os.path.realpath(os.path.join(candidate_fc_dir, filename))
    if not file_path.startswith(candidate_fc_dir + os.sep):
        abort(404)
    if not os.path.isfile(file_path):
        abort(404)
    return send_from_directory(candidate_fc_dir, filename, as_attachment=True)


@bp.route('/downloads')
def downloads_index():
    base = os.path.realpath(os.path.join(app.root_path, 'static', 'downloads', 'diff_all'))
    items = []
    if os.path.isdir(base):
        for fc in sorted(os.listdir(base)):
            fcdir = os.path.realpath(os.path.join(base, fc))
            if not os.path.isdir(fcdir):
                continue
            for fn in sorted(os.listdir(fcdir)):
                path = os.path.join(fcdir, fn)
                if not os.path.isfile(path):
                    continue
                items.append({'fc': fc, 'filename': fn,
                              'size': os.path.getsize(path),
                              'mtime': int(os.path.getmtime(path)),
                              'sha': _file_sha256(path)})
    return render_template('downloads.html', items=items)
