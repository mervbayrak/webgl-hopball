window.onload = function init() {
    const [gl, aspect] = setupWebGL();
    const hier = new Hierarchy(gl);
    const gui = new GUI(aspect);
    ///const shader = .... give shader objects to gameobjecs explicitly
    start(hier.gameObjects);
    render(gl, hier.gameObjects, gui);

    window.onkeydown = function (event) {
        isclicked = true;
        var keyCode = event.keyCode;
        var key = String.fromCharCode(keyCode);
        switch (key) {
            case "'":
                isclickedsag = true;
                break;
            case "%":
                isclickedsol = true;
                break;
        }
    };
};
var isclicked = false;
var isclickedsag = false;
var isclickedsol = false;

class Script {
    constructor() {
        this.gameObject = null;
        this.gameObjects = {};
    }
    start() {}
    update() {}
    onCollision() {}
}

class BlueCubeScript extends Script {
    start() {
        this.initialTranslation = this.gameObject.transform.translation;
    }

    update() {
        // update function runs for each draw operation
        this.gameObject.transform.rotation = mult(
            rotateY(1),
            this.gameObject.transform.rotation
        );

        const velocity = [0, 0, 0.005];
        const dt = GameTime.deltaTime;
        const scaledVelocity = scale(dt, velocity);
        const changeMatrix = translate(scaledVelocity);
        this.gameObject.transform.translation = mult(
            changeMatrix,
            this.gameObject.transform.translation
        );

        this.gameObject.transform.scaling = mult(
            scalem(0.99, 0.99, 0.99),
            this.gameObject.transform.scaling
        );

        const t = this.gameObject.transform.translation;
        const x = t[0][3];
        const y = t[1][3];
        const z = t[2][3];

        if (x > 10 || z > 10) {
            this.gameObject.transform.translation = this.initialTranslation;
            this.gameObject.transform.scaling = mat4();
        }
    }

    onCollision(other) {
        if (other.name != "ground") {
            delete this.gameObjects[other.name];
        }
    }

    zıpla(other, zıpla) {
        if (other != "ground") {
            this.gameObjects[other].transform.translation = translate(
                zıpla * 2,
                1,
                9
            );
        }
    }
}

class Hierarchy {
    constructor(gl) {
        const gameObjects = {};
        this.gameObjects = gameObjects;
        gameObjects["square"] = new Cube(
            "square",
            gl,
            vec4(1.0, 0.7, 0.2, 1.0),
            new Transform({ translation: translate(3.5, 0, -5) })
        );

        gameObjects["blueCube"] = new Cube(
            "blueCube",
            gl,
            vec4(1.0, 0.0, 1.0, 1.0),
            new Transform({ translation: translate(-2.5, 0, -2) })
        );
        const script = new BlueCubeScript();
        script.gameObject = gameObjects["blueCube"];
        script.gameObjects = this.gameObjects;
        //gameObjects["blueCube"].component.script = script;

        ////
        gameObjects["fixedCube"] = new Cube(
            "fixedCube",
            gl,
            vec4(1.0, 0.5, 0.0, 1.0),
            new Transform({ translation: translate(-2, 0, 2) })
        );
        gameObjects["fixedCube2"] = new Cube(
            "fixedCube2",
            gl,
            vec4(0.2, 0.1, 1.0, 1.0),
            new Transform({ translation: translate(2, 0, 2) })
        );

        gameObjects["fixedCube3"] = new Cube(
            "fixedCube3",
            gl,
            vec4(1.0, 0.5, 0.5, 1.0),
            new Transform({ translation: translate(-2, 0, -2) })
        );
        gameObjects["fixedCube4"] = new Cube(
            "fixedCube4",
            gl,
            vec4(0.0, 0.5, 0.0, 1.0),
            new Transform({ translation: translate(2, 0, -2) })
        );
        gameObjects["fixedCub5"] = new Cube(
            "fixedCube5",
            gl,
            vec4(0.0, 0.6, 1.0, 1.0),
            new Transform({ translation: translate(-3, 0, 4) })
        );

        gameObjects["shepe2"] = new Shepe(
            "shepe2",
            gl,
            vec4(1.0, 0.0, 0.0, 1.0),
            new Transform({
                scaling: scalem(1.2, 1, 1.2),
                translation: translate(0, 1, 9),
            })
        );
        const script3 = new BlueCubeScript();
        script3.gameObject = gameObjects["shepe2"];
        script3.gameObjects = this.gameObjects;
        gameObjects["shepe2"].component.script = script3;

        //// The simulation ground
        gameObjects["ground"] = new Cube(
            "ground",
            gl,
            vec4(0.0, 1.0, 0.6, 1.0),
            new Transform({ scaling: scalem(10, 0.7, 20) })
        );
    }
}

