import THREE from 'three'


let nullShade = `
attribute vec3 position;
void main() {
    gl_Position = vec4( position, 1.0 );
}
`;
let nullFrag = `
uniform vec2 resolution;
uniform sampler2D texture;
vec3 permute (vec3 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}
vec3 taylorInvSqrt (vec3 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}
float snoise(vec2 P) {
    const vec2 C = vec2((3.0 - sqrt(3.0)) / 6.0, 0.5*(sqrt(3.0) - 1.0));
    vec2 i = floor(P + dot(P, C.yy));
    vec2 x0 = P - i + dot(i, C.xx);
    vec2 i1;
    i1.x = step(x0.y, x0.x);
    i1.y = 1.0 - i1.x;
    vec4 xor = x0.xyxy + vec4(C.xx, C.xx * 2.0 - 1.0);
    xor.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(xor.xy, xor.xy), dot(xor.zw, xor.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = fract(p * (1.0 / 41.0)) * 2.0 - 1.0;
    vec3 gy = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 gx = x - ox;
    m *- taylorInvSqrt(gx*gx + gy*gy);
    vec3 g;
    g.x = gx.x * x0.x + gy.x * x0.y;
    g.yz = gx.yz + xor.xz + gy.yz * xor.yw;
    return 130.0 * dot(m, g);
}
void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    gl_FragColor = vec4(texture2D( texture, uv ).xyz * (0.8 + 0.2*snoise(gl_FragCoord.xy / vec2(2, 2))), 1.0);
}
`;
let positionShade = `
uniform vec2 resolution;
uniform sampler2D texture;
uniform sampler2D base_texture;
uniform float time;
uniform float density;
const mat3 colorShift = mat3( 1.0016374 ,  0.00332076, -0.00495827,
       -0.00327048,  1.00033642,  0.00293016,
       0.01252787, -0.01043093,  0.99792338);
void main ()
{
  vec2 uvCoord = gl_FragCoord.xy / resolution.xy;
  vec2 flow = vec2(-0.05, 0.0);
  vec2 gauss1 = 0.5 + 0.4 * vec2(cos(0.27 * time / 3.0), sin(0.37 * time / 3.0));
  gauss1 = uvCoord - gauss1;
  gauss1 = 10.0 * vec2(1.0, -1.0) * gauss1.yx * exp(-40.0 * dot(gauss1, gauss1));
  flow = flow + gauss1;
  float pt = 0.1 - density * 0.1;
  vec2 gauss2 = 0.5 + 0.4 * vec2(cos((0.27 - pt) * time / 3.0), sin((0.37 - pt)  * time / 3.0));
  gauss2 = uvCoord - gauss2;
  gauss2.x = mix(gauss2.x, gauss2.x - 1.0, step(abs(gauss2.x - 1.0), abs(gauss2.x)));
  gauss2.x = mix(gauss2.x, gauss2.x + 1.0, step(abs(gauss2.x + 1.0), abs(gauss2.x)));
  gauss2 = 10.0 * vec2(-1.0, 1.0) * gauss2.yx * exp(-40.0 * dot(gauss2, gauss2));
  flow = flow + gauss2;
  vec3 color = texture2D(texture, mod(uvCoord + 0.02 * flow, 1.0)).xyz;
  float leftness = smoothstep(0.0, 0.15, length(uvCoord - vec2(0.5)));
  vec3 base_color = texture2D(base_texture, vec2(mod(time / 20.0, 1.0), mod(time / 20.0, 1.0))).xyz * 1.5;
  float left = 0.9 + 0.1 * leftness;
  if(density > 0.6) {
    base_color = texture2D(base_texture, uvCoord).xyz;
    left = 0.0;
  }
  
  gl_FragColor = vec4(mix(base_color, color, left), 1.0);
}
`;
class Simulator {
    constructor(_renderer, density, temp) {
        this.textureDefaultPosition;
        this.renderer;
        this.copyShader;
        this.amountDim = 500;
        this.simulation;
        this.camera = new THREE.Camera();
        this.ready = false;
        this.density;
        this.temp;
        this.avgColor;
        this.density = density;
        this.temp = temp;
        this.renderer = _renderer;
        let rawShaderPrefix =  'precision ' + this.renderer.capabilities.precision + ' float;\n';
        this.scene = new THREE.Scene();
        this.camera.position.z = 1;
        this.copyShader = new THREE.RawShaderMaterial({
            uniforms: {
                resolution: { type: 'v2', value: new THREE.Vector2(this.amountDim, this.amountDim )},
                texture: { type: 't', value: undefined}
            },
            vertexShader: rawShaderPrefix + nullShade,
            fragmentShader: rawShaderPrefix + nullFrag,
            transparent: false,
            depthWrite: false,
            depthTest: false
        });
        this.positionShader = new THREE.RawShaderMaterial({
            uniforms: {
                resolution: {type: 'v2', value: new THREE.Vector2(this.amountDim, this.amountDim)},
                texture: {type: 't', value: undefined},
                base_texture: {type: 't', value: undefined},
                time: {type: 'f', value: 0.0},
                density: {type: 'f', value: density}
            },
            vertexShader: rawShaderPrefix + nullShade,
            fragmentShader: rawShaderPrefix + positionShade,
            transparent: false,
            depthWrite: false,
            depthTest: false
        });
        this.mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), this.copyShader);
        this.scene.add(this.mesh);
        this.positionRenderTarget = new THREE.WebGLRenderTarget(this.amountDim, this.amountDim, {
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            depthWrite: false,
            depthBuffer: false,
            stencilBuffer: false
        });
        this.positionRenderTarget2 = this.positionRenderTarget.clone();
        // this.newTexture = new THREE.TextureLoader().load(
        //     "images/gas_giant.jpg", 
        //     () => {
        //         this.copyTexture(this.mesh, this.scene, this.newTexture, this.positionRenderTarget);
        //         this.copyTexture(this.mesh, this.scene, this.positionRenderTarget.texture, this.positionRenderTarget2);
        //         this.ready = true;
        // });
            
        this.ready = true;
        this.newTexture = this.createTexture();
        this.copyTexture(this.mesh, this.scene, this.newTexture, this.positionRenderTarget);
        this.copyTexture(this.mesh, this.scene, this.positionRenderTarget.texture, this.positionRenderTarget2);
        this.simulation = {
            mesh: this.mesh,
            positionRenderTarget: this.positionRenderTarget,
            positionRenderTarget2: this.positionRenderTarget2,
            textureDefaultPosition: this.newTexture,
            scene: this.scene,
            positionShader: this.positionShader
        };
    }
    clamp(a, b, c) {
        return Math.max(b, Math.min(c, a));
    }
    createTexture() {
        let positions = new Float32Array(this.amountDim * this.amountDim * 4);
        let index;
        let total = this.amountDim * this.amountDim;
        let low1 = new THREE.Vector3(0.0, 155.0/255, 239.0/255);
        let low2 = new THREE.Vector3(149.0/255, 209.0/255, 60.0/255);
        let high1 = new THREE.Vector3(230.0/255, 35.0/255, 0.0/255);
        let high2 = new THREE.Vector3(1.0, 80.0/255, 50/255);
        let color1 = low1.sub(high1).multiplyScalar(this.temp).add(high1);
        let color2 = low2.sub(high2).multiplyScalar(this.temp).add(high2);
        //console.log(low1.sub(high1), low2.sub(high2))
        for(let i = 0; i < total; i++) {
            index = i * 4;
            positions[index + 0] = (color1.x - color2.x) * i / total + color2.x;
            positions[index + 1] = (color1.y - color2.y) * i / total + color2.y;
            positions[index + 2] = (color1.z - color2.z) * i / total + color2.z;
            positions[index + 3] = 1.0;
        }
        this.avgColor = new THREE.Color(
            (color1.x - color2.x) * 0.5 + color2.x,
            (color1.y - color2.y) * 0.5 + color2.y,
            (color1.z - color2.z) * 0.5 + color2.z
        );
        let texture = new THREE.DataTexture(positions, this.amountDim, this.amountDim, THREE.RGBAFormat, THREE.FloatType);
        texture.needsUpdate = true;
        this.textureDefaultPosition = texture;
        return texture;
    }
    createPositionTexture() {
        let positions = new Float32Array(this.amountDim * this.amountDim * 4);
        let index, r, phi, theta;
        for(let i = 0; i < this.amountDim * this.amountDim; i++) {
            index = i * 4;
            r = (0.5 + Math.random() * 0.5) * 50;
            phi = (Math.random() - 0.5) * Math.PI;
            theta = Math.random() * Math.PI * 2;
            positions[index + 0] = r * Math.cos(theta) * Math.cos(phi);
            positions[index + 1] = r * Math.sin(phi);
            positions[index + 2] = r * Math.sin(theta) * Math.cos(phi);
            positions[index + 3] = Math.random();
        }
        let texture = new THREE.DataTexture(positions, this.amountDim, this.amountDim, THREE.RGBAFormat, THREE.FloatType);
        texture.needsUpdate = true;
        this.textureDefaultPosition = texture;
        return texture;
    }
    copyTexture(mesh, scene, input, output) {
        this.mesh.material = this.copyShader;
        this.copyShader.uniforms.texture.value = input;
        this.renderer.render(scene, this.camera, output);
        return output;
    }
    updatePosition(dt) {
        let tmp = this.simulation.positionRenderTarget;
        this.simulation.positionRenderTarget = this.simulation.positionRenderTarget2;
        this.simulation.positionRenderTarget2 = tmp;
        this.simulation.mesh.material = this.simulation.positionShader;
        this.simulation.positionShader.uniforms.base_texture.value = this.simulation.textureDefaultPosition;
        this.simulation.positionShader.uniforms.texture.value = this.simulation.positionRenderTarget2.texture;
        this.simulation.positionShader.uniforms.time.value += dt * 0.001;
        this.renderer.render(this.simulation.scene, this.camera, this.simulation.positionRenderTarget);
    }
    update(dt) {
        let autoClearColor = this.renderer.autoClearColor;
        let clearColor = this.renderer.getClearColor().getHex();
        let clearAlpha = this.renderer.getClearAlpha();
        this.renderer.autoClearColor = false;
        if(this.ready)
            this.updatePosition(dt);
        this.renderer.autoClearColor = autoClearColor;
    }
}

export default Simulator;