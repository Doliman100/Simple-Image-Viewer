'use strict';

const scrollbarThickness = 17;

let fitType; // 0 = fit, 1 = fill, 2 = natural

let moveOffsetX;
let moveOffsetY;

// Compare
function isWider() {
  return doc.fullWidth < img.fullWidth;
}

function isHigher() {
  return doc.fullHeight < img.fullHeight;
}

function ratioCompare() {
  return doc.ratio < img.ratio;
}

// Units
const pixels = Object.seal({
  parse: (value) => Math.round(value * devicePixelRatio),
  toString: (value) => `${value / devicePixelRatio}px`,
  toNumber: (value) => value / devicePixelRatio,
});

// Document
const doc = Object.seal({
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
    document.onmousedown = onMouseDown;
  } else {
    document.onmousedown = undefined;
  }
}

// Fit
function fitFitAvailable() {
  return isWider() || isHigher();
}

function fitFillAvailable() {
  if (ratioCompare()) {
    return doc.height < img.fullHeight && doc.fullWidth < Math.floor(img.fullWidth * doc.height / img.fullHeight);
  } else {
    return doc.width < img.fullWidth && doc.fullHeight < Math.floor(img.fullHeight * doc.width / img.fullWidth);
  }
}

function fitFit() {
  if (ratioCompare()) {
    img.width = doc.fullWidth;
    img.height = img.width / img.ratio;
  } else {
    img.height = doc.fullHeight;
    img.width = img.height * img.ratio;
  }
  img.x = (doc.fullWidth - img.width) / 2;
  img.y = (doc.fullHeight - img.height) / 2;

  imgMovable(false);
}

function fitFill() {
  if (ratioCompare()) {
    img.height = doc.height;
    img.width = img.height * img.ratio;
  } else {
    img.width = doc.width;
    img.height = img.width / img.ratio;
  }
  img.x = 0;
  img.y = 0;

  imgMovable(true);
}

function fitNatural() {
  img.width = img.fullWidth * devicePixelRatio;
  img.height = img.fullHeight * devicePixelRatio;
  img.x = (doc.width - img.width) / 2;
  img.y = (doc.height - img.height) / 2;

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
      scrollTo(pixels.toNumber((img.width - doc.fullWidth) / 2), pixels.toNumber((img.height - doc.fullHeight) / 2));

      break;

    case 2:
      scrollTo(pixels.toNumber((img.fullWidth - doc.width) / 2), pixels.toNumber((img.fullHeight - doc.height) / 2));

      break;
  }
}

function fitUpdate() {
  doc.calcSize();

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

  document.onmouseup = onMouseUp;
  document.onmousemove = onMouseMove;
}

function onMouseMove(e) {
  scrollTo(moveOffsetX - e.clientX, moveOffsetY - e.clientY);

  return false;
}

function onMouseUp() {
  document.onmouseup = undefined;
  document.onmousemove = undefined;
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

window.addEventListener('keyup', (e) => {
  if (!e.ctrlKey) {
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
        if (e.shiftKey) {
          rotateCCW();
        } else {
          rotateCW();
        }

        break;
    }
  }
});