function mults(scalar, transform) {
    return mult(scalem(scalar, scalar, scalar), transform);
}

//// time functionality
class GameTime {
    static deltaTime = 0;
    static timestamp = -1;

    static updateTimestamp(timestamp) {
        if (GameTime.timestamp < 0) GameTime.timestamp = timestamp;
        GameTime.deltaTime = timestamp - GameTime.timestamp;
        GameTime.timestamp = timestamp;
    }
}

//// camera parameters

const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

//// a class that represents the gameobject transform matrices
class Transform {
    constructor({
        scaling = mat4(),
        rotation = mat4(),
        translation = mat4(),
    } = {}) {
        this.scaling = scaling;
        this.rotation = rotation;
        this.translation = translation;
    }
    modelMatrix() {
        return mult(this.translation, mult(this.rotation, this.scaling));
    }
}

class NaiveCollider {
    constructor(vertices) {
        this.vertices = vertices;
        this.gameObject = null; // make sure this is assigned after instantiation
    }

    detectsCollisionWith(other) {
        // iterate over vertices of the other, if any vertice is inside
        // then we have a collision
        const otherVertices = other.transformedVertices();
        const inverseTransform = inverse4(
            this.gameObject.transform.modelMatrix()
        );

        for (const otherVertice of otherVertices) {
            if (this.includes(mult(inverseTransform, otherVertice)))
                return true;
        }
        return false;
    }

    transformedVertices() {
        const vertices = [];
        const modelMatrix = this.gameObject.transform.modelMatrix();
        for (const vertice of this.vertices) {
            vertices.push(mult(modelMatrix, vertice));
        }
        return vertices;
    }
}

class NaiveBoxCollider extends NaiveCollider {
    constructor(vertices) {
        super(vertices);
    }
    includes(v) {
        const x = v[0];
        const y = v[1];
        const z = v[2];
        if (
            -0.5 <= x &&
            x <= 0.5 &&
            0 <= y &&
            y <= 1 &&
            -0.5 <= z &&
            z <= 0.5
        ) {
            return true;
        }
        return false;
    }
}

//// base class for game objects
class GameObject {
    constructor(
        name,
        gl,
        pointsArray,
        colorsArray,
        transform,
        collider = undefined,
        script = undefined,
        vertexShader = "",
        fragmentShader = ""
    ) {
        //// WebGL rendering context
        this.gl = gl;

        //// name of this object. this must be unique.
        this.name = name;

        //// components go here
        this.component = {};

        //// the script component
        this.component.script = script;

        //// current object transform
        this.transform = transform;

        //// camera settings
        this.viewMatrix = mat4();
        this.projectionMatrix = mat4();

        //// collisions
        if (collider) {
            this.collider = collider;
            this.collider.gameObject = this;
            this.collidesWith = [];
        }

        //// shaders and the program object
        if (vertexShader === "") this.createVertexShader();
        else this.vertexShader = vertexShader;

        if (fragmentShader === "") this.createFragmentShader();
        else this.fragmentShader = fragmentShader;

        this.program = this.createProgram();

        //// buffers and gpu data
        this.colorsArray = colorsArray;
        this.pointsArray = pointsArray;
        this.initAttributeBuffers();
    }

