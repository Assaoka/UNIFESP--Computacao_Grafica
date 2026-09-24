// ==================================================
// CONFIGURAÇÃO DO CANVAS E WEBGL
// ==================================================

const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// ==================================================
// SHADERS GLSL ES 3.00
// ==================================================

const vertexShaderSource = `#version 300 es

in vec3 aPosition;
in vec3 aColor;

out vec3 vColor;

uniform mat4 u_modelTransform;

void main() {
    vColor = aColor;
    gl_Position = u_modelTransform * vec4(aPosition, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es

precision mediump float;

in vec3 vColor;
out vec4 outColor;

void main() {
    outColor = vec4(vColor, 1.0);
}
`;

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

function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
    }

    return program;
}

const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

// ==================================================
// GEOMETRIA DO HELICÓPTERO (Vértices, Cores e Índices)
// ==================================================

function helicopterBodyVertices() {
    return new Float32Array([
        // Front
        -0.2, -0.2,  0.2,
         0.2, -0.2,  0.2,
         0.2,  0.2,  0.2,
        -0.2,  0.2,  0.2,

        // Back
        -0.2, -0.2, -0.2,
         0.2, -0.2, -0.2,
         0.2,  0.2, -0.2,
        -0.2,  0.2, -0.2
    ]);
}

function helicopterBodyColors() {
    return new Float32Array([
        // Front
        0.2, 0.7, 0.9,
        0.2, 0.7, 0.9,
        0.2, 0.7, 0.9,
        0.2, 0.7, 0.9,

        // Back
        0.1, 0.5, 0.7,
        0.1, 0.5, 0.7,
        0.1, 0.5, 0.7,
        0.1, 0.5, 0.7
    ]);
}

function helicopterBodyIndices() {
    return new Uint16Array([
        // Front
        0, 1, 2,
        0, 2, 3,

        // Back
        4, 6, 5,
        4, 7, 6,

        // Left
        0, 3, 7,
        0, 7, 4,

        // Right
        1, 5, 6,
        1, 6, 2,

        // Top
        3, 2, 6,
        3, 6, 7,

        // Bottom
        0, 4, 5,
        0, 5, 1
    ]);
}

function helicopterTopShaftVertices() {
    return new Float32Array([
        // Face inferior
        -0.03, 0.20, -0.03,
         0.03, 0.20, -0.03,
         0.03, 0.20,  0.03,
        -0.03, 0.20,  0.03,

        // Face superior
        -0.03, 0.30, -0.03,
         0.03, 0.30, -0.03,
         0.03, 0.30,  0.03,
        -0.03, 0.30,  0.03
    ]);
}

function helicopterTopShaftColors() {
    return new Float32Array([
        0.3, 0.3, 0.3,
        0.3, 0.3, 0.3,
        0.3, 0.3, 0.3,
        0.3, 0.3, 0.3,

        0.4, 0.4, 0.4,
        0.4, 0.4, 0.4,
        0.4, 0.4, 0.4,
        0.4, 0.4, 0.4
    ]);
}

function helicopterTopShaftIndices() {
    return new Uint16Array([
        0, 1, 2,
        0, 2, 3,

        4, 6, 5,
        4, 7, 6,

        0, 4, 5,
        0, 5, 1,

        3, 2, 6,
        3, 6, 7,

        0, 3, 7,
        0, 7, 4,

        1, 5, 6,
        1, 6, 2
    ]);
}

function helicopterTailVertices() {
    return new Float32Array([
         0.0, -0.05,  0.05,
         0.7, -0.05,  0.05,
         0.7,  0.05,  0.05,
         0.0,  0.05,  0.05,

         0.0, -0.05, -0.05,
         0.7, -0.05, -0.05,
         0.7,  0.05, -0.05,
         0.0,  0.05, -0.05
    ]);
}

function helicopterTailColors() {
    return new Float32Array([
        0.8, 0.2, 0.2,
        0.8, 0.2, 0.2,
        0.8, 0.2, 0.2,
        0.8, 0.2, 0.2,

        0.6, 0.1, 0.1,
        0.6, 0.1, 0.1,
        0.6, 0.1, 0.1,
        0.6, 0.1, 0.1
    ]);
}

function helicopterTailIndices() {
    return new Uint16Array([
        0, 1, 2,
        0, 2, 3,

        4, 6, 5,
        4, 7, 6,

        0, 3, 7,
        0, 7, 4,

        1, 5, 6,
        1, 6, 2,

        3, 2, 6,
        3, 6, 7,

        0, 4, 5,
        0, 5, 1
    ]);
}

