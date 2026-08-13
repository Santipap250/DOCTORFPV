// static/js/changelog.js — Batch E: extracted from templates/changelog.html inline <script>. No logic change.

function toggleCard(card){
  var body = card.querySelector('.cl-card-body');
  var isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  card.classList.toggle('expanded', !isOpen);
}
// Open latest by default
document.querySelectorAll('.latest-card').forEach(function(c){ c.classList.add('expanded'); });