    _compileShader(type, src) {
        const shader = this.gl.createShader(type, src);
        this.gl.shaderSource(shader, src);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(shader));
        }
        return shader;
    }

    //// prepares a program object from shaders
    createProgram() {
        const vertexShader = this._compileShader(
            this.gl.VERTEX_SHADER,
            this.vertexShader
        );
        const fragmentShader = this._compileShader(
            this.gl.FRAGMENT_SHADER,
            this.fragmentShader
        );

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error(this.gl.getProgramInfoLog(this.program));
        }
        return this.program;
    }

    detectsCollisionWith(other) {
        if (!this.collider) return false;
        if (!other.collider) return false;
        if (this.collider.detectsCollisionWith(other.collider)) return true;

        return false;
    }

    createVertexShader() {
        this.vertexShader = ` 
      // attribute  vec4 vPosition;
      // attribute  vec4 vColor;
      // attribute vec4 a_Color;
      // varying vec4 fColor;
      // varying vec4 v_Color;
      // uniform bool clicked;
      //uniform mat4 modelViewProjectionMatrix;

      attribute vec4 vPosition;
      attribute vec4 vNormal;
      attribute vec4 a_Color;
      varying vec3 N, L, E;
      varying vec4 v_Color;
      uniform bool clicked;
      uniform mat4 modelViewProjectionMatrix;
      uniform mat4 projectionMatrix;
      uniform vec4 lightPosition;
      uniform mat3 normalMatrix;

      

      void main()
      {
        vec3 light;
        vec3 pos = (modelViewProjectionMatrix * vPosition).xyz;
        if(lightPosition.z == 0.0)  L = normalize(lightPosition.xyz);
        else  L = normalize(lightPosition).xyz - pos;



        // gl_Position = modelViewProjectionMatrix * vPosition;
        // fColor = vColor;


        if (clicked) { //  Draw in red if mouse is pressed
          v_Color = vec4(1.0, 0.0, 0.0, 1.0); // red
       } else {
          v_Color = a_Color;
        }

        E =  -normalize(pos);
        N = normalize( normalMatrix*vNormal.xyz);
        gl_Position = modelViewProjectionMatrix * vPosition;

      }
    `;
        return this.vertexShader;
    }

    createFragmentShader() {
        this.fragmentShader = `
      #ifdef GL_ES
      precision highp float;
      #endif


      //varying vec4 fColor;

      uniform vec4 ambientProduct;
      uniform vec4 diffuseProduct;
      uniform vec4 specularProduct;
      uniform float shininess;
      varying vec3 N, L, E;

      void
      main()
      {
        vec4 fColor;
    
        vec3 H = normalize( L + E );
        vec4 ambient = ambientProduct;
    
        float Kd = max( dot(L, N), 0.0 );
        vec4  diffuse = Kd*diffuseProduct;
    
        float Ks = pow( max(dot(N, H), 0.0), shininess );
        vec4  specular = Ks * specularProduct;
        
        if( dot(L, N) < 0.0 ) specular = vec4(0.0, 0.0, 0.0, 1.0);
    
        fColor = ambient + diffuse +specular;
        fColor.a = 1.0;
    
        gl_FragColor = fColor;



        //gl_FragColor = fColor;
      }
    `;
        return this.fragmentShader;
    }

    initAttributeBuffers() {
        //// color attribute
        // this.cBuffer = this.gl.createBuffer();
        // this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cBuffer);
        // this.gl.bufferData(
        //   this.gl.ARRAY_BUFFER,
        //   flatten(this.colorsArray),
        //   this.gl.STATIC_DRAW
        // );
        //this.vColor = this.gl.getAttribLocation(this.program, "vColor");

        //// position attribute
        this.vBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vBuffer);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            flatten(this.pointsArray),
            this.gl.STATIC_DRAW
        );
        this.vPosition = this.gl.getAttribLocation(this.program, "vPosition");

        //// Uniform Locations
        this.modelViewProjectionMatrixLoc = this.gl.getUniformLocation(
            this.program,
            "modelViewProjectionMatrix"
        );
        u_Clicked = this.gl.getUniformLocation(this.program, "clicked");

        this.ambientProductLoc = this.gl.getUniformLocation(
            this.program,
            "ambientProduct"
        );
        this.diffuseProductLoc = this.gl.getUniformLocation(
            this.program,
            "diffuseProduct"
        );
        this.specularProductLoc = this.gl.getUniformLocation(
            this.program,
            "specularProduct"
        );
        this.lightPositionLoc = this.gl.getUniformLocation(
            this.program,
            "lightPosition"
        );
        this.shininessLoc = this.gl.getUniformLocation(
            this.program,
            "shininess"
        );

        if (!u_Clicked) {
            console.log(
                "Failed to get the storage location of uniform variable"
            );
            return;
        }
    }

    draw() {
        //// switch to this objects program
        this.gl.useProgram(this.program);

        // //// color attribute
        // this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cBuffer);
        // this.gl.vertexAttribPointer(this.vColor, 4, this.gl.FLOAT, false, 0, 0);
        // this.gl.enableVertexAttribArray(this.vColor);

        //// position attribute
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vBuffer);
        this.gl.vertexAttribPointer(
            this.vPosition,
            4,
            this.gl.FLOAT,
            false,
            0,
            0
        );
        this.gl.enableVertexAttribArray(this.vPosition);

        //// compute modelViewProjectionMatrix
        const modelViewProjectionMatrix = mult(
            this.projectionMatrix,
            mult(this.viewMatrix, this.transform.modelMatrix())
        );
        //// gpu modelViewProjectionMatrix
        this.gl.uniformMatrix4fv(
            this.modelViewProjectionMatrixLoc,
            false,
            flatten(modelViewProjectionMatrix)
        );

        var ambientProduct = mult(lightAmbient, materialAmbient);
        var diffuseProduct = mult(lightDiffuse, materialDiffuse);
        var specularProduct = mult(lightSpecular, materialSpecular);

        this.gl.uniform4fv(this.ambientProductLoc, flatten(ambientProduct));

        this.gl.uniform4fv(this.diffuseProductLoc, flatten(diffuseProduct));

        this.gl.uniform4fv(this.specularProductLoc, flatten(specularProduct));

        this.gl.uniform4fv(this.lightPositionLoc, flatten(lightPosition));

        this.gl.uniform1f(this.shininessLoc, materialShininess);

        //// draw
        //this.gl.drawArrays(this.gl.TRIANGLES, 0, this.pointsArray.length);
        for (var i = 0; i < index; i += 3)
            this.gl.drawArrays(this.gl.TRIANGLES, i, 3);

        //// disable vaa's
        //this.gl.disableVertexAttribArray(this.vColor);
        this.gl.disableVertexAttribArray(this.vPosition);
    }
}
var u_Clicked;
class Cube extends GameObject {
    constructor(name, gl, color, transform) {
        const [pointsArray, colorsArray] = cubePointsAndColors(color);
        const collider = new NaiveBoxCollider(cubeVertices());
        super(name, gl, pointsArray, colorsArray, transform, collider);
    }
}
class Shepe extends GameObject {
    constructor(name, gl, color, transform) {
        const [pointsArray, colorsArray] = shepePointsAndColors(color);
        const collider = new NaiveBoxCollider(cubeVertices());
        super(name, gl, pointsArray, colorsArray, transform, collider);
    }
}

