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

  static get scrollX() {
    return img.x;
  }
  static get scrollY() {
    return img.y;
  }

  static isHorizontalScrollbarVisible() {
    return this.fullWidth_ < Math.round(img.width);
  }
  static isVerticalScrollbarVisible() {
    return this.fullHeight_ < Math.round(img.height);
  }

  static scrollTo(/** @type {number} */ x, /** @type {number} */ y) {
    window.scrollTo(Pixels.toNumber(x), Pixels.toNumber(y));
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

  get x() {
    return -this.element.x;
  }
  set x(value) {
    this.element.style.left = Pixels.toString(Math.max(value, 0));
  }
  get y() {
    return -this.element.y;
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
  /** Fit up to 100% */
  INITIAL: Symbol('initial'),
};

class Fit {
  /** @private @type {symbol} */
  static fittingType_;
  /** @private @type {number} */
  static zoomFactor_;

  static set fittingType(/** @type {FittingType} */ value) {
    this.fittingType_ = value;
    this.update();
  }

  static applyZoomFactor() {
    img.width = img.fullWidth * this.zoomFactor_;
    img.height = img.fullHeight * this.zoomFactor_;
    img.x = (Win.width - img.width) / 2;
    img.y = (Win.height - img.height) / 2;

    ViewportScroller.setScrollable(Win.isHorizontalScrollbarVisible() || Win.isVerticalScrollbarVisible());
  }

  static update() {
    let fittingType = this.fittingType_;
    if (fittingType === FittingType.INITIAL && this.isFitAvailable() || fittingType === FittingType.FILL && !this.isFillAvailable_()) {
      fittingType = FittingType.FIT;
    }
    this.calcZoomFactor_(fittingType);
    this.applyZoomFactor();
  }

  static applyFit(/** @type {symbol} */ fittingType) {
    if (this.fittingType_ === fittingType) {
      return;
    }

    this.transformToCenter(() => {
      this.fittingType = fittingType;
    });
  }

  static transformToCenter(/** @type {() => void} */ f) {
    this.transformTo_(f, () => [Win.width / 2, Win.height / 2]);
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
    return Win.fullHeight < Math.round((Win.fullWidth - Win.scrollbarWidth) * img.fullHeight / img.fullWidth);
  }

  /** @private */
  static isFillHeightAvailable_() {
    return Win.fullWidth < Math.round((Win.fullHeight - Win.scrollbarHeight) * img.fullWidth / img.fullHeight);

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
  static calcZoomFactor_(/** @type {symbol} */ fittingType) {
    switch (fittingType) {
      case FittingType.FIT:
        this.zoomFactor_ = this.isFitHeightAvailable_() ?
          Win.fullHeight / img.fullHeight :
          Win.fullWidth / img.fullWidth;
        break;
      case FittingType.FILL:
        this.zoomFactor_ = this.isFillHeightAvailable_() ?
          (Win.fullHeight - Win.scrollbarHeight) / img.fullHeight :
          (Win.fullWidth - Win.scrollbarWidth) / img.fullWidth;
        break;
      case FittingType.INITIAL:
      case FittingType.NONE:
        this.zoomFactor_ = 1;
        break;
    }
  }

  /**
   * Keep window point during transformation
   * @private
   */
  static transformTo_(/** @type {() => void} */ f, /** @type {() => [number, number]} */ getInner) {
    // scrollX + innerX = x (point on image)

    let inner = getInner();
    let scrollX = Win.scrollX;
    let scrollY = Win.scrollY;
    let x = (scrollX + inner[0]) / this.zoomFactor_;
    let y = (scrollY + inner[1]) / this.zoomFactor_;

    const x0 = x - img.fullWidth / 2;
    const y0 = y - img.fullHeight / 2;
    const orientation = (4 - img.orientation) % 4; // -a

    f();

    const ang = (img.orientation + orientation) * Math.PI / 2; // (b + (-a)) % 4
    const sin = Math.sin(ang);
    const cos = Math.cos(ang);
    x = x0 * cos - y0 * sin + img.fullWidth / 2;
    y = x0 * sin + y0 * cos + img.fullHeight / 2;

    inner = getInner();
    scrollX = x * this.zoomFactor_ - inner[0];
    scrollY = y * this.zoomFactor_ - inner[1];

    Win.scrollTo(scrollX, scrollY);
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
    Fit.transformToCenter(() => {
      img.orientation = orientation % 4;
      Fit.update();
    });
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
      Fit.fittingType = FittingType.INITIAL;

      observer.disconnect();
    }
  });
  observer.observe(document.documentElement, {childList: true});
}

// Events
window.addEventListener('DOMContentLoaded', () => {
  undoDefault();
  Fit.applyZoomFactor();
});
window.addEventListener('resize', (e) => {
  Fit.transformToCenter(() => {
    Win.calcSize();
    Fit.update();
  });

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
