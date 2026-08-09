// static/js/shell-page-actions.js — Batch A: extracted from templates/partials/page_actions.html inline <script>. No logic change.

(function(){
  function openTools(){
    if(typeof window.openTP === 'function'){
      window.openTP();
      setTimeout(function(){
        var s = document.getElementById('tpSearch');
        if(s) s.focus();
      }, 80);
      return true;
    }
    var ham = document.getElementById('onHam');
    if(ham){
      ham.click();
      return true;
    }
    if(location.pathname !== '/app') location.href = '/app';
    return false;
  }
  window.openToolsPanel = openTools;
}());
