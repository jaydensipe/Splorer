// Imports
import { OBJLoader } from "https://cdn.skypack.dev/three@/examples/jsm/loaders/OBJLoader.js";
import { m4, v3 } from "./js/twgl-full.module.js";
import TWEEN from "./js/tween.esm.js";

// Shaders
const vs = ` 
    uniform mat4 u_worldViewProjection;
    uniform vec3 u_lightWorldPos;
    uniform mat4 u_world;
    uniform mat4 u_viewInverse;
    uniform mat4 u_worldInverseTranspose;

    attribute vec4 position;
    attribute vec3 normal;
    attribute vec2 texcoord;

    varying vec4 v_position;
    varying vec2 v_texCoord;
    varying vec3 v_normal;
    varying vec3 v_surfaceToLight;
    varying vec3 v_surfaceToView;

    void main() {
    v_texCoord = texcoord;
    v_position = u_worldViewProjection * position;
    v_normal = (u_worldInverseTranspose * vec4(normal, 0)).xyz;
    v_surfaceToLight = u_lightWorldPos - (u_world * position).xyz;
    v_surfaceToView = (u_viewInverse[3] - (u_world * position)).xyz;
    gl_Position = v_position;
    }`;

const fs = `
    precision mediump float;

    varying vec4 v_position;
    varying vec2 v_texCoord;
    varying vec3 v_normal;
    varying vec3 v_surfaceToLight;
    varying vec3 v_surfaceToView;

    uniform vec4 u_lightColor;
    uniform vec4 u_ambient;
    uniform sampler2D u_diffuse;
    uniform vec4 u_specular;
    uniform float u_shininess;
    uniform float u_specularFactor;

    vec4 lit(float l ,float h, float m) {
      return vec4(1.0,
                  max(l, 0.0),
                  (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
                  1.0);
    }

    void main() {
      vec4 diffuseColor = texture2D(u_diffuse, v_texCoord);
      vec3 a_normal = normalize(v_normal);
      vec3 surfaceToLight = normalize(v_surfaceToLight);
      vec3 surfaceToView = normalize(v_surfaceToView);
      vec3 halfVector = normalize(surfaceToLight + surfaceToView);
      vec4 litR = lit(dot(a_normal, surfaceToLight),
                        dot(a_normal, halfVector), u_shininess);
      vec4 outColor = vec4((
      u_lightColor * (diffuseColor * litR.y + diffuseColor * u_ambient +
                    u_specular * litR.z * u_specularFactor)).rgb,
          diffuseColor.a);
      gl_FragColor = outColor;
    }`;

