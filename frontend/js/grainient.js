document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.grainient-bg');

    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-2';
    canvas.style.background = 'linear-gradient(135deg, rgba(9, 87, 14, 0.52),rgba(255, 255, 255, 0.6), rgba(156, 185, 248, 0.6))';

    container.appendChild(canvas);

});