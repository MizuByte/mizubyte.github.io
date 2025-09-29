// Card click logic removed; handled by main.js
const cards = document.querySelectorAll('.card');

let mouseEnterTarget = null;
let targetBounds = null;

function handleMouseEnter(e) {
  mouseEnterTarget = e.target;
  targetBounds = e.target.getBoundingClientRect();
  
  mouseEnterTarget.addEventListener('mousemove', handleMouseMove);
  mouseEnterTarget.addEventListener('mouseleave', handleMouseLeave);
}

function handleMouseLeave(e) {
  mouseEnterTarget.style.setProperty('--x', 0);
  mouseEnterTarget.style.setProperty('--y', 0);
  
  mouseEnterTarget.removeEventListener('mousemove', handleMouseMove);
}

function handleMouseMove(e) {
  const { offsetX, offsetY } = e;
  
  const centerX = offsetX - (targetBounds.width * 0.5);
  const centerY = offsetY - (targetBounds.height * 0.5);
  
  const posX = Math.round(-1 * centerX * 0.1);
  const posY = Math.round(centerY * 0.1);
  
  mouseEnterTarget.style.setProperty('--x', posY);
  mouseEnterTarget.style.setProperty('--y', posX);
  
}

cards.forEach(card => {
  card.addEventListener('mouseenter', handleMouseEnter);
})