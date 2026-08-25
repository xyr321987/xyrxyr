import gsap from 'gsap';

export function initProjectGallery(container) {
  const images = [
    '/projects/项目1.jpg',
    '/projects/项目2.jpg',
    '/projects/项目3.jpg',
    '/projects/项目4.jpg',
    '/projects/项目5.jpg',
    '/projects/项目6.jpg',
  ];

  let indexImg = 0;
  let incr = 0;
  let oldIncrX = 0;
  let oldIncrY = 0;
  let firstMove = true;

  const isCoarsePointer = window.matchMedia('(hover: none)').matches;
  const resetDist = window.innerWidth / (isCoarsePointer ? 6 : 8);
  const W = window.innerWidth;
  const containerRect = container.getBoundingClientRect();
  const H = containerRect.height;
  const clampX = gsap.utils.clamp(0, W);
  const clampY = gsap.utils.clamp(0, H);

  function applyMove(clientX, clientY) {
    const rect = container.getBoundingClientRect();
    const valX = clampX(clientX);
    const valY = clampY(clientY - rect.top);

    if (firstMove) {
      firstMove = false;
      oldIncrX = valX;
      oldIncrY = valY;
      return;
    }

    incr += Math.abs(valX - oldIncrX) + Math.abs(valY - oldIncrY);

    if (incr > resetDist) {
      incr = 0;
      createMedia(valX, valY, valX - oldIncrX, valY - oldIncrY);
    }

    oldIncrX = valX;
    oldIncrY = valY;
  }

  function handleMouseMove(e) {
    applyMove(e.clientX, e.clientY);
  }

  function handleTouchMove(e) {
    if (!e.touches || !e.touches[0]) return;
    applyMove(e.touches[0].clientX, e.touches[0].clientY);
  }

  function createMedia(x, y, deltaX, deltaY) {
    const rect = container.getBoundingClientRect();
    const H = rect.height;

    if (y > H - 200) return;

    const image = document.createElement('img');
    image.setAttribute('src', images[indexImg]);
    image.className = 'gallery-flying-img';
    container.appendChild(image);

    const tl = gsap.timeline({
      onComplete: () => {
        container.removeChild(image);
        tl && tl.kill();
      },
    });

    tl.fromTo(
      image,
      {
        xPercent: -50 + (Math.random() - 0.5) * 80,
        yPercent: -50 + (Math.random() - 0.5) * 10,
        scaleX: 1.3,
        scaleY: 1.3,
        rotation: (Math.random() - 0.5) * 20,
      },
      {
        scaleX: 1,
        scaleY: 1,
        ease: 'elastic.out(2, 0.6)',
        duration: 0.4,
      },
    );

    tl.fromTo(
      image,
      {
        x: x - rect.left,
      },
      {
        x: '+=' + deltaX * 2,
        rotation: 0,
        ease: 'power1.in',
        duration: 0.4,
      },
      '<',
    );

    tl.fromTo(
      image,
      {
        y: y,
      },
      {
        y: '+=' + (H - y),
        scale: 0.9,
        yPercent: -95,
        ease: 'back.in(1.1)',
        duration: 0.4,
      },
      '<',
    );

    tl.to(image, {
      x: '+=' + deltaX * 1.6,
      rotation: (Math.random() - 0.5) * 40,
      ease: 'power1.in',
      duration: 0.3,
    });
    tl.to(
      image,
      {
        yPercent: 150,
        ease: 'back.in(' + (1.5 + (1 - y / H)) + ')',
        duration: 0.3,
      },
      '<',
    );

    indexImg = (indexImg + 1) % images.length;
  }

  container.addEventListener('mousemove', handleMouseMove);
  container.addEventListener('touchstart', handleTouchMove, { passive: true });
  container.addEventListener('touchmove', handleTouchMove, { passive: true });

  return () => {
    container.removeEventListener('mousemove', handleMouseMove);
    container.removeEventListener('touchstart', handleTouchMove);
    container.removeEventListener('touchmove', handleTouchMove);
  };
}