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
var populationSize = 50;
var genomes = [];
var currentGenome = -1;
var generation = 0;
var roundState;
var ai = true;
var draw = true;
var archive = {
	populationSize: 0,
	currentGeneration: 0,
	elites: [],
	genomes: []
};
var mutationRate = 0.05;
var mutationStep = 0.2;
var speeds = [500,100,1,0];
var speedIndex = 0;

function initialize() {
	archive.populationSize = populationSize;
	nextShape();
	applyShape();
	saveState = getState();
	roundState = getState();
	createInitialPopulation();
	var loop = function(){
		if (changeSpeed) {
			clearInterval(interval);
			interval = setInterval(loop, speed);
			changeInterval = false;
		}
		if (speed === 0) {
			draw = false;
			update();
			update();
			update();
		} else {
			draw = true;
		}
		update();
		if (speed === 0) {
			draw = true;
			updateScore();
		}
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
	} else if (characterPressed.toUpperCase() == "D") {
		speedIndex--;
		if (speedIndex < 0) {
			speedIndex = speeds.length - 1;
		}
		speed = speeds[speedIndex];
		changeSpeed = true;
	} else if (characterPressed.toUpperCase() == "E") {
		speedIndex++;
		if (speedIndex >= speeds.length) {
			speedIndex = 0;
		}
		speed = speeds[speedIndex];
		changeSpeed = true;
	} else if (characterPressed.toUpperCase() == "A") {
		ai = !ai;
	} else if (characterPressed.toUpperCase() == "R") {
		loadArchive(prompt("Insert archive:"));
	} else if (characterPressed.toUpperCase() == "F") {
		console.log("Height: " + getTotalHeight());
		console.log("Holes: " + getHoles());
		console.log("Roughness: " + getRoughness());
	} else {
		return true;
	}
	return false;
};

function createInitialPopulation() {
	genomes = [];
	for (var i = 0; i < populationSize; i++) {
		var genome = {
			id: Math.random(),
			rowsCleared: Math.random() * 1,
			cumulativeHeight: Math.random() * -1,
			holes: Math.random() * -1,
			roughness: Math.random() * -1
		};
		genomes.push(genome);
	}
	evaluateNextGenome();
}

function evaluateNextGenome() {
	currentGenome++;
	if (currentGenome == genomes.length) {
		evolve();
	}
	loadState(roundState);
	makeNextMove();
}

function evolve() {
	console.log("Generation " + generation + " evaluated.");
	currentGenome = 0;
	generation++;
	reset();
	roundState = getState();
	genomes.sort(function(a, b) {
		return b.fitness - a.fitness;
	});
	archive.elites.push(clone(genomes[0]));
	console.log("Elite's fitness: " + genomes[0].fitness);
	console.log(JSON.stringify(archive));
	while(genomes.length > populationSize / 2) {
		genomes.pop();
	}
	var totalFitness = 0;
	for (var i = 0; i < genomes.length; i++) {
		totalFitness += genomes[i].fitness;
	}
	var weights = [];
	var accumulated = 0;
	for (var j = 0; j < genomes.length; j++) {
		weights[j] = accumulated + (genomes[j].fitness / totalFitness);
		accumulated += genomes[j].fitness / totalFitness;
	}
	function getRandomGenome() {
		var random = Math.random() * 1;
		for (var k = 0; k < weights.length; k++) {
			if (weights[k] >= random) {
				return genomes[k];
			}
		}
	}
	var children = [];
	children.push(clone(genomes[0]));
	while (children.length < populationSize) {
		children.push(makeChild(getRandomGenome(), getRandomGenome()));
	}
	genomes = [];
	genomes = genomes.concat(children);
	archive.genomes = clone(genomes);
	archive.currentGeneration = clone(generation);
}

