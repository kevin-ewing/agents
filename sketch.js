const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 800;

let resetButton;
let backgroundAlpha = 10;
let alphaSlider;
let antsSlider;
let typeSelector;
let startSelector;
let antTypes = 2;
let antsSystems = [];
let pheromoneArray = [];
let antsNum = 40000;
let lookAhead;
let turnAngle;
let stepSize;

const antPheromoneFactor = 1;
const enemyPheromoneFactor = 1;

const pheromoneDecay = 1;

function windowResized() {
  setup(); // call setup again to redraw your sketch
}

function setup() {
  // prevent the creation of a canvas element
  resizeCanvas(windowWidth, windowHeight);
  frameRate(30); // Throttle the frame rate
  blendMode(MULTIPLY);
  angleMode(DEGREES);
  pixelDensity(1);
  background(0);
  lookAhead = random(2, 30);
  turnAngle = random(20, 40);
  antsSystems = [];
  stepsize = random(0.2, 4);
  let colorPalette = genPal(antTypes);

  pheromoneArray = [];
  for (let i = 0; i < antTypes; i++) {
    let tempArray = new Array(height);
    for (let y = 0; y < height; y++) {
      tempArray[y] = new Float32Array(width);
    }
    pheromoneArray.push(tempArray);
  }

  for (let i = 0; i < antTypes; i++) {
    antsSystems.push(new System(i, colorPalette[i]));
  }
}

function draw() {
  blendMode(MULTIPLY);
  background(0, backgroundAlpha); // Update viewing trail

  loadPixels();
  const systemsLength = antsSystems.length;
  for (let i = 0; i < systemsLength; i++) {
    antsSystems[i].updatePheromone();
    antsSystems[i].updateAngle();
    antsSystems[i].updatePosition();
  }
  updatePixels();
}

class Ant {
  constructor(antIndex, color) {
    this.antIndex = antIndex;
    this.color = color;

    this.x = random(width);
    this.y = random(height);
    this.angle = random(360);
    this.step = random(1, 2);
  }

  smell(direction) {
    const projection = this.angle + direction;
    const cosProj = cos(projection);
    const sinProj = sin(projection);
    let x = 0 | (this.x + lookAhead * cosProj);
    let y = 0 | (this.y + lookAhead * sinProj);
    x = (x + width) % width;
    y = (y + height) % height;

    // Bounds checking
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return 0; // or some default value
    }

    let enemy = 0;
    for (let k = 0; k < antTypes; k++) {
      if (k != this.antIndex) {
        enemy -= pheromoneArray[k][y][x];
      }
    }

    return pheromoneArray[this.antIndex][y][x] + enemy * enemyPheromoneFactor;
  }

  updateAngle() {
    const right = this.smell(turnAngle);
    const center = this.smell(0);
    const left = this.smell(-turnAngle);

    if (center > left && center > right) {
    } else if (left < right) {
      this.angle += turnAngle;
    } else if (left > right) {
      this.angle -= turnAngle;
    }
  }

  updatePosition() {
    this.x += cos(this.angle) * stepsize;
    this.y += sin(this.angle) * stepsize;
    this.x = (this.x + width) % width;
    this.y = (this.y + height) % height;

    pheromoneArray[this.antIndex][0 | this.y][0 | this.x] =
      255 * antPheromoneFactor;

    set(0 | this.x, 0 | this.y, color(this.color));
  }
}

class System {
  constructor(antIndex, color) {
    this.antIndex = antIndex;
    this.ants = [];
    for (let i = floor(antsNum / antTypes); i--; ) {
      this.ants.push(new Ant(this.antIndex, color));
    }

    pheromoneArray.push([]);
    for (let i = 0; i < height; i++) {
      let tempRow = [];
      for (let j = 0; j < width; j++) {
        tempRow.push(0);
      }
      pheromoneArray[this.antIndex].push(tempRow);
    }
  }

  updatePheromone() {
    const pheromones = pheromoneArray[this.antIndex];
    const lengthY = pheromones.length;
    for (let i = 0; i < lengthY; i++) {
      const row = pheromones[i];
      const lengthX = row.length;
      for (let j = 0; j < lengthX; j++) {
        const value = row[j];
        if (value > 0) {
          row[j] = Math.min(value - pheromoneDecay, 255);
        } else if (value < 0) {
          row[j] = Math.max(value + pheromoneDecay, -255);
        }
      }
    }
  }

  updateAngle() {
    for (const ant of this.ants) {
      ant.updateAngle();
    }
  }

  updatePosition() {
    for (const ant of this.ants) {
      ant.updatePosition();
    }
  }
}

function genPal(n) {
  let palette = [];
  let span = 40 * n;
  let base = random(0, 360);
  colorMode(HSB);

  for (let i = 0; i < n; i++) {
    let hue = ((span / n) * i + base) % 360;
    palette.push(color(hue, 30, 100));
  }

  colorMode(RGB);
  return palette;
}

function resetAnts() {
  background(0);
  antsSystems = [];
  pheromoneArray = [];
  backgroundAlpha = alphaSlider.value();
  antsNum = antsSlider.value();
  antTypes = typeSelector.value();
  startType = startSelector.value();

  let colorPalette = genPal(antTypes);

  for (let i = 0; i < antTypes; i++) {
    antsSystems.push(new System(i, colorPalette[i]));
  }
}
