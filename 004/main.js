const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// --------------------------------------------------
// VERTICES E CORES
// --------------------------------------------------

function verticesBarra(){
    return new Float32Array([
        -0.05,  0.2,
        -0.05, -0.2,
         0.05,  0.2,
         0.05,  0.2,
        -0.05, -0.2,
         0.05, -0.2
    ]);
}

function verticesBola(){
    let vertices = [];
    let numSegments = 30;
    let radius = 0.05;

    for (let i = 0; i < numSegments; i++) {
        let theta1 = (i / numSegments) * 2 * Math.PI;
        let theta2 = ((i + 1) / numSegments) * 2 * Math.PI;

        vertices.push(0, 0); // Center of the circle
        vertices.push(radius * Math.cos(theta1), radius * Math.sin(theta1));
        vertices.push(radius * Math.cos(theta2), radius * Math.sin(theta2));
    }

    return new Float32Array(vertices);
}

let verticesBarraDireita = verticesBarra();

let corBarraDireita = new Float32Array([
    0.0, 0.0, 1.0,
]);

let verticesBarraEsquerda = verticesBarra();

let corBarraEsquerda = new Float32Array([
    0.0, 1.0, 0.0,
]);

let verticesBolaCentro = verticesBola();

let corBolaCentro = new Float32Array([
    1.0, 0.0, 0.0,
]);

// --------------------------------------------------
// TRANSFORMAÇÕES
// --------------------------------------------------

let MbarraEsquerda = m3.translation(-0.9, 0.0);

let MbarraDireita = m3.translation(0.9, 0.0);

let MbolaCentro = m3.identity();

// --------------------------------------------------
// BUFFER
// --------------------------------------------------

const verticesBuffer = gl.createBuffer();

// --------------------------------------------------
// VERTEX SHADER
// --------------------------------------------------

const vertexShaderSource = `#version 300 es

in vec2 aPosition;

uniform mat3 u_transform;

out vec3 vColor;

void main() {
    vec3 position = u_transform * vec3(aPosition, 1.0);
    gl_Position = vec4(position.xy, 0.0, 1.0);
}

`;


// --------------------------------------------------
// FRAGMENT SHADER
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
// COMPILAR SHADERS
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
// CRIAR PROGRAMA
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
// LOCAL DOS ATRIBUTOS E DO UNIFORM
// --------------------------------------------------

const positionLocation =
    gl.getAttribLocation(
        program,
        "aPosition"
    );

const colorLocation =
    gl.getUniformLocation(
        program,
        "uColor"
    );

const transformLocation =
    gl.getUniformLocation(
        program,
        "u_transform"
    );

// --------------------------------------------------
// LIMPAR TELA
// --------------------------------------------------

gl.clearColor(0.1, 0.1, 0.1, 1.0);

gl.clear(gl.COLOR_BUFFER_BIT);


// --------------------------------------------------
// DESENHAR
// --------------------------------------------------

const numComponents = 2;

function drawScene(){
    
    atualizaAnimacao();

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    drawBarraEsquerda();
    drawBarraDireita();
    drawBolaCentro();
    
    requestAnimationFrame(drawScene);
}

function drawBarraEsquerda(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBarraEsquerda,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBarraEsquerda
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbarraEsquerda
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBarraEsquerda.length / numComponents
    );

}

function drawBarraDireita(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBarraDireita,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBarraDireita
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbarraDireita
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBarraDireita.length / numComponents
    );

}

function drawBolaCentro(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBolaCentro,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBolaCentro
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbolaCentro
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBolaCentro.length / numComponents
    );

}

// --------------------------------------------------
// PARÂMETROS ANIMAÇÃO E ESTADO DO JOGO
// --------------------------------------------------

let tyBE = 0.0;
let tyBD = 0.0;
let velocidadeBarra = 0.03;

let txBola = 0.0;
let tyBola = 0.0;
let txBola_offset = 0.01;
let tyBola_offset = 0.007;

const raioBola = 0.05;
const meiaLarguraBarra = 0.05;
const meiaAlturaBarra = 0.2;
const xBE = -0.9;
const xBD = 0.9;

// Controle contínuo de teclas pressionadas
const keys = {};

document.addEventListener("keydown", function(event) {
    keys[event.key] = true;
});

document.addEventListener("keyup", function(event) {
    keys[event.key] = false;
});

function reiniciaBola() {
    txBola = 0.0;
    tyBola = 0.0;
    // Inverte a direção horizontal no saque para alternar quem recebe a bola
    txBola_offset = -txBola_offset;
}

function atualizaAnimacao(){
    // 1. Movimentação da Barra Esquerda (W / S)
    if (keys["w"] || keys["W"]) {
        tyBE += velocidadeBarra;
    }
    if (keys["s"] || keys["S"]) {
        tyBE -= velocidadeBarra;
    }

    // 2. Movimentação da Barra Direita (ArrowUp / ArrowDown)
    if (keys["ArrowUp"]) {
        tyBD += velocidadeBarra;
    }
    if (keys["ArrowDown"]) {
        tyBD -= velocidadeBarra;
    }

    // 3. Limites das Barras no topo e base da tela (evita sair de [-1, 1])
    const limiteSuperior = 1.0 - meiaAlturaBarra;
    const limiteInferior = -1.0 + meiaAlturaBarra;

    if (tyBE > limiteSuperior) tyBE = limiteSuperior;
    if (tyBE < limiteInferior) tyBE = limiteInferior;
    if (tyBD > limiteSuperior) tyBD = limiteSuperior;
    if (tyBD < limiteInferior) tyBD = limiteInferior;

    // 4. Movimentação da Bola
    txBola += txBola_offset;
    tyBola += tyBola_offset;

    // 5. Colisão da Bola com as Paredes Superior e Inferior
    if (tyBola + raioBola >= 1.0 || tyBola - raioBola <= -1.0) {
        tyBola_offset = -tyBola_offset;
    }

    // 6. Colisão da Bola com a Barra Esquerda (xBE = -0.9)
    if (txBola - raioBola <= xBE + meiaLarguraBarra && txBola + raioBola >= xBE - meiaLarguraBarra) {
        if (tyBola <= tyBE + meiaAlturaBarra && tyBola >= tyBE - meiaAlturaBarra) {
            // Rebate e garante que a bola vá para a direita
            txBola_offset = Math.abs(txBola_offset);
        }
    }

    // 7. Colisão da Bola com a Barra Direita (xBD = 0.9)
    if (txBola + raioBola >= xBD - meiaLarguraBarra && txBola - raioBola <= xBD + meiaLarguraBarra) {
        if (tyBola <= tyBD + meiaAlturaBarra && tyBola >= tyBD - meiaAlturaBarra) {
            // Rebate e garante que a bola vá para a esquerda
            txBola_offset = -Math.abs(txBola_offset);
        }
    }

    // 8. Ponto / Bola Saiu da Tela (Reinicia no centro)
    if (txBola > 1.1 || txBola < -1.1) {
        reiniciaBola();
    }

    // 9. Atualização das Matrizes de Transformação
    MbarraEsquerda = m3.translation(xBE, tyBE);
    MbarraDireita = m3.translation(xBD, tyBD);
    MbolaCentro = m3.translation(txBola, tyBola);
}


// --------------------------------------------------
// INÍCIO DO DESENHO
// --------------------------------------------------

drawScene();