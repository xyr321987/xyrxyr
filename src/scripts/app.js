import gsap from 'gsap';
import barba from '@barba/core';
import WebGLPageTransition from './components/webgl-page-transition';
import MotionText from './components/motion-text';
import { preventLinksMenu, select } from './utils';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import DrawSVGPlugin from 'gsap/DrawSVGPlugin';
import { initProjectGallery } from './components/project-gallery';

class App {
  constructor() {
    this.motionTexts = new MotionText();
    this.motionTexts.init();
    this.motionTexts.animationIn();

    this.galleryCleanup = null;

    this.transitionOverlay = select('.transition__overlay');
    this.titleDestination = select('.transition__overlay .title__destination');
    this.splitTitleDestination = null;

    this.getPercentageVerticalClipExample3();

    this.barbaWrapper = select("[data-barba='wrapper']");
    this.webglPageTransition = new WebGLPageTransition();

    barba.init({
      transitions: [
        {
          name: 'default-transition',
          before: (data) => {
            this.barbaWrapper.classList.add('is__transitioning');
            gsap.set(data.next.container, {
              position: 'fixed',
              inset: 0,
              scale: 0.6,
              clipPath: 'inset(100% 0 0 0)',
              zIndex: 3,
              willChange: 'auto',
            });
            gsap.set(data.current.container, { zIndex: 2, willChange: 'auto' });
          },
          enter: (data) => {
            const contentCurrent = data.current.container.querySelector('.content__wrapper');
            const tl = gsap.timeline({
              defaults: { duration: 0.8, ease: 'power3.inOut' },
              onComplete: () => tl.kill(),
            });
            tl.to(data.current.container, { scale: 0.6 })
              .to(data.current.container, { opacity: 0.45, ease: 'power3' }, '<')
              .to(contentCurrent, { yPercent: -10, ease: 'power3' }, '<')
              .to(data.next.container, {
                clipPath: 'inset(0% 0 0 0)',
                ease: 'power3',
                onStart: () => {
                  this.motionTexts.init(data.next.container);
                  this.motionTexts.animationIn();
                },
                onComplete: () => this.motionTexts.destroy(),
              }, '<')
              .to(data.next.container, { scale: 1 });
            return new Promise((resolve) => { tl.call(() => resolve()); });
          },
          after: (data) => {
            this.barbaWrapper.classList.remove('is__transitioning');
            gsap.set(data.next.container, { clearProps: 'all' });
          },
          sync: true,
        },
        {
          name: 'example-2-transition',
          to: { namespace: ['about'] },
          before: () => this.barbaWrapper.classList.add('is__transitioning'),
          leave: () => {
            const tl = gsap.timeline({
              defaults: { duration: 1, ease: 'power1.in' },
              onComplete: () => tl.kill(),
            });
            gsap.set('#webgl', { pointerEvents: 'auto', autoAlpha: 1, visibility: 'visible' });
            tl.to(this.webglPageTransition.material.uniforms.uProgress, { value: -0.75 });
            return new Promise((resolve) => { tl.call(() => { this.motionTexts.destroy(); resolve(); }); });
          },
          after: () => {
            const tl = gsap.timeline({
              defaults: { duration: 1, ease: 'power1.in' },
              onComplete: () => {
                gsap.set('#webgl', { pointerEvents: 'none', autoAlpha: 0, visibility: 'hidden' });
                tl.kill();
              },
            });
            tl.to(this.webglPageTransition.material.uniforms.uProgress, { value: 1.5 });
            return new Promise((resolve) => { tl.call(() => { this.barbaWrapper.classList.remove('is__transitioning'); resolve(); }); });
          },
        },
        {
          name: 'example-3-transition',
          to: { namespace: ['works'] },
          before: () => this.barbaWrapper.classList.add('is__transitioning'),
          leave: (data) => {
            // 清理画廊
            if (this.galleryCleanup) {
              this.galleryCleanup();
              this.galleryCleanup = null;
            }

            const tl = gsap.timeline({
              defaults: { duration: 0.5, ease: 'sine.in' },
              onComplete: () => tl.kill(),
            });

            gsap.set('.transition__morph__svg', {
              pointerEvents: 'auto', autoAlpha: 1, visibility: 'visible',
            });

            const path = select('.transition__morph__svg svg path');
            const orig = path.getAttribute('d');

            let enterCurve = 'M 0 100 V 50 Q 50 0 100 50 V 100 z';
            let filledPath = 'M 0 100 V 0 Q 50 0 100 0 V 100 z';

            if (typeof data.trigger === 'string') {
              enterCurve = 'M 0 0 V 50 Q 50 100 100 50 V 0 z';
              filledPath = 'M 0 0 V 100 Q 50 100 100 100 V 0 z';
              gsap.set(path, { attr: { d: 'M 0 0 V 0 Q 50 0 100 0 V 0 z' } });
            }

            tl.to(path, { attr: { d: enterCurve }, duration: 0.5, ease: 'sine.in' })
              .to(path, { attr: { d: filledPath }, duration: 0.5, ease: 'sine' }, '<+=0.5');

            return new Promise((resolve) => {
              tl.call(() => { this.motionTexts.destroy(); resolve(); });
            });
          },
          after: (data) => {
            const path = select('.transition__morph__svg svg path');
            const orig = path.getAttribute('data-original-path') || path.getAttribute('d');

            const tl = gsap.timeline({
              defaults: { duration: 0.5, ease: 'sine.in' },
              onComplete: () => {
                gsap.set('.transition__morph__svg', {
                  pointerEvents: 'none', autoAlpha: 0, visibility: 'hidden',
                });
                tl.kill();
              },
            });

            let leaveCurve = 'M 0 0 V 50 Q 50 0 100 50 V 0 z';
            let unfilledPath = 'M 0 0 V 0 Q 50 0 100 0 V 0 z';

            if (typeof data.trigger === 'string') {
              leaveCurve = 'M 0 100 V 50 Q 50 100 100 50 V 100 z';
              unfilledPath = 'M 0 100 V 100 Q 50 100 100 100 V 100 z';
            }

            tl.to(path, { attr: { d: leaveCurve }, duration: 0.5, ease: 'sine.in' })
              .to(path, { attr: { d: unfilledPath }, duration: 0.5, ease: 'sine' }, '<+=0.5');

            return new Promise((resolve) => {
              tl.call(() => {
                this.barbaWrapper.classList.remove('is__transitioning');

                // 初始化项目图片画廊
                const gallery = data.next.container.querySelector('#projectGallery');
                if (gallery && !gallery.dataset.galleryInited) {
                  gallery.dataset.galleryInited = 'true';
                  this.galleryCleanup = initProjectGallery(gallery);
                }

                resolve();
              });
            });
          },
        },
        {
          name: 'example-4-transition',
          to: { namespace: ['team'] },
          before: (data) => {
            this.barbaWrapper.classList.add('is__transitioning');
            this.transitionOverlay.classList.add('team__transition');
            if (this.splitTitleDestination) this.splitTitleDestination.revert();
            this.splitTitleDestination = new SplitText(this.titleDestination, {
              type: 'words', mask: 'words', wordsClass: 'words',
            });
            gsap.set(this.transitionOverlay, {
              '--clip': `polygon(0% ${50 - this.percentageVerticalClip}%, 0% ${50 - this.percentageVerticalClip}%, 0% ${50 + this.percentageVerticalClip}%, 0% ${50 + this.percentageVerticalClip}%)`,
            });
          },
          leave: () => {
            const tl = gsap.timeline({
              defaults: { duration: 1, ease: 'expo.inOut' },
              onComplete: () => tl.kill(),
            });
            gsap.set(this.transitionOverlay, { pointerEvents: 'auto', autoAlpha: 1, visibility: 'visible' });
            tl.to(this.transitionOverlay, {
              '--clip': `polygon(0 ${50 - this.percentageVerticalClip}%, 100% ${50 - this.percentageVerticalClip}%, 100% ${50 + this.percentageVerticalClip}%, 0 ${50 + this.percentageVerticalClip}%)`,
            });
            tl.to(this.transitionOverlay, { '--clip': 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' });
            return new Promise((resolve) => { tl.call(() => { this.motionTexts.destroy(); resolve(); }); });
          },
          after: () => {
            const tl = gsap.timeline({
              defaults: { duration: 1, ease: 'hop' },
              onComplete: () => {
                if (this.splitTitleDestination) { this.splitTitleDestination.revert(); this.splitTitleDestination = null; }
                gsap.set(this.transitionOverlay, { pointerEvents: 'none', autoAlpha: 0, visibility: 'hidden' });
                tl.kill();
              },
            });
            tl.to(this.splitTitleDestination.words, { yPercent: -120, duration: 0.5, stagger: { amount: 0.25 }, ease: 'elastic.in(1, 1)' });
            tl.to(this.transitionOverlay, {
              '--clip': 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
              onStart: () => { this.motionTexts.init(); this.motionTexts.animationIn(); },
            }, '<+0.25');
            return new Promise((resolve) => { tl.call(() => { this.barbaWrapper.classList.remove('is__transitioning'); this.transitionOverlay.classList.remove('team__transition'); resolve(); }); });
          },
        },
        {
          name: 'example-5-transition',
          to: { namespace: ['archive'] },
          before: () => this.barbaWrapper.classList.add('is__transitioning'),
          leave: () => {
            const tl = gsap.timeline({
              defaults: { duration: 1.4, ease: 'sine.inOut' },
              onComplete: () => tl.kill(),
            });
            gsap.set('.transition__svg__wrapper', { pointerEvents: 'auto', autoAlpha: 1, visibility: 'visible' });
            gsap.set('.svg__transition svg path', { drawSVG: '0% 0%', attr: { 'stroke-width': 100 }, opacity: 0 });
            tl.to('.svg__transition svg path', { opacity: 1, duration: 0.5 });
            tl.to('.svg__transition svg path', { drawSVG: '0% 100%' }, '<');
            tl.to('.svg__transition svg path', { attr: { 'stroke-width': 400 }, ease: 'sine.inOut' }, '<+=0.18');
            return new Promise((resolve) => { tl.call(() => { this.motionTexts.destroy(); resolve(); }); });
          },
          after: () => {
            const tl = gsap.timeline({
              defaults: { duration: 1, ease: 'sine.inOut' },
              onComplete: () => {
                gsap.set('.transition__svg__wrapper', { pointerEvents: 'none', autoAlpha: 0, visibility: 'hidden' });
                gsap.set('.svg__transition svg path', { drawSVG: '0% 0%', attr: { 'stroke-width': 100 } });
                tl.kill();
              },
            });
            tl.to('.svg__transition svg path', { attr: { 'stroke-width': 100 } });
            tl.to('.svg__transition svg path', { drawSVG: '100% 100%' }, '<+=0.45');
            return new Promise((resolve) => { tl.call(() => { this.barbaWrapper.classList.remove('is__transitioning'); resolve(); }); });
          },
        },
        {
          name: 'example-6-transition',
          to: { namespace: ['contact'] },
          before: (data) => {
            this.barbaWrapper.classList.add('is__transitioning');
            data.next.container.classList.add('contact__transition');
            gsap.set(data.next.container, {
              position: 'fixed', inset: 0,
              clipPath: 'polygon(15% 75%, 85% 75%, 85% 75%, 15% 75%)',
              zIndex: 3, height: '100vh', overflow: 'hidden',
              '--clip': 'inset(0 0 0% 0)',
            });
          },
          enter: (data) => {
            const tl = gsap.timeline({
              defaults: { duration: 1.25, ease: 'hop' },
              onComplete: () => tl.kill(),
            });
            tl.to(data.next.container, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)' });
            tl.to(data.next.container, { '--clip': 'inset(0 0 100% 0)' }, '<+=0.285');
            tl.call(() => { this.motionTexts.destroy(); this.motionTexts.init(data.next.container); this.motionTexts.animationIn(); }, null, '<+=0.385');
            return new Promise((resolve) => { tl.call(() => resolve()); });
          },
          after: (data) => {
            this.barbaWrapper.classList.remove('is__transitioning');
            data.next.container.classList.remove('contact__transition');
            gsap.set(data.next.container, { clearProps: 'all' });
          },
          sync: true,
        },
      ],
    });

    this.render();
    this.addEventListeners();
  }

  getPercentageVerticalClipExample3() {
    const titleDestinationBound = this.titleDestination.getBoundingClientRect();
    const halfHeightTitleDestination = titleDestinationBound.height / 2;
    const halfHeightViewport = window.innerHeight / 2;
    this.percentageVerticalClip = (halfHeightTitleDestination / halfHeightViewport) * 50;
  }

  onResize() {
    this.getPercentageVerticalClipExample3();
    this.webglPageTransition.onResize();
  }

  addEventListeners() {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  render() {
    this.webglPageTransition.render();
    requestAnimationFrame(this.render.bind(this));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  preventLinksMenu();

  gsap.registerPlugin(SplitText, CustomEase, DrawSVGPlugin);

  CustomEase.create('hop', '0.56, 0, 0.35, 0.98');

  try {
    const app = new App();

    // 初始页面如果是 works，初始化画廊
    const container = document.querySelector("[data-barba='container']");
    if (container && container.dataset.barbaNamespace === 'works') {
      const gallery = container.querySelector('#projectGallery');
      if (gallery) {
        gallery.dataset.galleryInited = 'true';
        app.galleryCleanup = initProjectGallery(gallery);
      }
    }
  } catch (e) {
    document.body.innerHTML = '<div style="color:#fff;padding:40px;text-align:center;font-family:sans-serif">页面加载中，请稍候...<br><small>' + (e.message || '') + '</small></div>';
    setTimeout(() => location.reload(), 3000);
  }
});