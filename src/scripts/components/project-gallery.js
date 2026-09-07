import gsap from 'gsap';

/**
 * 初始化项目图片弹跳画廊
 * 完全模仿 codrops_mwg 的交互方式：
 * - 累计移动距离触发图片生成
 * - 图片从鼠标位置弹跳出现，缩放后下落，然后再次弹跳
 */
export function initProjectGallery(container) {
  const images = [
    '/projects/项目1.jpg',
    '/projects/项目2.jpg',
    '/projects/项目3.jpg',
    '/projects/项目4.jpg',
    '/projects/项目5.jpg',
    '/projects/项目6.jpg',
  ];

  let incr = 0;
  let oldIncrX = 0;
  let oldIncrY = 0;
  let firstMove = true;
  let indexImg = 0;

  const resetDist = window.innerWidth / 8;

  function applyMove(clientX, clientY) {
    const rect = container.getBoundingClientRect();
    const valX = clientX;
    const valY = clientY - rect.top;

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

  function onMouseMove(e) {
    applyMove(e.clientX, e.clientY);
  }

  container.addEventListener('mousemove', onMouseMove);

  function createMedia(x, y, deltaX, deltaY) {
    const H = container.getBoundingClientRect().height;

    // 不在太靠近底部的地方生成
    if (y > H - 100) return;

    const img = document.createElement('img');
    img.src = images[indexImg];
    img.className = 'gallery-flying-img';
    img.onerror = function () { this.remove(); };

    container.appendChild(img);

    const tl = gsap.timeline({
      onComplete: () => {
        if (img.parentNode) img.parentNode.removeChild(img);
        tl.kill();
      },
    });

    // Phase 1: 弹性弹跳出现
    tl.fromTo(img, {
      xPercent: -50 + (Math.random() - 0.5) * 80,
      yPercent: -50 + (Math.random() - 0.5) * 10,
      scaleX: 1.3,
      scaleY: 1.3,
      rotation: (Math.random() - 0.5) * 20,
    }, {
      scaleX: 1,
      scaleY: 1,
      ease: 'elastic.out(2, 0.6)',
      duration: 0.4,
    });

    tl.fromTo(img, {
      x: x,
    }, {
      x: '+=' + deltaX * 2,
      rotation: 0,
      ease: 'power1.in',
      duration: 0.4,
    }, '<');

    tl.fromTo(img, {
      y: y,
    }, {
      y: '+=' + (H - y),
      scale: 0.9,
      yPercent: -95,
      ease: 'back.in(1.1)',
      duration: 0.4,
    }, '<');

    // Phase 2: BOUNCE - 二次弹跳
    tl.to(img, {
      x: '+=' + deltaX * 1.6,
      rotation: (Math.random() - 0.5) * 40,
      ease: 'power1.in',
      duration: 0.3,
    });
    tl.to(img, {
      yPercent: 150,
      ease: 'back.in(' + (1.5 + (1 - y / H)) + ')',
      duration: 0.3,
    }, '<');

    indexImg = (indexImg + 1) % images.length;
  }

  return () => {
    container.removeEventListener('mousemove', onMouseMove);
  };
}