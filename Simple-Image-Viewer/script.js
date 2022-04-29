'use strict';

const scrollbarThickness = 17;

let fitType; // 0 = fit, 1 = fill, 2 = natural

let moveOffsetX;
let moveOffsetY;

// Compare
function isWider() {
  return win.fullWidth < img.fullWidth;
}

function isHigher() {
  return win.fullHeight < img.fullHeight;
}

function ratioCompare() {
  return win.ratio < img.ratio;
}

// Units
const pixels = Object.seal({
  parse: (value) => Math.round(value * devicePixelRatio),
  toString: (value) => `${value / devicePixelRatio}px`,
  toNumber: (value) => value / devicePixelRatio,
});

// Window
const win = Object.seal({
  fullWidth_: undefined,
  fullHeight_: undefined,

  get fullWidth() {
    return this.fullWidth_;
  },
  get fullHeight() {
    return this.fullHeight_;
  },
  get width() {
    return isHigher() ? this.fullWidth - scrollbarThickness : this.fullWidth;
  },
  get height() {
    return isWider() ? this.fullHeight - scrollbarThickness : this.fullHeight;
  },
  get ratio() {
    return this.fullWidth / this.fullHeight;
  },
  calcSize() {
    document.body.style.overflow = 'hidden';
    this.fullWidth_ = pixels.parse(visualViewport.width);
    this.fullHeight_ = pixels.parse(visualViewport.height);
    document.body.style.overflow = '';
  },
});

// Image
const img = Object.seal({
  horizontal: true, // is angle 0 or 180 degrees (angle / 180)
  orientation: 0, // angle / 90 (0 = 0, 1 = 90, 2 = 180, 3 = 270)

  width_: undefined,
  height_: undefined,
  node: undefined,

  get fullWidth() {
    return this.horizontal ? this.node.naturalWidth : this.node.naturalHeight;
  },
  get fullHeight() {
    return this.horizontal ? this.node.naturalHeight : this.node.naturalWidth;
  },

  get width() {
    return this.horizontal ? this.width_ : this.height_;
  },
  set width(value) {
    if (this.horizontal) {
      this.width_ = value;
      this.node.style.width = pixels.toString(value);
    } else {
      this.height_ = value;
      this.node.style.height = pixels.toString(value);
    }
  },
  get height() {
    return this.horizontal ? this.height_ : this.width_;
  },
  set height(value) {
    if (this.horizontal) {
      this.height_ = value;
      this.node.style.height = pixels.toString(value);
    } else {
      this.width_ = value;
      this.node.style.width = pixels.toString(value);
    }
  },
  get ratio() {
    return this.fullWidth / this.fullHeight;
  },

  set x(value) {
    this.node.style.left = pixels.toString(Math.max(value, 0));
  },
  set y(value) {
    this.node.style.top = pixels.toString(Math.max(value, 0));
  },
});

function imgMovable(state) {
  if (state) {
    window.addEventListener('mousedown', onMouseDown);
  } else {
    window.removeEventListener('mousedown', onMouseDown);
  }
}

// Fit
function fitFitAvailable() {
  return isWider() || isHigher();
}

function fitFillAvailable() {
  if (ratioCompare()) {
    return win.height < img.fullHeight && win.fullWidth < Math.floor(img.fullWidth * win.height / img.fullHeight);
  } else {
    return win.width < img.fullWidth && win.fullHeight < Math.floor(img.fullHeight * win.width / img.fullWidth);
  }
}

function fitFit() {
  if (ratioCompare()) {
    img.width = win.fullWidth;
    img.height = img.width / img.ratio;
  } else {
    img.height = win.fullHeight;
    img.width = img.height * img.ratio;
  }
  img.x = (win.fullWidth - img.width) / 2;
  img.y = (win.fullHeight - img.height) / 2;

  imgMovable(false);
}

function fitFill() {
  if (ratioCompare()) {
    img.height = win.height;
    img.width = img.height * img.ratio;
  } else {
    img.width = win.width;
    img.height = img.width / img.ratio;
  }
  img.x = 0;
  img.y = 0;

  imgMovable(true);
}

