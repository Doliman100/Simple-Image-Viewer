let doc_ratio;

let img;
let img_ratio;
let img_original = true; // is angle 0 or 180 degrees
let img_orientation = 0; // angle / 90 (0 = 0, 1 = 90, 2 = 180, 3 = 270)

let fit_type; // 0 = fit, 1 = fill, 2 = natural

let move_offset_x;
let move_offset_y;

// Compare
function isWider()
{
	return docWidthFull() < imgWidthFull();
}

function isHigher()
{
	return docHeightFull() < imgHeightFull();
}

function ratioCompare()
{
	return doc_ratio < img_ratio;
}

// Document
function docWidthFull()
{
	return window.innerWidth;
}

function docHeightFull()
{
	return window.innerHeight;
}

function docWidth()
{
	return isHigher() ? docWidthFull() - 17 : docWidthFull();
}

function docHeight()
{
	return isWider() ? docHeightFull() - 17 : docHeightFull();
}

function docRatio()
{
	doc_ratio = docWidthFull() / docHeightFull();
}

// Image
function imgWidthFull()
{
	return img_original ? img.naturalWidth : img.naturalHeight;
}

function imgHeightFull()
{
	return img_original ? img.naturalHeight : img.naturalWidth;
}

function imgWidth()
{
	return img_original ? img.scrollWidth : img.scrollHeight;
}

function imgHeight()
{
	return img_original ? img.scrollHeight : img.scrollWidth;
}

function imgRatio()
{
	img_ratio = imgWidthFull() / imgHeightFull();
}

function imgSize(w, h)
{
	if (img_original)
	{
		img.style.width = w;
		img.style.height = h;
	}
	else
	{
		img.style.width = h;
		img.style.height = w;
	}
}

function imgPos(x, y)
{
	img.style.left = Math.max(x, 0) + "px";
	img.style.top = Math.max(y, 0) + "px";
}

function imgDraggable(state)
{
	if (state)
		window.onmousedown = onMouseDown;
	else
		window.onmousedown = undefined;
}

// Fit
function fitFitAvailable()
{
	return isWider() || isHigher();
}

function fitFillAvailable()
{
	if (ratioCompare())
		return docHeight() < imgHeightFull() && docWidthFull() < Math.floor(imgWidthFull() * docHeight() / imgHeightFull());
	else
		return docWidth() < imgWidthFull() && docHeightFull() < Math.floor(imgHeightFull() * docWidth() / imgWidthFull());
}

function fitFit()
{
	if (ratioCompare())
		imgSize(docWidthFull() + "px", "auto");
	else
		imgSize("auto", docHeightFull() + "px");

	imgPos((docWidthFull() - imgWidth()) / 2, (docHeightFull() - imgHeight()) / 2);

	imgDraggable(false);
}

function fitFill()
{
	if (ratioCompare())
		imgSize("auto", docHeight() + "px");
	else
		imgSize(docWidth() + "px", "auto");

	imgPos(0, 0);

	scrollTo((imgWidth() - docWidthFull()) / 2, (imgHeight() - docHeightFull()) / 2); // combine this with line 154

	imgDraggable(true);
}

function fitNatural()
{
	imgSize("auto", "auto");
	imgPos((docWidth() - imgWidthFull()) / 2, (docHeight() - imgHeightFull()) / 2);

	scrollTo((imgWidthFull() - docWidth()) / 2, (imgHeightFull() - docHeight()) / 2);

	if (fitFitAvailable())
		imgDraggable(true);
}

function fit()
{
	switch (fit_type)
	{
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

function fitUpdate() // try to do something with these two functions
{
	if (fit_type == 0 && fitFitAvailable() || fit_type == 1 && fitFillAvailable() || (fit_type = 2))
		fit();
}

function fitType(n)
{
	if (fit_type != n && (n == 0 && fitFitAvailable() || n == 1 && fitFillAvailable() || n == 2))
	{
		fit_type = n;

		fit();
	}
}

// Rotate
function rotate()
{
	img.className = "orientation-" + img_orientation;

	img_original = !img_original; // img_orientation % 2

	imgRatio();

	fitUpdate();
}

function rotateCW()
{
	img_orientation = (img_orientation + 1) % 4;

	rotate();
}

function rotateCCW()
{
	img_orientation = (img_orientation + 3) % 4;

	rotate();
}

// Move
function onMouseDown(e)
{
	move_offset_x = scrollX + e.screenX;
	move_offset_y = scrollY + e.screenY;

	window.onmouseup = onMouseUp;
	window.onmousemove = onMouseMove;
}

function onMouseMove(e)
{
	scrollTo(move_offset_x - e.screenX, move_offset_y - e.screenY);

	return false;
}

function onMouseUp()
{
	window.onmouseup = undefined;
	window.onmousemove = undefined;
}

// Events
window.onkeyup = function(e)
{
	switch (e.code)
	{
	case "Digit1":
		fitType(0);
		break;
	case "Digit2":
		fitType(1);
		break;
	case "Digit3":
		fitType(2);
		break;
	case "KeyR":
		if (e.shiftKey)
			rotateCCW();
		else
			rotateCW();
		break;
	}
}

window.onresize = function()
{
	docRatio();

	fit();
}

// Init
img = document.getElementsByTagName("img")[0];

// Clear
document.body.removeAttribute("style");

img.removeAttribute("style");
img.removeAttribute("width");
img.removeAttribute("height");

img.className = "orientation-0";

// 
docRatio();
imgRatio();

if (fitFitAvailable())
	fitType(0);
else
	fitType(2);
