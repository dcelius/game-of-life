import { Cell, LifeSimulator } from './gameoflife.ts';

const canvas = document.querySelector(`canvas`)!;
const ctx = canvas.getContext(`2d`)!;

const win = window,
	doc = document,
	docElem = doc.documentElement,
	body = doc.getElementsByTagName(`body`)[0];

let width = win.innerWidth || docElem.clientWidth || body.clientWidth,
	height = win.innerHeight || docElem.clientHeight || body.clientHeight;

const dpi = 4;
const cellSize = 20;

let offset = { x: 0, y: 0 };
const totalOffset = { x: 0, y: 0 };

function resize() {
	width = win.innerWidth || docElem.clientWidth || body.clientWidth;
	height = win.innerHeight || docElem.clientHeight || body.clientHeight;
	canvas.height = height * dpi;
	canvas.width = width * dpi;
	canvas.style.height = height + `px`;
	canvas.style.width = width + `px`;
	draw();
}

let resizer: NodeJS.Timeout | number | string | undefined;
window.onresize = function() {
	clearTimeout(resizer);
	resizer = setTimeout(resize, 100);
};



// eslint-disable-next-line no-restricted-syntax
enum Command {
	PAN,
	DRAW,
	DELETE,
	NONE,
}

const state = {
	currentCommand: Command.NONE,
	isPressed: false,
	isStarted: false,
};

canvas.addEventListener(`mousedown`, e => mousedown(e));
canvas.addEventListener(`mouseup`, e => endDrag(e));
canvas.addEventListener(`mousemove`, e => mousemove(e));
canvas.addEventListener(`mouseleave`, e => endDrag(e));
window.addEventListener(`keydown`, e => {
	if (e.key === ` `) {
		state.isStarted = !state.isStarted;
	} else if (e.key === `c`) {
		if (state.isStarted) {
			state.isStarted = false;
		}
		sim.cells.clear();
	}
});

document.body.style.margin = `0`;
document.documentElement.style.overflow = `hidden`;

document.getElementById(`startButton`)!.addEventListener(`click`, e => {
	state.isStarted = !state.isStarted;
});

const sim = new LifeSimulator();

function getCellIdFromClick(e: MouseEvent) {
	const x = e.clientX - totalOffset.x;
	const y = e.clientY - totalOffset.y;
	const cellX = Math.floor(x / cellSize);
	const cellY = Math.floor(y / cellSize);
	return cellX + `:` + cellY;
}

function getTopLeftCornerOfCell(cellX: number, cellY: number) {
	const x = cellX * cellSize + totalOffset.x;
	const y = cellY * cellSize + totalOffset.y;
	return { x: x, y: y };
}

function draw() {
	ctx.clearRect(0, 0, width * dpi, height * dpi);

	ctx.save();
	ctx.scale(dpi, dpi);
	ctx.translate(-0.5, -0.5);

	ctx.lineWidth = 1;
	ctx.strokeStyle = `silver`;
	ctx.beginPath();

	for (let x = offset.x; x < width; x += cellSize) {
		ctx.moveTo(x, 0);
		ctx.lineTo(x, height);
	}

	for (let y = offset.y; y < height; y += cellSize) {
		ctx.moveTo(0, y);
		ctx.lineTo(width, y);
	}

	ctx.closePath();
	ctx.stroke();

	for (const cell of sim.cells.values()) {
		const topLeft = getTopLeftCornerOfCell(cell.x, cell.y);
		if (topLeft.x < 0 || topLeft.y < 0 || topLeft.x > width || topLeft.y > height) {
			continue;
		}
		ctx.fillStyle = `black`;
		ctx.fillRect(topLeft.x, topLeft.y, cellSize, cellSize);
	}

	ctx.restore();
}

function mousedown(e: MouseEvent) {
	state.isPressed = true;
	//console.log(e.clientX + ` ` + e.clientY);
	if (e.ctrlKey) {
		state.currentCommand = Command.DRAW;
		drawCell(e);
	} else if (e.shiftKey) {
		state.currentCommand = Command.DELETE;
		deleteCell(e);
	} else {
		state.currentCommand = Command.PAN;
	}
	//draw();
}

function endDrag(e: MouseEvent) {
	state.isPressed = false;
	state.currentCommand = Command.NONE;
}

function mousemove(e: MouseEvent) {
	if (!state.isPressed) {
		return;
	}

	if (e.ctrlKey) {
		state.currentCommand = Command.DRAW;
		drawCell(e);
	} else if (e.shiftKey) {
		state.currentCommand = Command.DELETE;
		deleteCell(e);
	} else {
		state.currentCommand = Command.PAN;
		pan(e);
	}

	//draw();
}

function handleCell(cellId: string) {
	if (state.isStarted) {
		return;
	}

	const exists = sim.cells.has(cellId);
	if (state.currentCommand === Command.DELETE && exists) {
		sim.cells.delete(cellId);
	} else if (state.currentCommand === Command.DRAW && !exists) {
		sim.cells.set(cellId,
			new Cell(parseInt(cellId.split(`:`)[0]), parseInt(cellId.split(`:`)[1])));
	}
}

function deleteCell(e: MouseEvent) {
	handleCell(getCellIdFromClick(e));
}

function drawCell(e: MouseEvent) {
	handleCell(getCellIdFromClick(e));
}

function pan(e: MouseEvent) {

	offset.x += e.movementX;
	offset.y += e.movementY;
	totalOffset.x += e.movementX;
	totalOffset.y += e.movementY;

	const signX = offset.x > 0 ? 1 : -1;
	const signY = offset.y > 0 ? 1 : -1;

	offset = {
		x: (Math.abs(offset.x) > cellSize)
			? offset.x - Math.floor((offset.x * signX) / cellSize) * cellSize * signX
			: offset.x,
		y: (Math.abs(offset.y) > cellSize)
			? offset.y - Math.floor((offset.y * signY) / cellSize) * cellSize * signY
			: offset.y,
	};
}

resize(); // initial resize

const rangeslider = document.getElementById(`sliderRange`)! as HTMLInputElement;
const output = document.getElementById(`demo`)!;
output.innerHTML = rangeslider.value;

const renderSpeed = 1000 / 30;
let timeSinceLastUpdate = 0;
let simSpeed = 1000 / 5;

rangeslider.addEventListener(`input`, e => {
	output.innerHTML = rangeslider.value;
	simSpeed = 1000 / parseInt(rangeslider.value);
});

const updater = setInterval(update, renderSpeed);
function update() {
	if (state.isStarted) {
		timeSinceLastUpdate += renderSpeed;
		if (timeSinceLastUpdate >= simSpeed) {
			timeSinceLastUpdate = 0;
			sim.update();
		}
	}
	draw();
}

