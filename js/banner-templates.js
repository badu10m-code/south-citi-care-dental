// banner-templates.js: owner banner templates + renderer, shared by homepage and admin
var SCC_TEMPLATES = {
  festive: { name: 'Festive / Puja', bg: 'linear-gradient(120deg,#B91C1C 0%,#EA580C 55%,#F59E0B 100%)' },
  offer:   { name: 'Offer',          bg: 'linear-gradient(120deg,#0EA5E9 0%,#0369A1 100%)' },
  smile:   { name: 'New patients',   bg: 'linear-gradient(120deg,#0D9488 0%,#0EA5E9 100%)' },
  dark:    { name: 'Bold dark',      bg: 'linear-gradient(120deg,#0F172A 0%,#1E3A8A 100%)' }
};
function sccEsc(s) {
  return String(s || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function bannerHTML(b) {
  if (b && b.type === 'upload' && b.data) {
    return '<div class="banner-slide"><img class="banner-img" src="' + b.data + '" alt="Clinic banner"></div>';
  }
  var t = (b && SCC_TEMPLATES[b.tpl]) ? SCC_TEMPLATES[b.tpl] : SCC_TEMPLATES.offer;
  return '<div class="banner-slide"><div class="banner-tpl" style="background:' + t.bg + '">' +
    (b.badge ? '<span class="badge">' + sccEsc(b.badge) + '</span>' : '') +
    '<h3>' + sccEsc(b.heading || '') + '</h3>' +
    (b.sub ? '<p>' + sccEsc(b.sub) + '</p>' : '') +
    (b.cta ? '<a class="cta" href="contact.html#book">' + sccEsc(b.cta) + '</a>' : '') +
    '</div></div>';
}
