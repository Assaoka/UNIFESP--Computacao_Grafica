/**
 * ATIVIDADE 004 - PONG 2D EM WEBGL 2.0 COM MATRIZES DE TRANSFORMAÇÃO
 * Disciplina: Computação Gráfica — UNIFESP
 * Padrão Arquitetural: 10 Seções Canônicas da Professora
 */

const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado pelo seu navegador.");
}

// =========================================================================
// BIBLIOTECA DE MATRIZES 3x3 (m3.js Canônica da Professora - Column-Major)
// =========================================================================
const m3 = {
    identity: function() {
        return [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ];
    },

    multiply: function(a, b) {
        let a00 = a[0*3+0], a01 = a[1*3+0], a02 = a[2*3+0];
        let a10 = a[0*3+1], a11 = a[1*3+1], a12 = a[2*3+1];
        let a20 = a[0*3+2], a21 = a[1*3+2], a22 = a[2*3+2];

        let b00 = b[0*3+0], b01 = b[1*3+0], b02 = b[2*3+0];
        let b10 = b[0*3+1], b11 = b[1*3+1], b12 = b[2*3+1];
        let b20 = b[0*3+2], b21 = b[1*3+2], b22 = b[2*3+2];

        return [
            a00*b00 + a01*b10 + a02*b20, a10*b00 + a11*b10 + a12*b20, a20*b00 + a21*b10 + a22*b20,
            a00*b01 + a01*b11 + a02*b21, a10*b01 + a11*b11 + a12*b21, a20*b01 + a21*b11 + a22*b21,
            a00*b02 + a01*b12 + a02*b22, a10*b02 + a11*b12 + a12*b22, a20*b02 + a21*b12 + a22*b22
        ];
    },

    translation: function(tx, ty) {
        return [
            1,  0,  0,
            0,  1,  0,
            tx, ty, 1
        ];
    },

    scaling: function(sx, sy) {
        return [
            sx, 0,  0,
            0,  sy, 0,
            0,  0,  1
        ];
    },

    rotation: function(angleInRadians) {
        let c = Math.cos(angleInRadians);
        let s = Math.sin(angleInRadians);
        return [
            c, s, 0,
           -s, c, 0,
            0, 0, 1
        ];
    },

    translate: function(m, tx, ty) {
        return m3.multiply(m3.translation(tx, ty), m);
    },

    rotate: function(m, angleInRadians) {
        return m3.multiply(m3.rotation(angleInRadians), m);
    },

    scale: function(m, sx, sy) {
        return m3.multiply(m3.scaling(sx, sy), m);
    }
};

/* =========================================================================
   1. VÉRTICES E CORES
   ========================================================================= */

// Modelo Canônico: Quadrado Unitário Centrado na Origem [-0.5, 0.5]
// Usado para desenhar Raquetes, Bola e Linhas do Campo via transformações!
const unitSquareVertices = new Float32Array([
    -0.5, -0.5,
     0.5, -0.5,
    -0.5,  0.5,
    -0.5,  0.5,
     0.5, -0.5,
     0.5,  0.5
]);

// Paleta de Cores em Formato RGB Normalizado [0.0, 1.0]
const COLOR_PADDLE1 = new Float32Array([0.22, 0.74, 0.97]); // Ciano Neon
const COLOR_PADDLE2 = new Float32Array([0.75, 0.52, 0.99]); // Roxo Elétrico
const COLOR_BALL    = new Float32Array([0.98, 0.75, 0.14]); // Âmbar Dourado
const COLOR_NET     = new Float32Array([0.28, 0.33, 0.41]); // Cinza Suave

/* =========================================================================
   2. BUFFERS
   ========================================================================= */

const squareBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, squareBuffer);
gl.bufferData(gl.ARRAY_BUFFER, unitSquareVertices, gl.STATIC_DRAW);

/* =========================================================================
   3. VERTEX SHADER
   ========================================================================= */

