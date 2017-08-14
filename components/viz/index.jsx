import React, { Component } from 'react';
import THREE from 'three'
import * as constants from './constants.js';
import cubevert from './shaders/cube.vert'
import cubefrag from './shaders/cube.frag'

let scene, camera, renderer, control;
let last_time = Date.now();
let dt;
let spin = false;
let plane_geo = new THREE.BufferGeometry();
let mesh;
let mice = [];
let ticks = 0;
let debounce = 0;

export default class Viz extends Component {

  constructor(props) {
      super(props);
      this.init();
      this.animate();
  }

  init = () => {

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.enabled = true;
    renderer.setSize(window.innerWidth, window.innerHeight);

    window.onresize = () => renderer.setSize(window.innerWidth, window.innerHeight);

    //renderer.setClearColor("#343434");
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xffffff, 0.001);

    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 3000);
    //camera = new THREE.OrthographicCamera(-1, 1, -1, 1, 0.1, 3000);
    //camera.position.set(300, 60, 300).normalize().multiplyScalar(1000);
    camera.position.set(0.0, 0.0, 1.1);
    let vertices = new Float32Array(3 * 2000 * 2000 * 6);
    let index = 0;
    for(let i = 0; i < 2000; i ++) {
      for(let j = 0; j < 2000; j ++) {
        vertices[index] = -1.0 + i / 1000.0;
        vertices[index+1] = -1.0 + j / 1000.0;
        vertices[index+2] = 0.0;

        index += 3;

        vertices[index] = -1.0 + (i + 1) / 1000.0;
        vertices[index+1] = -1.0 + j / 1000.0;
        vertices[index+2] = 0.0;

        index += 3;

        vertices[index] = -1.0 + (i + 1) / 1000.0;
        vertices[index+1] = -1.0 + (j + 1) / 1000.0;
        vertices[index+2] = 0.0;

        index += 3;

        vertices[index] = -1.0 + (i + 1) / 1000.0;
        vertices[index+1] = -1.0 + (j + 1) / 1000.0;
        vertices[index+2] = 0.0;

        index += 3;

        vertices[index] = -1.0 + i / 1000.0;
        vertices[index+1] = -1.0 + (j + 1) / 1000.0;
        vertices[index+2] = 0.0;

        index += 3;

        vertices[index] = -1.0 + i / 1000.0;
        vertices[index+1] = -1.0 + j / 1000.0;
        vertices[index+2] = 0.0;

        index += 3;
      }
    }

    for(let i = 0; i < 50; i ++) {
      mice.push(new THREE.Vector3(0.0, 0.0, ticks));
    }

    plane_geo.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    console.log(plane_geo)

    const material = new THREE.ShaderMaterial({
        vertexShader: cubevert,
        fragmentShader: cubefrag,
        vertexColors: THREE.FaceColors,
        uniforms: {
          time: { value: 0.0 },
          _color: new THREE.Uniform(constants.colors[2]),
          mice: { type: 'v3v', value: mice }
        }
      })

    mesh = new THREE.Mesh( plane_geo, material );

    scene.add(mesh);
}

  animate = () => {
    ticks += 1.0 / 60.0;
    mesh.material.uniforms.time.value = ticks;
    mesh.material.uniforms.mice.value = mice;
    //mesh.rotation.y = Math.PI / 2.0;
    //mesh.position.z = -2;
    last_time = Date.now();

    renderer.render( scene, camera );
    requestAnimationFrame( this.animate );
  }

  onMove = evt => {
    if(debounce % 3 == 0) {
    let mouse = new THREE.Vector3();
      mouse.x = (evt.pageX / window.innerWidth) * 2 - 1;
      mouse.y = -(evt.pageY / window.innerHeight) * 2 + 1;
      mouse.z = ticks;
      mice.unshift(mouse);
      mice.pop();
    }
    debounce += 1;
  }

  componentWillMount = () => {
    window.addEventListener('mousemove', this.onMove);
  }


  render() {
    return <div></div>;
  }
}
