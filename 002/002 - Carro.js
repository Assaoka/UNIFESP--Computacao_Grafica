const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// --------------------------------------------------
// 1. VÉRTICES E CORES (CARRO)
// --------------------------------------------------

const vertices = new Float32Array([
    // --- CHASSI (Vermelho) - 2 Triângulos (6 Vértices) ---
    -0.6, -0.2,
     0.6, -0.2,
     0.6,  0.0,
    -0.6, -0.2,
     0.6,  0.0,
    -0.6,  0.0,

    // --- CABINE (Azul Escuro) - 2 Triângulos (6 Vértices) ---
    -0.3,  0.0,
     0.3,  0.0,
     0.2,  0.3,
    -0.3,  0.0,
     0.2,  0.3,
    -0.2,  0.3,

    // --- RODAS (Cinza Escuro) - 2 Pontos (2 Vértices) ---
    -0.35, -0.22,
     0.35, -0.22
]);

const colors = new Float32Array([
    // Chassi (Vermelho: 0.9, 0.2, 0.2) x6
    0.9, 0.2, 0.2,
    0.9, 0.2, 0.2,
    0.9, 0.2, 0.2,
    0.9, 0.2, 0.2,
    0.9, 0.2, 0.2,
    0.9, 0.2, 0.2,

    // Cabine (Azul Escuro: 0.2, 0.4, 0.8) x6
    0.2, 0.4, 0.8,
    0.2, 0.4, 0.8,
    0.2, 0.4, 0.8,
    0.2, 0.4, 0.8,
    0.2, 0.4, 0.8,
    0.2, 0.4, 0.8,

    // Rodas (Cinza Escuro: 0.2, 0.2, 0.2) x2
    0.2, 0.2, 0.2,
    0.2, 0.2, 0.2
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
    gl_PointSize = 35.0; // Tamanho das rodas do carro
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

// 1. Desenha o Chassi e a Cabine (12 Vértices em TRIANGLES)
gl.drawArrays(gl.TRIANGLES, 0, 12);

// 2. Desenha as 2 Rodas (2 Vértices em POINTS)
gl.drawArrays(gl.POINTS, 12, 2);
