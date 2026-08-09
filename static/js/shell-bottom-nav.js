// static/js/shell-bottom-nav.js — Batch A: extracted from templates/partials/bottom_nav.html inline <script>. No logic change.

(function(){
  var toolsBtn = document.querySelector('.js-bottom-tools[data-tools-launcher]');
  if(!toolsBtn) return;
  toolsBtn.addEventListener('click', function(e){
    if(typeof window.openTP === 'function'){
      e.preventDefault();
      window.openTP();
    }
  });
}());