function makeChild(mum, dad) {
	var child = {
		id : Math.random(),
		rowsCleared: randomChoice(mum.rowsCleared, dad.rowsCleared),
		cumulativeHeight: randomChoice(mum.cumulativeHeight, dad.cumulativeHeight),
		holes: randomChoice(mum.holes, dad.holes),
		roughness: randomChoice(mum.roughness, dad.roughness),
		fitness: -1
	};
	if (Math.random() < mutationRate) {
		child.rowsCleared = child.rowsCleared + Math.random() * mutationStep;
	}
	if (Math.random() < mutationRate) {
		child.cumulativeHeight = child.cumulativeHeight + Math.random() * -mutationStep;
	}
	if (Math.random() < mutationRate) {
		child.holes = child.holes + Math.random() * -mutationStep;
	}
	if (Math.random() < mutationRate) {
		child.roughness = child.roughness + Math.random() * -mutationStep;
	}
	return child;
}

function makeNextMove() {
	var lastState = getState();
	var possibleMoves = [];
	var possibleMoveRatings = [];
	for (var rots = 0; rots < 4; rots++) {
		for (var j = 0; j < rots; j++) {
			rotateShape();
		}
		for (var t = -5; t <= 5; t++) {
			loadState(lastState);
			if (t < 0) {
				for (var l = 0; l < Math.abs(t); l++) {
					moveLeft();
				}
			} else if (t > 0) {
				for (var r = 0; r < t; r++) {
					moveRight();
				}
			}
			var moveDownResults = moveDown();
			while (moveDownResults.moved) {
				moveDownResults = moveDown();
			}
			var rating = 0;
			rating += moveDownResults.rowsCleared * genomes[currentGenome].rowsCleared;
			rating += getTotalHeight() * genomes[currentGenome].cumulativeHeight;
			rating += getHoles() * genomes[currentGenome].holes;
			rating += getRoughness() * genomes[currentGenome].roughness;
			if (moveDownResults.lose) {
				rating -= 500;
			}
			possibleMoveRatings.push(rating);
			possibleMoves.push({rotations: clone(rots), translation: clone(t), rating: rating, results: moveDownResults});
		}
	}
	var maxRating = -1000;
	var maxMove = -1;
	var ties = [];
	for (var index = 0; index < possibleMoves.length; index++) {
		if (possibleMoveRatings[index] > maxRating) {
			maxRating = possibleMoveRatings[index];
			maxMove = index;
			ties = [index];
		} else if (possibleMoveRatings[index] == maxRating) {
			ties.push(index);
		}
	}
	var move = possibleMoves[ties[randomNumBetween(0, ties.length - 1)]];
	loadState(lastState);
	for (var rotations = 0; rotations < move.rotations; rotations++) {
		rotateShape();
	}
	if (move.translation < 0) {
		for (var lefts = 0; lefts < Math.abs(move.translation); lefts++) {
			moveLeft();
		}
	} else if (move.translation > 0) {
		for (var rights = 0; rights < move.translation; rights++) {
			moveRight();
		}
	}
	output();
}

function update() {
	if (ai && currentGenome != -1) {
		var results = moveDown();
		if (!results.moved) {
			if (results.lose) {
				genomes[currentGenome].fitness = clone(score);
				evaluateNextGenome();
			} else {
				makeNextMove();
			}
		}
	} else {
		moveDown();
	}
	output();
	updateScore();
}

function moveDown() {
	var result = {lose: false, moved: true, rowsCleared: 0};
	removeShape();
	currentShape.y++;
	if (collides(grid, currentShape)) {
		currentShape.y--;
		applyShape();
		nextShape();
		result.rowsCleared = clearRows();
		if (collides(grid, currentShape)) {
			result.lose = true;
			if (ai) {
			} else {
				reset();
			}
		}
		result.moved = false;
	}
	applyShape();
	//score++;
	updateScore();
	output();
	return result;
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
		score += 400;
	} else if (rowsToClear.length == 2) {
		score += 1000;
	} else if (rowsToClear.length == 3) {
		score += 3000;
	} else if (rowsToClear.length >= 4) {
		score += 12000;
	}
	var rowsCleared = clone(rowsToClear.length);
	for (var toClear = rowsToClear.length - 1; toClear >= 0; toClear--) {
		grid.splice(rowsToClear[toClear], 1);
	}
	while (grid.length < 20) {
		grid.unshift([0,0,0,0,0,0,0,0,0,0]);
	}
	return rowsCleared;
}