function helicopterPropellersVertices() {
    return new Float32Array([
        // PROPELLER 1
        -0.8, 0.30, -0.05,
         0.8, 0.30, -0.05,
         0.8, 0.30,  0.05,
        -0.8, 0.30,  0.05,

        -0.8, 0.35, -0.05,
         0.8, 0.35, -0.05,
         0.8, 0.35,  0.05,
        -0.8, 0.35,  0.05,

        // PROPELLER 2
        -0.05, 0.35, -0.8,
         0.05, 0.35, -0.8,
         0.05, 0.35,  0.8,
        -0.05, 0.35,  0.8,

        -0.05, 0.40, -0.8,
         0.05, 0.40, -0.8,
         0.05, 0.40,  0.8,
        -0.05, 0.40,  0.8
    ]);
}

function helicopterPropellersColors() {
    return new Float32Array([
        // Verde suave
        0.4, 0.8, 0.4,
        0.4, 0.8, 0.4,
        0.4, 0.8, 0.4,
        0.4, 0.8, 0.4,

        0.4, 0.8, 0.4,
        0.4, 0.8, 0.4,
        0.4, 0.8, 0.4,
        0.4, 0.8, 0.4,

        // Ciano suave
        0.4, 0.85, 0.85,
        0.4, 0.85, 0.85,
        0.4, 0.85, 0.85,
        0.4, 0.85, 0.85,

        0.4, 0.85, 0.85,
        0.4, 0.85, 0.85,
        0.4, 0.85, 0.85,
        0.4, 0.85, 0.85
    ]);
}

function helicopterPropellersIndices() {
    return new Uint16Array([
        // Propeller 1
        0, 1, 2,
        0, 2, 3,

        4, 6, 5,
        4, 7, 6,

        0, 4, 5,
        0, 5, 1,

        3, 2, 6,
        3, 6, 7,

        0, 3, 7,
        0, 7, 4,

        1, 5, 6,
        1, 6, 2,

        // Propeller 2
        8, 9, 10,
        8, 10, 11,

        12, 14, 13,
        12, 15, 14,

        8, 12, 13,
        8, 13, 9,

        11, 10, 14,
        11, 14, 15,

        8, 11, 15,
        8, 15, 12,

        9, 13, 14,
        9, 14, 10
    ]);
}

function helicopterTailPropellerVertices() {
    return new Float32Array([
        // PÁ 1 — direção X
        0.55, -0.025, 0.05,
        0.85, -0.025, 0.05,
        0.85,  0.025, 0.05,
        0.55,  0.025, 0.05,

        0.55, -0.025, 0.06,
        0.85, -0.025, 0.06,
        0.85,  0.025, 0.06,
        0.55,  0.025, 0.06,

        // PÁ 2 — direção Y
        0.675, -0.15, 0.06,
        0.725, -0.15, 0.06,
        0.725,  0.15, 0.06,
        0.675,  0.15, 0.06,

        0.675, -0.15, 0.07,
        0.725, -0.15, 0.07,
        0.725,  0.15, 0.07,
        0.675,  0.15, 0.07
    ]);
}

function helicopterTailPropellerColors() {
    return new Float32Array([
        // Pá 1
        0.35, 0.75, 0.65,
        0.35, 0.75, 0.65,
        0.35, 0.75, 0.65,
        0.35, 0.75, 0.65,

        0.35, 0.75, 0.65,
        0.35, 0.75, 0.65,
        0.35, 0.75, 0.65,
        0.35, 0.75, 0.65,

        // Pá 2
        0.35, 0.85, 0.85,
        0.35, 0.85, 0.85,
        0.35, 0.85, 0.85,
        0.35, 0.85, 0.85,

        0.35, 0.85, 0.85,
        0.35, 0.85, 0.85,
        0.35, 0.85, 0.85,
        0.35, 0.85, 0.85
    ]);
}

function helicopterTailPropellerIndices() {
    return new Uint16Array([
        // Pá 1
        0, 1, 2,
        0, 2, 3,

        4, 6, 5,
        4, 7, 6,

        0, 4, 5,
        0, 5, 1,

        3, 2, 6,
        3, 6, 7,

        0, 3, 7,
        0, 7, 4,

        1, 5, 6,
        1, 6, 2,

        // Pá 2
        8, 9, 10,
        8, 10, 11,

        12, 14, 13,
        12, 15, 14,

        8, 12, 13,
        8, 13, 9,

        11, 10, 14,
        11, 14, 15,

        8, 11, 15,
        8, 15, 12,

        9, 13, 14,
        9, 14, 10
    ]);
}