function fitNatural() {
  img.width = img.fullWidth * devicePixelRatio;
  img.height = img.fullHeight * devicePixelRatio;
  img.x = (win.width - img.width) / 2;
  img.y = (win.height - img.height) / 2;

  if (fitFitAvailable()) {
    imgMovable(true);
  }
}

function fit() {
  switch (fitType) {
    case 0:
      fitFit();

      break;

    case 1:
      fitFill();

      break;

    case 2:
      fitNatural();

      break;
  }
}

function scroll() {
  switch (fitType) {
    case 1:
      scrollTo(pixels.toNumber((img.width - win.fullWidth) / 2), pixels.toNumber((img.height - win.fullHeight) / 2));

      break;

    case 2:
      scrollTo(pixels.toNumber((img.fullWidth - win.width) / 2), pixels.toNumber((img.fullHeight - win.height) / 2));

      break;
  }
}

function fitUpdate() {
  win.calcSize();

  if (fitType == 0 && fitFitAvailable() || fitType == 1 && fitFillAvailable() || (fitType = 2)) {
    fit();
  }
}

function applyFit(n) {
  if (fitType != n && (n == 0 && fitFitAvailable() || n == 1 && fitFillAvailable() || n == 2)) {
    fitType = n;

    fit();
    scroll();
  }
}

// Rotate
function rotate() {
  img.node.className = `orientation-${img.orientation}`;

  img.horizontal = !img.horizontal; // img.orientation % 2

  fitUpdate();
}

function rotateCW() {
  img.orientation = (img.orientation + 1) % 4;

  rotate();
}

function rotateCCW() {
  img.orientation = (img.orientation + 3) % 4;

  rotate();
}

// Move
function onMouseDown(e) {
  moveOffsetX = scrollX + e.clientX;
  moveOffsetY = scrollY + e.clientY;

  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('mousemove', onMouseMove);
}

function onMouseMove(e) {
  scrollTo(moveOffsetX - e.clientX, moveOffsetY - e.clientY);

  e.preventDefault();
}

function onMouseUp() {
  window.removeEventListener('mouseup', onMouseUp);
  window.removeEventListener('mousemove', onMouseMove);
}

// Init
function undoDefault() {
  img.node.style.margin = '';
  img.node.style.cursor = '';
  img.node.width = img.node.naturalWidth;
  img.node.height = img.node.naturalHeight;

  fitUpdate();
}

// load style sync
const xhr = new XMLHttpRequest();
xhr.open('GET', chrome.runtime.getURL('style.css'), false);
xhr.send();

// insert style sync
const sheet = new CSSStyleSheet();
// @ts-ignore
sheet.replaceSync(xhr.responseText);
// @ts-ignore
document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];

const observer = new MutationObserver(() => {
  if (document.body) {
    // img_element_
    img.node = document.body.firstChild;
    img.node.className = 'orientation-0';
    img.node.addEventListener('click', (e) => e.stopPropagation(), true);

    undoDefault();
    applyFit(fitFitAvailable() ? 0 : 2);

    observer.disconnect();
  }
});
observer.observe(document.documentElement, {childList: true});

// Events
window.addEventListener('DOMContentLoaded', undoDefault);
window.addEventListener('resize', (e) => {
  fitUpdate();

  e.stopImmediatePropagation();
});

window.addEventListener('keydown', (e) => {
  // https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/resources/pdf/pdf_viewer.ts;l=325;drc=30dc92ddfcd163862acd0d1b8f0ababae3d1e2f8
  if (e.altKey || e.ctrlKey || e.metaKey) {
    return;
  }

  if (e.shiftKey) {
    if (e.code === 'KeyR') {
      rotateCCW();
    }
  } else {
    switch (e.code) {
      case 'Digit1':
        applyFit(2);
        break;
      case 'Digit2':
        applyFit(1);
        break;
      case 'Digit3':
        applyFit(0);
        break;
      case 'KeyR':
        rotateCW();
        break;
    }
  }
});
