// csvWorker.js
self.onmessage = function(e) {
    const file = e.data;
    const reader = new FileReader();

    reader.onload = function(event) {
        const text = event.target.result;
        const points = processCSV(text);
        self.postMessage(points);
    };

    reader.readAsText(file);
};

function processCSV(text) {
    const lines = text.split('\n');
    const points = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            const [x, y, z, ...imageData] = line.split(',');
            points.push({ 
                x: parseFloat(x), 
                y: parseFloat(y), 
                z: parseFloat(z), 
                imageData: imageData.map(Number) 
            });
        }
    }
    return points;
}
