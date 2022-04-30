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
  node; // image_element_
  width_;
  height_;
  horizontal = true; // is angle 0 or 180 degrees (angle / 180)
  orientation = 0; // angle / 90 (0 = 0, 1 = 90, 2 = 180, 3 = 270)

  constructor(element) {
    if (element instanceof HTMLImageElement === false) {
      throw new TypeError('Failed to construct \'Img\': parameter 1 is not of type \'HTMLImageElement\'.');
    }
    this.node = element;
    this.node.className = 'orientation-0';
    this.node.addEventListener('click', (e) => e.stopPropagation(), true);
  }

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

// Fit
class Fit {
  static fitType; // 0 = fit, 1 = fill, 2 = natural

  static fitFit() {
    if (this.ratioCompare()) {
      img.width = Win.fullWidth;
      img.height = img.width / img.ratio;
    } else {
      img.height = Win.fullHeight;
      img.width = img.height * img.ratio;
    }
    img.x = (Win.fullWidth - img.width) / 2;
    img.y = (Win.fullHeight - img.height) / 2;

    Move.imgMovable(false);
  }

  static fitFill() {
    if (this.ratioCompare()) {
      img.height = Win.height;
      img.width = img.height * img.ratio;
    } else {
      img.width = Win.width;
      img.height = img.width / img.ratio;
    }
    img.x = 0;
    img.y = 0;

    Move.imgMovable(true);
  }

  static fitNatural() {
    img.width = img.fullWidth * devicePixelRatio;
    img.height = img.fullHeight * devicePixelRatio;
    img.x = (Win.width - img.width) / 2;
    img.y = (Win.height - img.height) / 2;

    if (this.fitFitAvailable()) {
      Move.imgMovable(true);
    }
  }

  static fitUpdate() {
    Win.calcSize();

    if (this.fitType == 0 && this.fitFitAvailable() || this.fitType == 1 && this.fitFillAvailable() || (this.fitType = 2)) {
      this.fit();
    }
  }

  static applyFit(n) {
    if (this.fitType != n && (n == 0 && this.fitFitAvailable() || n == 1 && this.fitFillAvailable() || n == 2)) {
      this.fitType = n;

      this.fit();
      this.scroll();
    }
  }

  static ratioCompare() {
    return Win.ratio < img.ratio;
  }

  static fitFitAvailable() {
    return Win.isWider() || Win.isHigher();
  }

  static fitFillAvailable() {
    if (this.ratioCompare()) {
      return Win.height < img.fullHeight && Win.fullWidth < Math.floor(img.fullWidth * Win.height / img.fullHeight);
    } else {
      return Win.width < img.fullWidth && Win.fullHeight < Math.floor(img.fullHeight * Win.width / img.fullWidth);
    }
  }

  static fit() {
    switch (this.fitType) {
      case 0:
        this.fitFit();

        break;

      case 1:
        this.fitFill();

        break;

      case 2:
        this.fitNatural();

        break;
    }
  }

  static scroll() {
    switch (this.fitType) {
      case 1:
        scrollTo(Pixels.toNumber((img.width - Win.fullWidth) / 2), Pixels.toNumber((img.height - Win.fullHeight) / 2));

        break;

      case 2:
        scrollTo(Pixels.toNumber((img.fullWidth - Win.width) / 2), Pixels.toNumber((img.fullHeight - Win.height) / 2));

        break;
    }
  }
}

// Rotate
class Rotate {
  static rotateCW() {
    img.orientation = (img.orientation + 1) % 4;

    this.rotate();
  }

  static rotateCCW() {
    img.orientation = (img.orientation + 3) % 4;

    this.rotate();
  }

  static rotate() {
    img.node.className = `orientation-${img.orientation}`;

    img.horizontal = !img.horizontal; // img.orientation % 2

    Fit.fitUpdate();
  }
}

// Move
class Move {
  static moveOffsetX;
  static moveOffsetY;

  static imgMovable(state) {
    if (state) {
      window.addEventListener('mousedown', this.onMouseDown);
    } else {
      window.removeEventListener('mousedown', this.onMouseDown);
    }
  }

  static onMouseDown = (e) => {
    this.moveOffsetX = scrollX + e.clientX;
    this.moveOffsetY = scrollY + e.clientY;

    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
  };

  static onMouseUp = () => {
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
  };

  static onMouseMove = (e) => {
    scrollTo(this.moveOffsetX - e.clientX, this.moveOffsetY - e.clientY);

    e.preventDefault();
  };
}

// Init
let img;

function undoDefault() {
  img.node.style.margin = '';
  img.node.style.cursor = '';
  img.node.width = img.node.naturalWidth;
  img.node.height = img.node.naturalHeight;

  Fit.fitUpdate();
}

{
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
      img = new Img(document.body.firstChild);

      undoDefault();
      Fit.applyFit(Fit.fitFitAvailable() ? 0 : 2);

      observer.disconnect();
    }
  });
  observer.observe(document.documentElement, {childList: true});
}

// Events
window.addEventListener('DOMContentLoaded', undoDefault);
window.addEventListener('resize', (e) => {
  Fit.fitUpdate();

  e.stopImmediatePropagation();
});

window.addEventListener('keydown', (e) => {
  // https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/resources/pdf/pdf_viewer.ts;l=325;drc=30dc92ddfcd163862acd0d1b8f0ababae3d1e2f8
  if (e.altKey || e.ctrlKey || e.metaKey) {
    return;
  }

  if (e.shiftKey) {
    if (e.code === 'KeyR') {
      Rotate.rotateCCW();
    }
  } else {
    switch (e.code) {
      case 'Digit1':
        Fit.applyFit(2);
        break;
      case 'Digit2':
        Fit.applyFit(1);
        break;
      case 'Digit3':
        Fit.applyFit(0);
        break;
      case 'KeyR':
        Rotate.rotateCW();
        break;
    }
  }
});
