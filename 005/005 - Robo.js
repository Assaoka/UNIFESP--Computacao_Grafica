const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// --------------------------------------------------
// SHADERS GLSL ES 3.00 (Com u_viewTransform e u_modelTransform)
// --------------------------------------------------

const vertexShaderSource = `#version 300 es

in vec2 aPosition;

uniform mat3 u_viewTransform;
uniform mat3 u_modelTransform;

void main() {
    vec3 position = u_viewTransform * u_modelTransform * vec3(aPosition, 1.0);
    gl_Position = vec4(position.xy, 0.0, 1.0);
    gl_PointSize = 12.0;
}
`;

const fragmentShaderSource = `#version 300 es

precision mediump float;

uniform vec3 uColor;

out vec4 outColor;

void main() {
    outColor = vec4(uColor, 1.0);
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
// CLASSE RENDERER (Padrão Professora)
// ==================================================

class Renderer {
    constructor(gl, program) {
        this.gl = gl;
        this.program = program;

        this.positionLocation = gl.getAttribLocation(program, "aPosition");
        this.colorLocation = gl.getUniformLocation(program, "uColor");
        this.viewTransformLocation = gl.getUniformLocation(program, "u_viewTransform");
        this.modelTransformLocation = gl.getUniformLocation(program, "u_modelTransform");

        this.viewTransform = m3.identity();
        this.verticesBuffer = gl.createBuffer();
    }

    defineViewTransform(viewTransform) {
        this.viewTransform = viewTransform;
    }

    draw(object) {
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, object.vertices, gl.DYNAMIC_DRAW);

        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.uniform3fv(this.colorLocation, object.color);
        gl.uniformMatrix3fv(this.modelTransformLocation, false, object.modelTransform);
        gl.uniformMatrix3fv(this.viewTransformLocation, false, this.viewTransform);

        gl.drawArrays(object.drawMode, 0, object.vertices.length / 2);
    }
}


// ==================================================
// FUNÇÕES AUXILIARES DE GEOMETRIA (Retângulos e Partes)
// ==================================================

// Retângulo centrado em (0, 0)
function retanguloCentradoVertices(largura, altura) {
    const w2 = largura / 2;
    const h2 = altura / 2;
    return new Float32Array([
        -w2, -h2,
         w2,  h2,
        -w2,  h2,

        -w2, -h2,
         w2, -h2,
         w2,  h2
    ]);
}

// Membro articulado no topo (o pivô y fica em 0.0, e se estende para baixo até -altura)
function membroArticuladoVertices(largura, altura) {
    const w2 = largura / 2;
    return new Float32Array([
        -w2, -altura,
         w2,  0.0,
        -w2,  0.0,

        -w2, -altura,
         w2, -altura,
         w2,  0.0
    ]);
}


// ==================================================
// CLASSE BASE SCENE OBJECT
// ==================================================

class SceneObject {
    constructor(vertices, color, drawMode = gl.TRIANGLES) {
        this.vertices = vertices;
        this.color = color;
        this.drawMode = drawMode;
        this.modelTransform = m3.identity();
    }

    updateModelTransform(modelTransform) {
        this.modelTransform = modelTransform;
    }
}


// ==================================================
// CLASSES DOS COMPONENTES DO ROBÔ
// ==================================================

// Corpo
class RobotBody extends SceneObject {
    constructor() {
        super(
            retanguloCentradoVertices(0.6, 0.6),
            new Float32Array([0.2, 0.5, 0.9]) // Azul
        );
    }
}

// Cabeça
class RobotHead extends SceneObject {
    constructor() {
        super(
            retanguloCentradoVertices(0.4, 0.35),
            new Float32Array([0.7, 0.7, 0.8]) // Prata
        );
    }
}

// Haste da Antena
class RobotAntennaStem extends SceneObject {
    constructor() {
        super(
            new Float32Array([0.0, 0.0, 0.0, 0.15]),
            new Float32Array([1.0, 0.8, 0.2]), // Amarelo
            gl.LINES
        );
    }
}

// Ponto (Olhos e Topo da Antena)
class RobotPoint extends SceneObject {
    constructor(color) {
        super(
            new Float32Array([0.0, 0.0]),
            color,
            gl.POINTS
        );
    }
}

// Braço (Pivô no ombro)
class RobotArm extends SceneObject {
    constructor() {
        super(
            membroArticuladoVertices(0.15, 0.4),
            new Float32Array([0.2, 0.8, 0.9]) // Ciano
        );
    }
}

// Perna (Pivô no quadril)
class RobotLeg extends SceneObject {
    constructor() {
        super(
            membroArticuladoVertices(0.15, 0.3),
            new Float32Array([0.3, 0.3, 0.4]) // Cinza Escuro
        );
    }
}


// ==================================================
// CLASSE ROBOT (Composto e Animado)
// ==================================================

class Robot {
    constructor(tx = 0.0, ty = 0.0) {
        this.tx = tx;
        this.ty = ty;
        this.time = 0.0;

        // Partes componentes
        this.body = new RobotBody();
        this.head = new RobotHead();
        this.antennaStem = new RobotAntennaStem();
        this.antennaTop = new RobotPoint(new Float32Array([1.0, 0.8, 0.2]));
        this.leftEye = new RobotPoint(new Float32Array([1.0, 0.2, 0.2]));
        this.rightEye = new RobotPoint(new Float32Array([1.0, 0.2, 0.2]));

        this.leftArm = new RobotArm();
        this.rightArm = new RobotArm();

        this.leftLeg = new RobotLeg();
        this.rightLeg = new RobotLeg();
    }

    move() {
        this.time += 0.04;

        // 1. Movimentação do Robô (Global): Desloca horizontalmente e flutua nos passos
        const roboGlobalX = this.tx + Math.sin(this.time * 0.5) * 0.35;
        const roboGlobalY = this.ty + Math.abs(Math.sin(this.time * 2.0)) * 0.04;
        const robotTransform = m3.translation(roboGlobalX, roboGlobalY);

        // 2. CORPO (Centrado em y = -0.1 em relação ao robô)
        const bodyTransform = m3.translate(robotTransform, 0.0, -0.1);
        this.body.updateModelTransform(bodyTransform);

        // 3. CABEÇA: Balanço/rotação própria
        const headAngle = Math.sin(this.time * 1.5) * 0.12;
        let headTransform = m3.translate(robotTransform, 0.0, 0.425);
        headTransform = m3.rotate(headTransform, headAngle);
        this.head.updateModelTransform(headTransform);

        // Antena (Haste e Topo ligados à cabeça)
        const antennaStemTransform = m3.translate(headTransform, 0.0, 0.175);
        this.antennaStem.updateModelTransform(antennaStemTransform);

        const antennaTopTransform = m3.translate(antennaStemTransform, 0.0, 0.15);
        this.antennaTop.updateModelTransform(antennaTopTransform);

        // Olhos (Ligados à cabeça)
        const leftEyeTransform = m3.translate(headTransform, -0.08, 0.025);
        this.leftEye.updateModelTransform(leftEyeTransform);

        const rightEyeTransform = m3.translate(headTransform, 0.08, 0.025);
        this.rightEye.updateModelTransform(rightEyeTransform);

        // 4. BRAÇOS: Rotação oscilatória no ombro (frequência 1.8)
        const armAngle = Math.sin(this.time * 1.8) * 0.6;

        let leftArmTransform = m3.translate(robotTransform, -0.375, 0.1);
        leftArmTransform = m3.rotate(leftArmTransform, armAngle);
        this.leftArm.updateModelTransform(leftArmTransform);

        let rightArmTransform = m3.translate(robotTransform, 0.375, 0.1);
        rightArmTransform = m3.rotate(rightArmTransform, -armAngle);
        this.rightArm.updateModelTransform(rightArmTransform);

        // 5. PERNAS: Movimento alternado em oposição de fase nos quadris
        const legAngle = Math.sin(this.time * 1.8) * 0.45;

        let leftLegTransform = m3.translate(robotTransform, -0.175, -0.4);
        leftLegTransform = m3.rotate(leftLegTransform, -legAngle);
        this.leftLeg.updateModelTransform(leftLegTransform);

        let rightLegTransform = m3.translate(robotTransform, 0.175, -0.4);
        rightLegTransform = m3.rotate(rightLegTransform, legAngle);
        this.rightLeg.updateModelTransform(rightLegTransform);
    }

    draw(renderer) {
        // Desenha membros inferiores/posteriores
        renderer.draw(this.leftLeg);
        renderer.draw(this.rightLeg);

        // Desenha tronco
        renderer.draw(this.body);

        // Desenha membros superiores
        renderer.draw(this.leftArm);
        renderer.draw(this.rightArm);

        // Desenha cabeça e detalhes
        renderer.draw(this.head);
        renderer.draw(this.antennaStem);
        renderer.draw(this.antennaTop);
        renderer.draw(this.leftEye);
        renderer.draw(this.rightEye);
    }
}


// ==================================================
// CLASSE SCENE (Gerencia loop, renderer e objetos)
// ==================================================

class Scene {
    constructor(gl, program) {
        this.gl = gl;
        this.program = program;

        this.renderer = new Renderer(gl, program);

        // Janela de visualização (coordenadas de mundo de [-1.2, -1.2] a [1.2, 1.2])
        this.viewTransform = m3.setClippingWindow(-1.2, -1.2, 1.2, 1.2);
        this.renderer.defineViewTransform(this.viewTransform);

        this.robot = new Robot(0.0, 0.0);
    }

    update() {
        this.robot.move();
    }

    draw() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.useProgram(this.program);

        this.robot.draw(this.renderer);
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


// ==================================================
// INICIAR CENA
// ==================================================

const scene = new Scene(gl, program);
scene.init();
