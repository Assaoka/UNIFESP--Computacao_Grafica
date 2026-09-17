const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// --------------------------------------------------
// 1. VÉRTICES E CORES
// --------------------------------------------------

// Retângulo centrado na origem [-w/2, +w/2] x [-h/2, +h/2]
function criarRetangulo(largura, altura) {
    const w2 = largura / 2;
    const h2 = altura / 2;
    return new Float32Array([
        -w2, -h2,
         w2, -h2,
         w2,  h2,
        -w2, -h2,
         w2,  h2,
        -w2,  h2
    ]);
}

// Retângulo cujo pivô fica no topo (y vai de -altura até 0)
// Ideal para braços e pernas rotacionarem no ponto de articulação superior (ombro / quadril)
function criarMembro(largura, altura) {
    const w2 = largura / 2;
    return new Float32Array([
        -w2, -altura,
         w2, -altura,
         w2,  0.0,
        -w2, -altura,
         w2,  0.0,
        -w2,  0.0
    ]);
}

// Geometrias das partes do robô
const verticesCorpo = criarRetangulo(0.6, 0.6);        // Largura 0.6, Altura 0.6
const verticesCabeca = criarRetangulo(0.4, 0.35);      // Largura 0.4, Altura 0.35
const verticesBraco = criarMembro(0.15, 0.4);          // Membro de 0.15 x 0.4 articulado no topo
const verticesPerna = criarMembro(0.15, 0.3);          // Membro de 0.15 x 0.3 articulado no topo

const verticesHaste = new Float32Array([
    0.0, 0.0,
    0.0, 0.15
]);

const verticesPonto = new Float32Array([
    0.0, 0.0
]);

// Cores das partes (RGB)
const corCorpo = new Float32Array([0.2, 0.5, 0.9]);         // Azul
const corCabeca = new Float32Array([0.7, 0.7, 0.8]);        // Prata
const corBracoEsq = new Float32Array([0.2, 0.8, 0.9]);      // Ciano
const corBracoDir = new Float32Array([0.2, 0.8, 0.9]);      // Ciano
const corPernaEsq = new Float32Array([0.3, 0.3, 0.4]);      // Cinza Escuro
const corPernaDir = new Float32Array([0.3, 0.3, 0.4]);      // Cinza Escuro
const corAmarelo = new Float32Array([1.0, 0.8, 0.2]);       // Amarelo (Antena)
const corVermelho = new Float32Array([1.0, 0.2, 0.2]);      // Vermelho (Olhos)


// --------------------------------------------------
// 2. BUFFERS
// --------------------------------------------------

const verticesBuffer = gl.createBuffer();


// --------------------------------------------------
// 3. VERTEX SHADER
// --------------------------------------------------

const vertexShaderSource = `#version 300 es

in vec2 aPosition;

uniform mat3 u_transform;

void main() {
    vec3 position = u_transform * vec3(aPosition, 1.0);
    gl_Position = vec4(position.xy, 0.0, 1.0);
    gl_PointSize = 12.0;
}
`;


// --------------------------------------------------
// 4. FRAGMENT SHADER
// --------------------------------------------------