class Square extends GameObject {
    constructor(name, gl, color, transform) {
        const [pointsArray, colorsArray] = squarePointsAndColors(color);
        //const collider = new NaiveBoxCollider(cubeVertices());
        super(name, gl, pointsArray, colorsArray, transform);
    }
}

function start(gameObjects) {
    for (const gameObject of Object.values(gameObjects)) {
        if (gameObject.component.script) gameObject.component.script.start();
    }
}

function render(gl, gameObjects, gui, timestamp) {
    ////// GameEngine related
    //// update game time
    if (timestamp) GameTime.updateTimestamp(timestamp);

    //// detect all collisions
    const objects = Object.values(gameObjects);
    for (const object of objects) object.collidesWith = [];
    for (let i = 0; i < objects.length; i++) {
        const current = objects[i];
        for (let j = i + 1; j < objects.length; j++) {
            const other = objects[j];
            if (
                current.detectsCollisionWith(other) ||
                other.detectsCollisionWith(current)
            ) {
                current.collidesWith.push(other);
                other.collidesWith.push(current);
            }
        }
    }

    //// handle all collisions
    for (const gameObject of Object.values(gameObjects)) {
        if (gameObject.component.script) {
            for (const other of gameObject.collidesWith) {
                gameObject.component.script.onCollision(other);
            }
        }
    }
    //// update all objects
    for (const gameObject of Object.values(gameObjects)) {
        if (gameObject.component.script) gameObject.component.script.update();
    }

    if (isclicked) {
        isclicked = false;
        var deger = 1;

        if (isclickedsag) {
            isclickedsag = false;
            deger = 1;
        }
        if (isclickedsol) {
            isclickedsol = false;
            deger = -1;
        }
        for (const gameObject of Object.values(gameObjects)) {
            if (gameObject.component.script) {
                gameObject.component.script.zıpla(gameObject.name, deger);
            }
        }
    }

    ////// WebGL related
    //// clear the background
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // gui.radius.slider.value = 14.05;
    // gui.theta.slider.value = 23;
    // gui.phi.slider.value = 88;

    //// camera settings
    eye = sphericalEye(
        gui.radius.slider.value,
        gui.theta.slider.value * (Math.PI / 180),
        gui.phi.slider.value * (Math.PI / 180)
    );
    const viewMatrix = lookAt(eye, at, up);
    const projectionMatrix = perspective(
        gui.fovy.slider.value,
        gui.aspect.slider.value,
        gui.near.slider.value,
        gui.far.slider.value
    );

    //// draw all objects
    for (const gameObject of Object.values(gameObjects)) {
        gameObject.viewMatrix = viewMatrix;
        gameObject.projectionMatrix = projectionMatrix;
        gameObject.draw();
    }

    //// call self for recursion
    requestAnimFrame((timestamp) => render(gl, gameObjects, gui, timestamp));
}

