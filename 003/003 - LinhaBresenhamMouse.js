const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// --------------------------------------------------
// 1. VÉRTICES, CORES E ESTADOS
// --------------------------------------------------

// Paleta de 10 cores pré-definidas (índices 0 a 9)
const colorPalette = [
    [0.0, 0.4, 1.0], // 0: Azul Inicial
    [1.0, 0.0, 0.0], // 1: Vermelho
    [0.0, 1.0, 0.0], // 2: Verde
    [1.0, 1.0, 0.0], // 3: Amarelo
    [1.0, 0.0, 1.0], // 4: Magenta
    [0.0, 1.0, 1.0], // 5: Ciano
    [1.0, 0.5, 0.0], // 6: Laranja
    [0.5, 0.0, 1.0], // 7: Roxo
    [1.0, 1.0, 1.0], // 8: Branco
    [0.5, 0.5, 0.5]  // 9: Cinza
];

let currentColorIndex = 0; // Começa azul
let currentThickness = 1;  // Espessura padrão 1px
let currentMode = 'r';     // 'r' = reta (2 cliques), 't' = triângulo (3 cliques)
let activeSubMode = 'k';   // 'k' = mudar cor, 'e' = mudar espessura

let clickedPoints = [];    // Guarda os pontos clicados [(x,y), ...]
let vertexData = [];       // Contém as coordenadas NDC [x1, y1, x2, y2, ...]
let colorData = [];        // Contém a cor RGB de cada ponto [r, g, b, ...]

// Inicializa a cena com uma linha azul de (0,0) a (0,0)
function initInitialLine() {
    vertexData = [0.0, 0.0];
    colorData = [...colorPalette[0]];
}
initInitialLine();

// --------------------------------------------------
// 2. BUFFERS
// --------------------------------------------------

const verticesBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.DYNAMIC_DRAW);

const colorsBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorData), gl.DYNAMIC_DRAW);

// --------------------------------------------------
// 3. VERTEX SHADER
// --------------------------------------------------

const vertexShaderSource = `#version 300 es
in vec2 aPosition;
in vec3 aColor;

out vec3 vColor;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    gl_PointSize = 2.0; // Cada pixel rasterizado por Bresenham é desenhado como ponto
    vColor = aColor;
}
`;

// --------------------------------------------------
// 4. FRAGMENT SHADER
// --------------------------------------------------

const fragmentShaderSource = `#version 300 es
precision mediump float;

in vec3 vColor;
out vec4 outColor;

void main() {
    outColor = vec4(vColor, 1.0);
}
`;

// --------------------------------------------------
// 5. COMPILAR SHADERS
// --------------------------------------------------

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(error);
    }
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

// --------------------------------------------------
// 6. CRIAR PROGRAMA
// --------------------------------------------------

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
}

// --------------------------------------------------
// 7. LOCAL DOS ATRIBUTOS
// --------------------------------------------------

const positionLocation = gl.getAttribLocation(program, "aPosition");
const colorLocation = gl.getAttribLocation(program, "aColor");

// --------------------------------------------------
// 8. CONFIGURAR ATRIBUTOS
// --------------------------------------------------

gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
gl.enableVertexAttribArray(colorLocation);
gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

// --------------------------------------------------
// ALGORITMO DE BRESENHAM E RASTERIZAÇÃO CUSTOMIZADA
// --------------------------------------------------

// Gera os pixels da linha entre (x0, y0) e (x1, y1) usando apenas aritmética de inteiros
function bresenhamLine(x0, y0, x1, y1, thickness) {
    const pixels = [];
    
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    let currX = x0;
    let currY = y0;

    const offsetStart = -Math.floor(thickness / 2);
    const offsetEnd = offsetStart + thickness;

    while (true) {
        // Aplica a espessura adicionando vizinhos ao redor de cada pixel do traçado
        for (let ox = offsetStart; ox < offsetEnd; ox++) {
            for (let oy = offsetStart; oy < offsetEnd; oy++) {
                pixels.push(currX + ox, currY + oy);
            }
        }

        if (currX === x1 && currY === y1) break;

        let e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            currX += sx;
        }
        if (e2 < dx) {
            err += dx;
            currY += sy;
        }
    }
    return pixels;
}

