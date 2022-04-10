'use strict';

const scrollbarThickness = 17 / window.devicePixelRatio;

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

// Document
const doc = Object.seal({
  get fullWidth() {
    return window.innerWidth;
  },
  get fullHeight() {
    return window.innerHeight;
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
});

// Image
const img = Object.seal({
  horizontal: true, // is angle 0 or 180 degrees (angle / 180)
  orientation: 0, // angle / 90 (0 = 0, 1 = 90, 2 = 180, 3 = 270)

  width_: undefined,
  height_: undefined,
  node: undefined,

  get fullWidth() {
    return this.horizontal ? this.width_ : this.height_;
  },
  get fullHeight() {
    return this.horizontal ? this.height_ : this.width_;
  },

  get width() {
    return this.horizontal ? this.node.scrollWidth : this.node.scrollHeight;
  },
  set width(value) {
    if (this.horizontal) {
      this.node.style.width = value;
    } else {
      this.node.style.height = value;
    }
  },
  get height() {
    return this.horizontal ? this.node.scrollHeight : this.node.scrollWidth;
  },
  set height(value) {
    if (this.horizontal) {
      this.node.style.height = value;
    } else {
      this.node.style.width = value;
    }
  },
  get ratio() {
    return this.fullWidth / this.fullHeight;
  },

  set x(value) {
    this.node.style.left = `${Math.max(value, 0)}px`;
  },
  set y(value) {
    this.node.style.top = `${Math.max(value, 0)}px`;
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
    img.width = `${doc.fullWidth}px`;
    img.height = 'auto';
  } else {
    img.width = 'auto';
    img.height = `${doc.fullHeight}px`;
  }
  img.x = (doc.fullWidth - img.width) / 2;
  img.y = (doc.fullHeight - img.height) / 2;

  imgMovable(false);
}

function fitFill() {
  if (ratioCompare()) {
    img.width = 'auto';
    img.height = `${doc.height}px`;
  } else {
    img.width = `${doc.width}px`;
    img.height = 'auto';
  }
  img.x = 0;
  img.y = 0;

  imgMovable(true);
}

function fitNatural() {
  img.width = 'auto';
  img.height = 'auto';
  img.x = (doc.width - img.fullWidth) / 2;
  img.y = (doc.height - img.fullHeight) / 2;

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
      scrollTo((img.width - doc.fullWidth) / 2, (img.height - doc.fullHeight) / 2);

      break;

    case 2:
      scrollTo((img.fullWidth - doc.width) / 2, (img.fullHeight - doc.height) / 2);

      break;
  }
}

function fitUpdate() {
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
const imgNative = document.body.firstChild; // img_element_
img.width_ = imgNative.naturalWidth;
img.height_ = imgNative.naturalHeight;
img.node = new Image(img.width_, img.height_);
img.node.src = imgNative.src;
img.node.className = 'orientation-0';
document.body.replaceChild(img.node, imgNative);

applyFit(fitFitAvailable() ? 0 : 2);

// Events
window.addEventListener('resize', fitUpdate);

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
