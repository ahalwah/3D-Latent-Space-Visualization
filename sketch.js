let canvas;
let canvasWidth = 640;
let canvasHeight = 480;
let scene;
let points = [];
let ballSize = 3;
let ballSizeInput;
let incrementValue = 0.1;
let incrementInput;
let selectedPoints = [];
let previousSelectedPoints = [];
let loadCSVButton;
let fileInput;
let worker;
let dragging = false;
let dragStartX, dragStartY;
let spherePosition = { x: 0, y: 0, z: 0 };
let currentPlane = 'XY';
let loadingFile = false; // Flag to track file loading process
let pointsInSphereLabel;
let pointSlider;
let imageCanvas, imageContext;

function setup() {
    canvas = createCanvas(canvasWidth, canvasHeight, WEBGL);
    canvas.elt.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    canvas.parent('p5-canvas');
    canvas.position(0, 0);
    scene = new Scene();
    camera(0, 0, (canvasHeight / 2), 0, 0, 0, 0, 1, 0); // /tan(PI / 6)

    let controls = select('#controls');

    // Create an invisible file input for CSV file
    fileInput = createFileInput(handleFile);
    fileInput.class('hidden-file-input');
    fileInput.hide(); // Hide the actual file input

    // Create a visible button to trigger the file input
    let loadCSVButton = createButton('Load CSV File');
    loadCSVButton.class('load-csv-button');
    loadCSVButton.mousePressed(() => {
        loadingFile = true; // Set flag when starting to load file
        fileInput.elt.click();
    });
    controls.child(loadCSVButton);

    // Ball Radius
    let ballRadiusContainer = createDiv();
    ballRadiusContainer.class('control-container');

    let ballRadiusLabel = createP('Sphere Radius:');
    ballRadiusLabel.class('control-label');
    ballRadiusContainer.child(ballRadiusLabel);

    ballSizeInput = createInput(ballSize.toString(), 'number');
    ballSizeInput.class('control-input');
    ballSizeInput.attribute('step', `${incrementValue}`);
    ballSizeInput.input(() => {
        updateBallSize();
        highlightPointsInSphere();
    });
    ballRadiusContainer.child(ballSizeInput);

    let incrementLabel = createP('Step Size:');
    incrementLabel.class('control-label');
    ballRadiusContainer.child(incrementLabel);

    incrementInput = createInput(incrementValue.toString(), 'number');
    incrementInput.class('control-input');
    incrementInput.attribute('step', '0.1');
    incrementInput.input(updateIncrementValue);
    ballRadiusContainer.child(incrementInput);

    controls.child(ballRadiusContainer);

    // Buttons for view controls
    let buttonContainer = createDiv();
    buttonContainer.class('button-container');
    controls.child(buttonContainer);

    let resetButton = createButton('Reset View');
    resetButton.mousePressed(() => {
        resetView();
        highlightPointsInSphere();
    });
    buttonContainer.child(resetButton);

    let xyButton = createButton('<span class="x-letter">X</span><span class="y-letter">Y</span> Plane');
    xyButton.mousePressed(() => {
        setPlane('XY');
        highlightPointsInSphere();
    });
    buttonContainer.child(xyButton);

    let xzButton = createButton('<span class="x-letter">X</span><span class="z-letter">Z</span> Plane');
    xzButton.mousePressed(() => {
        setPlane('XZ');
        highlightPointsInSphere();
    });
    buttonContainer.child(xzButton);

    let yzButton = createButton('<span class="y-letter">Y</span><span class="z-letter">Z</span> Plane');
    yzButton.mousePressed(() => {
        setPlane('YZ');
        highlightPointsInSphere();
    });
    buttonContainer.child(yzButton);

    // Reset Sphere Position Button
    let resetSphereButton = createButton('Reset Sphere Position');
    resetSphereButton.class('reset-sphere-button');
    resetSphereButton.mousePressed(() => {
        resetSpherePosition();
        highlightPointsInSphere();
    });
    controls.child(resetSphereButton);

    // Points in Sphere Label
    pointsInSphereLabel = createP('Points in Sphere: 0');
    pointsInSphereLabel.class('points-in-sphere-label'); // Match the class with Sphere Radius
    controls.child(pointsInSphereLabel);

    // Slider to navigate through points in the sphere
    pointSlider = createSlider(0, 0, 0);
    pointSlider.class('point-slider');
    pointSlider.attribute('disabled', true); // Disable slider initially
    pointSlider.input(() => {
        let index = pointSlider.value();
        if (index < selectedPoints.length) {
            let pt = selectedPoints[index];
            displayImage(pt.imageData);
        }
    });
    controls.child(pointSlider);

    // Create HTML canvas for displaying point image
    let imageContainer = createDiv();
    imageContainer.class('image-container');
    controls.child(imageContainer);
    imageCanvas = createElement('canvas');
    imageCanvas.attribute('width', '200');
    imageCanvas.attribute('height', '200');
    imageContainer.child(imageCanvas);
    imageContext = imageCanvas.elt.getContext('2d');

    // Initialize web worker
    worker = new Worker('csvWorker.js');
    worker.onmessage = function(e) {
        points = e.data;
        if (points.length > 0) {
            points[0].selected = true;
        }
        highlightPointsInSphere();
        loadingFile = false; // Reset flag when file loading is done
    };
}