function applyShape() {
	for (var row = 0; row < currentShape.shape.length; row++) {
		for (var col = 0; col < currentShape.shape[row].length; col++) {
			if (currentShape.shape[row][col] !== 0) {
				grid[currentShape.y + row][currentShape.x + col] = currentShape.shape[row][col];
			}
		}
	}
}

function removeShape() {
	for (var row = 0; row < currentShape.shape.length; row++) {
		for (var col = 0; col < currentShape.shape[row].length; col++) {
			if (currentShape.shape[row][col] !== 0) {
				grid[currentShape.y + row][currentShape.x + col] = 0;
			}
		}
	}
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

function reset() {
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
	if (draw) {
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
}

function updateScore() {
	if (draw) {
		var scoreDetails = document.getElementById("score");
		var html = "<br /><br /><h2>&nbsp;</h2><h2>Score: " + score + "</h2>";
		html += "<br /><b>--Upcoming--</b>";
		for (var i = 0; i < upcomingShape.length; i++) {
			var next =replaceAll((upcomingShape[i] + ""), "0", "&nbsp;");
			html += "<br />&nbsp;&nbsp;&nbsp;&nbsp;" + next;
		}
		for (var l = 0; l < 4 - upcomingShape.length; l++) {
			html += "<br />";
		}
		for (var c = 0; c < colors.length; c++) {
			html = replaceAll(html, "," + (c + 1), ",<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>");
			html = replaceAll(html, (c + 1) + ",", "<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>,");
		}
		html += "<br />Speed: " + speed;
		if (ai) {
			html += "<br />Generation: " + generation;
			html += "<br />Individual: " + (currentGenome + 1)  + "/" + populationSize;
			html += "<br /><pre style=\"font-size:12px\">" + JSON.stringify(genomes[currentGenome], null, 2) + "</pre>";
		}
		html = replaceAll(replaceAll(replaceAll(html, "&nbsp;,", "&nbsp;&nbsp;"), ",&nbsp;", "&nbsp;&nbsp;"), ",", "&nbsp;");
		scoreDetails.innerHTML = html;
	}
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

function getTotalHeight() {
	removeShape();
	var peaks = [20,20,20,20,20,20,20,20,20,20];
	for (var row = 0; row < grid.length; row++) {
		for (var col = 0; col < grid[row].length; col++) {
			if (grid[row][col] !== 0 && peaks[col] === 20) {
				peaks[col] = row;
			}
		}
	}
	var totalHeight = 0;
	for (var i = 0; i < peaks.length; i++) {
		totalHeight += 20 - peaks[i];
	}
	applyShape();
	return totalHeight;
}

function getHoles() {
	removeShape();
	var peaks = [20,20,20,20,20,20,20,20,20,20];
	for (var row = 0; row < grid.length; row++) {
		for (var col = 0; col < grid[row].length; col++) {
			if (grid[row][col] !== 0 && peaks[col] === 20) {
				peaks[col] = row;
			}
		}
	}
	var holes = 0;
	for (var x = 0; x < peaks.length; x++) {
		for (var y = peaks[x]; y < grid.length; y++) {
			if (grid[y][x] === 0) {
				holes++;
			}
		}
	}
	applyShape();
	return holes;
}

function getRoughness() {
	removeShape();
	var peaks = [20,20,20,20,20,20,20,20,20,20];
	for (var row = 0; row < grid.length; row++) {
		for (var col = 0; col < grid[row].length; col++) {
			if (grid[row][col] !== 0 && peaks[col] === 20) {
				peaks[col] = row;
			}
		}
	}
	var roughness = 0;
	var differences = [];
	for (var i = 0; i < peaks.length - 1; i++) {
		roughness += Math.abs(peaks[i] - peaks[i + 1]);
		differences[i] = Math.abs(peaks[i] - peaks[i + 1]);
	}
	applyShape();
	return roughness;
}

function loadArchive(archiveString) {
	archive = JSON.parse(archiveString);
	genomes = clone(archive.genomes);
	populationSize = archive.populationSize;
	generation = archive.currentGeneration;
	currentGenome = 0;
	reset();
	roundState = getState();
	console.log("Archive loaded!");
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

function randomNumBetween(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomChoice(propOne, propTwo) {
	if (Math.round(Math.random()) === 0) {
		return clone(propOne);
	} else {
		return clone(propTwo);
	}
}
