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
    return this.fullWidth_ < Math.round(img.width);
  }
  static isVerticalScrollbarVisible() {
    return this.fullHeight_ < Math.round(img.height);
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

  static update() {
    let fittingType = this.fittingType_;
    if (fittingType === FittingType.FIT && !this.isFitAvailable() || fittingType === FittingType.FILL && !this.isFillAvailable_()) {
      fittingType = FittingType.NONE;
    }
    this.fit_(fittingType);
  }

  static applyFit(/** @type {symbol} */ fittingType) {
    if (this.fittingType_ != fittingType) {
      this.fittingType_ = fittingType;

      this.update();
      this.scroll_();
    }
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
  static fit_(/** @type {Symbol} */ fittingType) {
    let zoomFactor;
    switch (fittingType) {
      case FittingType.FIT:
        zoomFactor = this.isFitHeightAvailable_() ?
          Win.fullHeight / img.fullHeight :
          Win.fullWidth / img.fullWidth;

        break;

      case FittingType.FILL:
        zoomFactor = this.isFillHeightAvailable_() ?
          (Win.fullHeight - Win.scrollbarHeight) / img.fullHeight :
          (Win.fullWidth - Win.scrollbarWidth) / img.fullWidth;

        break;

      case FittingType.NONE:
        zoomFactor = 1;

        break;
    }

    img.width = img.fullWidth * zoomFactor;
    img.height = img.fullHeight * zoomFactor;
    img.x = (Win.width - img.width) / 2;
    img.y = (Win.height - img.height) / 2;

    ViewportScroller.setScrollable(Win.isHorizontalScrollbarVisible() || Win.isVerticalScrollbarVisible());
  }

  /** @private */
  static scroll_() {
    window.scrollTo(Pixels.toNumber((img.width - Win.width) / 2), Pixels.toNumber((img.height - Win.height) / 2));
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
      Win.calcSize();
      Win.calcScrollbarSize();
      Fit.applyFit(FittingType.FIT);

      observer.disconnect();
    }
  });
  observer.observe(document.documentElement, {childList: true});
}

// Events
window.addEventListener('DOMContentLoaded', () => {
  undoDefault();
  Fit.update();
});
window.addEventListener('resize', (e) => {
  Win.calcSize();
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