async function main() {

    // Removes main menu elements
    var elements = document.getElementById("centered");
    elements.style.display = "none";

    // Adds score element
    var scoreelement = document.getElementById("score");
    scoreelement.innerHTML = 'Score: ' + 0;
    scoreelement.style.display = "block";

    var gl = twgl.getWebGLContext(document.getElementById("glCanvas"));
    if (!gl) {
        return;
    }

    // Player Variables
    var canMove = true;
    var playerPos = [0.0, 0.0, 0.0, 1]
    var playerWiggle = [0.0, 0.0, 0.0, 1]
    var isDead = false;
    const playerMoveSpeed = 400;
    var score = 0;

    const PLAYERDOWN = [0.0, 0.0, 0.0, 1]
    const PLAYERUP = [0.0, 400.0, 0.0, 1]

    // Adds 1 to score and updates UI
    function increaseScore() {
        score++;
        var scoreelement = document.getElementById("score");
        scoreelement.innerHTML = 'Score: ' + score;
    }

    // Stops game and updates UI, then refreshes
    function death() {
        isDead = true;
        var deathelement = document.getElementById("death");
        deathelement.style.display = "block";

        var counter = 5;
        deathelement.innerHTML = "Oh no! You've died.<br>Redeploying in: " + counter;
        setInterval(() => {
            counter--;
            deathelement.innerHTML = "Oh no! You've died.<br>Redeploying in: " + counter;

            if (counter === 0) {
                window.location.reload();
            }
        }, 1000);
    }

    // Handles player input
    function playerInput() {

        // Bobs player ship for dramatic effect
        const t = new TWEEN.Tween(playerWiggle)
            .to([0.0, 5.0, 0.0, 1], 250)
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

            // Handles moving UP!
            if (e.key === 'w') {
                const startPos = playerPos;
                canMove = false;

                const t = new TWEEN.Tween(startPos)
                    .to(PLAYERUP, playerMoveSpeed)
                    .easing(TWEEN.Easing.Back.Out)
                    .onUpdate(() => {
                        playerPos = startPos;
                    })
                    .onComplete(() => {
                        death();
                        canMove = true;
                    })

                t.start();
            }

            // Handles moving DOWN!
            if (e.key === 's') {
                const startPos = playerPos;
                canMove = false;

                const t = new TWEEN.Tween(startPos)
                    .to(PLAYERDOWN, playerMoveSpeed)
                    .easing(TWEEN.Easing.Back.Out)
                    .onUpdate(() => {
                        playerPos = startPos;
                    })
                    .onComplete(() => {
                        canMove = true;
                    })

                t.start();
            }
        })
    }
    playerInput();

    // Program Info
    var rocketProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);
    var asteroidProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);
    var planetProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // Model Imports
    const rocket = await processModel('./assets/rocket/10475_Rocket_Ship_v1_L3.obj');
    const asteroid = await processModel('./assets/asteroid/10464_Asteroid_v1_Iterations-2.obj');
    const planet = await processModel('./assets/planets/13913_Sun_v2_l3.obj');

    // Buffer Info for each model to send to GPU
    const bufferRocket = rocket.map((d) =>
        twgl.createBufferInfoFromArrays(gl, d)
    )

    const bufferAsteroid = asteroid.map((d) =>
        twgl.createBufferInfoFromArrays(gl, d)
    )

    const bufferplanet = planet.map((d) =>
        twgl.createBufferInfoFromArrays(gl, d)
    )

    const rocketTex = twgl.createTexture(gl, {
        min: gl.NEAREST,
        mag: gl.NEAREST,
        src: './assets/rocket/10475_Rocket_Ship_v1_Diffuse.jpg',
        flipY: true
    });

    const asteroidTex = twgl.createTexture(gl, {
        min: gl.NEAREST,
        mag: gl.NEAREST,
        src: './assets/asteroid/10464_Asteroid_v1_diffuse.jpg',
        flipY: true
    });

    const planetTex = twgl.createTexture(gl, {
        min: gl.NEAREST,
        mag: gl.NEAREST,
        src: './assets/planets/13913_Sun_diff.jpg',
        flipY: true
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

    var asteroidPos = [0, 0, 2000];
    const j = new TWEEN.Tween(asteroidPos)
        .to([0, 0, -400], 5000)
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate((value) => {
            if (value[2] < 325 && value[2] > 0 && playerPos[1] === PLAYERDOWN[1]) {
            }
        })

    j.start();

    // Main game loop
    var lastTime = 0;
    function render(time) {
        if (isDead) {
            return;
        }

        time *= 0.001;
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0, 0, 0, 0)
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Camera Variables
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.5;
        const zFar = 5000;
        const projection = m4.perspective(fov, aspect, zNear, zFar);
        const eye = [600, 0, 0];
        const target = [0, 0, 0];
        const up = [0, 1, 0];

        // Matrices
        const camera = m4.lookAt(eye, target, up);
        const view = m4.inverse(camera);
        const viewProjection = m4.multiply(projection, view);
        const world = m4.translate(m4.rotateY(m4.identity(), deg2rad(270)), v3.create(0, -250, -250));

        // ROCKET
        var uniforms = {
            u_lightWorldPos: [1000, 80, 3000],
            u_lightColor: [1, 1, 0.5, 1],
            u_ambient: [0.1, 0.2, 0.2, 1],
            u_specular: [1, 1, 1, 1],
            u_shininess: 75,
            u_specularFactor: 0.8,
            u_diffuse: rocketTex,
        };

        uniforms.u_viewInverse = camera;
        uniforms.u_world = world;
        uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world));
        uniforms.u_worldViewProjection = m4.rotateZ(m4.translate(m4.translate(m4.multiply(viewProjection, world), playerPos), playerWiggle), deg2rad(180));

        gl.useProgram(rocketProgramInfo.program);
        bufferRocket.forEach((bufferInfo) => {
            twgl.setUniforms(rocketProgramInfo, uniforms);
            twgl.setBuffersAndAttributes(gl, rocketProgramInfo, bufferInfo);
            twgl.drawBufferInfo(gl, bufferInfo);
        });

        // PLANET
        uniforms.u_diffuse = planetTex;
        uniforms.u_world = world;
        uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world));
        uniforms.u_worldViewProjection = m4.scale(m4.translate(m4.multiply(viewProjection, world), [-1000, 200, 3500]), [3, 3, 3]);

        gl.useProgram(planetProgramInfo.program);
        bufferplanet.forEach((bufferInfo) => {
            twgl.setUniforms(planetProgramInfo, uniforms);
            twgl.setBuffersAndAttributes(gl, planetProgramInfo, bufferInfo);
            twgl.drawBufferInfo(gl, bufferInfo);
        });

        // ASTEROID
        uniforms.u_diffuse = asteroidTex;
        uniforms.u_world = world;
        uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world));
        uniforms.u_worldViewProjection = m4.scale(m4.translate(m4.multiply(viewProjection, world), asteroidPos), [0.1, 0.1, 0.1]);

        gl.useProgram(asteroidProgramInfo.program);
        bufferAsteroid.forEach((bufferInfo) => {
            twgl.setUniforms(asteroidProgramInfo, uniforms);
            twgl.setBuffersAndAttributes(gl, asteroidProgramInfo, bufferInfo);
            twgl.drawBufferInfo(gl, bufferInfo);
        });


        if (time >= lastTime + 1) {
            // one second has passed, run some code here
            lastTime = time;
            console.log('ds')

        }

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
    console.log(modelInfo)

    const vertexAttributes = modelInfo.children.map((d) => ({
        position: { numComponents: 3, data: d.geometry.attributes.position.array },
        normal: { numComponents: 3, data: d.geometry.attributes.normal.array },
        texcoord: { numComponents: 2, data: d.geometry.attributes.uv.array }
    }));

    return vertexAttributes;
}