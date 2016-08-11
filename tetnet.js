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

function initialize() {
	nextShape();
	applyShape();
	setInterval(function () {
		update();
	}, 500);
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
	} else {
		return true;
	}
	return false;
};

function update() {
	moveDown();
	output();
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
	currentShape.shape = randomProperty(shapes);
	currentShape.x = Math.floor(grid[0].length / 2) - Math.ceil(currentShape.shape[0].length / 2);
	currentShape.y = 0;
}

function lose() {
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
	var html = "<h1>TetNet</h1><br />var grid =";
	for (var i = 0; i < grid.length; i++) {
		html += "<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + grid[i];
	}
	html += "<br />];";

	for (var c = 0; c < colors.length; c++) {
		html = replaceAll(html, "," + (c + 1), ",<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>");
		html = replaceAll(html, (c + 1) + ",", "<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>,");
	}

	output.innerHTML = html;
}

function randomProperty(obj) {
	var keys = Object.keys(obj);
	return obj[keys[ keys.length * Math.random() << 0]];
}

function replaceAll(target, search, replacement) {
	return target.replace(new RegExp(search, 'g'), replacement);
}