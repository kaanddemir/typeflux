(() => {
  // Prevent double injection
  if (window.__typeflux_injected) return;
  window.__typeflux_injected = true;

  const STYLE_ID = 'typeflux-style';
  const FONT_LINK_ID = 'typeflux-font-link';

  let selectModeActive = false;
  let hoveredElement = null;
  window.__typeflux_selected_element = window.__typeflux_selected_element || null;

  // Current state
  const state = {
    isEnabled: true,
    fontFamily: '',
    headingWeight: '',
    bodyWeight: '',
    headings: { h1: '', h2: '', h3: '', h4: '', h5: '', h6: '' },
    bodySize: '',
    lineHeight: '',
    letterSpacing: '',

    // Specifically for selected element
    selectedStyles: {
      fontFamily: '',
      fontWeight: '',
      fontSize: '',
      lineHeight: '',
      letterSpacing: ''
    }
  };

  function buildCSS() {
    let css = '';

    // Selected Element Styles
    if (state.selectedStyles.fontFamily) {
      css += `[data-tf-styled="true"] { font-family: '${state.selectedStyles.fontFamily}', sans-serif !important; }\n`;
    }
    if (state.selectedStyles.fontWeight) {
      css += `[data-tf-styled="true"] { font-weight: ${state.selectedStyles.fontWeight} !important; }\n`;
    }
    if (state.selectedStyles.fontSize) {
      css += `[data-tf-styled="true"] { font-size: ${state.selectedStyles.fontSize}px !important; }\n`;
    }
    if (state.selectedStyles.lineHeight) {
      css += `[data-tf-styled="true"] { line-height: ${state.selectedStyles.lineHeight} !important; }\n`;
    }
    if (state.selectedStyles.letterSpacing) {
      css += `[data-tf-styled="true"] { letter-spacing: ${state.selectedStyles.letterSpacing}px !important; }\n`;
    }

    if (state.fontFamily) {
      css += `body, body * { font-family: '${state.fontFamily}', sans-serif !important; }\n`;
    }

    if (state.headingWeight) {
      css += `h1, h2, h3, h4, h5, h6 { font-weight: ${state.headingWeight} !important; }\n`;
    }

    if (state.bodyWeight) {
      css += `body, body p, body span, body li, body a, body td, body div:not(:has(*)) { font-weight: ${state.bodyWeight} !important; }\n`;
    }

    for (const [tag, size] of Object.entries(state.headings)) {
      if (size) {
        css += `${tag} { font-size: ${size}px !important; }\n`;
      }
    }

    if (state.bodySize) {
      css += `body, body p, body span, body li, body a, body td, body div:not(:has(*)) { font-size: ${state.bodySize}px !important; }\n`;
    }

    if (state.lineHeight) {
      css += `body, body * { line-height: ${state.lineHeight} !important; }\n`;
    }

    if (state.letterSpacing) {
      css += `body, body * { letter-spacing: ${state.letterSpacing}px !important; }\n`;
    }

    return css;
  }

  function applyStyles() {
    let styleEl = document.getElementById(STYLE_ID);

    if (!state.isEnabled) {
      if (styleEl) styleEl.remove();
      return;
    }

    const css = buildCSS();

    if (!css) {
      if (styleEl) styleEl.remove();
      return;
    }

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = css;
  }

  function loadGoogleFont(fontName) {
    let linkEl = document.getElementById(FONT_LINK_ID);

    if (!fontName) {
      if (linkEl) linkEl.remove();
      return;
    }

    const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@100;200;300;400;500;600;700;800;900&display=swap`;

    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.id = FONT_LINK_ID;
      linkEl.rel = 'stylesheet';
      document.head.appendChild(linkEl);
    }

    linkEl.href = fontUrl;
  }

  function addSelectionStyles() {
    if (document.getElementById('tf-selection-styles')) return;
    const style = document.createElement('style');
    style.id = 'tf-selection-styles';
    style.textContent = `
        .tf-hovered-element {
            outline: 2px dashed #06b6d4 !important;
            outline-offset: 4px !important;
            cursor: crosshair !important;
            box-shadow: 0 0 0 5000px rgba(10, 17, 24, 0.45) !important;
            z-index: 999999 !important;
        }
        .tf-selected-element {
            outline: 2px solid #ffb84d !important;
            outline-offset: 4px !important;
            z-index: 999998 !important;
        }
        .tf-toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: #111a24;
            color: #e2f1f8;
            padding: 8px 16px;
            border-radius: 20px;
            font-family: sans-serif;
            font-size: 14px;
            z-index: 9999999;
            border: 1px solid #06b6d4;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            opacity: 0;
            pointer-events: none;
        }
        .tf-toast.visible {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
  }

  const IGNORED_TAGS = ['html', 'body', 'img', 'video', 'audio', 'canvas', 'svg', 'path', 'g', 'circle', 'rect', 'line', 'polygon', 'polyline', 'iframe', 'embed', 'object', 'picture', 'source', 'track', 'br', 'hr', 'area', 'map'];

  function getValidTarget(target) {
    let el = target;
    while (el && IGNORED_TAGS.includes(el.tagName.toLowerCase())) {
      el = el.parentElement;
    }
    return el;
  }

  function onMouseMove(e) {
    if (!selectModeActive) return;

    // Determine the closest valid target since we don't want to capture images/svgs
    const target = getValidTarget(e.target);
    if (!target) return;

    e.stopPropagation();

    if (hoveredElement && hoveredElement !== target) {
      hoveredElement.classList.remove('tf-hovered-element');
    }
    hoveredElement = target;
    if (hoveredElement && hoveredElement !== document.body) {
      hoveredElement.classList.add('tf-hovered-element');
    }
  }

  function onClick(e) {
    if (!selectModeActive) return;
    e.preventDefault();
    e.stopPropagation();

    const target = getValidTarget(e.target);
    if (!target) {
      selectModeActive = false;
      document.removeEventListener('mousemove', onMouseMove, true);
      document.removeEventListener('click', onClick, true);
      if (hoveredElement) {
        hoveredElement.classList.remove('tf-hovered-element');
        hoveredElement = null;
      }
      return;
    }

    if (window.__typeflux_selected_element) {
      window.__typeflux_selected_element.classList.remove('tf-selected-element');
    }

    window.__typeflux_selected_element = target;
    window.__typeflux_selected_element.classList.add('tf-selected-element');
    window.__typeflux_selected_element.setAttribute('data-tf-styled', 'true');

    if (hoveredElement) {
      hoveredElement.classList.remove('tf-hovered-element');
      hoveredElement = null;
    }

    selectModeActive = false;
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click', onClick, true);

    const toast = document.createElement('div');
    toast.className = 'tf-toast';
    toast.innerHTML = `Selected <strong>&lt;${target.tagName.toLowerCase()}&gt;</strong>. Open TypeFlux to edit.`;
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('visible'), 10);

    // Remove toast with animation
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  function resetAll() {
    state.fontFamily = '';
    state.headingWeight = '';
    state.bodyWeight = '';
    state.headings = { h1: '', h2: '', h3: '', h4: '', h5: '', h6: '' };
    state.bodySize = '';
    state.lineHeight = '';
    state.letterSpacing = '';

    const styleEl = document.getElementById(STYLE_ID);
    if (styleEl) styleEl.remove();

    const linkEl = document.getElementById(FONT_LINK_ID);
    if (linkEl) linkEl.remove();
  }

  // Message listener
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'enterSelectMode':
        selectModeActive = true;
        addSelectionStyles();
        document.addEventListener('mousemove', onMouseMove, true);
        document.addEventListener('click', onClick, true);
        sendResponse({ status: 'ok' });
        return true;

      case 'exitSelectMode':
        selectModeActive = false;
        document.removeEventListener('mousemove', onMouseMove, true);
        document.removeEventListener('click', onClick, true);
        if (hoveredElement) hoveredElement.classList.remove('tf-hovered-element');
        if (window.__typeflux_selected_element) {
          window.__typeflux_selected_element.classList.remove('tf-selected-element');
          window.__typeflux_selected_element = null;
        }
        sendResponse({ status: 'ok' });
        return true;

      case 'updateFont':
        if (window.__typeflux_selected_element) {
          state.selectedStyles.fontFamily = message.value;
          loadGoogleFont(message.value);
          applyStyles();
        } else {
          state.fontFamily = message.value;
          loadGoogleFont(message.value);
          applyStyles();
        }
        break;

      case 'updateHeadingWeight':
        if (window.__typeflux_selected_element) {
          state.selectedStyles.fontWeight = message.value;
          applyStyles();
        } else {
          state.headingWeight = message.value;
          applyStyles();
        }
        break;

      case 'updateBodyWeight':
        if (window.__typeflux_selected_element) {
          state.selectedStyles.fontWeight = message.value;
          applyStyles();
        } else {
          state.bodyWeight = message.value;
          applyStyles();
        }
        break;

      case 'updateHeading':
        if (window.__typeflux_selected_element) {
          state.selectedStyles.fontSize = message.value;
          applyStyles();
        } else {
          state.headings[message.tag] = message.value;
          applyStyles();
        }
        break;

      case 'updateBodySize':
        if (window.__typeflux_selected_element) {
          state.selectedStyles.fontSize = message.value;
          applyStyles();
        } else {
          state.bodySize = message.value;
          applyStyles();
        }
        break;

      case 'updateLineHeight':
        if (window.__typeflux_selected_element) {
          state.selectedStyles.lineHeight = message.value;
          applyStyles();
        } else {
          state.lineHeight = message.value;
          applyStyles();
        }
        break;

      case 'updateLetterSpacing':
        if (window.__typeflux_selected_element) {
          state.selectedStyles.letterSpacing = message.value;
          applyStyles();
        } else {
          state.letterSpacing = message.value;
          applyStyles();
        }
        break;

      case 'reset':
        document.querySelectorAll('[data-tf-styled]').forEach(el => {
          el.removeAttribute('data-tf-styled');
          el.classList.remove('tf-selected-element');
        });
        window.__typeflux_selected_element = null;
        state.selectedStyles = {
          fontFamily: '',
          fontWeight: '',
          fontSize: '',
          lineHeight: '',
          letterSpacing: ''
        };
        selectModeActive = false;
        document.removeEventListener('mousemove', onMouseMove, true);
        document.removeEventListener('click', onClick, true);

        resetAll();
        break;

      case 'toggleExtension':
        state.isEnabled = message.enabled;
        applyStyles();
        return true;

      case 'getMetadata':
        const metadata = {
          headingWeight: 700,
          bodyWeight: 400,
          headings: {},
          bodySize: 16,
          lineHeight: 1.5,
          letterSpacing: 0,
          enabled: state.isEnabled,
          isSelecting: selectModeActive,
          selectedTag: window.__typeflux_selected_element ? window.__typeflux_selected_element.tagName.toLowerCase() : null
        };

        if (window.__typeflux_selected_element) {
          const style = window.getComputedStyle(window.__typeflux_selected_element);
          metadata.bodySize = parseFloat(style.fontSize) || 16;
          metadata.bodyWeight = parseInt(style.fontWeight) || 400;
          metadata.fontFamily = state.selectedStyles.fontFamily || '';

          let lh = style.lineHeight;
          if (lh === 'normal') {
            metadata.lineHeight = 1.2;
          } else {
            metadata.lineHeight = parseFloat(lh) / metadata.bodySize || 1.5;
          }

          let ls = style.letterSpacing;
          if (ls === 'normal') {
            metadata.letterSpacing = 0;
          } else {
            metadata.letterSpacing = parseFloat(ls) || 0;
          }
        } else {
          // Get body styles
          const bodyStyle = window.getComputedStyle(document.body);
          metadata.bodySize = parseFloat(bodyStyle.fontSize) || 16;
          metadata.bodyWeight = parseInt(bodyStyle.fontWeight) || 400;
          metadata.fontFamily = state.fontFamily || '';

          let lh = bodyStyle.lineHeight;
          if (lh === 'normal') {
            metadata.lineHeight = 1.2;
          } else {
            // If line height is px, convert to multiplier relative to font size
            metadata.lineHeight = parseFloat(lh) / metadata.bodySize || 1.5;
          }

          let ls = bodyStyle.letterSpacing;
          if (ls === 'normal') {
            metadata.letterSpacing = 0;
          } else {
            metadata.letterSpacing = parseFloat(ls) || 0;
          }
        }

        // Get heading styles. Look for the first instance of each in the DOM to get the most accurate representative, 
        // fallback to creating a dummy element if not found.
        const headingFallbacks = { h1: 48, h2: 38, h3: 31, h4: 25, h5: 20, h6: 16 };

        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
          let el = document.querySelector(tag);

          if (el) {
            const style = window.getComputedStyle(el);
            metadata.headings[tag] = parseFloat(style.fontSize) || headingFallbacks[tag];
            if (tag === 'h1') metadata.headingWeight = parseInt(style.fontWeight) || 700;
          } else {
            metadata.headings[tag] = headingFallbacks[tag];
          }
        });

        sendResponse(metadata);
        return true;

      case 'ping':
        sendResponse({ status: 'ok' });
        return true;
    }

    sendResponse({ status: 'ok' });
    return true;
  });
})();
