'use strict';

// Units
class Pixels {
  static parse(value) {
    return Math.round(value * window.devicePixelRatio);
  }
  static toNumber(value) {
    return value / window.devicePixelRatio;
  }
  static toString(value) {
    return `${value / window.devicePixelRatio}px`;
  }
}

// Window
class Win {
  static SCROLLBAR_THICKNESS = 17;
  static fullWidth_;
  static fullHeight_;

  static get fullWidth() {
    return this.fullWidth_;
  }
  static get fullHeight() {
    return this.fullHeight_;
  }
  static get width() {
    return this.isVerticalScrollbarVisible() ? this.fullWidth_ - this.SCROLLBAR_THICKNESS : this.fullWidth_;
  }
  static get height() {
    return this.isHorizontalScrollbarVisible() ? this.fullHeight_ - this.SCROLLBAR_THICKNESS : this.fullHeight_;
  }
  static get ratio() {
    return this.fullWidth_ / this.fullHeight_;
  }
  static isHorizontalScrollbarVisible() {
    return this.fullWidth_ < img.fullWidth;
  }
  static isVerticalScrollbarVisible() {
    return this.fullHeight_ < img.fullHeight;
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
  element; // image_element_
  width_;
  height_;
  /**
   * angle / 90 (0 = 0, 1 = 90, 2 = 180, 3 = 270)
   * @private @type {number}
   */
  orientation_;
  /**
   * is angle 0 or 180 degrees
   * @private @type {boolean}
   */
  horizontal_;

  constructor(element) {
    if (element instanceof HTMLImageElement === false) {
      throw new TypeError('Failed to construct \'Img\': parameter 1 is not of type \'HTMLImageElement\'.');
    }
    this.element = element;
    this.orientation = 0;
    this.element.addEventListener('click', (e) => e.stopPropagation(), true);
  }

  set x(value) {
    this.element.style.left = Pixels.toString(Math.max(value, 0));
  }
  set y(value) {
    this.element.style.top = Pixels.toString(Math.max(value, 0));
  }

  get fullWidth() {
    return this.horizontal_ ? this.element.naturalWidth : this.element.naturalHeight;
  }
  get fullHeight() {
    return this.horizontal_ ? this.element.naturalHeight : this.element.naturalWidth;
  }

  get width() {
    return this.horizontal_ ? this.width_ : this.height_;
  }
  set width(value) {
    if (this.horizontal_) {
      this.width_ = value;
      this.element.style.width = Pixels.toString(value);
    } else {
      this.height_ = value;
      this.element.style.height = Pixels.toString(value);
    }
  }
  get height() {
    return this.horizontal_ ? this.height_ : this.width_;
  }
  set height(value) {
    if (this.horizontal_) {
      this.height_ = value;
      this.element.style.height = Pixels.toString(value);
    } else {
      this.width_ = value;
      this.element.style.width = Pixels.toString(value);
    }
  }
  get ratio() {
    return this.fullWidth / this.fullHeight;
  }

  get orientation() {
    return this.orientation_;
  }
  set orientation(value) {
    this.orientation_ = value;
    this.horizontal_ = value % 2 === 0;
    this.element.className = `orientation-${value}`;
  }
}

// Fit
/** @enum {symbol} */
const FittingType = {
  FIT: Symbol('fit'),
  /** Cover */
  FILL: Symbol('fill'),
  /** Actual size */
  NONE: Symbol('none'),
};

class Fit {
  /** @private @type {symbol} */
  static fittingType_;

  static fitFit() {
    if (this.ratioCompare_()) {
      img.width = Win.fullWidth;
      img.height = img.width / img.ratio;
    } else {
      img.height = Win.fullHeight;
      img.width = img.height * img.ratio;
    }
    img.x = (Win.fullWidth - img.width) / 2;
    img.y = (Win.fullHeight - img.height) / 2;

    ViewportScroller.setScrollable(false);
  }

  static fitFill() {
    if (this.ratioCompare_()) {
      img.height = Win.height;
      img.width = img.height * img.ratio;
    } else {
      img.width = Win.width;
      img.height = img.width / img.ratio;
    }
    img.x = 0;
    img.y = 0;

    ViewportScroller.setScrollable(true);
  }

  static fitNatural() {
    img.width = img.fullWidth * window.devicePixelRatio;
    img.height = img.fullHeight * window.devicePixelRatio;
    img.x = (Win.width - img.width) / 2;
    img.y = (Win.height - img.height) / 2;

    if (this.isFitAvailable()) {
      ViewportScroller.setScrollable(true);
    }
  }