function draw() {
    clear();
    background(200);

    // Apply transformations
    translate(scene.getTransX(), scene.getTransY(), 0);
    rotateX(scene.getRotX());
    rotateY(scene.getRotY());
    scale(scene.getZoom());

    // Update rotation based on left mouse drag
    if (!loadingFile && mouseIsPressed && mouseButton === LEFT && keyIsDown(CONTROL)) {
        if (mouseInsideCanvas()) {
            let dx = mouseX - pmouseX;
            let dy = mouseY - pmouseY;
            scene.setRotX(scene.getRotX() - dy * 0.0025);
            scene.setRotY(scene.getRotY() + dx * 0.0025);
        }
    }

    // Update translation based on right mouse drag
    if (!loadingFile && mouseIsPressed && mouseButton === RIGHT && keyIsDown(CONTROL)) {
        if (mouseInsideCanvas()) {
            let dx = mouseX - pmouseX;
            let dy = mouseY - pmouseY;
            scene.setTransX(scene.getTransX() + dx / 2);
            scene.setTransY(scene.getTransY() + dy / 2);
        }
    }

    drawAxes();
    drawSphere();
    drawPoints(points);
}

function mouseInsideCanvas() {
    return mouseX >= 0 && mouseX <= canvasWidth && mouseY >= 0 && mouseY <= canvasHeight;
}

function drawAxes() {
    strokeWeight(0.5);
    // X-axis (red)
    stroke(255, 0, 0);
    line(0, 0, 0, 20, 0, 0);
    // Y-axis (green)
    stroke(0, 255, 0);
    line(0, 0, 0, 0, 20, 0);
    // Z-axis (blue)
    stroke(0, 0, 255);
    line(0, 0, 0, 0, 0, 20);
}

function windowResized() {
    resizeCanvas(canvasWidth, canvasHeight);
}

function mouseWheel(event) {
    if (mouseInsideCanvas()) {
        let zoom = scene.getZoom();
        zoom -= event.delta * 0.001;
        scene.setZoom(zoom < 0 ? 0 : zoom);
    }
    return false; // Prevent default scrolling behavior
}

function keyPressed() {
    if (keyCode === 32) { // space bar
        // reset view
        scene.reset();
    }
}

function updateBallSize() {
    ballSize = parseFloat(ballSizeInput.value());
}

function updateIncrementValue() {
    incrementValue = parseFloat(incrementInput.value());
    ballSizeInput.attribute('step', `${incrementValue}`);
}

function resetView() {
    scene.reset();
}

function setPlane(plane) {
    currentPlane = plane;
    if (plane === 'XY') {
        scene.setRotX(0);
        scene.setRotY(0);
    } else if (plane === 'XZ') {
        scene.setRotX(HALF_PI);
        scene.setRotY(0);
    } else if (plane === 'YZ') {
        scene.setRotX(0);
        scene.setRotY(HALF_PI);
    }
}

function drawSphere() {
    push();
    noFill();
    stroke(255, 105, 180, 40); // Pink with alpha 0.2
    translate(spherePosition.x, spherePosition.y, spherePosition.z);
    sphere(ballSize);
    pop();
}

function mousePressed() {
    if (loadingFile || !mouseInsideCanvas()) return; // Skip mouse interaction if loading a file or mouse is outside canvas
    if (mouseButton === LEFT && !keyIsDown(CONTROL)) {
        dragging = true;
        dragStartX = mouseX;
        dragStartY = mouseY;
    }
}