const vertexShaderSource = `#version 300 es
in vec2 aPosition;

uniform mat3 u_transform;

void main() {
    // 1. Eleva coordenada vec2 para homogênea (x, y, 1.0)
    // 2. Multiplica pela matriz 3x3 calculada na CPU
    vec3 position = u_transform * vec3(aPosition, 1.0);
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/* =========================================================================
   4. FRAGMENT SHADER
   ========================================================================= */

const fragmentShaderSource = `#version 300 es
precision mediump float;

uniform vec3 u_color;
out vec4 outColor;

void main() {
    outColor = vec4(u_color, 1.0);
}
`;

/* =========================================================================
   5. COMPILAR SHADERS
   ========================================================================= */

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Erro ao compilar Shader (${type === gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT"}): ${info}`);
    }
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

/* =========================================================================
   6. CRIAR PROGRAMA
   ========================================================================= */

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Erro ao linkar programa WebGL: ${gl.getProgramInfoLog(program)}`);
}

gl.useProgram(program);

/* =========================================================================
   7. LOCAL DOS ATRIBUTOS E UNIFORMS
   ========================================================================= */

const positionAttributeLocation = gl.getAttribLocation(program, "aPosition");
const transformUniformLocation  = gl.getUniformLocation(program, "u_transform");
const colorUniformLocation      = gl.getUniformLocation(program, "u_color");

/* =========================================================================
   8. CONFIGURAR ATRIBUTOS
   ========================================================================= */

gl.bindBuffer(gl.ARRAY_BUFFER, squareBuffer);
gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(
    positionAttributeLocation,
    2,          // vec2 (x, y)
    gl.FLOAT,   // tipo float
    false,      // normalizado
    0,          // stride
    0           // offset
);

/* =========================================================================
   9. LIMPAR TELA
   ========================================================================= */

gl.clearColor(0.03, 0.05, 0.09, 1.0); // Fundo escuro azulado elegante

/* =========================================================================
   10. DESENHAR (ESTADO DO JOGO, TRANSFORMAÇÕES E LOOP DE ANIMAÇÃO)
   ========================================================================= */

// Dimensões em Coordenadas Normalizadas de Dispositivo (NDC [-1.0, 1.0])
const paddleWidth = 0.04;
const paddleHeight = 0.35;
const paddleSpeed = 0.025;

let p1Y = 0.0;
let p2Y = 0.0;

// Estado da Bola
const ballSize = 0.05;
let ballX = 0.0;
let ballY = 0.0;
let ballSpeedX = 0.015;
let ballSpeedY = 0.010;
let ballRotation = 0.0;

// Placar
let scoreP1 = 0;
let scoreP2 = 0;

// Teclado
const keys = {};
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === "r" || e.key === "R") {
        resetGame();
    }
});
window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

function resetBall() {
    ballX = 0.0;
    ballY = 0.0;
    ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 0.015;
    ballSpeedY = (Math.random() * 2 - 1) * 0.012;
    ballRotation = 0.0;
}

function resetGame() {
    scoreP1 = 0;
    scoreP2 = 0;
    p1Y = 0.0;
    p2Y = 0.0;
    resetBall();
}

function updatePhysics() {
    // 1. Movimento Jogador 1 (W / S)
    if (keys["w"] || keys["W"]) p1Y += paddleSpeed;
    if (keys["s"] || keys["S"]) p1Y -= paddleSpeed;

    // Limites de tela Jogador 1
    const maxPaddleY = 1.0 - paddleHeight / 2;
    p1Y = Math.max(-maxPaddleY, Math.min(maxPaddleY, p1Y));

    // 2. Movimento Jogador 2 (Setas ou IA simples)
    if (keys["ArrowUp"]) {
        p2Y += paddleSpeed;
    } else if (keys["ArrowDown"]) {
        p2Y -= paddleSpeed;
    } else {
        // IA Suave acompanhando a bola se não houver clique nas setas
        const target = ballY;
        if (p2Y < target - 0.05) p2Y += paddleSpeed * 0.65;
        if (p2Y > target + 0.05) p2Y -= paddleSpeed * 0.65;
    }
    p2Y = Math.max(-maxPaddleY, Math.min(maxPaddleY, p2Y));

    // 3. Movimento da Bola
    ballX += ballSpeedX;
    ballY += ballSpeedY;
    ballRotation += Math.hypot(ballSpeedX, ballSpeedY) * 3.0; // Rotação angular em torno do próprio centro

    // Colisão Paredes Superior/Inferior
    const maxBallY = 1.0 - ballSize / 2;
    if (ballY >= maxBallY) {
        ballY = maxBallY;
        ballSpeedY = -ballSpeedY;
    } else if (ballY <= -maxBallY) {
        ballY = -maxBallY;
        ballSpeedY = -ballSpeedY;
    }

    // Colisão com Raquete 1 (Esquerda: x = -0.85)
    const p1X = -0.85;
    if (
        ballX - ballSize / 2 <= p1X + paddleWidth / 2 &&
        ballX + ballSize / 2 >= p1X - paddleWidth / 2 &&
        ballY <= p1Y + paddleHeight / 2 &&
        ballY >= p1Y - paddleHeight / 2 &&
        ballSpeedX < 0
    ) {
        ballSpeedX = -ballSpeedX * 1.05; // Aumenta 5% de velocidade
        // Efeito na direção vertical conforme o local do impacto
        ballSpeedY += (ballY - p1Y) * 0.04;
    }

    // Colisão com Raquete 2 (Direita: x = 0.85)
    const p2X = 0.85;
    if (
        ballX + ballSize / 2 >= p2X - paddleWidth / 2 &&
        ballX - ballSize / 2 <= p2X + paddleWidth / 2 &&
        ballY <= p2Y + paddleHeight / 2 &&
        ballY >= p2Y - paddleHeight / 2 &&
        ballSpeedX > 0
    ) {
        ballSpeedX = -ballSpeedX * 1.05;
        ballSpeedY += (ballY - p2Y) * 0.04;
    }

    // Ponto / Gol
    if (ballX > 1.1) {
        scoreP1++;
        resetBall();
    } else if (ballX < -1.1) {
        scoreP2++;
        resetBall();
    }
}

function drawObject(matrix, color) {
    gl.uniformMatrix3fv(transformUniformLocation, false, matrix);
    gl.uniform3fv(colorUniformLocation, color);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function drawScene() {
    updatePhysics();

    gl.clear(gl.COLOR_BUFFER_BIT);

    // 1. Desenhar Linha Central Pontilhada (Net)
    for (let y = -0.9; y <= 0.9; y += 0.15) {
        let mNet = m3.translation(0.0, y);
        mNet = m3.scale(mNet, 0.015, 0.07);
        drawObject(mNet, COLOR_NET);
    }

    // 2. Desenhar Raquete 1 (Translação + Escala)
    let mPaddle1 = m3.translation(-0.85, p1Y);
    mPaddle1 = m3.scale(mPaddle1, paddleWidth, paddleHeight);
    drawObject(mPaddle1, COLOR_PADDLE1);

    // 3. Desenhar Raquete 2 (Translação + Escala)
    let mPaddle2 = m3.translation(0.85, p2Y);
    mPaddle2 = m3.scale(mPaddle2, paddleWidth, paddleHeight);
    drawObject(mPaddle2, COLOR_PADDLE2);

    // 4. Desenhar Bola (Translação + Rotação no próprio eixo + Escala)
    // Ordem: T(bx, by) * R(theta) * S(size, size)
    let mBall = m3.translation(ballX, ballY);
    mBall = m3.rotate(mBall, ballRotation);
    mBall = m3.scale(mBall, ballSize, ballSize);
    drawObject(mBall, COLOR_BALL);

    // Próximo Quadro
    requestAnimationFrame(drawScene);
}

// Iniciar o Loop Contínuo a 60 FPS
requestAnimationFrame(drawScene);
