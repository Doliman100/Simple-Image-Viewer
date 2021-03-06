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
	return isHigher() ? docWidthFull() - 17 / window.devicePixelRatio : docWidthFull();
}

function docHeight()
{
	return isWider() ? docHeightFull() - 17 / window.devicePixelRatio : docHeightFull();
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

function imgMovable(state)
{
	if (state)
	{
		document.onmousedown = onMouseDown;
	}
	else
	{
		document.onmousedown = undefined;
	}
}

// Fit
function fitFitAvailable()
{
	return isWider() || isHigher();
}

function fitFillAvailable()
{
	if (ratioCompare())
	{
		return docHeight() < imgHeightFull() && docWidthFull() < Math.floor(imgWidthFull() * docHeight() / imgHeightFull());
	}
	else
	{
		return docWidth() < imgWidthFull() && docHeightFull() < Math.floor(imgHeightFull() * docWidth() / imgWidthFull());
	}
}

function fitFit()
{
	if (ratioCompare())
	{
		imgSize(docWidthFull() + "px", "auto");
	}
	else
	{
		imgSize("auto", docHeightFull() + "px");
	}

	imgPos((docWidthFull() - imgWidth()) / 2, (docHeightFull() - imgHeight()) / 2);

	imgMovable(false);
}

function fitFill()
{
	if (ratioCompare())
	{
		imgSize("auto", docHeight() + "px");
	}
	else
	{
		imgSize(docWidth() + "px", "auto");
	}

	imgPos(0, 0);

	imgMovable(true);
}

function fitNatural()
{
	imgSize("auto", "auto");
	imgPos((docWidth() - imgWidthFull()) / 2, (docHeight() - imgHeightFull()) / 2);

	if (fitFitAvailable())
	{
		imgMovable(true);
	}
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

function scroll()
{
	switch (fit_type)
	{
	case 1:
		scrollTo((imgWidth() - docWidthFull()) / 2, (imgHeight() - docHeightFull()) / 2);

		break;

	case 2:
		scrollTo((imgWidthFull() - docWidth()) / 2, (imgHeightFull() - docHeight()) / 2);

		break;
	}
}

function fitUpdate()
{
	if (fit_type == 0 && fitFitAvailable() || fit_type == 1 && fitFillAvailable() || (fit_type = 2))
	{
		fit();
	}
}

function fitType(n)
{
	if (fit_type != n && (n == 0 && fitFitAvailable() || n == 1 && fitFillAvailable() || n == 2))
	{
		fit_type = n;

		fit();
		scroll();
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
	move_offset_x = scrollX + e.clientX;
	move_offset_y = scrollY + e.clientY;

	document.onmouseup = onMouseUp;
	document.onmousemove = onMouseMove;
}

function onMouseMove(e)
{
	scrollTo(move_offset_x - e.clientX, move_offset_y - e.clientY);

	return false;
}

function onMouseUp()
{
	document.onmouseup = undefined;
	document.onmousemove = undefined;
}

// Disable default click event
document.addEventListener("click", (e) => e.stopPropagation(), true);

// Init
img = document.body.firstChild;

docRatio();
imgRatio();

img.className = "orientation-0";

fitType(fitFitAvailable() ? 0 : 2);

// Events
window.onresize = function()
{
	docRatio();

	fitUpdate();
}

document.onkeyup = function(e)
{
	if (!e.ctrlKey)
	{
		switch (e.code)
		{
		case "Digit1":
			fitType(2);

			break;

		case "Digit2":
			fitType(1);

			break;

		case "Digit3":
			fitType(0);

			break;

		case "KeyR":
			if (e.shiftKey)
			{
				rotateCCW();
			}
			else
			{
				rotateCW();
			}

			break;
		}
	}
}
