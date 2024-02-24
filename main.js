import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnrealBloomPass } from "/node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js";

import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';


const params = {
  threshold: 0,
  strength: 0.4,
  radius: 0.9,
  exposure: 1
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight,0.1,1000);
const listener = new THREE.AudioListener();
camera.add(listener);
const audioLoader = new THREE.AudioLoader();
const backgroundSound = new THREE.Audio(listener);

audioLoader.load('./sounds/power-buzz.mp3',function(buffer){
  backgroundSound.setBuffer(buffer);
  backgroundSound.setLoop(true);
  backgroundSound.setVolume(0.05)
});
const switchSound = new THREE.Audio(listener);
audioLoader.load('./sounds/switch.mp3',function(buffer){
  switchSound.setBuffer(buffer);
  switchSound.setVolume(0.2)
});

const keySound = new THREE.Audio(listener);
audioLoader.load('./sounds/keyboard1.mp3',function(buffer){
  keySound.setBuffer(buffer);
  keySound.setVolume(0.2)
});
const acceptSound = new THREE.Audio(listener);
audioLoader.load('./sounds/accept.mp3',function(buffer){
  acceptSound.setBuffer(buffer);
  acceptSound.setVolume(0.2)
});

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
  if (intersects.length> 0 && intersects[0].object.name == "power_on") {
    backgroundSound.play()
    switchSound.play();
    scene.traverse((object) => {
      if (object.name == 'screen') {
        object.material.color.set(0xFFFFFF);
        object.layers.enable(BLOOM_SCENE);
        object.material.roughness = 0.8;
      }
    });
  }
  if (intersects.length> 0 && intersects[0].object.name == "power_off") {
    switchSound.play();
    scene.traverse((object) => {
      if (object.name == 'screen') {
        backgroundSound.pause()
        object.material.color.r = 0.06193931773304939
        object.material.color.g = 0.07818111777305603
        object.material.color.b = 0.0741833969950676
        object.layers.disable(BLOOM_SCENE);
        object.material.roughness = 0.12823103368282318;
      }
    });
  }

}

// Set the renderer size to the new width and height
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(6);
camera.position.setY(5);
camera.position.setX(2);

let text = ">Welcome to my website! :-)\n>Type help to see available commands.\n>Hold left click to rotate, and right\n>click to pan."
let terminal = ">"
let firstLetter = true
let font = null
let experienceActive = false;

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
effect2.uniforms[ 'amount' ].value = 0.0009;


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

const pointLight = new THREE.PointLight(0xffffff,3);
pointLight.position.set(1, 3, 3);

const ambientLight = new THREE.AmbientLight(0xffffff,0.05);
scene.add(pointLight,ambientLight);

// const gridHelper = new THREE.GridHelper(100,100);
// scene.add(gridHelper);

const loader = new GLTFLoader();
loader.load("/fixed1.glb", function (gltf){
  scene.add(gltf.scene);
});


const fontLoader = new TTFLoader();
let textMesh1,textMesh2;
let material = new THREE.MeshStandardMaterial( { color: 0x000000} );
let group = new THREE.Group();
group.position.x = -0.25;
group.position.y = 2.75;
group.position.z = 0.81;
scene.add( group );

fontLoader.load( 'ttf/VT323-Regular.ttf', function ( json ) {

  font = new Font( json );
  createText();

} );

const controls = new OrbitControls(camera, renderer.domElement);

window.addEventListener( 'pointerdown', onPointerDown );
window.addEventListener( 'keypress', onDocumentKeyPress );
window.addEventListener( 'keydown', onDocumentKeyDown );

function animate(){
  controls.update()
  renderer.render(scene,camera)
  scene.traverse(nonBloomed);
  bloomComposer.render()
  scene.traverse(restoreMaterial)
  finalComposer.render()
  requestAnimationFrame(animate);
}

function createText(){
  let textGeo1 = new TextGeometry(text,{
    font: font,
    size: 0.075,
    height: 0.01,
    curveSegments: 4,
    bevelEnabled: false
  })

  let textGeo2 = new TextGeometry(terminal,{
    font: font,
    size: 0.075,
    height: 0.01,
    curveSegments: 4,
    bevelEnabled: false
  })

  textMesh1 = new THREE.Mesh( textGeo1, material );
  group.add( textMesh1 );

  textMesh2 = new THREE.Mesh( textGeo2, material );
  textMesh2.position.y = textMesh1.position.y - 1.1
  group.add( textMesh2 );
}
function onDocumentKeyDown( event ) {
  keySound.stop()
  keySound.play()

  if ( firstLetter ) {

    firstLetter = false;
    terminal = '>';

  }

  const keyCode = event.keyCode;

  // backspace

  if ( keyCode === 8 && !(terminal.length == 1)) {

    event.preventDefault();
    terminal = terminal.substring( 0, terminal.length - 1 );
    refreshInputText()

    return false;
    

  }

  if(keyCode == 13){
    
    event.preventDefault();
    let command = terminal.substring(1);
    if (!(command == "")){
      acceptSound.stop()
      acceptSound.play()
    }

    if (command == "help"){
      text = ">Available commands:\n>about - learn more about me!\n>experience - see my experience!\n>projects - see stuff i've built!\n>website - learn how i made this!\n>contact - contact me!\n>off - bottom right switches.."
    }
    else if (command == "about"){
      text = ">I'm Eric, a 4th year software\n>engineer studying at the University\n>of Alberta. I love making software\n>that meets right in the middle of\n>creativity and practicality - things\n>that look good and are soundly built.\n\n>When I'm not at the computer, I'm\n>probably with my cat :p"
    }
    else if (command == "experience"){
      text = ">Bio-Conversion Databank Foundation\n>Jan 2023 - Oct 2023\n>I worked as a full-stack engineer \n>using Vue 2 and AWS Cloud. While I\n>was there, I developed a CRUD bio-\n>informatic metabolite map with D3.js,\n>GraphQL, and DynamoDB as an aide\n>for biology research. I also was\n>involved with the pipeline automation\n>of new maps using Boto3/Python.\n>Type 'n' to go to the next page!"
      experienceActive = true
      console.log(experienceActive)
    }
    else if (command == "n" && experienceActive){
      text = ">AlbertaSat\n>Jan 2022 - Jan 2023\n"
    }
    else{
      text = ">Don't know that command :(\n>about - learn more about me!\n>website - learn how i made this!"
    }
    terminal = ">"
    refreshAllText()
  }

}

function onDocumentKeyPress(e){
  const keyCode = e.which;
  
  if(keyCode === 8){
    e.preventDefault();
  }else{
    const ch = String.fromCharCode(keyCode);
    terminal += ch
    refreshInputText()
  }
}

function refreshInputText(){
  textMesh2.geometry.dispose();
  textMesh2.geometry = new TextGeometry(terminal, {
    font: font,
    size: 0.075,
    height: 0.01,
    curveSegments: 4,
    bevelEnabled: false
  });
}
function refreshAllText(){
  textMesh1.geometry.dispose();
  textMesh1.geometry = new TextGeometry(text, {
    font: font,
    size: 0.075,
    height: 0.01,
    curveSegments: 4,
    bevelEnabled: false
  });
  textMesh2.geometry.dispose();
  textMesh2.geometry = new TextGeometry(terminal, {
    font: font,
    size: 0.075,
    height: 0.01,
    curveSegments: 4,
    bevelEnabled: false
  });
}
animate()