const helicopterBodyGeometry = {
    vertices: helicopterBodyVertices(),
    colors: helicopterBodyColors(),
    indices: helicopterBodyIndices()
};

const helicopterTopShaftGeometry = {
    vertices: helicopterTopShaftVertices(),
    colors: helicopterTopShaftColors(),
    indices: helicopterTopShaftIndices()
};

const helicopterTailGeometry = {
    vertices: helicopterTailVertices(),
    colors: helicopterTailColors(),
    indices: helicopterTailIndices()
};

const helicopterPropellersGeometry = {
    vertices: helicopterPropellersVertices(),
    colors: helicopterPropellersColors(),
    indices: helicopterPropellersIndices()
};

const helicopterTailPropellerGeometry = {
    vertices: helicopterTailPropellerVertices(),
    colors: helicopterTailPropellerColors(),
    indices: helicopterTailPropellerIndices()
};

// ==================================================
// CLASSE RENDERER
// ==================================================

class Renderer {
    constructor(gl, program) {
        this.gl = gl;
        this.program = program;

        this.positionLocation = gl.getAttribLocation(program, "aPosition");
        this.colorLocation = gl.getAttribLocation(program, "aColor");
        this.modelTransformLocation = gl.getUniformLocation(program, "u_modelTransform");

        this.verticesBuffer = gl.createBuffer();
        this.colorBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();
    }

    draw(object) {
        const gl = this.gl;

        // Vértices
        gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, object.vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 0, 0);

        // Cores
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, object.colors, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.colorLocation);
        gl.vertexAttribPointer(this.colorLocation, 3, gl.FLOAT, false, 0, 0);

        // Índices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, object.indices, gl.STATIC_DRAW);

        // Transformação do Modelo
        gl.uniformMatrix4fv(this.modelTransformLocation, false, object.modelTransform);

        // Desenhar elementos
        gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0);
    }
}

// ==================================================
// CLASSES DE OBJETOS DA CENA
// ==================================================

class SceneObject {
    constructor(vertices, colors, indices) {
        this.vertices = vertices;
        this.colors = colors;
        this.indices = indices;
        this.modelTransform = m4.identity();
    }

    update(modelTransform) {
        this.modelTransform = modelTransform;
    }

    updateModelTransform(modelTransform) {
        this.modelTransform = modelTransform;
    }

    draw(renderer) {
        renderer.draw(this);
    }
}

class HelicopterBody extends SceneObject {
    constructor() {
        super(
            helicopterBodyGeometry.vertices,
            helicopterBodyGeometry.colors,
            helicopterBodyGeometry.indices
        );
    }
}

class HelicopterTopShaft extends SceneObject {
    constructor() {
        super(
            helicopterTopShaftGeometry.vertices,
            helicopterTopShaftGeometry.colors,
            helicopterTopShaftGeometry.indices
        );
    }
}

class HelicopterTail extends SceneObject {
    constructor() {
        super(
            helicopterTailGeometry.vertices,
            helicopterTailGeometry.colors,
            helicopterTailGeometry.indices
        );
    }
}

class HelicopterPropellers extends SceneObject {
    constructor() {
        super(
            helicopterPropellersGeometry.vertices,
            helicopterPropellersGeometry.colors,
            helicopterPropellersGeometry.indices
        );
    }
}

class HelicopterTailPropeller extends SceneObject {
    constructor() {
        super(
            helicopterTailPropellerGeometry.vertices,
            helicopterTailPropellerGeometry.colors,
            helicopterTailPropellerGeometry.indices
        );
    }
}

// ==================================================
// CONTROLE DO TECLADO (Interação Contínua)
// ==================================================

const keys = {};

window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault(); // Evita scroll da página com as setas
    }
    keys[event.key] = true;
});

window.addEventListener("keyup", (event) => {
    keys[event.key] = false;
});

// ==================================================
// CLASSE SCENE (Gerencia Animação e Transformações Hierárquicas)
// ==================================================

class Scene {
    constructor(gl, program) {
        this.gl = gl;
        this.program = program;
        this.renderer = new Renderer(gl, program);

        // Componentes do Helicóptero
        this.helicopterBody = new HelicopterBody();
        this.helicopterTopShaft = new HelicopterTopShaft();
        this.helicopterTail = new HelicopterTail();
        this.helicopterPropellers = new HelicopterPropellers();
        this.helicopterTailPropeller = new HelicopterTailPropeller();

        // Posição do Helicóptero no espaço (controlada pelas setas)
        this.posX = 0.0;
        this.posY = 0.0;
        this.speed = 0.015;

        // Ângulos de rotação contínua das hélices
        this.topPropellerAngle = 0.0;
        this.tailPropellerAngle = 0.0;

        // Ângulo de inclinação/orientação do helicóptero para visualização tridimensional
        this.viewAngleX = 0.35;
        this.viewAngleY = -0.55;
    }

