// apollo.js: burger, stat counters, carousel arrows for the apollo theme
document.addEventListener('DOMContentLoaded', function () {
  var burger = document.querySelector('.nav-burger');
  var links = document.querySelector('.ap-links');
  if (burger && links) {
    burger.addEventListener('click', function () { links.classList.toggle('open'); });
