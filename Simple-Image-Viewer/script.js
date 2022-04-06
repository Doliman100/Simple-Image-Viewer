'use strict';

const scrollbarThickness = 17 / window.devicePixelRatio;

let fitType; // 0 = fit, 1 = fill, 2 = natural

let moveOffsetX;
let moveOffsetY;

// Compare
function isWider() {
  return doc.widthFull < img.widthFull;
}

function isHigher() {
  return doc.heightFull < img.heightFull;
}

function ratioCompare() {
  return doc.ratio < img.ratio;
}

// Document
const doc = {
  get widthFull() {
    return window.innerWidth;
  },
  get heightFull() {
    return window.innerHeight;
  },
  get width() {
    return isHigher() ? this.widthFull - scrollbarThickness : this.widthFull;
  },
  get height() {
    return isWider() ? this.heightFull - scrollbarThickness : this.heightFull;
  },
  get ratio() {
    return this.widthFull / this.heightFull;
  },
};

// Image
const img = {
  horizontal: true, // is angle 0 or 180 degrees (angle / 180)
  orientation: 0, // angle / 90 (0 = 0, 1 = 90, 2 = 180, 3 = 270)

  width_: undefined,
  height_: undefined,
  node: undefined,

  get widthFull() {
    return this.horizontal ? this.width_ : this.height_;
  },
  get heightFull() {
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
    return this.widthFull / this.heightFull;
  },

  set x(value) {
    this.node.style.left = Math.max(value, 0) + 'px';
  },
  set y(value) {
    this.node.style.top = Math.max(value, 0) + 'px';
  },
};

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
    return doc.height < img.heightFull && doc.widthFull < Math.floor(img.widthFull * doc.height / img.heightFull);
  } else {
    return doc.width < img.widthFull && doc.heightFull < Math.floor(img.heightFull * doc.width / img.widthFull);
  }
}

function fitFit() {
  if (ratioCompare()) {
    img.width = doc.widthFull + 'px';
    img.height = 'auto';
  } else {
    img.width = 'auto';
    img.height = doc.heightFull + 'px';
  }
  img.x = (doc.widthFull - img.width) / 2;
  img.y = (doc.heightFull - img.height) / 2;

  imgMovable(false);
}

function fitFill() {
  if (ratioCompare()) {
    img.width = 'auto';
    img.height = doc.height + 'px';
  } else {
    img.width = doc.width + 'px';
    img.height = 'auto';
  }
  img.x = 0;
  img.y = 0;

  imgMovable(true);
}

function fitNatural() {
  img.width = 'auto';
  img.height = 'auto';
  img.x = (doc.width - img.widthFull) / 2;
  img.y = (doc.height - img.heightFull) / 2;

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
      scrollTo((img.width - doc.widthFull) / 2, (img.height - doc.heightFull) / 2);

      break;

    case 2:
      scrollTo((img.widthFull - doc.width) / 2, (img.heightFull - doc.height) / 2);

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
  img.node.className = 'orientation-' + img.orientation;

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
