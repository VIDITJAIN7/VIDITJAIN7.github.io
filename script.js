(() => {
  'use strict';
  const motion = true;
  document.documentElement.classList.add('motion-running');

  // Reveal on arrival, never leave content hidden when scripts fail or are disabled.
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver((observations, observer) => {
      observations.forEach(({target, isIntersecting}) => {
        if (!isIntersecting) return;
        if (motion) target.animate([
          { opacity: .55, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], {duration: 500, easing: 'cubic-bezier(.22,1,.36,1)'});
        if (motion) {
          target.querySelectorAll('.draw-line, .diagram-lines path').forEach(path => {
            const length = Number(path.getAttribute('pathLength')) || path.getTotalLength();
            path.animate([
              {strokeDasharray: String(length), strokeDashoffset: String(length)},
              {strokeDasharray: String(length), strokeDashoffset: '0'}
            ], {duration: 1100, easing: 'cubic-bezier(.22,1,.36,1)'});
          });
          target.querySelectorAll('.bar-row i').forEach(bar => {
            bar.animate([{transform:'scaleX(0)'},{transform:getComputedStyle(bar).transform}],
              {duration:900,easing:'cubic-bezier(.22,1,.36,1)'});
          });
        }
        observer.unobserve(target);
      });
    }, { threshold: .08 });
    document.querySelectorAll('.reveal, .case-heading-inner').forEach(node => reveal.observe(node));
  }

  const sections = [...document.querySelectorAll('.entry')];
  const links = [...document.querySelectorAll('.contents a')];
  const track = document.querySelector('.reading-track');
  let queued = false;
  let activeId = '';
  const updatePosition = () => {
    queued = false;
    if (!sections.length) return;
    const threshold = innerWidth <= 760 ? 160 : 195;
    let current = sections[0];
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= threshold) current = section;
      const chapterProgress = (threshold - rect.top) / Math.max(1, rect.height);
      section.style.setProperty('--chapter-progress', String(Math.max(0, Math.min(1, chapterProgress))));
    }
    // Short final chapters may never reach the top reading line.
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 3) current = sections.at(-1);
    links.forEach(link => {
      if (link.hash === '#' + current.id) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
    if (current.id !== activeId) {
      const activeLink = links.find(link=>link.hash==='#'+current.id);
      const nav = activeLink?.parentElement;
      if (nav && nav.scrollWidth > nav.clientWidth) {
        nav.scrollTo({left:activeLink.offsetLeft-(nav.clientWidth-activeLink.offsetWidth)/2,behavior:motion?'smooth':'auto'});
      }
      activeId = current.id;
    }
    const first = sections[0].getBoundingClientRect().top + scrollY;
    const last = sections.at(-1).getBoundingClientRect().bottom + scrollY;
    const progress = Math.max(0, Math.min(1, (scrollY + threshold - first) / Math.max(1,last-first-innerHeight+threshold)));
    track?.style.setProperty('--read-progress', String(progress));
  };
  const queuePosition = () => {
    if (!queued) { queued = true; requestAnimationFrame(updatePosition); }
  };
  addEventListener('scroll', queuePosition, {passive:true});
  addEventListener('resize', queuePosition);
  addEventListener('pageshow', queuePosition);
  document.fonts?.ready.then(queuePosition);
  updatePosition();

  /*
   * Canvas studies adapted from Ali Imam (@designali-in), via 21st.dev:
   * Dot Sphere and Mechanical Waves. See THIRD_PARTY_NOTICES.md.
   * DOM-native ports: container sizing, bounded DPR, shared RAF, visibility
   * suspension, reduced motion, and deterministic static frames.
   */
  const art = [];
  let frame = 0, lastFrame = 0, elapsed = 0;
  const mint = [163,222,215];
  const mod = (value, limit) => ((value % limit) + limit) % limit;
  const gaussian = (amplitude,x,y,cx,cy,sx,sy) =>
    amplitude * Math.exp(-((x-cx)**2/(2*sx*sx)) - ((y-cy)**2/(2*sy*sy)));

  function drawDots(item, time) {
    const {ctx,width:w,height:h,pointer} = item;
    ctx.clearRect(0,0,w,h);
    const radius = Math.min(w*.52,h*.85);
    const targetX = pointer.active ? pointer.x : w*.52 + Math.sin(time*.18)*w*.12;
    const targetY = pointer.active ? pointer.y : h*.50 + Math.cos(time*.23)*h*.08;
    item.focus.x += (targetX-item.focus.x)*.055;
    item.focus.y += (targetY-item.focus.y)*.055;
    const cx = item.focus.x, cy = item.focus.y;
    const gap = w < 400 ? 9 : 11;
    // Original staggered dot lattice, radial alpha and radius falloff.
    for (let j=0; j<=h/gap; j++) {
      for (let i=0; i<=w/gap+1; i++) {
        const x=i*gap+(j%2===0 ? -gap/2 : 0), y=j*gap;
        const distance=Math.hypot(x-cx,y-cy);
        if (distance > radius) continue;
        const alpha=1-distance/radius;
        ctx.fillStyle='rgba('+mint.join(',')+','+(alpha*.6)+')';
        ctx.beginPath(); ctx.arc(x,y,2*alpha,0,Math.PI*2); ctx.fill();
      }
    }
  }

  function drawWaves(item, time) {
    const {ctx,width:w,height:h,pointer}=item;
    ctx.clearRect(0,0,w,h);
    const spacing = 9, nodeSpacing = 12;
    const lines = Math.ceil(h/spacing)+8;
    const nodes = Math.ceil(w/nodeSpacing)+2;
    // Retains the source's Gaussian peak field and quadratic line interpolation;
    // smooth periodic drift replaces random noise for a calm, repeatable surface.
    const targetX = pointer.active ? pointer.x : w*(.52+.11*Math.sin(time*.22));
    const targetY = pointer.active ? pointer.y : h*.58;
    item.focus.x += (targetX-item.focus.x)*.04;
    item.focus.y += (targetY-item.focus.y)*.04;
    const peak = item.focus;
    const phase = mod(time*3,spacing);
    ctx.lineWidth=.75;
    for (let line=0;line<lines;line++) {
      const baseline=line*spacing-phase;
      const values=[];
      for(let node=0;node<nodes;node++) {
        const x=node*nodeSpacing;
        const ridge=gaussian(h*.38,x,baseline,peak.x,peak.y,w*.16,h*.28);
        const shoulder=gaussian(h*.16,x,baseline,w*.25,h*.64,w*.1,h*.4);
        values.push(baseline-ridge-shoulder+Math.sin(x*.012+time*.45+line*.15)*3);
      }
      const fade=Math.max(0,Math.sin(Math.min(1,baseline/h)*Math.PI));
      ctx.strokeStyle='rgba('+mint.join(',')+','+(.12+fade*.36)+')';
      ctx.beginPath(); ctx.moveTo(0,values[0]);
      for(let node=1;node<nodes-1;node++) {
        ctx.quadraticCurveTo(node*nodeSpacing,values[node],(node+.5)*nodeSpacing,(values[node]+values[node+1])/2);
      }
      ctx.stroke();
    }
  }
  function draw(item) { (item.kind==='dots' ? drawDots : drawWaves)(item,elapsed); }
  function size(item) {
    const rect=item.canvas.getBoundingClientRect();
    item.width=rect.width; item.height=rect.height;
    item.focus={x:rect.width*.52,y:rect.height*.58};
    const dpr=Math.min(devicePixelRatio || 1,2);
    item.canvas.width=Math.round(rect.width*dpr);
    item.canvas.height=Math.round(rect.height*dpr);
    item.ctx.setTransform(dpr,0,0,dpr,0,0);
    draw(item);
  }
  function tick(now) {
    frame=0;
    if (!motion || document.hidden || !art.some(item=>item.visible)) return;
    // Cap decorative motion at 30fps, independent of display refresh rate.
    if (now-lastFrame>=32) {
      elapsed+=Math.min((now-lastFrame)/1000,.05);
      lastFrame=now;
      art.filter(item=>item.visible).forEach(draw);
    }
    frame=requestAnimationFrame(tick);
  }
  function refreshArt() {
    cancelAnimationFrame(frame); frame=0;
    art.forEach(draw);
    if (motion && !document.hidden && art.some(item=>item.visible)) {
      lastFrame=performance.now(); frame=requestAnimationFrame(tick);
    }
  }
  const artObserver = 'IntersectionObserver' in window ? new IntersectionObserver(observations=>{
    observations.forEach(({target,isIntersecting})=>{
      const item=art.find(item=>item.canvas===target);
      if(item) item.visible=isIntersecting;
    });
    refreshArt();
  }, {rootMargin:'40px'}) : null;
  document.querySelectorAll('canvas[data-art]').forEach(canvas=>{
    const ctx=canvas.getContext('2d');
    if(!ctx) return;
    const kind = document.body.classList.contains('page-about') && canvas.classList.contains('intro-art') ? 'waves' : canvas.dataset.art;
    const item={canvas,ctx,kind,width:0,height:0,visible:true,focus:{x:0,y:0},pointer:{active:false,x:0,y:0}};
    art.push(item); size(item);
    if('ResizeObserver' in window) new ResizeObserver(()=>size(item)).observe(canvas);
    else addEventListener('resize',()=>size(item));
    // Background artwork responds to movement without intercepting navigation.
    const host=canvas.parentElement;
    host.addEventListener('pointermove',e=>{
      if(!motion || e.pointerType==='touch') return;
      const rect=canvas.getBoundingClientRect();
      item.pointer={active:true,x:Math.max(0,Math.min(rect.width,e.clientX-rect.left)),y:Math.max(0,Math.min(rect.height,e.clientY-rect.top))};
    },{passive:true});
    host.addEventListener('pointerleave',()=>{item.pointer.active=false;});
    artObserver?.observe(canvas);
  });
  addEventListener('visibilitychange',refreshArt);
  addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;});
  addEventListener('pageshow',refreshArt);
  refreshArt();
})();
