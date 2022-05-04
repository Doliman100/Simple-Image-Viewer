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
  /**
   * fractional part
   * @private @type {number}
   */
  static scrollXF_ = 0;
  /**
   * fractional part
   * @private @type {number}
   */
  static scrollYF_ = 0;

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

  static get scrollX() {
    return img.x + this.scrollXF_;
  }
  static get scrollY() {
    return img.y + this.scrollYF_;
  }

  static isHorizontalScrollbarVisible() {
    return this.fullWidth_ < Math.round(img.width);
  }
  static isVerticalScrollbarVisible() {
    return this.fullHeight_ < Math.round(img.height);
  }

  static scrollTo(/** @type {number} */ x, /** @type {number} */ y) {
    // window.scrollTo internally uses fp32
    // window.scrollX/Y returns an integer multiplied by dpi

    const scrollX = Pixels.toNumber(x);
    const scrollY = Pixels.toNumber(y);

    const internalScrollX = Math.trunc(Math.fround(scrollX));
    const internalScrollY = Math.trunc(Math.fround(scrollY));

    window.scrollTo(internalScrollX, internalScrollY);

    this.scrollXF_ = scrollX - internalScrollX;
    this.scrollYF_ = scrollY - internalScrollY;
  }

  static calcFullSize() {
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

  get orientation() {
    return this.orientation_;
  }
  set orientation(value) {
    this.orientation_ = value;
    this.horizontal_ = value % 2 === 0;
    this.element.className = `orientation-${value}`;
  }
}

// Viewport
// https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/resources/pdf/viewport.ts
/** @enum {symbol} */
const FittingType = {
  FIT: Symbol('fit'),
  /** Cover */
  FILL: Symbol('fill'),
  /** Custom zoom factor */
  NONE: Symbol('none'),
  /** Fit up to 100% */
  INITIAL: Symbol('initial'),
};

class Viewport {
  /** @private @type {FittingType} */
  static fittingType_;

  static set fittingType(/** @type {FittingType} */ value) {
    this.fittingType_ = value;
    this.update();
  }

  static applyZoomFactor() {
    img.width = img.fullWidth * Zoom.factor;
    img.height = img.fullHeight * Zoom.factor;
    img.x = (Win.width - img.width) / 2;
    img.y = (Win.height - img.height) / 2;

    ViewportScroller.setScrollable(Win.isHorizontalScrollbarVisible() || Win.isVerticalScrollbarVisible());
  }

  static update() {
    this.calcZoomFactor_();
    this.applyZoomFactor();
  }

