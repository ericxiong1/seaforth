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
import { UnrealBloomPass } from "/node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

const params = {
  threshold: 0,
  strength: 1,
  radius: 0.5,
  exposure: 1
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight,0.1,1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

renderer.toneMapping = THREE.CineonToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();


function onPointerDown( event ) {
  pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  raycaster.setFromCamera( pointer, camera );
  const intersects = raycaster.intersectObjects( scene.children);

  if (intersects[0].object.name == "power_on") {
    scene.traverse((object) => {
      if (object.name == 'screen') {
        object.material.color.set(0xE1D9D1);
        console.log(object.layers)
        object.layers.enable(BLOOM_SCENE);
      }
    });
  }
  if (intersects[0].object.name == "power_off") {
    scene.traverse((object) => {
      if (object.name == 'screen') {
        object.material.color.r = 0.06193931773304939
        object.material.color.g = 0.07818111777305603
        object.material.color.b = 0.0741833969950676
        console.log(object.layers)
        object.layers.disable(BLOOM_SCENE);
      }
    });
  }

}

// Set the renderer size to the new width and height
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(6);
camera.position.setY(5);
camera.position.setX(2);

const renderScene = new RenderPass( scene, camera );

const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
bloomPass.threshold = params.threshold;
bloomPass.strength = params.strength;
bloomPass.radius = params.radius;

const bloomComposer = new EffectComposer( renderer );
bloomComposer.renderToScreen = false;
bloomComposer.addPass( renderScene );
bloomComposer.addPass( bloomPass );

const mixPass = new ShaderPass(
  new THREE.ShaderMaterial( {
    uniforms: {
      baseTexture: { value: null },
      bloomTexture: { value: bloomComposer.renderTarget2.texture }
    },
    vertexShader: document.getElementById( 'vertexshader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
    defines: {}
  } ), 'baseTexture'
);
mixPass.needsSwap = true;

const outputPass = new OutputPass();

const effect2 = new ShaderPass( RGBShiftShader );
effect2.uniforms[ 'amount' ].value = 0.0015;


const finalComposer = new EffectComposer( renderer );
finalComposer.addPass( renderScene );
finalComposer.addPass( mixPass );
finalComposer.addPass( effect2 );
finalComposer.addPass( outputPass );

const BLOOM_SCENE = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set(BLOOM_SCENE);
const darkMaterial = new THREE.MeshBasicMaterial({color: 0x000000})
const materials = {};

function nonBloomed(obj){
  if (obj.isMesh && bloomLayer.test(obj.layers) === false){
    materials[obj.uuid] = obj.material;
    obj.material = darkMaterial;
  }
}

function restoreMaterial(obj){
  if(materials[obj.uuid]){
    obj.material = materials[obj.uuid];
    delete materials[obj.uuid]
  }
}

const pointLight = new THREE.PointLight(0xffffff,2);
pointLight.position.set(1, 3, 3);

// const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight);

// const gridHelper = new THREE.GridHelper(100,100);
// scene.add(gridHelper);

const loader = new GLTFLoader();
loader.load("/fixed1.glb", function (gltf){
  scene.add(gltf.scene);
});


const controls = new OrbitControls(camera, renderer.domElement);

window.addEventListener( 'pointerdown', onPointerDown );

function animate(){
  controls.update()
  renderer.render(scene,camera)
  scene.traverse(nonBloomed);
  bloomComposer.render()
  scene.traverse(restoreMaterial)
  finalComposer.render()
  requestAnimationFrame(animate);
}

animate()