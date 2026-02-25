// ===== Google Fonts List =====
const GOOGLE_FONTS = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
    'Poppins', 'Raleway', 'Nunito', 'Playfair Display', 'Merriweather',
    'Source Sans 3', 'Ubuntu', 'Oswald', 'Rubik', 'Work Sans',
    'Fira Sans', 'Quicksand', 'Mulish', 'Barlow', 'Manrope',
    'Space Grotesk', 'DM Sans', 'Outfit', 'Plus Jakarta Sans', 'Sora',
    'Crimson Text', 'Libre Baskerville', 'Bitter', 'Josefin Sans', 'Archivo'
];

// ===== Default Values =====
const DEFAULTS = {
    headingWeight: 700,
    bodyWeight: 400,
    h1: 48, h2: 38, h3: 31, h4: 25, h5: 20, h6: 16,
    bodySize: 16,
    lineHeight: 1.5,
    letterSpacing: 0
};


// ===== DOM References =====
const fontSearch = document.getElementById('fontSearch');
const fontDropdown = document.getElementById('fontDropdown');

const resetTypographyBtn = document.getElementById('resetTypographyBtn');
const resetHeadingsBtn = document.getElementById('resetHeadingsBtn');
const resetBodyBtn = document.getElementById('resetBodyBtn');
const resetBtn = document.getElementById('resetBtn');
const selectModeBtn = document.getElementById('selectModeBtn');
const selectModeIndicator = document.getElementById('selectModeIndicator');

const weightTarget = document.getElementById('weightTarget');
const globalWeight = document.getElementById('globalWeight');
const weightAll = document.getElementById('weightAll');
const weightHeadings = document.getElementById('weightHeadings');
const weightBody = document.getElementById('weightBody');

const bodySlider = document.getElementById('bodySize');
const bodyValue = document.getElementById('bodySizeValue');
const lineSlider = document.getElementById('lineHeight');
const lineValue = document.getElementById('lineHeightValue');
const letterSlider = document.getElementById('letterSpacing');
const letterValue = document.getElementById('letterSpacingValue');



const validationWarning = document.getElementById('validationWarning');
const errorWarning = document.getElementById('errorWarning');
const extensionToggle = document.getElementById('extensionToggle');

const showMoreHeadingsBtn = document.getElementById('showMoreHeadingsBtn');
const advancedHeadings = document.getElementById('advancedHeadings');

selectModeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (selectModeBtn.classList.contains('active')) {
        selectModeBtn.classList.remove('active');
        sendToTab({ type: 'exitSelectMode' });
        selectModeIndicator.classList.remove('visible');

        // Refresh values after exiting edit mode (shows global values again)
        chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
            if (tab && tab.id) fetchAndApplyMetadata(tab.id);
        });
    } else {
        sendToTab({ type: 'enterSelectMode' });
        window.close(); // Close popup so user can click on page
    }
});

// ===== Accordion Logic =====
const accordions = document.querySelectorAll('.accordion-item');
accordions.forEach(item => {
    const header = item.querySelector('.accordion-header');
    header.addEventListener('click', () => {
        item.classList.toggle('active');
    });
});

