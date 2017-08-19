import THREE from 'three'
import positionShade from './shaders/position.frag';


let nullShade = `
attribute vec3 position;
void main() {
    gl_Position = vec4( position, 1.0 );
}
`;
let nullFrag = `
uniform vec2 resolution;
uniform sampler2D texture;

vec2 hash( vec2 p ) // replace this by something better
{
	p = vec2( dot(p,vec2(127.1,311.7)),
			  dot(p,vec2(269.5,183.3)) );

	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}


float snoise( in vec2 p )
{
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;

	vec2 i = floor( p + (p.x+p.y)*K1 );
	
    vec2 a = p - i + (i.x+i.y)*K2;
    vec2 o = step(a.yx,a.xy);    
    vec2 b = a - o + K2;
	vec2 c = a - 1.0 + 2.0*K2;

    vec3 h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );

	vec3 n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));

    return dot( n, vec3(70.0) );
	
}
void main() {
    vec2 vUv = gl_FragCoord.xy / resolution.xy;
    vec3 rnd = vec3(snoise(16.0 * vUv + 1.1), snoise(16.0 * vUv + 2.2), snoise(16.0 * vUv + 3.3));
    gl_FragColor = vec4(rnd, 1.0);
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

        this.mice = [];


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
                density: {type: 'f', value: density},
                mice: { type: 'v3v', value: this.mice },
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
        this.simulation.positionShader.uniforms.mice.value = this.mice;
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