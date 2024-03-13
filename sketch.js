let refreshButton;

const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 800;

let palType;
let colorPalette;
let resetButton;
let backgroundAlpha = 10;
let antTypes;
let antsSystems = [];
let pheromoneArray = [];
let antsNum;
let lookAhead;
let turnAngle;
let stepSize;

const antPheromoneFactor = 1;
const enemyPheromoneFactor = 1;

const pheromoneDecay = 1;

function windowResized() {
  refresh();
}

function refresh() {
  background(0);
  antsSystems = [];

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

function regen() {
  lookAhead = random(2, 30);
  turnAngle = random(20, 40);
  stepsize = random(0.2, 4);
  antTypes = floor(random(0, 3)) + 2;
  antsNum = 80000 - 10000 * antTypes;
  colorPalette = genPal(antTypes);
}

function setup() {
  // prevent the creation of a canvas element
  resizeCanvas(windowWidth, windowHeight);
  frameRate(30); // Throttle the frame rate
  blendMode(MULTIPLY);
  angleMode(DEGREES);
  pixelDensity(1);
  background(0);
  refreshButton = createButton("Refresh");
  regen();
  refresh();
}

function onRefresh() {
  setup();
}

function ui() {
  fill(255); // Set text color to white
  textSize(16); // Set text size
  textAlign(RIGHT, TOP); // Align text to the top right corner
  text(
    `Ant Count: ${antsNum}\nAnt Types: ${antTypes}\nLook Ahead (Pixels): ${lookAhead.toFixed(
      4
    )}\nTurn Angle (Degrees): ${turnAngle.toFixed(
      4
    )}\nStep Size (Pixels): ${stepsize.toFixed(4)}\nPalette Type: ${palType}`,
    windowWidth - 10,
    10
  );

  fill(0);
  rect(windowWidth - 100, windowHeight - 10, windowWidth, windowHeight);
  fill(255); // Set text color to white
  textSize(10); // Set text size
  textAlign(RIGHT, TOP); // Align text to the top right corner
  text(
    `Frame Rate: ${frameRate().toFixed(2).padEnd(4, "0")}`,
    windowWidth - 10,
    windowHeight - 10
  );

  refreshButton.position(windowWidth - 90, 140); // Position in bottom left corner
  refreshButton.mousePressed(onRefresh); // Call onRefresh when button is pressed

  // Style the button
  refreshButton.style("background-color", "white"); // Set background color
  refreshButton.style("color", "black"); // Set text color
  refreshButton.style("text-align", "center"); // Center the text
  refreshButton.style("cursor", "pointer"); // Change cursor on hover
  refreshButton.style("border-radius", "12px"); // Add rounded corners
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

  blendMode(BLEND); // Reset blend mode for normal text rendering
  ui(); // Display ui on top of everything
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

    if (center <= left || center <= right) {
      this.angle += left < right ? turnAngle : -turnAngle;
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
    const decay = pheromoneDecay; // Cache pheromoneDecay to avoid repeated scope lookups
    for (let i = 0; i < lengthY; i++) {
      const row = pheromones[i];
      const lengthX = row.length;
      for (let j = 0; j < lengthX; j++) {
        const value = row[j];
        // Combining the checks for positive and negative values to avoid duplicate code
        row[j] =
          value > 0 ? Math.max(value - decay, 0) : Math.min(value + decay, 0);
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
  colorMode(HSB, 360, 100, 100, 100);
  let palette = Array(n); // Clear previous palette
  let baseHue = random(0, 360); // Starting hue
  let colorType = floor(random(4)); // 0: Analogous, 1: Complimentary, 2: Triadic, 3: Monochromatic
  switch (colorType) {
    case 0: // Analogous
      palType = "Analogous";
      for (let i = 0; i < n; i++) {
        palette[i] = [(baseHue + i * 30) % 360, 70, 100];
      }
      break;
    case 1: // Complimentary
      palType = "Complimentary";
      for (let i = 0; i < n; i++) {
        let saturation = 70;
        let brightness = 90;
        let hueVar = 0;
        if (n > 2) {
          // Vary saturation and brightness for more than 2 colors
          saturation -= i * (30 / (n - 1)); // Decrease saturation gradually
          brightness -= i * (15 / (n - 1)); // Decrease brightness gradually
          hueVar += i * (10 / (n - 1)); // Add slight hue variation
        }
        palette[i] = [
          (baseHue + i * 180 + hueVar) % 360,
          saturation,
          brightness,
        ];
      }
      break;
    case 2: // Triadic
      palType = "Triadic";
      for (let i = 0; i < n; i++) {
        let saturation = 70;
        let brightness = 90;
        let hueVar = 0;
        if (n > 3) {
          // Vary saturation and brightness for more than 2 colors
          saturation -= i * (30 / (n - 1)); // Decrease saturation gradually
          brightness -= i * (15 / (n - 1)); // Decrease brightness gradually
          hueVar += i * (10 / (n - 1)); // Add slight hue variation
        }
        palette[i] = [
          (baseHue + i * 120 + hueVar) % 360,
          saturation,
          brightness,
        ];
      }
      break;
    case 3: // Monochromatic
      palType = "Monochromatic";
      for (let i = 0; i < n; i++) {
        let hueVariation = 5; // Slight variation in hue
        let saturation = 40 + i * (40 / (n - 1)); // Vary saturation a good amount
        let brightness = 90 + i * (10 / (n - 1)); // Not change brightness very much
        palette[i] = [
          (baseHue + hueVariation * i) % 360,
          saturation,
          brightness,
        ];
      }
      break;
  }
  return palette;
}