const fragmentShaderSource = `#version 300 es

precision mediump float;

uniform vec3 uColor;

out vec4 outColor;

void main() {
    outColor = vec4(uColor, 1.0);
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
// 7. LOCAL DOS ATRIBUTOS E UNIFORMS
// --------------------------------------------------

const positionLocation = gl.getAttribLocation(program, "aPosition");
const colorLocation = gl.getUniformLocation(program, "uColor");
const transformLocation = gl.getUniformLocation(program, "u_transform");


// --------------------------------------------------
// 8. CONFIGURAR ATRIBUTOS
// --------------------------------------------------

gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);


// --------------------------------------------------
// 9. LIMPAR TELA E FUNÇÕES DE DESENHO AUXILIARES
// --------------------------------------------------

gl.clearColor(0.1, 0.1, 0.1, 1.0);

function desenharObjeto(vertices, modoDesenho, numVertices, cor, matrizTransform) {
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    gl.uniform3fv(colorLocation, cor);
    gl.uniformMatrix3fv(transformLocation, false, matrizTransform);

    gl.drawArrays(modoDesenho, 0, numVertices);
}


// --------------------------------------------------
// 10. ANIMAÇÃO E DESENHO
// --------------------------------------------------

let tempo = 0;

function drawScene() {
    tempo += 0.04;

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    // 1. Movimento global do Robô (desloca horizontalmente e flutua levemente)
    const roboX = Math.sin(tempo * 0.5) * 0.35;
    const roboY = Math.abs(Math.sin(tempo * 2.0)) * 0.04;
    const matrizRobo = m3.translation(roboX, roboY);

    // 2. CORPO (Centrado no referencial do robô em (0.0, -0.1))
    const matrizCorpo = m3.translate(matrizRobo, 0.0, -0.1);
    desenharObjeto(verticesCorpo, gl.TRIANGLES, 6, corCorpo, matrizCorpo);

    // 3. CABEÇA (Fica em cima do corpo e balança/gira levemente de forma autônoma)
    const anguloCabeca = Math.sin(tempo * 1.5) * 0.12; // balanço da cabeça
    let matrizCabeca = m3.translate(matrizRobo, 0.0, 0.425);
    matrizCabeca = m3.rotate(matrizCabeca, anguloCabeca);
    desenharObjeto(verticesCabeca, gl.TRIANGLES, 6, corCabeca, matrizCabeca);

    // Detalhes da Cabeça (seguem a matriz da cabeça)
    // Haste da Antena
    const matrizHaste = m3.translate(matrizCabeca, 0.0, 0.175);
    desenharObjeto(verticesHaste, gl.LINES, 2, corAmarelo, matrizHaste);

    // Topo da Antena
    const matrizTopo = m3.translate(matrizHaste, 0.0, 0.15);
    desenharObjeto(verticesPonto, gl.POINTS, 1, corAmarelo, matrizTopo);

    // Olhos
    const matrizOlhoEsq = m3.translate(matrizCabeca, -0.08, 0.025);
    desenharObjeto(verticesPonto, gl.POINTS, 1, corVermelho, matrizOlhoEsq);

    const matrizOlhoDir = m3.translate(matrizCabeca, 0.08, 0.025);
    desenharObjeto(verticesPonto, gl.POINTS, 1, corVermelho, matrizOlhoDir);

    // 4. BRAÇOS (Movimento oscilatório de caminhada / balanço nos ombros)
    // Ângulos alternados para os braços (frequência 1.8)
    const anguloBracoEsq = Math.sin(tempo * 1.8) * 0.6;
    const anguloBracoDir = -Math.sin(tempo * 1.8) * 0.6;

    // Braço Esquerdo (Ombro em (-0.375, 0.1))
    let matrizBracoEsq = m3.translate(matrizRobo, -0.375, 0.1);
    matrizBracoEsq = m3.rotate(matrizBracoEsq, anguloBracoEsq);
    desenharObjeto(verticesBraco, gl.TRIANGLES, 6, corBracoEsq, matrizBracoEsq);

    // Braço Direito (Ombro em (0.375, 0.1))
    let matrizBracoDir = m3.translate(matrizRobo, 0.375, 0.1);
    matrizBracoDir = m3.rotate(matrizBracoDir, anguloBracoDir);
    desenharObjeto(verticesBraco, gl.TRIANGLES, 6, corBracoDir, matrizBracoDir);

    // 5. PERNAS (Movimento alternado de caminhada na bacia, com frequência e fase diferentes)
    // Pernas balançam em oposição aos braços para marcha realista
    const anguloPernaEsq = -Math.sin(tempo * 1.8) * 0.45;
    const anguloPernaDir = Math.sin(tempo * 1.8) * 0.45;

    // Perna Esquerda (Quadril em (-0.175, -0.4))
    let matrizPernaEsq = m3.translate(matrizRobo, -0.175, -0.4);
    matrizPernaEsq = m3.rotate(matrizPernaEsq, anguloPernaEsq);
    desenharObjeto(verticesPerna, gl.TRIANGLES, 6, corPernaEsq, matrizPernaEsq);

    // Perna Direita (Quadril em (0.175, -0.4))
    let matrizPernaDir = m3.translate(matrizRobo, 0.175, -0.4);
    matrizPernaDir = m3.rotate(matrizPernaDir, anguloPernaDir);
    desenharObjeto(verticesPerna, gl.TRIANGLES, 6, corPernaDir, matrizPernaDir);

    requestAnimationFrame(drawScene);
}

// Inicia o ciclo de animação
drawScene();
