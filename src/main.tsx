import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Initialize mock data store
import { initStore } from './data/store'
initStore()

// ---- REMOVE PLATFORM BRANDING BADGE ---------------------------------
function removePlatformBadge() {
  const all = document.querySelectorAll('body > *');
  all.forEach((el) => {
    const text = (el.textContent || '').trim();
    const href = el.getAttribute('href') || '';
    if (
      text === 'Kimi Agent' ||
      text.includes('Kimi') && text.includes('Agent') ||
      href.includes('kimi.com/agent')
    ) {
      const h = el as HTMLElement;
      h.style.cssText = 'display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;width:0!important;height:0!important;overflow:hidden!important;position:absolute!important;z-index:-9999!important;';
      try { h.remove(); } catch { /* ignore */ }
    }
  });
}
removePlatformBadge();
setInterval(removePlatformBadge, 300);
const mo = new MutationObserver((muts) => {
  for (const m of muts) {
    for (const node of m.addedNodes) {
      if (node.nodeType === 1) {
        const el = node as HTMLElement;
        const text = (el.textContent || '').trim();
        if (text.includes('Kimi') && text.includes('Agent')) {
          el.style.cssText = 'display:none!important;visibility:hidden!important;opacity:0!important;';
          try { el.remove(); } catch { /* */ }
        }
      }
    }
  }
});
mo.observe(document.body, { childList: true, subtree: true });
// ----------------------------------------------------------------------

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <App />
  </HashRouter>,
)