function setupWebGL() {
    const canvas = document.getElementById("canvas1");
    const gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        console.error("Could not set up WebGL");
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    aspect = canvas.width / canvas.height;
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    canvas.onmousedown = function (ev) {
        var x = ev.clientX;
        var y = ev.clientY;
        var rect = ev.target.getBoundingClientRect();

        if (
            rect.left <= x &&
            x < rect.right &&
            rect.top <= y &&
            y < rect.bottom
        ) {
            isclicked = true;
        }
    };

    return [gl, aspect];
}

//// SHOOT WEB Components
class Slider {
    constructor(id, min, max, step, value, divId) {
        //// create - get elements
        this.div = document.getElementById(divId);
        this.labelSpan = document.createElement("span");
        this.slider = document.createElement("input");

        //// set up elements
        this.labelSpan.setAttribute("id", id + "LabelSpan");
        this.labelSpan.innerHTML = value;

        this.slider.setAttribute("type", "range");
        this.slider.setAttribute("min", min);
        this.slider.setAttribute("max", max);
        this.slider.setAttribute("step", step);
        this.slider.setAttribute("id", id);
        this.slider.setAttribute("value", value);
        this.slider.oninput = function (event) {
            document.getElementById(id + "LabelSpan").innerHTML =
                event.target.value;
        };

        //// build the hierarchy
        this.div.appendChild(document.createTextNode(this.slider.id + " "));
        this.div.appendChild(document.createTextNode(this.slider.min));
        this.div.appendChild(this.slider);
        this.div.appendChild(document.createTextNode(this.slider.max + " ("));
        this.div.appendChild(this.labelSpan);
        this.div.appendChild(document.createTextNode(")"));
    }
}

