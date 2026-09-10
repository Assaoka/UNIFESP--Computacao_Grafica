const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// --------------------------------------------------
// 1. VÉRTICES E CORES (ROBÔ)
// --------------------------------------------------

// Retângulos e componentes (Triângulos e Pontos)
const vertices = new Float32Array([
    // --- CORPO (Azul) - 2 Triângulos (6 Vértices) ---
    -0.3, -0.4,
     0.3, -0.4,
     0.3,  0.2,
    -0.3, -0.4,
     0.3,  0.2,
    -0.3,  0.2,

    // --- CABEÇA (Prata) - 2 Triângulos (6 Vértices) ---
    -0.2,  0.25,
     0.2,  0.25,
     0.2,  0.6,
    -0.2,  0.25,
     0.2,  0.6,
    -0.2,  0.6,

    // --- BRAÇO ESQUERDO (Cyan) - 6 Vértices ---
    -0.45, -0.3,
    -0.3,  -0.3,
    -0.3,   0.1,
    -0.45, -0.3,
    -0.3,   0.1,
    -0.45,  0.1,

    // --- BRAÇO DIREITO (Cyan) - 6 Vértices ---
     0.3,  -0.3,
     0.45, -0.3,
     0.45,  0.1,
     0.3,  -0.3,
     0.45,  0.1,
     0.3,   0.1,

    // --- PERNA ESQUERDA (Cinza Escuro) - 6 Vértices ---
    -0.25, -0.7,
    -0.1,  -0.7,
    -0.1,  -0.4,
    -0.25, -0.7,
    -0.1,  -0.4,
    -0.25, -0.4,

    // --- PERNA DIREITA (Cinza Escuro) - 6 Vértices ---
     0.1,  -0.7,
     0.25, -0.7,
     0.25, -0.4,
     0.1,  -0.7,
     0.25, -0.4,
     0.1,  -0.4,

    // --- ANTENA HASTE (Amarelo) - Line (2 Vértices) ---
     0.0,  0.6,
     0.0,  0.75,

    // --- ANTENA TOPO (Amarelo) - Point (1 Vértice) ---
     0.0,  0.75,

    // --- OLHO ESQUERDO E DIREITO (Vermelho) - Points (2 Vértices) ---
    -0.08, 0.45,
     0.08, 0.45
]);

const colors = new Float32Array([
    // Corpo (Azul: 0.2, 0.5, 0.9) x6
    0.2, 0.5, 0.9,  0.2, 0.5, 0.9,  0.2, 0.5, 0.9,
    0.2, 0.5, 0.9,  0.2, 0.5, 0.9,  0.2, 0.5, 0.9,

    // Cabeça (Prata: 0.7, 0.7, 0.8) x6
    0.7, 0.7, 0.8,  0.7, 0.7, 0.8,  0.7, 0.7, 0.8,
    0.7, 0.7, 0.8,  0.7, 0.7, 0.8,  0.7, 0.7, 0.8,

    // Braço Esq (Cyan: 0.2, 0.8, 0.9) x6
    0.2, 0.8, 0.9,  0.2, 0.8, 0.9,  0.2, 0.8, 0.9,
    0.2, 0.8, 0.9,  0.2, 0.8, 0.9,  0.2, 0.8, 0.9,

    // Braço Dir (Cyan: 0.2, 0.8, 0.9) x6
    0.2, 0.8, 0.9,  0.2, 0.8, 0.9,  0.2, 0.8, 0.9,
    0.2, 0.8, 0.9,  0.2, 0.8, 0.9,  0.2, 0.8, 0.9,

    // Perna Esq (Escuro: 0.3, 0.3, 0.4) x6
    0.3, 0.3, 0.4,  0.3, 0.3, 0.4,  0.3, 0.3, 0.4,
    0.3, 0.3, 0.4,  0.3, 0.3, 0.4,  0.3, 0.3, 0.4,

    // Perna Dir (Escuro: 0.3, 0.3, 0.4) x6
    0.3, 0.3, 0.4,  0.3, 0.3, 0.4,  0.3, 0.3, 0.4,
    0.3, 0.3, 0.4,  0.3, 0.3, 0.4,  0.3, 0.3, 0.4,

    // Antena Haste (Amarelo: 1.0, 0.8, 0.2) x2
    1.0, 0.8, 0.2,  1.0, 0.8, 0.2,

    // Antena Topo (Amarelo: 1.0, 0.8, 0.2) x1
    1.0, 0.8, 0.2,

    // Olhos (Vermelho: 1.0, 0.2, 0.2) x2
    1.0, 0.2, 0.2,  1.0, 0.2, 0.2
]);


// --------------------------------------------------
// 2. BUFFERS
// --------------------------------------------------

const verticesBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const colorsBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);


// --------------------------------------------------
// 3. VERTEX SHADER
// --------------------------------------------------

const vertexShaderSource = `#version 300 es

in vec2 aPosition;
in vec3 aColor;

out vec3 vColor;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    gl_PointSize = 14.0;
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


const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource
);

const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
);


// --------------------------------------------------
// 6. CRIAR PROGRAMA
// --------------------------------------------------

const program = gl.createProgram();

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

    throw new Error(
        gl.getProgramInfoLog(program)
    );
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
// 9. LIMPAR TELA
// --------------------------------------------------

gl.clearColor(0.1, 0.1, 0.1, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);


// --------------------------------------------------
// 10. DESENHAR
// --------------------------------------------------

gl.useProgram(program);

// Desenha Triângulos (Corpo, Cabeça, Braços, Pernas: 36 vértices)
gl.drawArrays(gl.TRIANGLES, 0, 36);

// Desenha Linha da Antena (2 vértices)
gl.drawArrays(gl.LINES, 36, 2);

// Desenha Topo da Antena e Olhos (Pontos: 3 vértices)
gl.drawArrays(gl.POINTS, 38, 3);
