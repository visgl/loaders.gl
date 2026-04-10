
let gl;
let modelMatrix = mat4.create();
let viewMatrix = mat4.create();
let modelViewMatrix = mat4.create();
let projectionMatrix = mat4.create();
let glbBuilder;
let glb;

init = async function() {

    // Set the canvas size (to manage HiDPI monitors):
    const canvas = document.getElementById('canvas');
    const devicePixelRatio = Utils.getDevicePixelRatio();
    canvas.width = canvas.parentNode.offsetWidth * devicePixelRatio;
    canvas.height = canvas.parentNode.offsetHeight * devicePixelRatio;

    gl = canvas.getContext('webgl2');

    if (!gl) {
        console.error('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    // Load GLB:
    const GLB_URL = "/glb-files/DamagedHelmet.glb";
    glbBuilder = new GLBBuilder(gl);
    glb = await glbBuilder.load(GLB_URL);

    // Set projection matrix:
    const fov = 45;
    const zNear = 1.0;
    const zFar = 100.0;
    const ratio = gl.canvas.clientWidth / gl.canvas.clientHeight;
    mat4.identity(projectionMatrix);
    mat4.perspective(projectionMatrix, fov, ratio, zNear, zFar);

    // Create view matrix:
    mat4.identity(viewMatrix);
    mat4.translate(viewMatrix, viewMatrix, [0, 0, -4]);

    // Create model matrix:
    mat4.identity(modelMatrix);
    mat4.rotateX(modelMatrix, modelMatrix, Utils.toRadian(90));
    mat4.rotateZ(modelMatrix, modelMatrix, Utils.toRadian(45));

    // Set model view matrix:
    mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);

    // Start rendering:
    const render = () => {
        draw();
        requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
};

draw = function() {

    // Enable alpha blending:
    gl.enable(gl.DEPTH_TEST);             // Enable depth testing
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthFunc(gl.LEQUAL);              // Near things obscure far things

    // Clear:
    gl.clearColor(0.2, 0.2, 0.2, 1.0);    // Clear to black, fully opaque
    gl.clearDepth(1.0);                   // Clear everything
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Rotate a bit and update model view matrix:
    mat4.rotateY(viewMatrix, viewMatrix, Utils.toRadian(0.2));
    mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);

    // Draw GLB model:
    glb.draw(projectionMatrix, modelViewMatrix, gl.TRIANGLES);
};