class Text {
    constructor(text, divId) {
        document
            .getElementById(divId)
            .appendChild(
                document
                    .createElement("span")
                    .appendChild(document.createTextNode(text))
            );
    }
}
class Br {
    constructor(divId) {
        document
            .getElementById(divId)
            .appendChild(document.createElement("br"));
    }
}
class Hr {
    constructor(divId) {
        document
            .getElementById(divId)
            .appendChild(document.createElement("hr"));
    }
}
class GUI {
    constructor(aspect) {
        new Hr("cam-props");
        new Text("Camera Position", "cam-props");
        new Br("cam-props");
        this.radius = new Slider("radius", 0.05, 100, 1, 17, "cam-props");
        new Br("cam-props");
        this.theta = new Slider("theta", -180, 180, 1, 51, "cam-props");
        new Br("cam-props");
        this.phi = new Slider("phi", -180, 180, 1, 83, "cam-props");

        new Hr("cam-props");
        new Text("Camera Projection", "cam-props");
        new Br("cam-props");
        this.near = new Slider("near", 0.01, 3, 0.01, 0.1, "cam-props");
        new Br("cam-props");
        this.far = new Slider("far", 3, 1000, 1, 1000, "cam-props");
        new Br("cam-props");
        this.fovy = new Slider("fovy", 10, 120, 1, 90, "cam-props");
        new Br("cam-props");
        this.aspect = new Slider("aspect", 0.01, 10, 0.1, aspect, "cam-props");
        new Hr("cam-props");
    }
}

//// End of SHOOT WEB COMPONENTS

////
function cubeVertices() {
    return [
        vec4(-0.5, 0, 0.5, 1.0),
        vec4(-0.5, 1, 0.5, 1.0),
        vec4(0.5, 1, 0.5, 1.0),
        vec4(0.5, 0, 0.5, 1.0),
        vec4(-0.5, 0, -0.5, 1.0),
        vec4(-0.5, 1, -0.5, 1.0),
        vec4(0.5, 1, -0.5, 1.0),
        vec4(0.5, 0, -0.5, 1.0),
    ];
}

function cubePointsAndColors(color) {
    const points = [];
    const colors = [];
    const vertices = cubeVertices();
    const colorList = [color, color, color, color, color, color, color, color];

    const indices = [
        1, 0, 3, 1, 2, 3, 2, 3, 7, 2, 6, 7, 3, 0, 4, 3, 7, 4, 6, 5, 1, 6, 2, 1,
        4, 5, 6, 4, 7, 6, 5, 4, 0, 5, 1, 0,
    ];
    for (let i of indices) {
        points.push(vertices[i]);
        colors.push(colorList[i]);
    }

    return [points, colors];
}
function shepePointsAndColors(color) {
    const colors = [];

    tetrahedron(va, vb, vc, vd, 3);
    for (let i of pointsArray) {
        colors.push(color);
    }

    return [pointsArray, colors];
}
function squarePointsAndColors(color) {
    const points = [];
    const colors = [];
    const vertices = cubeVertices();
    const colorList = [color, color, color, color, color, color, color, color];

    const indices = [
        1, 0, 3, 1, 2, 3, 2, 3, 7, 2, 6, 7, 3, 0, 4, 3, 7, 4, 6, 5, 1, 6, 2, 1,
        4, 5, 6, 4, 7, 6, 5, 4, 0, 5, 1, 0,
    ];

    for (let i of indices) {
        points.push(vertices[i]);
        colors.push(colorList[i]);
    }
    return [points, colors];
}
function sphericalEye(radius, theta, phi) {
    return vec3(
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(theta)
    );
}

//Shepe işlemleri

var va = vec4(0.0, 0.0, -1.0, 1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333, 1);

var lightPosition = vec4(1.0, 0.0, 1.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.5, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 20.0;

var ctm;

var pointsArray = [];

var eye;

var index = 0;
function triangle(a, b, c) {
    var t1 = subtract(b, a);
    var t2 = subtract(c, a);
    var normal = normalize(cross(t2, t1));
    normal = vec4(normal);

    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);

    index += 3;
}

function divideTriangle(a, b, c, count) {
    if (count > 0) {
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    } else {
        triangle(a, b, c);
    }
}

function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}