  static update() {
    Win.calcSize();

    if (this.fittingType_ == FittingType.FIT && this.isFitAvailable() || this.fittingType_ == FittingType.FILL && this.isFillAvailable_() || (this.fittingType_ = FittingType.NONE)) {
      this.fit_();
    }
  }

  /**
   * @param {symbol} fittingType
   */
  static applyFit(fittingType) {
    if (this.fittingType_ != fittingType && (fittingType == FittingType.FIT && this.isFitAvailable() || fittingType == FittingType.FILL && this.isFillAvailable_() || fittingType == FittingType.NONE)) {
      this.fittingType_ = fittingType;

      this.fit_();
      this.scroll_();
    }
  }

  static ratioCompare_() {
    return Win.ratio < img.ratio;
  }

  static isFitAvailable() {
    return Win.isHorizontalScrollbarVisible() || Win.isVerticalScrollbarVisible();
  }

  static isFillAvailable_() {
    if (this.ratioCompare_()) {
      return Win.height < img.fullHeight && Win.fullWidth < Math.floor(img.fullWidth * Win.height / img.fullHeight);
    } else {
      return Win.width < img.fullWidth && Win.fullHeight < Math.floor(img.fullHeight * Win.width / img.fullWidth);
    }
  }

  static fit_() {
    switch (this.fittingType_) {
      case FittingType.FIT:
        this.fitFit();

        break;

      case FittingType.FILL:
        this.fitFill();

        break;

      case FittingType.NONE:
        this.fitNatural();

        break;
    }
  }

  static scroll_() {
    switch (this.fittingType_) {
      case FittingType.FILL:
        window.scrollTo(Pixels.toNumber((img.width - Win.fullWidth) / 2), Pixels.toNumber((img.height - Win.fullHeight) / 2));

        break;

      case FittingType.NONE:
        window.scrollTo(Pixels.toNumber((img.fullWidth - Win.width) / 2), Pixels.toNumber((img.fullHeight - Win.height) / 2));

        break;
    }
  }
}

// Rotate
class Rotate {
  static cw() {
    this.do_(img.orientation + 1);
  }
  static ccw() {
    this.do_(img.orientation + 3);
  }
  static do_(orientation) {
    img.orientation = orientation % 4;
    Fit.update();
  }
}

// Move
class ViewportScroller {
  static offsetX_;
  static offsetY_;

  static setScrollable(value) {
    if (value) {
      window.addEventListener('mousedown', this.onMousedown_);
    } else {
      window.removeEventListener('mousedown', this.onMousedown_);
    }
  }

  static onMousedown_ = (e) => {
    this.offsetX_ = window.scrollX + e.clientX;
    this.offsetY_ = window.scrollY + e.clientY;

    window.addEventListener('mouseup', this.onMouseup_);
    window.addEventListener('mousemove', this.onMousemove_);
  };

  static onMouseup_ = () => {
    window.removeEventListener('mouseup', this.onMouseup_);
    window.removeEventListener('mousemove', this.onMousemove_);
  };

  static onMousemove_ = (e) => {
    window.scrollTo(this.offsetX_ - e.clientX, this.offsetY_ - e.clientY);

    e.preventDefault();
  };
}

// Init
let img;

function undoDefault() {
  img.element.style.margin = '';
  img.element.style.cursor = '';
  img.element.width = img.element.naturalWidth;
  img.element.height = img.element.naturalHeight;

  Fit.update();
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
      Fit.applyFit(Fit.isFitAvailable() ? FittingType.FIT : FittingType.NONE);

      observer.disconnect();
    }
  });
  observer.observe(document.documentElement, {childList: true});
}

// Events
window.addEventListener('DOMContentLoaded', undoDefault);
window.addEventListener('resize', (e) => {
  Fit.update();

  e.stopImmediatePropagation();
});

window.addEventListener('keydown', (e) => {
  // https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/resources/pdf/pdf_viewer.ts;l=325;drc=30dc92ddfcd163862acd0d1b8f0ababae3d1e2f8
  if (e.altKey || e.ctrlKey || e.metaKey) {
    return;
  }

  if (e.shiftKey) {
    if (e.code === 'KeyR') {
      Rotate.ccw();
    }
  } else {
    switch (e.code) {
      case 'Digit1':
        Fit.applyFit(FittingType.NONE);
        break;
      case 'Digit2':
        Fit.applyFit(FittingType.FILL);
        break;
      case 'Digit3':
        Fit.applyFit(FittingType.FIT);
        break;
      case 'KeyR':
        Rotate.cw();
        break;
    }
  }
});
