/**
 * 初始化证书轮播
 * - 自动横向滑动
 * - 鼠标滚轮 / 手指左右拖拽手动控制
 * - 悬停暂停（仅桌面 hover 设备）
 * 返回 cleanup 函数，用于页面切换时移除事件监听。
 */
export function initCertCarousel(container) {
  const wrapper = container.querySelector('.cert-track-wrapper');
  const track = container.querySelector('.cert-gallery');
  if (!wrapper || !track) return () => {};

  const items = track.querySelectorAll('.cert-gallery-item');
  if (items.length === 0) return () => {};

  let gap = 14;
  let position = 0;
  let maxPosition = 0;
  let autoSpeed = 0.4;
  let isPaused = false;
  let resumeTimer = null;
  let rafId = null;

  let isDragging = false;
  let dragStartX = 0;
  let dragStartPos = 0;

  function calcDimensions() {
    const wrapperRect = wrapper.getBoundingClientRect();
    const style = getComputedStyle(track);
    gap = parseInt(style.gap) || 14;
    const itemWidth = items[0].getBoundingClientRect().width;
    const totalWidth = items.length * (itemWidth + gap);
    maxPosition = totalWidth - wrapperRect.width;
    if (maxPosition < 0) maxPosition = 0;
  }

  function updateTransform() {
    track.style.transform = `translateX(${-position}px)`;
  }

  function clamp(v) {
    if (v < 0) return 0;
    if (v > maxPosition) return maxPosition;
    return v;
  }

  function autoSlide() {
    if (isPaused) return;
    position += autoSpeed;
    if (position >= maxPosition) position = 0;
    updateTransform();
  }

  function loop() {
    autoSlide();
    rafId = requestAnimationFrame(loop);
  }

  function pauseTemporarily(ms) {
    isPaused = true;
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      isPaused = false;
    }, ms);
  }

  function onWheel(e) {
    e.preventDefault();
    position = clamp(position + e.deltaY * 0.5);
    updateTransform();
    pauseTemporarily(2000);
  }

  function onPointerDown(e) {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartPos = position;
    isPaused = true;
    if (resumeTimer) clearTimeout(resumeTimer);
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    position = clamp(dragStartPos - dx);
    updateTransform();
  }

  function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;
    pauseTemporarily(2000);
  }

  function onPointerCancel() {
    isDragging = false;
    pauseTemporarily(1500);
  }

  function onMouseEnter() {
    if (window.matchMedia('(hover: hover)').matches) pauseTemporarily(3000);
  }

  function onMouseLeave() {
    if (window.matchMedia('(hover: hover)').matches) pauseTemporarily(1000);
  }

  let resizeTimer = null;
  function onResize() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      calcDimensions();
      if (position > maxPosition) {
        position = maxPosition;
        updateTransform();
      }
    }, 200);
  }

  wrapper.addEventListener('wheel', onWheel, { passive: false });
  wrapper.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerCancel);
  wrapper.addEventListener('mouseenter', onMouseEnter);
  wrapper.addEventListener('mouseleave', onMouseLeave);
  window.addEventListener('resize', onResize);

  // 初始计算延迟一帧，确保页面切换动画后布局稳定
  requestAnimationFrame(() => {
    calcDimensions();
  });
  // 图片/字体加载后再校准一次尺寸
  if (document.readyState === 'complete') {
    calcDimensions();
  } else {
    window.addEventListener('load', onResize, { once: true });
  }

  loop();

  return () => {
    cancelAnimationFrame(rafId);
    if (resumeTimer) clearTimeout(resumeTimer);
    if (resizeTimer) clearTimeout(resizeTimer);
    wrapper.removeEventListener('wheel', onWheel);
    wrapper.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
    wrapper.removeEventListener('mouseenter', onMouseEnter);
    wrapper.removeEventListener('mouseleave', onMouseLeave);
    window.removeEventListener('resize', onResize);
  };
}