  static offerFittingType(/** @type {FittingType} */ fittingType) {
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
  static transformToCursor(/** @type {() => void} */ f, /** @type {MouseEvent} */ e) {
    this.transformTo_(f, () => [e.clientX, e.clientY]);
  }

  static zoomToCenter(/** @type {number} */ factor) {
    this.transformToCenter(() => this.zoomTo_(factor));
  }
  static zoomToCursor(/** @type {number} */ factor, /** @type {MouseEvent} */ e) {
    this.transformToCursor(() => this.zoomTo_(factor), e);
  }

  /** @private */
  static isFitHeightAvailable_() {
    return Win.fullWidth > Math.round(Win.fullHeight * img.fullWidth / img.fullHeight);

    // height = winHeight
    // width = winHeight * imgWidth / imgHeight
    // winWidth > width

    // winWidth / winHeight > imgWidth / imgHeight
  }

  /** @private */
  static isFitAvailable_() {
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
  static calcZoomFactor_() {
    let fittingType = this.fittingType_;
    if (Zoom.changingBrowserZoomMode) {
      fittingType = FittingType.INITIAL;
    }
    if (fittingType === FittingType.INITIAL && this.isFitAvailable_() || fittingType === FittingType.FILL && !this.isFillAvailable_()) {
      fittingType = FittingType.FIT;
    }

    switch (fittingType) {
      case FittingType.FIT:
        Zoom.factor = this.isFitHeightAvailable_() ?
          Win.fullHeight / img.fullHeight :
          Win.fullWidth / img.fullWidth;
        break;
      case FittingType.FILL:
        Zoom.factor = this.isFillHeightAvailable_() ?
          (Win.fullHeight - Win.scrollbarHeight) / img.fullHeight :
          (Win.fullWidth - Win.scrollbarWidth) / img.fullWidth;
        break;
      case FittingType.INITIAL:
        Zoom.factor = 1;
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
    let x = (scrollX + inner[0]) / Zoom.factor;
    let y = (scrollY + inner[1]) / Zoom.factor;

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
    scrollX = x * Zoom.factor - inner[0];
    scrollY = y * Zoom.factor - inner[1];

    Win.scrollTo(scrollX, scrollY);
  }

  /** @private */
  static zoomTo_(/** @type {number} */ factor) {
    Zoom.factor = factor;
    this.fittingType = FittingType.NONE;
  }
}

// Zoom
class Zoom {
  /** @type {boolean} */
  static changingBrowserZoomMode = false;
  /** @type {boolean} */
  static changingBrowserZoom = false;
  /** @type {number} */
  static min;
  /** @type {number} */
  static max;
  /**
   * https://source.chromium.org/chromium/chromium/src/+/main:components/zoom/page_zoom_constants.cc
   * @private @const @type {number[]}
   */
  static PRESET_ZOOM_FACTORS = [0.25, 1 / 3, 0.5, 2 / 3, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];
  /** @private @type {number} */
  static factor_;
  // /** @private @type {number} */
  // static timer_;
  // /** @private @type {HTMLSpanElement} */
  // static overlay_;

  static {
    this.min = this.PRESET_ZOOM_FACTORS[0];
    this.max = this.PRESET_ZOOM_FACTORS.at(-1);

    this.changingBrowserZoomMode = true;
    chrome.runtime.sendMessage('', () => {
      this.changingBrowserZoomMode = false;
      Win.calcScrollbarSize();
      Viewport.update();
    });

    // this.overlay_ = document.createElement('span');
    // this.overlay_.style.display = 'none';
    // this.overlay_.classList.add('overlay');
  }

  static get factor() {
    return this.factor_;
  }
  static set factor(value) {
    this.factor_ = value;
    // this.show_();

    if (this.changingBrowserZoomMode || this.changingBrowserZoom) {
      return;
    }

    this.changingBrowserZoom = true;
    // console.log('changing browser zoom', value);
    chrome.runtime.sendMessage(value, () => {
      this.changingBrowserZoom = false;
      // console.log('browser zoom changed', value);
    });
  }

  static init() {
    // document.body.append(this.overlay_);
  }

  // /** https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/common/page/page_zoom.cc;l=32;drc=938b37a6d2886bf8335fc7db792f1eb46c65b2ae */
  // static equals(a, b) {
  //   return Math.abs(a - b) <= 0.001;
  // }

  /** https://source.chromium.org/chromium/chromium/src/+/main:components/zoom/page_zoom.cc;l=109;drc=451126413f90723c23b397b866f8d6cac8ae30fe */
  static next() {
    return this.PRESET_ZOOM_FACTORS.find((value) => value > this.factor_);
  }
  static prev() {
    // @ts-ignore https://tc39.es/proposal-array-find-from-last/#sec-array.prototype.findlast
    return this.PRESET_ZOOM_FACTORS.findLast((value) => value < this.factor_);
  }

  // static show_() {
  //   this.overlay_.textContent = `${(this.factor_ * 100).toFixed(0)}%`;
  //   this.overlay_.style.display = '';

  //   clearTimeout(this.timer_);
  //   this.timer_ = setTimeout(() => {
  //     this.overlay_.style.display = 'none';
  //   }, 1000);
  // }
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
    Viewport.transformToCenter(() => {
      img.orientation = orientation % 4;
      Viewport.update();
    });
  }
}

// ViewportScroller
// https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/resources/pdf/viewport_scroller.ts
/** Scrolls the page in response to mouse drag. */
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
      observer.disconnect();

      img = new Img(/** @type {HTMLImageElement} */ (document.body.firstElementChild));
      undoDefault();
      Win.calcFullSize();
      Zoom.init();
      Viewport.fittingType = FittingType.INITIAL;
    }
  });
  observer.observe(document.documentElement, {childList: true});
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!Zoom.changingBrowserZoom && !Zoom.changingBrowserZoomMode) {
    Viewport.zoomToCenter(message);
  }
  sendResponse();
});

// Events
window.addEventListener('DOMContentLoaded', () => {
  undoDefault();
  Viewport.applyZoomFactor();
});
window.addEventListener('resize', (e) => {
  Viewport.transformToCenter(() => {
    Win.calcFullSize();
    Viewport.update();
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
        Viewport.zoomToCenter(1);
        break;
      case 'Digit2':
        Viewport.offerFittingType(FittingType.FILL);
        break;
      case 'Digit3':
        Viewport.offerFittingType(FittingType.FIT);
        break;
      case 'KeyR':
        Rotate.cw();
        break;
    }
  }
});
window.addEventListener('wheel', (e) => {
  // https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/resources/pdf/gesture_detector.ts;l=139;drc=20a35c13bf7784939b81d9e8561eade9b557ccc1
  if (!e.ctrlKey) {
    return;
  }

  if (e.deltaY > 0) {
    if (Zoom.factor > Zoom.min) {
      Viewport.zoomToCursor(Zoom.prev(), e);
    }
    e.preventDefault();
  } else if (e.deltaY < 0) {
    if (Zoom.factor < Zoom.max) {
      Viewport.zoomToCursor(Zoom.next(), e);
    }
    e.preventDefault();
  }
}, {passive: false});
