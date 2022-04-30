'use strict';

// Units
class Pixels {
  static parse(value) {
    return Math.round(value * devicePixelRatio);
  }
  static toNumber(value) {
    return value / devicePixelRatio;
  }
  static toString(value) {
    return `${value / devicePixelRatio}px`;
  }
}

// Window
class Win {
  static scrollbarThickness = 17;
  static fullWidth_;
  static fullHeight_;

  static get fullWidth() {
    return this.fullWidth_;
  }
  static get fullHeight() {
    return this.fullHeight_;
  }
  static get width() {
    return this.isHigher() ? this.fullWidth - this.scrollbarThickness : this.fullWidth;
  }
  static get height() {
    return this.isWider() ? this.fullHeight - this.scrollbarThickness : this.fullHeight;
  }
  static get ratio() {
    return this.fullWidth / this.fullHeight;
  }
  static isWider() {
    return this.fullWidth < img.fullWidth;
  }
  static isHigher() {
    return this.fullHeight < img.fullHeight;
  }
  static calcSize() {
    document.body.style.overflow = 'hidden';
    this.fullWidth_ = Pixels.parse(visualViewport.width);
    this.fullHeight_ = Pixels.parse(visualViewport.height);
    document.body.style.overflow = '';
  }
}

// Image
class Img {
  node;
  width_;
  height_;
  horizontal = true; // is angle 0 or 180 degrees (angle / 180)
  orientation = 0; // angle / 90 (0 = 0, 1 = 90, 2 = 180, 3 = 270)

  set x(value) {
    this.node.style.left = Pixels.toString(Math.max(value, 0));
  }
  set y(value) {
    this.node.style.top = Pixels.toString(Math.max(value, 0));
  }

  get fullWidth() {
    return this.horizontal ? this.node.naturalWidth : this.node.naturalHeight;
  }
  get fullHeight() {
    return this.horizontal ? this.node.naturalHeight : this.node.naturalWidth;
  }

  get width() {
    return this.horizontal ? this.width_ : this.height_;
  }
  set width(value) {
    if (this.horizontal) {
      this.width_ = value;
      this.node.style.width = Pixels.toString(value);
    } else {
      this.height_ = value;
      this.node.style.height = Pixels.toString(value);
    }
  }
  get height() {
    return this.horizontal ? this.height_ : this.width_;
  }
  set height(value) {
    if (this.horizontal) {
      this.height_ = value;
      this.node.style.height = Pixels.toString(value);
    } else {
      this.width_ = value;
      this.node.style.width = Pixels.toString(value);
    }
  }
  get ratio() {
    return this.fullWidth / this.fullHeight;
  }
}
const img = new Img();

// Fit
let fitType; // 0 = fit, 1 = fill, 2 = natural

function fitFit() {
  if (ratioCompare()) {
    img.width = Win.fullWidth;
    img.height = img.width / img.ratio;
  } else {
    img.height = Win.fullHeight;
    img.width = img.height * img.ratio;
  }
  img.x = (Win.fullWidth - img.width) / 2;
  img.y = (Win.fullHeight - img.height) / 2;

  imgMovable(false);
}

function fitFill() {
  if (ratioCompare()) {
    img.height = Win.height;
    img.width = img.height * img.ratio;
  } else {
    img.width = Win.width;
    img.height = img.width / img.ratio;
  }
  img.x = 0;
  img.y = 0;

  imgMovable(true);
}

function fitNatural() {
  img.width = img.fullWidth * devicePixelRatio;
  img.height = img.fullHeight * devicePixelRatio;
  img.x = (Win.width - img.width) / 2;
  img.y = (Win.height - img.height) / 2;

  if (fitFitAvailable()) {
    imgMovable(true);
  }
}

function fitUpdate() {
  Win.calcSize();

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

function ratioCompare() {
  return Win.ratio < img.ratio;
}

function fitFitAvailable() {
  return Win.isWider() || Win.isHigher();
}

function fitFillAvailable() {
  if (ratioCompare()) {
    return Win.height < img.fullHeight && Win.fullWidth < Math.floor(img.fullWidth * Win.height / img.fullHeight);
  } else {
    return Win.width < img.fullWidth && Win.fullHeight < Math.floor(img.fullHeight * Win.width / img.fullWidth);
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
      scrollTo(Pixels.toNumber((img.width - Win.fullWidth) / 2), Pixels.toNumber((img.height - Win.fullHeight) / 2));

      break;

    case 2:
      scrollTo(Pixels.toNumber((img.fullWidth - Win.width) / 2), Pixels.toNumber((img.fullHeight - Win.height) / 2));

      break;
  }
}

// Rotate
function rotateCW() {
  img.orientation = (img.orientation + 1) % 4;

  rotate();
}

function rotateCCW() {
  img.orientation = (img.orientation + 3) % 4;

  rotate();
}

function rotate() {
  img.node.className = `orientation-${img.orientation}`;

  img.horizontal = !img.horizontal; // img.orientation % 2

  fitUpdate();
}

// Move
let moveOffsetX;
let moveOffsetY;

function imgMovable(state) {
  if (state) {
    window.addEventListener('mousedown', onMouseDown);
  } else {
    window.removeEventListener('mousedown', onMouseDown);
  }
}

function onMouseDown(e) {
  moveOffsetX = scrollX + e.clientX;
  moveOffsetY = scrollY + e.clientY;

  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('mousemove', onMouseMove);
}

function onMouseUp() {
  window.removeEventListener('mouseup', onMouseUp);
  window.removeEventListener('mousemove', onMouseMove);
}

function onMouseMove(e) {
  scrollTo(moveOffsetX - e.clientX, moveOffsetY - e.clientY);

  e.preventDefault();
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
