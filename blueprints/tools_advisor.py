# blueprints/tools_advisor.py
from flask import Blueprint, render_template, jsonify

bp = Blueprint('tools_advisor', __name__)

@bp.route('/pid-advisor')
def pid_advisor():
    # Lazy import แก้ circular
    from app import get_all_symptoms, _get_symptom_advice
    symptoms_list = get_all_symptoms()
    advice_dict = {s['id']: _get_symptom_advice(s['id']) for s in symptoms_list}
    return render_template('pid_advisor.html', 
                          symptoms=symptoms_list, 
                          advice_json=json.dumps(advice_dict, ensure_ascii=False))
    
