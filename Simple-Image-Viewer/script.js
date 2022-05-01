'use strict';

// Units
class Pixels {
  static parse(/** @type {number} */ value) {
    return Math.round(value * window.devicePixelRatio);
  }
  static toNumber(/** @type {number} */ value) {
    return value / window.devicePixelRatio;
  }
  static toString(/** @type {number} */ value) {
    return `${value / window.devicePixelRatio}px`;
  }
}

// Window
class Win {
  /** @type {number} */
  static scrollbarWidth;
  /** @type {number} */
  static scrollbarHeight;
  /** @private @type {number} */
  static fullWidth_;
  /** @private @type {number} */
  static fullHeight_;

  static get fullWidth() {
    return this.fullWidth_;
  }
  static get fullHeight() {
    return this.fullHeight_;
  }
  static get width() {
    return this.isVerticalScrollbarVisible() ? this.fullWidth_ - this.scrollbarWidth : this.fullWidth_;
  }
  static get height() {
    return this.isHorizontalScrollbarVisible() ? this.fullHeight_ - this.scrollbarHeight : this.fullHeight_;
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
    document.documentElement.style.overflow = 'hidden';
    this.fullWidth_ = Pixels.parse(visualViewport.width);
    this.fullHeight_ = Pixels.parse(visualViewport.height);
    document.documentElement.style.overflow = '';
  }
  static calcScrollbarSize() {
    document.documentElement.style.overflow = 'scroll';
    this.scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    this.scrollbarHeight = window.innerHeight - document.documentElement.clientHeight;
    document.documentElement.style.overflow = '';
  }
}

// Image
class Img {
  /**
   * image_element_
   * @type {HTMLImageElement}
   */
  element;
  /** @private @type {number} */
  width_;
  /** @private @type {number} */
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

  constructor(/** @type {HTMLImageElement} */ element) {
    if (element instanceof HTMLImageElement === false) {
      throw new TypeError('Failed to construct \'Img\': parameter 1 is not of type \'HTMLImageElement\'.');
    }
    this.element = element;
    this.orientation = 0;
    this.element.addEventListener('click', (e) => e.stopPropagation(), true);
  }

  set x(/** @type {number} */ value) {
    this.element.style.left = Pixels.toString(Math.max(value, 0));
  }
  set y(/** @type {number} */ value) {
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
    Win.calcScrollbarSize();

    if (this.fittingType_ == FittingType.FIT && this.isFitAvailable() || this.fittingType_ == FittingType.FILL && this.isFillAvailable_() || (this.fittingType_ = FittingType.NONE)) {
      this.fit_();
    }
  }

  static applyFit(/** @type {symbol} */ fittingType) {
    if (this.fittingType_ != fittingType && (fittingType == FittingType.FIT && this.isFitAvailable() || fittingType == FittingType.FILL && this.isFillAvailable_() || fittingType == FittingType.NONE)) {
      this.fittingType_ = fittingType;

      this.fit_();
      this.scroll_();
    }
  }

  /** @private */
  static ratioCompare_() {
    return Win.ratio < img.ratio;
  }

  /** @private */
  static isFitHeightAvailable_() {
    return Win.fullWidth > Math.round(Win.fullHeight * img.fullWidth / img.fullHeight);

    // height = winHeight
    // width = winHeight * imgWidth / imgHeight
    // winWidth > width

    // winWidth / winHeight > imgWidth / imgHeight
  }

  static isFitAvailable() {
    return Win.fullWidth < img.fullWidth || Win.fullHeight < img.fullHeight;
  }

  /** @private */
  static isFillWidthAvailable_() {
    return Win.fullWidth - Win.scrollbarWidth < img.fullWidth &&
      Win.fullHeight < Math.round((Win.fullWidth - Win.scrollbarWidth) * img.fullHeight / img.fullWidth);
  }

  /** @private */
  static isFillHeightAvailable_() {
    return Win.fullHeight - Win.scrollbarHeight < img.fullHeight &&
      Win.fullWidth < Math.round((Win.fullHeight - Win.scrollbarHeight) * img.fullWidth / img.fullHeight);

    // height = winHeight - 17
    // width = (winHeight - 17) * imgWidth / imgHeight
    // winWidth < width

    // winWidth / (winHeight - 17) < imgWidth / imgHeight
  }

  /** @private */
  static isFillAvailable_() {
    return this.isFillWidthAvailable_() || this.isFillHeightAvailable_();
  }

  /** @private */
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

  /** @private */
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
  /** @private */
  static do_(/** @type {number} */ orientation) {
    img.orientation = orientation % 4;
    Fit.update();
  }
}

// Move
class ViewportScroller {
  /** @private @type {number} */
  static offsetX_;
  /** @private @type {number} */
  static offsetY_;

  static setScrollable(/** @type {boolean} */ value) {
    if (value) {
      window.addEventListener('mousedown', this.onMousedown_);
    } else {
      window.removeEventListener('mousedown', this.onMousedown_);
    }
  }

  /** @private */
  static onMousedown_ = (/** @type {MouseEvent} */ e) => {
    // respect active custom scrollbars
    if (e.defaultPrevented) {
      return;
    }

    this.offsetX_ = window.scrollX + e.clientX;
    this.offsetY_ = window.scrollY + e.clientY;

    window.addEventListener('mouseup', this.onMouseup_);
    window.addEventListener('mousemove', this.onMousemove_);
  };

  /** @private */
  static onMouseup_ = () => {
    window.removeEventListener('mouseup', this.onMouseup_);
    window.removeEventListener('mousemove', this.onMousemove_);
  };

  /** @private */
  static onMousemove_ = (/** @type {MouseEvent} */ e) => {
    window.scrollTo(this.offsetX_ - e.clientX, this.offsetY_ - e.clientY);

    e.preventDefault();
  };
}

// Init
/** @type {Img} */
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
      img = new Img(/** @type {HTMLImageElement} */ (document.body.firstElementChild));

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
