// Imports
import { OBJLoader } from "https://cdn.skypack.dev/three@/examples/jsm/loaders/OBJLoader.js";
import { m4, v3 } from "../node_modules/twgl.js/dist/4.x/twgl-full.module.js";
import TWEEN from "../node_modules/@tweenjs/tween.js/dist/tween.esm.js";

async function main() {

    // Removes main menu elements
    var elements = document.getElementById("centered");
    elements.style.display = "none";

    var gl = twgl.getWebGLContext(document.getElementById("glCanvas"));
    var rocketProgramInfo = twgl.createProgramInfo(gl, ["rocket_vs", "rocket_fs"]);
    var asteroidProgramInfo = twgl.createProgramInfo(gl, ["asteroid_vs", "asteroid_fs"]);

    // Model Imports
    const rocket = await processModel('./assets/rocket/10475_Rocket_Ship_v1_L3.obj');
    const asteroid = await processModel('./assets/asteroid/10464_Asteroid_v1_Iterations-2.obj');

    // Player Variables
    var canMove = true;
    var playerPos = [0.0, 0.0, 0.0, 1]
    var playerWiggle = [0.0, 0.0, 0.0, 1]

    // Handles player input
    function playerInput() {

        // Bobs player ship for dramatic effect :]
        const t = new TWEEN.Tween(playerWiggle)
            .to([0.0, 5.0, 0.0, 1], 750)
            .easing(TWEEN.Easing.Sinusoidal.In)
            .onUpdate(() => {

            })
            .onComplete(() => {
                canMove = true;
            })

        t.start();
        t.repeat(Infinity);
        t.yoyo(true);

        // Handles different key presses for player movement
        document.addEventListener('keydown', function (e) {

            if (!canMove) {
                return;
            }
            canMove = false;

            // Handles moving UP!
            if (e.key === 'w') {
                const startPos = playerPos;

                const t = new TWEEN.Tween(startPos)
                    .to([0.0, 400.0, 0.0, 1], 500)
                    .easing(TWEEN.Easing.Back.Out)
                    .onUpdate(() => {
                        playerPos = startPos;
                    })
                    .onComplete(() => {
                        canMove = true;
                    })

                t.start();
            }

            // Handles moving DOWN!
            if (e.key === 's') {
                const startPos = playerPos;

                const t = new TWEEN.Tween(startPos)
                    .to([0.0, 0.0, 0.0, 1], 500)
                    .easing(TWEEN.Easing.Back.Out)
                    .onUpdate(() => {
                        playerPos = startPos;
                        console.log(playerPos)
                    })
                    .onComplete(() => {
                        canMove = true;
                    })

                t.start();
            }
        })
    }

    playerInput();


    const bufferRocket = rocket.map((d) =>
        twgl.createBufferInfoFromArrays(gl, d)
    )

    const bufferAsteroid = asteroid.map((d) =>
        twgl.createBufferInfoFromArrays(gl, d)
    )

    const tex = twgl.createTexture(gl, {
        min: gl.NEAREST,
        mag: gl.NEAREST,
        src: [
            255, 255, 255, 255,
            192, 192, 192, 255,
            192, 192, 192, 255,
            255, 255, 255, 255,
        ],
    });

    // Zooms out camera for dramatic effect
    var fov = deg2rad(10);
    const t = new TWEEN.Tween([fov])
        .to([deg2rad(90)], 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate((value) => {
            fov = value;
        })

    t.start();

    // Main game loop
    function render(time) {
        time *= 0.001;
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0.2, 0.2, 0.2, 1.0)
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Camera Variables
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.5;
        const zFar = 1000;
        const projection = m4.perspective(fov, aspect, zNear, zFar);
        const eye = [500, 4, -6];
        const target = [0, 0, 0];
        const up = [0, 1, 0];

        const camera = m4.lookAt(eye, target, up);
        const view = m4.inverse(camera);
        const viewProjection = m4.multiply(projection, view);
        const world = m4.translate(m4.rotateY(m4.identity(), deg2rad(270)), v3.create(0, -250, -250));

        // Shader Uniforms
        const uniforms = {
            u_lightWorldPos: [10, 80, -1500],
            u_lightColor: [1, 0.8, 0.8, 1],
            u_ambient: [0.1, 0, 0, 1],
            u_specular: [1, 1, 1, 1],
            u_shininess: 75,
            u_specularFactor: 0.8,
            u_diffuse: tex,
            u_playerPos: playerPos,
            u_playerWiggle: playerWiggle
        };
        uniforms.u_viewInverse = camera;
        uniforms.u_world = world;
        uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world));
        uniforms.u_worldViewProjection = m4.multiply(viewProjection, world);

        gl.useProgram(rocketProgramInfo.program);
        bufferRocket.forEach((bufferInfo) => {
            twgl.setUniforms(rocketProgramInfo, uniforms);
            twgl.setBuffersAndAttributes(gl, rocketProgramInfo, bufferInfo);
            twgl.drawBufferInfo(gl, bufferInfo);
        });

        gl.useProgram(asteroidProgramInfo.program);
        bufferAsteroid.forEach((bufferInfo) => {
            twgl.setUniforms(asteroidProgramInfo, uniforms);
            twgl.setBuffersAndAttributes(gl, asteroidProgramInfo, bufferInfo);
            twgl.drawBufferInfo(gl, bufferInfo);
        });

        requestAnimationFrame(render);
        TWEEN.update();
    }
    requestAnimationFrame(render);


}
document.querySelector('button').addEventListener('click', main);

function deg2rad(deg) {
    return deg * Math.PI / 180;
}

function loadModel(url) {
    const loader = new OBJLoader();
    return loader.loadAsync(url);
}

async function processModel(url) {
    const modelInfo = await loadModel(url);

    const vertexAttributes = modelInfo.children.map((d) => ({
        position: { numComponents: 3, data: d.geometry.attributes.position.array },
        normal: { numComponents: 3, data: d.geometry.attributes.normal.array },
        texcoord: { numComponents: 2, data: d.geometry.attributes.uv.array }
    }));

    return vertexAttributes;
}