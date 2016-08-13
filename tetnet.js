var grid = [
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
];

var shapes = {
	I: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
	J: [[2,0,0], [2,2,2], [0,0,0]],
	L: [[0,0,3], [3,3,3], [0,0,0]],
	O: [[4,4], [4,4]],
	S: [[0,5,5], [5,5,0], [0,0,0]],
	T: [[0,6,0], [6,6,6], [0,0,0]],
	Z: [[7,7,0], [0,7,7], [0,0,0]]
};

var colors = ["F92338", "C973FF", "1C76BC", "FEE356", "53D504", "36E0FF", "F8931D"];

var currentShape = {x: 0, y: 0, shape: undefined};
var upcomingShape;
var score = 0;
var rndSeed = 1;
var bag = [];
var bagIndex = 0;
var saveState;
var speed = 500;
var changeSpeed = false;

function initialize() {
	nextShape();
	applyShape();
	saveState = getState();
	var loop = function(){
		if (changeSpeed) {
			clearInterval(interval);
			interval = setInterval(loop, speed);
			changeInterval = false;
		}
		update();
	};
	var interval = setInterval(loop, speed);
}
document.onLoad = initialize();

window.onkeydown = function () {
	var characterPressed = String.fromCharCode(event.keyCode);
	if (event.keyCode == 38) {
		rotateShape();
	} else if (event.keyCode == 40) {
		moveDown();
	} else if (event.keyCode == 37) {
		moveLeft();
	} else if (event.keyCode == 39) {
		moveRight();
	} else if (shapes[characterPressed.toUpperCase()] !== undefined) {
		removeShape();
		currentShape.shape = shapes[characterPressed.toUpperCase()];
		applyShape();
	} else if (characterPressed.toUpperCase() == "Q") {
		saveState = getState();
	} else if (characterPressed.toUpperCase() == "W") {
		loadState(saveState);
	} else if (characterPressed.toUpperCase() == "E") {
		if (speed == 500) {
			speed = 0;
		} else if (speed === 0) {
			speed = 500;
		}
		changeSpeed = true;
	} else {
		return true;
	}
	return false;
};

function update() {
	moveDown();
	output();
	updateScore();
}

function moveDown() {
	removeShape();
	currentShape.y++;
	if (collides(grid, currentShape)) {
		currentShape.y--;
		applyShape();
		nextShape();
		clearRows();
		if (collides(grid, currentShape)) {
			lose();
		}
	}
	applyShape();
	score++;
	updateScore();
}

function moveLeft() {
	removeShape();
	currentShape.x--;
	if (collides(grid, currentShape)) {
		currentShape.x++;
	}
	applyShape();
}

function moveRight() {
	removeShape();
	currentShape.x++;
	if (collides(grid, currentShape)) {
		currentShape.x--;
	}
	applyShape();
}

function rotateShape() {
	removeShape();
	currentShape.shape = rotate(currentShape.shape, 1);
	if (collides(grid, currentShape)) {
		currentShape.shape = rotate(currentShape.shape, 3);
	}
	applyShape();
}

function clearRows() {
	var rowsToClear = [];
	for (var row = 0; row < grid.length; row++) {
		var containsEmptySpace = false;
		for (var col = 0; col < grid[row].length; col++) {
			if (grid[row][col] === 0) {
				containsEmptySpace = true;
			}
		}
		if (!containsEmptySpace) {
			rowsToClear.push(row);
		}
	}
	if (rowsToClear.length == 1) {
		score += 120;
	} else if (rowsToClear.length == 2) {
		score += 300;
	} else if (rowsToClear.length == 3) {
		score += 600;
	} else if (rowsToClear.length >= 4) {
		score += 2400;
	}
	for (var toClear = rowsToClear.length - 1; toClear >= 0; toClear--) {
		grid.splice(rowsToClear[toClear], 1);
	}
	while (grid.length < 20) {
		grid.unshift([0,0,0,0,0,0,0,0,0,0]);
	}
}

function applyShape() {
	for (var row = 0; row < currentShape.shape.length; row++) {
		for (var col = 0; col < currentShape.shape[row].length; col++) {
			if (currentShape.shape[row][col] !== 0) {
				grid[currentShape.y + row][currentShape.x + col] = currentShape.shape[row][col];
			}
		}
	}
	output();
}

function removeShape() {
	for (var row = 0; row < currentShape.shape.length; row++) {
		for (var col = 0; col < currentShape.shape[row].length; col++) {
			if (currentShape.shape[row][col] !== 0) {
				grid[currentShape.y + row][currentShape.x + col] = 0;
			}
		}
	}
	output();
}

function nextShape() {
	bagIndex += 1;
	if (bag.length === 0 || bagIndex == bag.length) {
		generateBag();
	} 
	if (bagIndex == bag.length - 1) {
		var prevSeed = rndSeed;
		upcomingShape = randomProperty(shapes);
		rndSeed = prevSeed;
	} else {
		upcomingShape = shapes[bag[bagIndex + 1]];
	}
	currentShape.shape = shapes[bag[bagIndex]];
	currentShape.x = Math.floor(grid[0].length / 2) - Math.ceil(currentShape.shape[0].length / 2);
	currentShape.y = 0;
}