function mouseDragged() {
    if (loadingFile || !mouseInsideCanvas()) return; // Skip mouse interaction if loading a file or mouse is outside canvas
    if (dragging) {
        let dx = (mouseX - dragStartX) * 0.12;
        let dy = (mouseY - dragStartY) * 0.12;

        if (currentPlane === 'XY') {
            spherePosition.x += dx;
            spherePosition.y += dy;
        } else if (currentPlane === 'XZ') {
            spherePosition.x += dx;
            spherePosition.z -= dy;
        } else if (currentPlane === 'YZ') {
            spherePosition.y += dy;
            spherePosition.z += dx;
        }

        dragStartX = mouseX;
        dragStartY = mouseY;
        highlightPointsInSphere(); // Update points while dragging
    }
}

function mouseReleased() {
    if (loadingFile || !mouseInsideCanvas()) return; // Skip mouse interaction if loading a file or mouse is outside canvas
    dragging = false;
}

function resetSpherePosition() {
    spherePosition = { x: 0, y: 0, z: 0 };
    highlightPointsInSphere();
}

function handleFile(file) {
    if (file.type === 'text') {
        worker.postMessage(file.file);
    }
}

function drawPoints(points) {
    for (let i = 0; i < points.length; i++) {
        let pt = points[i];
        if (pt.selected) {
            strokeWeight(7);
            stroke('blue'); // Blue for selected points
        } else {
            strokeWeight(5);
            stroke(0); // Black for unselected points
        }
        point(pt.x, pt.y, pt.z);
    }
}

function highlightPointsInSphere() {
    selectedPoints = [];
    let sphereCenter = createVector(spherePosition.x, spherePosition.y, spherePosition.z);

    for (let pt of points) {
        let pointVec = createVector(pt.x, pt.y, pt.z);
        if (sphereCenter.dist(pointVec) <= ballSize) {
            pt.selected = true;
            selectedPoints.push(pt);
        } else {
            pt.selected = false;
        }
    }

    pointsInSphereLabel.html(`Points in Sphere: ${selectedPoints.length}`);
    if (selectedPoints.length === 0) {
        pointSlider.attribute('disabled', true);
        pointSlider.value(0);
        imageContext.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    } else {
        pointSlider.removeAttribute('disabled'); // Enable the slider
        pointSlider.attribute('max', selectedPoints.length - 1);
        pointSlider.value(0);
        displayImage(selectedPoints[0].imageData);
    }

    // Update the display only if there are changes in the selected points
    if (!arraysEqual(selectedPoints, previousSelectedPoints)) {
        previousSelectedPoints = [...selectedPoints];
    }
}

function displayImage(imageData) {
    imageContext.clearRect(0, 0, 200, 200); // Clear the previous image
    if (imageData) {
        const imageWidth = 64; // Based on your reference, the image is 64x64
        const imageHeight = 64;
        const reshapedImageData = [];

        // Convert flattened array to 2D array
        for (let i = 0; i < imageHeight; i++) {
            const row = imageData.slice(i * imageWidth, (i + 1) * imageWidth);
            reshapedImageData.push(row);
        }

        const imageDataArray = new Uint8ClampedArray(imageWidth * imageHeight * 4);

        // Fill imageDataArray with pixel data
        for (let i = 0; i < reshapedImageData.length; i++) {
            for (let j = 0; j < reshapedImageData[i].length; j++) {
                const pixelIndex = (i * imageWidth + j) * 4;
                const grayscaleValue = reshapedImageData[i][j] * 255;
                imageDataArray[pixelIndex] = grayscaleValue; // Red
                imageDataArray[pixelIndex + 1] = grayscaleValue; // Green
                imageDataArray[pixelIndex + 2] = grayscaleValue; // Blue
                imageDataArray[pixelIndex + 3] = 255; // Alpha
            }
        }

        const imageDataObject = new ImageData(imageDataArray, imageWidth, imageHeight);
        imageContext.putImageData(imageDataObject, 0, 0);

        // Rescale the image to fit the canvas
        imageContext.drawImage(imageCanvas.elt, 0, 0, imageWidth, imageHeight, 0, 0, 200, 200);
    }
}

function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i].x !== b[i].x || a[i].y !== b[i].y || a[i].z !== b[i].z) {
            return false;
        }
    }
    return true;
}
