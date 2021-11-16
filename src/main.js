main();

function main() {
    var gl = twgl.getWebGLContext(document.getElementById("glCanvas"));
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    var arrays = {
        position: [0, 1, 0, 1, -1, 0, -1, -1, 0],
    };
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    function render(time) {
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        var uniforms = {
            time: time * 0.001,
            resolution: [gl.canvas.width, gl.canvas.height],
        };

        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.setUniforms(programInfo, uniforms);
        twgl.drawBufferInfo(gl, bufferInfo);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
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
        uv: { numComponents: 2, data: d.geometry.attributes.uv.array }
    }));

    return vertexAttributes;
}

// Handles player input
function playerInput() {
    document.addEventListener('keydown', function (e) {

        // Handles moving UP!
        if (e.key === 'w') {
            console.log('Moving up!')
        }

        // Handles moving DOWN!
        if (e.key === 's') {
            console.log('Moving down!')
        }
    })
}