function generateBag() {
	bag = [];
	var contents = "";
	for (var i = 0; i < 7; i++) {
		var shape = randomKey(shapes);
		while(contents.indexOf(shape) != -1) {
			shape = randomKey(shapes);
		}
		bag[i] = shape;
		contents += shape;
	}
	bagIndex = 0;
}

function lose() {
	score = 0;
	grid = [[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	];
	generateBag();
	nextShape();
}

function collides(scene, object) {
	for (var row = 0; row < object.shape.length; row++) {
		for (var col = 0; col < object.shape[row].length; col++) {
			if (object.shape[row][col] !== 0) {
				if (scene[object.y + row] === undefined || scene[object.y + row][object.x + col] === undefined || scene[object.y + row][object.x + col] !== 0) {
					return true;
				}
			}
		}
	}
}

function scan() {
	removeShape();
	var peak = 20;
	var base = -1;
	for (var y = 0; y < grid.length; y++) {
		for (var x = 0; x < grid[y].length; x++) {
			if (grid[y][x] !== 0) {
				if (y < peak) {
					peak = y;
				}
				if (y > base) {
					base = y;
				}
			}
		}
	}
	var range = base - peak;
	var distances = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
	for (var row = peak; row <= base; row++) {
		for (var col = 0; col < grid[row].length; col++) {
			if (grid[row][col] !== 0 && distances[col] == 1) {
				if (range === 0) {
					distances[col] = 0;
				} else {
					distances[col] = (row - peak) / range;
				}
			}
		}
	}
	applyShape();
	return distances;
}

function rotate(matrix, times) {
	for (var t = 0; t < times; t++) {
		matrix = transpose(matrix);
		for (var i = 0; i < matrix.length; i++) {
			matrix[i].reverse();
		} 
	}
	return matrix;
}

function transpose(array) {
	return array[0].map(function(col, i) { 
		return array.map(function(row) { 
			return row[i];
		});
	});
}

function output() {
	var output = document.getElementById("output");
	var html = "<h1>TetNet</h1><br />var grid = [";
	var space = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
	for (var i = 0; i < grid.length; i++) {
		if (i === 0) {
			html += "[" + grid[i] + "]";
		} else {
			html += "<br />" + space + "[" + grid[i] + "]";
		}
	}
	html += "];";
	for (var c = 0; c < colors.length; c++) {
		html = replaceAll(html, "," + (c + 1), ",<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>");
		html = replaceAll(html, (c + 1) + ",", "<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>,");
	}
	output.innerHTML = html;
}

function updateScore() {
	var scoreDetails = document.getElementById("score");
	var html = "<br /><br /><h2>&nbsp;</h2><h2>Score: " + score + "</h2><b>--Upcoming--</b><br />";
	for (var i = 0; i < upcomingShape.length; i++) {
		var next =replaceAll((upcomingShape[i] + ""), "0", "&nbsp;");
		html += "<br />&nbsp;&nbsp;&nbsp;&nbsp;" + next;
	}
	for (var c = 0; c < colors.length; c++) {
		html = replaceAll(html, "," + (c + 1), ",<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>");
		html = replaceAll(html, (c + 1) + ",", "<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>,");
	}
	html = replaceAll(replaceAll(replaceAll(html, "&nbsp;,", "&nbsp;&nbsp;"), ",&nbsp;", "&nbsp;&nbsp;"), ",", "&nbsp;");
	scoreDetails.innerHTML = html;
}

function getState() {
	var state = {
		grid: clone(grid),
		currentShape: clone(currentShape),
		upcomingShape: clone(upcomingShape),
		bag: clone(bag),
		bagIndex: clone(bagIndex),
		rndSeed: clone(rndSeed),
		score: clone(score)
	};
	return state;
}

function loadState(state) {
	grid = clone(state.grid);
	currentShape = clone(state.currentShape);
	upcomingShape = clone(state.upcomingShape);
	bag = clone(state.bag);
	bagIndex = clone(state.bagIndex);
	rndSeed = clone(state.rndSeed);
	score = clone(state.score);
	output();
	updateScore();
}

function clone(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function randomProperty(obj) {
	return(obj[randomKey(obj)]);
}

function randomKey(obj) {
	var keys = Object.keys(obj);
	var i = seededRandom(0, keys.length);
	return keys[i];
}

function replaceAll(target, search, replacement) {
	return target.replace(new RegExp(search, 'g'), replacement);
}

function seededRandom(min, max) {
	max = max || 1;
	min = min || 0;

	rndSeed = (rndSeed * 9301 + 49297) % 233280;
	var rnd = rndSeed / 233280;

	return Math.floor(min + rnd * (max - min));
}
