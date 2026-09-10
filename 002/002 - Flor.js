const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// --------------------------------------------------
// 1. VÉRTICES E CORES (FLOR)
// --------------------------------------------------

const vertices = new Float32Array([
    // --- CAULE (Verde Escuro) - Line (2 Vértices) ---
     0.0, -0.7,
     0.0,  0.1,

    // --- PÉTALAS (Rosa/Vermelho) - 4 Triângulos (12 Vértices) ---
    // Pétala Cima
    -0.1,  0.1,
     0.1,  0.1,
     0.0,  0.5,

    // Pétala Baixo
    -0.1,  0.1,
     0.1,  0.1,
     0.0, -0.3,

    // Pétala Esquerda
    -0.1,  0.1,
    -0.1, -0.1,
    -0.5,  0.0,

    // Pétala Direita
     0.1,  0.1,
     0.1, -0.1,
     0.5,  0.0,

    // --- MIOLO (Amarelo) - Point (1 Vértice) ---
     0.0,  0.0
]);

const colors = new Float32Array([
    // Caule (Verde: 0.1, 0.7, 0.2) x2
    0.1, 0.7, 0.2,
    0.1, 0.7, 0.2,

    // Pétala Cima (Rosa: 0.9, 0.3, 0.5) x3
    0.9, 0.3, 0.5,
    0.9, 0.3, 0.5,
    0.9, 0.3, 0.5,

    // Pétala Baixo (Rosa: 0.9, 0.3, 0.5) x3
    0.9, 0.3, 0.5,
    0.9, 0.3, 0.5,
    0.9, 0.3, 0.5,

    // Pétala Esquerda (Rosa: 0.9, 0.3, 0.5) x3
    0.9, 0.3, 0.5,
    0.9, 0.3, 0.5,
    0.9, 0.3, 0.5,

    // Pétala Direita (Rosa: 0.9, 0.3, 0.5) x3
    0.9, 0.3, 0.5,
    0.9, 0.3, 0.5,
    0.9, 0.3, 0.5,

    // Miolo (Amarelo: 1.0, 0.9, 0.1) x1
    1.0, 0.9, 0.1
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
    gl_PointSize = 40.0; // Tamanho do miolo da flor
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

// 1. Desenha o Caule (Linha: 2 vértices)
gl.drawArrays(gl.LINES, 0, 2);

// 2. Desenha as Pétalas (4 Triângulos: 12 vértices)
gl.drawArrays(gl.TRIANGLES, 2, 12);

// 3. Desenha o Miolo (Ponto: 1 vértice)
gl.drawArrays(gl.POINTS, 14, 1);
