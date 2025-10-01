// Card click logic removed; handled by main.js
const cards = document.querySelectorAll('.card');

function handleMouseEnter(e) {
  const el = e.currentTarget;
  if (!el) return;
  const rect = el.getBoundingClientRect();

  function handleMouseMove(ev) {
    const clientX = ev.clientX;
    const clientY = ev.clientY;
    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;

    const centerX = offsetX - (rect.width * 0.5);
    const centerY = offsetY - (rect.height * 0.5);

    const posX = Math.round(-1 * centerX * 0.1);
    const posY = Math.round(centerY * 0.1);

    el.style.setProperty('--x', posY);
    el.style.setProperty('--y', posX);
  }

  function handleMouseLeave() {
    el.style.setProperty('--x', 0);
    el.style.setProperty('--y', 0);
    el.removeEventListener('mousemove', handleMouseMove);
    el.removeEventListener('mouseleave', handleMouseLeave);
  }

  el.addEventListener('mousemove', handleMouseMove);
  el.addEventListener('mouseleave', handleMouseLeave);
}

cards.forEach(card => {
  card.addEventListener('mouseenter', handleMouseEnter);
});