    update() {
        // 1. Movimentação com as setas do teclado (X' e Y')
        if (keys["ArrowUp"]) {
            this.posY += this.speed;
        }
        if (keys["ArrowDown"]) {
            this.posY -= this.speed;
        }
        if (keys["ArrowLeft"]) {
            this.posX -= this.speed;
        }
        if (keys["ArrowRight"]) {
            this.posX += this.speed;
        }

        // Limites da área de voo (com escala 0.5)
        const limitX = 0.75;
        const limitY = 0.75;
        this.posX = Math.max(-limitX, Math.min(limitX, this.posX));
        this.posY = Math.max(-limitY, Math.min(limitY, this.posY));

        // Rotação contínua dos ângulos das hélices (velocidade reduzida pela metade)
        this.topPropellerAngle += 0.125;
        this.tailPropellerAngle += 0.175;

        // ---------------------------------------------------------------
        // PASSO 3: TRANSFORMAÇÃO GLOBAL (Translada por X', Y', Z' e aplica escala 0.5)
        // Caixa quadrada perfeitamente alinhada com o eixo Z (sem inclinação angular oblíqua)
        // ---------------------------------------------------------------
        let globalTransform = m4.translation(this.posX, this.posY, 0.0);
        globalTransform = m4.scale(globalTransform, 0.5, 0.5, 0.5);

        // Corpo, Haste vertical e Cauda recebem a transformação global diretamente
        this.helicopterBody.update(globalTransform);
        this.helicopterTopShaft.update(globalTransform);
        this.helicopterTail.update(globalTransform);

        // ---------------------------------------------------------------
        // PASSO 1: HÉLICE SUPERIOR (Pivô original: X=0, Y=0.35, Z=0)
        // 1. Puxa pro 0,0,0: Translation(0, -0.35, 0)
        // 2. Rotaciona em torno de Y: yRotation(topPropellerAngle)
        // 3. Volta pro ponto original: Translation(0, 0.35, 0)
        // 4. Translada TUDO por X', Y', Z' (globalTransform)
        // ---------------------------------------------------------------
        let topM = m4.translation(0.0, -0.35, 0.0);
        topM = m4.yRotate(topM, this.topPropellerAngle);
        topM = m4.translate(topM, 0.0, 0.35, 0.0);
        topM = m4.multiply(globalTransform, topM);
        this.helicopterPropellers.update(topM);

        // ---------------------------------------------------------------
        // PASSO 2: HÉLICE DA CAUDA (Pivô original: X=0.7, Y=0.0, Z=0.06)
        // 1. Volta pro 0,0,0: Translation(-0.7, 0.0, -0.06)
        // 2. Rotaciona em Z: zRotation(tailPropellerAngle)
        // 3. Volta pro ponto original: Translation(0.7, 0.0, 0.06)
        // 4. Translada TUDO por X', Y', Z' (globalTransform)
        // ---------------------------------------------------------------
        let tailM = m4.translation(-0.7, 0.0, -0.06);
        tailM = m4.zRotate(tailM, this.tailPropellerAngle);
        tailM = m4.translate(tailM, 0.7, 0.0, 0.06);
        tailM = m4.multiply(globalTransform, tailM);
        this.helicopterTailPropeller.update(tailM);
    }

    draw() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.useProgram(this.program);

        this.helicopterBody.draw(this.renderer);
        this.helicopterTopShaft.draw(this.renderer);
        this.helicopterTail.draw(this.renderer);
        this.helicopterPropellers.draw(this.renderer);
        this.helicopterTailPropeller.draw(this.renderer);
    }

    execute() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.execute());
    }

    init() {
        requestAnimationFrame(() => this.execute());
    }
}

// ==================================================
// CONFIGURAÇÃO INICIAL DO WEBGL
// ==================================================

gl.clearColor(0.1, 0.1, 0.1, 1.0);
gl.viewport(0, 0, canvas.width, canvas.height);
gl.enable(gl.DEPTH_TEST);

// ==================================================
// INICIAR CENA
// ==================================================

const scene = new Scene(gl, program);
scene.init();
