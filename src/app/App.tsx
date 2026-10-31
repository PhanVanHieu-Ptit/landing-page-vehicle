import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { conceptChapters as chapters } from '../config/vehicle';
import './experience.css';

const clamp = (n: number) => Math.max(0, Math.min(1, n));
export function App() {
  const stage = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [staticMode, setStaticMode] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [menu, setMenu] = useState(false);
  const [failed, setFailed] = useState(false);
  const current = Math.min(5, Math.floor(progress * 6));
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setStaticMode(preference.matches);
    preference.addEventListener('change', updatePreference);
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = stage.current;
        if (el) setProgress(clamp(-el.getBoundingClientRect().top / Math.max(1, el.offsetHeight - innerHeight)));
      });
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
    return () => { cancelAnimationFrame(frame); removeEventListener('scroll', update); removeEventListener('resize', update); preference.removeEventListener('change', updatePreference); };
  }, [staticMode]);
  useEffect(() => {
    const followHash = () => {
      const index = chapters.findIndex(chapter => `#${chapter.id}` === location.hash);
      const el = stage.current;
      if (index < 0 || !el) return;
      if (staticMode) document.getElementById(chapters[index].id)?.scrollIntoView();
      else window.scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * ((index + .04) / 6));
    };
    const frame = requestAnimationFrame(followHash);
    addEventListener('hashchange', followHash);
    addEventListener('popstate', followHash);
    return () => { cancelAnimationFrame(frame); removeEventListener('hashchange', followHash); removeEventListener('popstate', followHash); };
  }, [staticMode]);
  function navigate(index: number) {
    const el = stage.current;
    if (!el) return;
    history.replaceState(null, '', `#${chapters[index].id}`);
    if (staticMode) document.getElementById(chapters[index].id)?.scrollIntoView();
    else window.scrollTo({ top: el.offsetTop + (el.offsetHeight - innerHeight) * ((index + .04) / 6), behavior: 'instant' });
    setMenu(false);
  }
  return <div className="grand-tourer" data-static={staticMode}>
    <a className="skip-link" href="#story">Skip to story</a>
    <header className="gt-header">
      <a className="gt-wordmark" href="#presence" onClick={e => { e.preventDefault(); navigate(0); }}>LIGHT<span> / </span>FORM<i>ATELIER AUTOMOTIVE</i></a>
      <span className="gt-header-note">A grand touring study <span>—</span> No. 001</span>
      <button className="gt-menu-button" aria-expanded={menu} aria-controls="chapter-menu" onClick={() => setMenu(!menu)}>{menu ? 'Close −' : 'Explore +'}</button>
    </header>
    {menu && <nav id="chapter-menu" className="gt-menu" aria-label="Chapters">{chapters.map((c, i) => <a key={c.id} href={`#${c.id}`} onClick={e => { e.preventDefault(); navigate(i); }}><span>0{i + 1}</span>{c.label}<span>↗</span></a>)}<button onClick={() => { setStaticMode(!staticMode); setMenu(false); }}>{staticMode ? 'Enable scroll motion' : 'Use still presentation'}</button></nav>}
    <main id="story" tabIndex={-1} ref={stage} className="gt-story">
      <div className="gt-stage">
        <div className="gt-images" aria-hidden="true">
          <img className={current === 0 ? 'is-active gt-unveiled-base' : 'gt-unveiled-base'} src="/assets/concept/hero.jpg" alt="" />
          {chapters.map((c, i) => {
            const local = progress * 6 - i;
            const visible = i === current;
            return <img key={c.id} src={`/assets/concept/${c.image}.jpg`} alt="" fetchPriority={i === 0 ? 'high' : 'auto'} loading="eager" onError={() => setFailed(true)} className={visible ? 'is-active' : ''} style={{ '--image-scale': 1 + clamp(local) * .055, ...(i === 0 ? { clipPath: `inset(0 0 ${clamp((local - .15) / .8) * 100}% 0)` } : {}), '--image-x': `${(clamp(local) - .5) * -1.5}%` } as CSSProperties} />;
          })}
        </div>
        <div className="gt-vignette" />
        <div className="gt-edition" aria-hidden="true">GRAND TOURER <span>CONCEPT / 001</span></div>
        <div className="gt-panels">{chapters.map((c, i) => <section key={c.id} id={c.id} className={`gt-panel ${i === current ? 'is-active' : ''}`} aria-hidden={!staticMode && i !== current}>
          {staticMode && <img className="gt-static-image" src={`/assets/concept/${c.image}.jpg`} alt={`Oxblood grand tourer concept — ${c.label.toLowerCase()}`} />}
          <div className="gt-copy"><p className="gt-kicker"><span />{c.kicker}</p><h1 hidden={i !== 0}>{c.title}</h1>{i > 0 && <h2>{c.title}</h2>}<p className="gt-description">{c.text}</p>{i === 5 && <button className="gt-replay" onClick={() => navigate(0)}>Experience it again <span>↗</span></button>}</div>
          {i === 4 && <div className="gt-instrument"><svg viewBox="0 0 300 210" role="img" aria-label={`Story progress ${Math.round(progress * 100)} percent`}><path d="M 33 177 A 135 135 0 1 1 267 177" fill="none" stroke="currentColor" strokeWidth="1" opacity=".25" />{Array.from({ length: 41 }, (_, n) => <line key={n} x1="150" y1={n % 5 === 0 ? '28' : '20'} x2="150" y2="12" transform={`rotate(${-120 + n * 6} 150 145)`} stroke="currentColor" opacity={n % 5 === 0 ? '.8' : '.3'} />)}<g transform={`rotate(${-120 + clamp((progress * 6 - 4)) * 240} 150 145)`}><path d="M148 153L150 32L152 153Z" fill="#b49b75" /></g><circle cx="150" cy="145" r="5" fill="#b49b75" /></svg><strong>{String(Math.round(clamp(progress * 6 - 4) * 100)).padStart(2, '0')}<small>%</small></strong><span>THE JOURNEY / SCROLL PROGRESS</span></div>}
        </section>)}</div>
        {failed && <p className="gt-media-error">Imagery unavailable. Explore the study through its six chapters.</p>}
        <footer className="gt-stage-footer"><button onClick={() => navigate(current === 5 ? 0 : current + 1)}><span className="gt-scroll-line" />{current === 0 ? 'Scroll to unveil' : current === 5 ? 'Back to the beginning' : 'Continue the story'}<span>↓</span></button><span className="gt-bottom-caption">{current === 0 ? 'Beneath the surface, a story.' : chapters[current].label}</span><span className="gt-count">0{current + 1}<i> / 06</i></span></footer>
        <nav className="gt-dots" aria-label="Story chapters">{chapters.map((c, i) => <a key={c.id} href={`#${c.id}`} aria-label={c.label} aria-current={i === current ? 'step' : undefined} onClick={e => { e.preventDefault(); navigate(i); }}><span /> <i>{c.label}</i></a>)}</nav>
        <div className="gt-progress" style={{ transform: `scaleX(${progress})` }} />
      </div>
    </main>
    <footer className="gt-colophon"><a href="#presence" onClick={e => { e.preventDefault(); navigate(0); }}>LIGHT / FORM</a><span>Original concept imagery · An independent design study</span><button onClick={() => setStaticMode(!staticMode)}>{staticMode ? 'Motion off' : 'Motion on'} ↗</button></footer>
  </div>;
}
