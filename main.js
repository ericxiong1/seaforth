import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { DotScreenShader } from 'three/addons/shaders/DotScreenShader.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { HalftonePass } from 'three/addons/postprocessing/HalftonePass.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight,0.1,1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});
// scene.background = new THREE.Color( 0xffFFFF );
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(6);
camera.position.setY(5);
camera.position.setX(2);


const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(3, 3, 3);

// const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight);

// const gridHelper = new THREE.GridHelper(100,100);
// scene.add(gridHelper);

const loader = new GLTFLoader();
loader.load("/scene.gltf", function (gltf){
  scene.add(gltf.scene);
});

const composer = new EffectComposer( renderer );
composer.addPass( new RenderPass( scene, camera ) );

// const effect1 = new ShaderPass( DotScreenShader );
// effect1.uniforms[ 'scale' ].value = 4;
// composer.addPass( effect1 );

const effect2 = new ShaderPass( RGBShiftShader );
effect2.uniforms[ 'amount' ].value = 0.0010;
composer.addPass( effect2 );

const effect3 = new OutputPass();
composer.addPass( effect3 );

const controls = new OrbitControls(camera, renderer.domElement);

function animate(){
  requestAnimationFrame(animate);
  controls.update()
  renderer.render(scene,camera)
  composer.render()
}

animate()