let lastDrawnShape = null; // Guarda a última forma desenhada { mode, points }

// Converte pixels da tela para WebGL NDC [-1, 1] e atualiza a geometria
function generateGraphicData() {
    // Se não há pontos pendentes, mas temos a última forma gravada, usamos ela
    let shapeMode = currentMode;
    let shapePoints = clickedPoints;

    if (clickedPoints.length === 0 && lastDrawnShape) {
        shapeMode = lastDrawnShape.mode;
        shapePoints = lastDrawnShape.points;
    }

    const linesToDraw = [];

    if (shapeMode === 'r' && shapePoints.length === 2) {
        linesToDraw.push([shapePoints[0], shapePoints[1]]);
    } else if (shapeMode === 't' && shapePoints.length === 3) {
        linesToDraw.push([shapePoints[0], shapePoints[1]]);
        linesToDraw.push([shapePoints[1], shapePoints[2]]);
        linesToDraw.push([shapePoints[2], shapePoints[0]]);
    }

    if (linesToDraw.length > 0) {
        vertexData = [];
        colorData = [];
        const color = colorPalette[currentColorIndex];

        linesToDraw.forEach(line => {
            const [p0, p1] = line;
            const pxList = bresenhamLine(p0.x, p0.y, p1.x, p1.y, currentThickness);

            for (let i = 0; i < pxList.length; i += 2) {
                const px = pxList[i];
                const py = pxList[i + 1];

                // Converte espaço Canvas [0, 600] para NDC [-1, 1]
                const ndcX = (px / canvas.width) * 2 - 1;
                const ndcY = -((py / canvas.height) * 2 - 1);

                vertexData.push(ndcX, ndcY);
                colorData.push(color[0], color[1], color[2]);
            }
        });
    }

    if (vertexData.length === 0) {
        initInitialLine();
    }

    // Atualiza buffers da GPU
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorData), gl.DYNAMIC_DRAW);
}

// --------------------------------------------------
// 9. INTERAÇÃO COM MOUSE E TECLADO
// --------------------------------------------------

canvas.addEventListener("mousedown", (event) => {
    const x = event.offsetX;
    const y = event.offsetY;

    clickedPoints.push({ x, y });

    const maxPoints = (currentMode === 'r') ? 2 : 3;

    if (clickedPoints.length === maxPoints) {
        lastDrawnShape = {
            mode: currentMode,
            points: [...clickedPoints]
        };
        generateGraphicData();
        drawScene();
        clickedPoints = []; // Limpa para a próxima figura
    }
});

window.addEventListener("keydown", (event) => {
    const key = event.key;

    // Teclas 'r' / 'R' -> Ativa modo RETA
    if (key === 'r' || key === 'R') {
        currentMode = 'r';
        clickedPoints = [];
    }
    // Teclas 't' / 'T' -> Ativa modo TRIÂNGULO
    else if (key === 't' || key === 'T') {
        currentMode = 't';
        clickedPoints = [];
    }
    // Teclas 'k' / 'K' -> Modo mudar cor
    else if (key === 'k' || key === 'K') {
        activeSubMode = 'k';
    }
    // Teclas 'e' / 'E' -> Modo mudar espessura
    else if (key === 'e' || key === 'E') {
        activeSubMode = 'e';
    }
    // Dígitos '0' a '9'
    else if (key >= '0' && key <= '9') {
        const val = parseInt(key);
        if (activeSubMode === 'k') {
            currentColorIndex = val;
        } else if (activeSubMode === 'e') {
            currentThickness = (val === 0) ? 1 : val; // Espessura de 1 a 9px
        }
        // Se já houver um desenho na tela, recarrega com a nova cor/espessura
        if (lastDrawnShape || vertexData.length > 2) {
            generateGraphicData();
            drawScene();
        }
    }
});

// --------------------------------------------------
// 10. LIMPAR TELA E DESENHAR
// --------------------------------------------------

gl.clearColor(0.0, 0.0, 0.0, 1.0);

function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.drawArrays(gl.POINTS, 0, vertexData.length / 2);
}

drawScene();