let warningTimeout = null;
let selectModeTimeout = null;
function checkValidation() {
    let hasWarning = false;
    let outOfRangeLabels = [];

    // Clear existing inline warning icons
    document.querySelectorAll('.inline-warning-icon').forEach(icon => icon.remove());

    // Do not show warnings if we are editing a single element
    if (selectModeBtn.classList.contains('active')) {
        validationWarning.classList.remove('visible');
        if (warningTimeout) {
            clearTimeout(warningTimeout);
            warningTimeout = null;
        }
        return;
    }

    document.querySelectorAll('.value-input').forEach(input => {
        const row = input.closest('.control-row');
        if (!row) return;
        const slider = row.querySelector('.slider');
        if (!slider) return;

        const val = parseFloat(input.value.replace(',', '.'));
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);

        if (!isNaN(val) && (val < min || val > max)) {
            hasWarning = true;

            const labelEl = row.querySelector('label');
            if (labelEl) {
                let labelText = '';
                for (let node of labelEl.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        labelText += node.textContent;
                    }
                }
                labelText = labelText.trim();

                if (labelText && !outOfRangeLabels.includes(labelText)) {
                    outOfRangeLabels.push(labelText);
                }

                // Append warning icon
                const icon = document.createElement('span');
                icon.className = 'inline-warning-icon';
                icon.title = 'Outside recommended range';
                icon.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffb84d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 4px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>`;
                labelEl.appendChild(icon);
            }
        }
    });

    if (hasWarning) {
        const toastSpan = validationWarning.querySelector('span');
        if (toastSpan) {
            if (outOfRangeLabels.length > 0) {
                toastSpan.innerHTML = `<strong>${outOfRangeLabels.join(', ')}</strong> outside recommended range.`;
            } else {
                toastSpan.textContent = 'Outside recommended range.';
            }
        }

        if (!validationWarning.classList.contains('visible')) {
            validationWarning.classList.add('visible');
        }

        if (warningTimeout) clearTimeout(warningTimeout);
        warningTimeout = setTimeout(() => {
            validationWarning.classList.remove('visible');
            warningTimeout = null;
        }, 3000);
    } else {
        validationWarning.classList.remove('visible');
        if (warningTimeout) {
            clearTimeout(warningTimeout);
            warningTimeout = null;
        }
    }
}

// ===== Helper: Send message to active tab =====
async function sendToTab(message) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return;
        await chrome.tabs.sendMessage(tab.id, message);
    } catch (err) {
        // Content script might not be injected yet
        console.log('TypeFlux: Could not reach content script', err.message);
    }
}

function showErrorWarning() {
    errorWarning.classList.add('visible');
    // Disable all inputs in the popup so users don't try to use them on restricted pages
    const header = document.querySelector('.header');
    const accordion = document.querySelector('.accordion');

    if (header) {
        header.style.opacity = '0.4';
        header.style.pointerEvents = 'none';
    }
    if (accordion) {
        accordion.style.opacity = '0.4';
        accordion.style.pointerEvents = 'none';
    }
}

// ===== Inject content script =====
async function ensureContentScript() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return;

        // Check for restricted URLs (chrome://, edge://, Chrome Web Store)
        if (tab.url.startsWith('chrome://') ||
            tab.url.startsWith('edge://') ||
            tab.url.startsWith('about:') ||
            tab.url.includes('chrome.google.com/webstore') ||
            tab.url.includes('chromewebstore.google.com')) {
            showErrorWarning();
            return;
        }

        // Try to ping first
        try {
            await chrome.tabs.sendMessage(tab.id, { type: 'ping' });
            fetchAndApplyMetadata(tab.id);
            return;
        } catch {
            // Not injected yet
        }

        // Inject the script
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });
        fetchAndApplyMetadata(tab.id);
    } catch (err) {
        console.error('TypeFlux: Could not inject content script', err);
    }
}

// ===== Fetch current page typography =====
function fetchAndApplyMetadata(tabId) {
    chrome.tabs.sendMessage(tabId, { type: 'getMetadata' }, (metadata) => {
        if (chrome.runtime.lastError || !metadata) return;

        // Update font name
        if (metadata.fontFamily !== undefined) {
            fontSearch.value = metadata.fontFamily;
        }

        // Update generic values
        if (metadata.headingWeight) {
            let clampedHW = clamp(Math.round(metadata.headingWeight / 100) * 100, 100, 900);
            weightHeadings.value = clampedHW;
            DEFAULTS.headingWeight = clampedHW;
        }

        if (metadata.bodyWeight) {
            let clampedBW = clamp(Math.round(metadata.bodyWeight / 100) * 100, 100, 900);
            weightBody.value = clampedBW;
            weightAll.value = clampedBW; // fallback for 'all' based on body
            DEFAULTS.bodyWeight = clampedBW;
        }

        // Init UI for current dropdown target
        updateWeightUI();

        if (metadata.bodySize) {
            let numVal = Math.round(metadata.bodySize);
            let clampedSlider = clamp(numVal, bodySlider.min, bodySlider.max);
            bodySlider.value = clampedSlider;
            bodyValue.value = numVal;
            DEFAULTS.bodySize = numVal;
        }

        if (metadata.lineHeight) {
            let numVal = parseFloat(metadata.lineHeight).toFixed(1);
            let clampedSlider = clampFloat(numVal, lineSlider.min, lineSlider.max);
            lineSlider.value = clampedSlider;
            lineValue.value = numVal;
            DEFAULTS.lineHeight = parseFloat(numVal);
        }

        if (metadata.letterSpacing !== undefined) {
            let numVal = parseFloat(metadata.letterSpacing).toFixed(1);
            let clampedSlider = clampFloat(numVal, letterSlider.min, letterSlider.max);
            letterSlider.value = clampedSlider;
            letterValue.value = numVal;
            DEFAULTS.letterSpacing = parseFloat(numVal);
        }

        if (metadata.enabled !== undefined) {
            extensionToggle.checked = metadata.enabled;
        }

        if (metadata.isSelecting || metadata.selectedTag) {
            selectModeBtn.classList.add('active');
            if (metadata.selectedTag) {
                selectModeIndicator.querySelector('span').innerHTML = `Editing <strong>&lt;${metadata.selectedTag}&gt;</strong>`;
            } else {
                selectModeIndicator.querySelector('span').textContent = `Select an element on the page`;
            }

            // Only trigger if not already visible to avoid spam
            if (!selectModeIndicator.classList.contains('visible')) {
                selectModeIndicator.classList.add('visible');

                if (selectModeTimeout) clearTimeout(selectModeTimeout);
                selectModeTimeout = setTimeout(() => {
                    selectModeIndicator.classList.remove('visible');
                    selectModeTimeout = null;
                }, 3000);
            }
        } else {
            selectModeBtn.classList.remove('active');
            selectModeIndicator.classList.remove('visible');
            if (selectModeTimeout) {
                clearTimeout(selectModeTimeout);
                selectModeTimeout = null;
            }
        }

        // Update heading values
        if (metadata.headings) {
            document.querySelectorAll('.heading-slider').forEach(slider => {
                const tag = slider.dataset.tag;
                if (metadata.headings[tag]) {
                    const rawVal = metadata.headings[tag];
                    let clampedSlider = clamp(Math.round(rawVal), slider.min, slider.max);
                    slider.value = clampedSlider;

                    const valueInput = document.querySelector(`.heading-value[data-tag="${tag}"]`);
                    valueInput.value = Math.round(rawVal);
                    DEFAULTS[tag] = Math.round(rawVal);
                }
            });
        }

        checkValidation();
    });
}

extensionToggle.addEventListener('change', () => {
    sendToTab({ type: 'toggleExtension', enabled: extensionToggle.checked });
});

// ===== Font Selector =====
function populateFontDropdown(filter = '') {
    fontDropdown.innerHTML = '';
    const lowerFilter = filter.toLowerCase();
    const filtered = GOOGLE_FONTS.filter(f => f.toLowerCase().includes(lowerFilter));

    if (filtered.length === 0) {
        fontDropdown.classList.add('hidden');
        return;
    }

    filtered.forEach(font => {
        const div = document.createElement('div');
        div.className = 'font-option';
        div.textContent = font;
        div.addEventListener('click', () => selectFont(font));
        fontDropdown.appendChild(div);
    });

    fontDropdown.classList.remove('hidden');
}

function selectFont(fontName) {
    fontSearch.value = fontName;
    fontDropdown.classList.add('hidden');
    sendToTab({ type: 'updateFont', value: fontName });
}

fontSearch.addEventListener('focus', () => {
    populateFontDropdown(fontSearch.value);
});

fontSearch.addEventListener('input', () => {
    populateFontDropdown(fontSearch.value);
});

// Close dropdown on outside click
document.addEventListener('click', (e) => {
    if (!e.target.closest('.font-selector')) {
        fontDropdown.classList.add('hidden');
    }
});

// ===== Unified Weight Logic =====
function updateWeightUI() {
    const target = weightTarget.value;
    if (target === 'all') globalWeight.value = weightAll.value;
    else if (target === 'headings') globalWeight.value = weightHeadings.value;
    else if (target === 'body') globalWeight.value = weightBody.value;
}

weightTarget.addEventListener('change', updateWeightUI);

globalWeight.addEventListener('change', () => {
    const val = globalWeight.value;
    const target = weightTarget.value;

    if (target === 'all') {
        weightAll.value = val;
        weightHeadings.value = val;
        weightBody.value = val;
        sendToTab({ type: 'updateHeadingWeight', value: val });
        sendToTab({ type: 'updateBodyWeight', value: val });
    } else if (target === 'headings') {
        weightHeadings.value = val;
        sendToTab({ type: 'updateHeadingWeight', value: val });
    } else if (target === 'body') {
        weightBody.value = val;
        sendToTab({ type: 'updateBodyWeight', value: val });
    }
});

// ===== Heading Sliders =====
document.querySelectorAll('.heading-slider').forEach(slider => {
    const tag = slider.dataset.tag;
    const valueInput = document.querySelector(`.heading-value[data-tag="${tag}"]`);

    slider.addEventListener('input', () => {
        valueInput.value = slider.value;
        sendToTab({ type: 'updateHeading', tag, value: slider.value });
        checkValidation();
    });

    valueInput.addEventListener('input', () => {
        const val = clamp(valueInput.value, valueInput.min, valueInput.max);
        slider.value = clamp(val, slider.min, slider.max);
        sendToTab({ type: 'updateHeading', tag, value: val });
        checkValidation();
    });
});

if (showMoreHeadingsBtn) {
    showMoreHeadingsBtn.addEventListener('click', () => {
        const isHidden = advancedHeadings.style.display === 'none';
        if (isHidden) {
            advancedHeadings.style.display = 'flex';
            showMoreHeadingsBtn.innerHTML = `Show Less <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.2s; transform: rotate(180deg);"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
        } else {
            advancedHeadings.style.display = 'none';
            showMoreHeadingsBtn.innerHTML = `Show More <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.2s;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
        }
    });
}



// ===== Body Style Options =====
bodySlider.addEventListener('input', () => {
    bodyValue.value = bodySlider.value;
    sendToTab({ type: 'updateBodySize', value: bodySlider.value });
    checkValidation();
});

bodyValue.addEventListener('input', () => {
    const val = clamp(bodyValue.value, bodyValue.min, bodyValue.max);
    bodySlider.value = clamp(val, bodySlider.min, bodySlider.max);
    sendToTab({ type: 'updateBodySize', value: val });
    checkValidation();
});

// ===== Line Height =====
lineSlider.addEventListener('input', () => {
    lineValue.value = lineSlider.value;
    sendToTab({ type: 'updateLineHeight', value: lineSlider.value });
    checkValidation();
});

lineValue.addEventListener('input', () => {
    const val = clampFloat(lineValue.value, lineValue.min, lineValue.max);
    lineSlider.value = clampFloat(val, lineSlider.min, lineSlider.max);
    sendToTab({ type: 'updateLineHeight', value: val });
    checkValidation();
});

// ===== Letter Spacing =====
letterSlider.addEventListener('input', () => {
    letterValue.value = letterSlider.value;
    sendToTab({ type: 'updateLetterSpacing', value: letterSlider.value });
    checkValidation();
});

letterValue.addEventListener('input', () => {
    const val = clampFloat(letterValue.value, letterValue.min, letterValue.max);
    letterSlider.value = clampFloat(val, letterSlider.min, letterSlider.max);
    sendToTab({ type: 'updateLetterSpacing', value: val });
    checkValidation();
});

// ===== Reset Handlers =====
resetTypographyBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    // Reset Font
    fontSearch.value = '';
    sendToTab({ type: 'updateFont', value: '' });

    // Reset Typography Weights in UI
    weightAll.value = DEFAULTS.bodyWeight;
    weightHeadings.value = DEFAULTS.headingWeight;
    weightBody.value = DEFAULTS.bodyWeight;
    updateWeightUI();

    // Clear overrides in content script
    sendToTab({ type: 'updateHeadingWeight', value: '' });
    sendToTab({ type: 'updateBodyWeight', value: '' });

    // Animate
    resetTypographyBtn.style.transform = 'rotate(-180deg)';
    setTimeout(() => { resetTypographyBtn.style.transform = 'none'; }, 200);
});

resetHeadingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    // Reset Show More state
    if (showMoreHeadingsBtn) {
        advancedHeadings.style.display = 'none';
        showMoreHeadingsBtn.innerHTML = `Show More <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.2s;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    }

    // Reset Heading Sliders in UI
    document.querySelectorAll('.heading-slider').forEach(slider => {
        const tag = slider.dataset.tag;
        const def = DEFAULTS[tag];
        slider.value = def;
        document.querySelector(`.heading-value[data-tag="${tag}"]`).value = def;

        // Clear explicit override in content script
        sendToTab({ type: 'updateHeading', tag, value: '' });
    });
    checkValidation();

    // Animate
    resetHeadingsBtn.style.transform = 'rotate(-180deg)';
    setTimeout(() => { resetHeadingsBtn.style.transform = 'none'; }, 200);
});

resetBodyBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    // Reset Body Properties in UI
    bodySlider.value = DEFAULTS.bodySize;
    bodyValue.value = DEFAULTS.bodySize;
    lineSlider.value = DEFAULTS.lineHeight;
    lineValue.value = DEFAULTS.lineHeight;
    letterSlider.value = DEFAULTS.letterSpacing;
    letterValue.value = DEFAULTS.letterSpacing;

    // Clear overrides in content script
    sendToTab({ type: 'updateBodySize', value: '' });
    sendToTab({ type: 'updateLineHeight', value: '' });
    sendToTab({ type: 'updateLetterSpacing', value: '' });

    // Animate
    resetBodyBtn.style.transform = 'rotate(-180deg)';
    setTimeout(() => { resetBodyBtn.style.transform = 'none'; }, 200);
});

resetBtn.addEventListener('click', () => {
    // 1. Reset Font & Typography Weights in UI
    fontSearch.value = '';
    weightAll.value = DEFAULTS.bodyWeight;
    weightHeadings.value = DEFAULTS.headingWeight;
    weightBody.value = DEFAULTS.bodyWeight;
    updateWeightUI();

    // 2. Reset Heading Sliders in UI
    if (showMoreHeadingsBtn) {
        advancedHeadings.style.display = 'none';
        showMoreHeadingsBtn.innerHTML = `Show More <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.2s;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    }

    document.querySelectorAll('.heading-slider').forEach(slider => {
        const tag = slider.dataset.tag;
        const def = DEFAULTS[tag];
        slider.value = def;
        document.querySelector(`.heading-value[data-tag="${tag}"]`).value = def;
    });

    // 3. Reset Body Style in UI
    bodySlider.value = DEFAULTS.bodySize;
    bodyValue.value = DEFAULTS.bodySize;
    lineSlider.value = DEFAULTS.lineHeight;
    lineValue.value = DEFAULTS.lineHeight;
    letterSlider.value = DEFAULTS.letterSpacing;
    letterValue.value = DEFAULTS.letterSpacing;

    // Fully reset content script states and remove style tags
    sendToTab({ type: 'reset' });

    // Also reset select mode UI
    selectModeBtn.classList.remove('active');
    selectModeIndicator.classList.remove('visible');
    if (selectModeTimeout) {
        clearTimeout(selectModeTimeout);
        selectModeTimeout = null;
    }

    checkValidation();

    // Button animation
    resetBtn.style.transform = 'scale(0.96)';
    setTimeout(() => { resetBtn.style.transform = ''; }, 150);
});
function clamp(val, min, max) {
    if (typeof val === 'string') val = val.replace(',', '.');
    return Math.min(Math.max(Number(val) || Number(min), Number(min)), Number(max));
}

function clampFloat(val, min, max) {
    if (typeof val === 'string') val = val.replace(',', '.');
    const n = parseFloat(val);
    if (isNaN(n)) return parseFloat(min);
    return Math.min(Math.max(n, parseFloat(min)), parseFloat(max));
}

// ===== Init =====
ensureContentScript();
