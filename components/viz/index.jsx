import React, { Component } from 'react';
import THREE from 'three'
import * as constants from './constants.js';
import cubevert from './shaders/cube.vert';
import cubefrag from './shaders/cube.frag';
import Simulator from './simulate.js';
import './style.css';

let scene, camera, renderer, control;
let last_time = Date.now();
let dt;
let spin = false;
let plane_geo = new THREE.BufferGeometry();
let mesh;
let mice = [];
let ticks = 0;
let debounce = 0;
let raycaster;
let spinTime = 0;
let origRot = 0;

export default class Viz extends Component {

  constructor(props) {
      super(props);
      this.state = {
        about: false,
        contact: false
      }
  }

  componentDidMount = () => {
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


    this.simulate = new Simulator(renderer, 0.4, 0.4);

    //renderer.setClearColor("#343434");
    document.getElementById('container').appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xffffff, 0.001);

    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 3000);
    //camera = new THREE.OrthographicCamera(-1, 1, -1, 1, 0.1, 3000);
    //camera.position.set(300, 60, 300).normalize().multiplyScalar(1000);
    camera.position.set(0.0, 0.0, 3.3);

    for(let i = 0; i < 50; i ++) {
      mice.push(new THREE.Vector3(0.5 + (Math.random()*0.6 - 0.3), 0.5 + (Math.random()*0.6 - 0.3), ticks));
    }

    const material = new THREE.ShaderMaterial({
        vertexShader: cubevert,
        fragmentShader: cubefrag,
        uniforms: {
          time: { value: 0.0 },
          _color: new THREE.Uniform(constants.colors[2]),
          mice: { type: 'v3v', value: mice },
          tex: {type: 't', value:this.newTexture}
        }
      })

    mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry(2, 2), material );

    scene.add(mesh);

    raycaster = new THREE.Raycaster();
}

  animate = () => {
    ticks += 1.0 / 60.0;
    mesh.material.uniforms.time.value = ticks;
    mesh.material.uniforms.mice.value = mice;
    //mesh.rotation.y = Math.PI / 2.0;
    //mesh.position.z = -2;
    this.simulate.mice = mice;
    this.simulate.update(Date.now() - last_time);
    mesh.material.uniforms.tex.value = this.simulate.simulation.positionRenderTarget.texture;
    last_time = Date.now();

    let time_since_spin = Date.now() - spinTime;

    renderer.render( scene, camera );
    requestAnimationFrame( this.animate );
  }

  onMove = evt => {
    if(debounce % 5 == 0) {
        let mouse = new THREE.Vector3();
        mouse.x = (evt.pageX / window.innerWidth) * 2 - 1;
        mouse.y = (evt.pageY / window.innerHeight) * 2 - 1;
        mouse.z = ticks;

        raycaster.setFromCamera(new THREE.Vector2(mouse.x, mouse.y), camera);
        let intersects = raycaster.intersectObject (mesh);

        if(intersects.length > 0) {
          let intersect = intersects[0];
          mouse.x = intersect.uv.x;
          mouse.y = 1.0 - intersect.uv.y;
          mice.unshift(mouse);
          mice.pop();
        }
    }
    debounce += 1;
  }

  componentWillMount = () => {
    window.addEventListener('mousemove', this.onMove);
    window.addEventListener('touchmove', this.onMove);
    window.addEventListener('touchstart', this.onMove);
  }

  aboutIt = () => {
    this.state.about = !this.state.about;
    if(this.state.about)
      this.state.contact = false;
    this.setState(this.state);
  }

  contactIt = () => {
    this.state.contact = !this.state.contact;
    if(this.state.contact)
      this.state.about = false;
    this.setState(this.state);
  }


  render() {
    let showAbout = this.state.about ? {display: "flex"} : {display: "none"};
    let showContact = this.state.contact ? {display: "flex"} : {display: "none"};

    return <div id='container' className='container'>
        <div className='info'>
          <div className='title'>ytoi</div>
          <a className='descrip' onClick={this.aboutIt}>about</a>
          <a className='descrip' href="https://vimeo.com/user65188480" target="_blank">vimeo</a>
          <a className='descrip' href="https://www.instagram.com/disconeighbor/" target="_blank">instagram</a>
          <a className='descrip' onClick={this.contactIt}>contact</a>
        </div>
        <div className='about' style={showAbout}>
          <div className='deet'>
            Tom Wall & Taimur Shah
          </div>
          <div className='deet'>
            Interactive Digital Artists.
          </div>
        </div>
        <div className='about' style={showContact}>
          thomasjwall1@gmail.com
        </div>
      </div>;
  }
}
