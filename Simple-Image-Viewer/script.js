let docRatio;

let imgRatio;
let imgOriginal = true; // is angle 0 or 180 degrees
let imgOrientation = 0; // angle / 90 (0 = 0, 1 = 90, 2 = 180, 3 = 270)

let fitType; // 0 = fit, 1 = fill, 2 = natural

let moveOffsetX;
let moveOffsetY;

// Compare
function isWider() {
  return docWidthFull() < imgWidthFull();
}

function isHigher() {
  return docHeightFull() < imgHeightFull();
}

function ratioCompare() {
  return docRatio < imgRatio;
}

// Document
function docWidthFull() {
  return window.innerWidth;
}

function docHeightFull() {
  return window.innerHeight;
}

function docWidth() {
  return isHigher() ? docWidthFull() - 17 / window.devicePixelRatio : docWidthFull();
}

function docHeight() {
  return isWider() ? docHeightFull() - 17 / window.devicePixelRatio : docHeightFull();
}

function calcDocRatio() {
  docRatio = docWidthFull() / docHeightFull();
}

// Image
function imgWidthFull() {
  return imgOriginal ? imgNaturalWidth : imgNaturalHeight;
}

function imgHeightFull() {
  return imgOriginal ? imgNaturalHeight : imgNaturalWidth;
}

function imgWidth() {
  return imgOriginal ? img.scrollWidth : img.scrollHeight;
}

function imgHeight() {
  return imgOriginal ? img.scrollHeight : img.scrollWidth;
}

function calcImgRatio() {
  imgRatio = imgWidthFull() / imgHeightFull();
}

function imgSize(w, h) {
  if (imgOriginal) {
    img.style.width = w;
    img.style.height = h;
  } else {
    img.style.width = h;
    img.style.height = w;
  }
}

function imgPos(x, y) {
  img.style.left = Math.max(x, 0) + 'px';
  img.style.top = Math.max(y, 0) + 'px';
}

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
    return docHeight() < imgHeightFull() && docWidthFull() < Math.floor(imgWidthFull() * docHeight() / imgHeightFull());
  } else {
    return docWidth() < imgWidthFull() && docHeightFull() < Math.floor(imgHeightFull() * docWidth() / imgWidthFull());
  }
}

function fitFit() {
  if (ratioCompare()) {
    imgSize(docWidthFull() + 'px', 'auto');
  } else {
    imgSize('auto', docHeightFull() + 'px');
  }

  imgPos((docWidthFull() - imgWidth()) / 2, (docHeightFull() - imgHeight()) / 2);

  imgMovable(false);
}

function fitFill() {
  if (ratioCompare()) {
    imgSize('auto', docHeight() + 'px');
  } else {
    imgSize(docWidth() + 'px', 'auto');
  }

  imgPos(0, 0);

  imgMovable(true);
}

function fitNatural() {
  imgSize('auto', 'auto');
  imgPos((docWidth() - imgWidthFull()) / 2, (docHeight() - imgHeightFull()) / 2);

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
      scrollTo((imgWidth() - docWidthFull()) / 2, (imgHeight() - docHeightFull()) / 2);

      break;

    case 2:
      scrollTo((imgWidthFull() - docWidth()) / 2, (imgHeightFull() - docHeight()) / 2);

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
  img.className = 'orientation-' + imgOrientation;

  imgOriginal = !imgOriginal; // img_orientation % 2

  calcImgRatio();

  fitUpdate();
}

function rotateCW() {
  imgOrientation = (imgOrientation + 1) % 4;

  rotate();
}

function rotateCCW() {
  imgOrientation = (imgOrientation + 3) % 4;

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
const imgNative = document.body.firstChild;
const imgNaturalWidth = imgNative.naturalWidth;
const imgNaturalHeight = imgNative.naturalHeight;
const img = new Image(imgNaturalWidth, imgNaturalHeight);
img.src = imgNative.src;
document.body.replaceChild(img, imgNative);

calcDocRatio();
calcImgRatio();

img.className = 'orientation-0';

applyFit(fitFitAvailable() ? 0 : 2);

// Events
window.addEventListener('resize', (e) => {
  calcDocRatio();

  fitUpdate();
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
