/* Photos used by the demos: filenames inside ../media (edit freely). */
const PHOTOS = ["01-photo.jpg", "02-photo.jpg", "03-photo.jpg", "04-photo.jpg"];

const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;

$$('.ph').forEach(el => {                       // fill photos (placeholder colour if missing)
    const i = +el.dataset.i || 0; el.style.setProperty('--h', (i * 67 + 200) % 360);
    const im = new Image(); im.alt = ''; im.loading = 'lazy'; im.draggable = false;
    im.onerror = () => im.remove(); im.src = '../media/' + PHOTOS[i % PHOTOS.length]; el.append(im);
});

$$('.ex').forEach(s => {                        // nav
    const a = document.createElement('a'); s.id = 'e' + s.querySelector('b').textContent;
    a.href = '#' + s.id; a.textContent = s.querySelector('h2').textContent; document.getElementById('nav').append(a);
});

if (!calm) $$('[data-track]').forEach(el => {   // cursor position -> CSS variables
    el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        el.style.setProperty('--x', x + 'px'); el.style.setProperty('--y', y + 'px');
        el.style.setProperty('--fx', (x / r.width).toFixed(3)); el.style.setProperty('--fy', (y / r.height).toFixed(3));
    });
    el.addEventListener('pointerleave', () => ['--x', '--y', '--fx', '--fy'].forEach(p => el.style.removeProperty(p)));
});

const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))), { threshold: .3 });
$$('.rev').forEach(e => io.observe(e));

$$('.st').forEach(s => s.onclick = () => s.prepend(s.lastElementChild));           // stack cycle
$$('.ba').forEach(b => b.querySelector('input').oninput = e => b.style.setProperty('--p', e.target.value + '%'));

if (matchMedia('(hover:hover)').matches && !calm) {                                 // cursor ring + magnet
    const c = document.querySelector('.cur');
    addEventListener('pointermove', e => { c.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; c.classList.toggle('big', !!e.target.closest('.ph')) });
    $$('.mag').forEach(m => {
        m.addEventListener('pointermove', e => { const r = m.getBoundingClientRect(); m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .3}px,${(e.clientY - r.top - r.height / 2) * .3}px)` });
        m.addEventListener('pointerleave', () => m.style.transform = '');
    });
}