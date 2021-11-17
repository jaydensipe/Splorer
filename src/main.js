main();

// Imports
import { OBJLoader } from "https://cdn.skypack.dev/three@/examples/jsm/loaders/OBJLoader.js";
import { m4, v3 } from "../node_modules/twgl.js/dist/4.x/twgl-full.module.js";
import TWEEN from "../node_modules/@tweenjs/tween.js/dist/tween.esm.js";

async function main() {
    var gl = twgl.getWebGLContext(document.getElementById("glCanvas"));
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    // cube
    // const arrays = [{
    //     position: [1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1],
    //     normal: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1],
    //     texcoord: [1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
    //     indices: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23],
    // }];

    // Model Imports
    const rocket = await processModel('./assets/rocket/10475_Rocket_Ship_v1_L3.obj');

    // Player Variables
    var canMove = true;
    var playerPos = [0.0, 0.0, 0.0, 1]
    var playerWiggle = [0.0, 0.0, 0.0, 1]

    // Handles player input
    function playerInput() {
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
                        console.log(playerPos)
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

    const bufferInfoArray = rocket.map((d) =>
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

    function render(time) {
        time *= 0.001;
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0.3, 0.3, 0.3, 1.0)
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Camera Variables
        const fov = deg2rad(90);
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
            u_lightWorldPos: [1, 8, -150],
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

        gl.useProgram(programInfo.program);
        bufferInfoArray.forEach((bufferInfo) => {
            twgl.setUniforms(programInfo, uniforms);
            twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
            twgl.drawBufferInfo(gl, bufferInfo);
        });

        requestAnimationFrame(render);
        TWEEN.update();
    }
    requestAnimationFrame(render);


}

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