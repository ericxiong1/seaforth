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

audioLoader.load('power-buzz.mp3',function(buffer){
  backgroundSound.setBuffer(buffer);
  backgroundSound.setLoop(true);
  backgroundSound.setVolume(0.05)
});
const switchSound = new THREE.Audio(listener);
audioLoader.load('switch.mp3',function(buffer){
  switchSound.setBuffer(buffer);
  switchSound.setVolume(0.2)
});

const keySound = new THREE.Audio(listener);
audioLoader.load('keyboard1.mp3',function(buffer){
  keySound.setBuffer(buffer);
  keySound.setVolume(0.2)
});
const acceptSound = new THREE.Audio(listener);
audioLoader.load('accept.mp3',function(buffer){
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
let firstClick = true;
let loading = true;

function monitorOn(){
  backgroundSound.play()
  switchSound.play();
  scene.traverse((object) => {
    if (object.name == 'screen') {
      group.visible = true;
      object.material.color.set(0xFFFFFF);
      object.layers.enable(BLOOM_SCENE);
      object.material.roughness = 0.8;
    }
  });
}


function onPointerDown( event ) {
  if (loading){
    return
  }
  if (firstClick){
    document.querySelector('#tip').style.display = "none"
    monitorOn()
    firstClick = false;
  }
  pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  raycaster.setFromCamera( pointer, camera );
  const intersects = raycaster.intersectObjects( scene.children);
  if (intersects.length> 0 && intersects[0].object.name == "power_on") {
    backgroundSound.play()
    switchSound.play();
    scene.traverse((object) => {
      if (object.name == 'screen') {
        group.visible = true;
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
        group.visible = false;
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
camera.position.setZ(3.5);
camera.position.setY(3.5);
camera.position.setX(1);

let text = ">Welcome to my website! :-)\n>Type help to see available commands.\n>Hold left click to rotate, and right\n>click to pan."
let terminal = ">"
let firstLetter = true
let font = null
let experienceActive = false;
let projectNum = 0
let codeNum = -1

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
loader.load("https://rawcdn.githack.com/ericxiong1/seaforth/422e4ae4745db215074230301ecb914f7f7da931/public/fixed1.glb", function (gltf){
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
group.visible = false;

fontLoader.load( 'VT323-Regular.ttf', function ( json ) {

  font = new Font( json );
  createText();

} );

const controls = new OrbitControls(camera, renderer.domElement);



window.addEventListener( 'pointerdown', onPointerDown );
window.addEventListener( 'keypress', onDocumentKeyPress );
window.addEventListener( 'keydown', onDocumentKeyDown );
window.addEventListener( 'resize', onWindowResize );

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
      text = ">Available commands:\n>about - learn more about me!\n>experience - see my experience!\n>projects - see stuff i've built!\n>website - learn how i made this!\n>contact - contact me!\n>Try the switches on the bottom right!\n>Hold left click to rotate, and right\n>click to pan. Scroll wheel to zoom."
      projectNum = 0
      codeNum = -1
    }
    else if (command == "about"){
      text = ">I'm Eric, a 4th year software\n>engineer studying at the University\n>of Alberta. I love making software\n>that meets right in the middle of\n>creativity and practicality - things\n>that look good and are soundly built.\n\n>When I'm not at the computer, I'm\n>probably with my cat :p"
      projectNum = 0
      codeNum = -1
    }
    else if (command == "experience"){
      text = ">Bio-Conversion Databank Foundation\n>Jan 2023 - Oct 2023\n>I worked as a full-stack engineer \n>using Vue 2 and AWS Cloud. While I\n>was there, I developed a CRUD bio-\n>informatic metabolite map with D3.js,\n>GraphQL, and DynamoDB as an aide\n>for biology research. I also was\n>involved with the pipeline automation\n>of new maps using Boto3/Python.\n>Type 'n' to go to the next page!"
      experienceActive = true
      projectNum = 0
      codeNum = -1
    }
    else if (command == "n" && experienceActive){
      text = ">AlbertaSat\n>Jan 2022 - Jan 2023\n>I worked as a volunteer for the\n>development and testing of a \n>Raspberry Pi 4 attached with an x-ray\n>spectrometer to be placed on a weather\n>balloon. I used Python, Pandas, and\n>Matplotlib for testing as well as\n>data processing. I wrote test cases\n>for the launch using the unittest\n>framework for unit testing!"
      experienceActive = false;
    }
    else if (command == "projects"){
      text = ">Packedify Spotify Playlist Manager\n>An SPA project using React.js and\n>Express.js that allows the user to\n>grab their top 50 songs and artists\n>from the last 1-6 months using the\n>Spotify Web API. It implements the\n>OAuth 2.0 authentication flow,\n>allowing the user to login securely\n>and fetch their data.\n>Type 'n' to go to the next page!\n>Type 'code' to see the code!"
      projectNum = 1
      codeNum = 0
    }
    else if (command == "n" && projectNum == 1){
      text = ">BCI Chromium Extension\n>A JavaScript based Chromium extension\n>that uses the Web Bluetooth API to\n>gather EEG data from a Muse S user.\n>It manipulates the browser screen\n>brightness based on the user's\n>wakefulness and light level for\n>comfort on the eyes.\n>Type 'n' to go to the next page!\n>Type 'code' to see the code!"
      projectNum++
      codeNum = 1
    }
    else if (command == "n" && projectNum == 2){
      text = ">Pythons on A Plane\n>An endless runner game reminiscent\n>of games like Jetpack Joyride. Uses\n>pygame for the game design and\n>Firebase for a backend leaderboard!\n>Dodge menacing obstacles and collect\n>coins to soar through the skies with\n>finesse.\n>Type 'code' to see the code!"
      codeNum = 2
      projectNum = 0
    }
    else if (command == "code" && codeNum == 0){
      window.open("https://github.com/ericxiong1/packedify-public", '_blank').focus();
      codeNum = -1
    }
    else if (command == "code" && codeNum == 1){
      window.open("https://github.com/ericxiong1/bci-chromium-extension", '_blank').focus();
      codeNum = -1
    }
    else if (command == "code" && codeNum == 2){
      window.open("https://github.com/ericxiong1/pythons-on-a-plane", '_blank').focus();
      codeNum = -1
    }
    else if(command == "website"){
      text = ">This website was built from scratch\n>using free Blender models, free\n>royalty sounds, and vanilla JS using\n>the amazing library three.js! This\n>was my first project in 3D WebGL\n>programming. All post-processing\n>effects, bloom, events, lighting,\n>and audio cues were all learned from\n>the wonderful examples three.js has\n>provided in their documentation."
      projectNum = 0
      codeNum = -1
    }
    else if(command == "contact"){
      text = ">I'm looking for work for my 4-8\n>month co-op term starting May 2024!\n>If you're interested in adding me to\n>your team, please reach out via my\n>email at exiong@ualberta.ca! I'd love\n>to hear from you!"
    }
    else{
      text = ">Don't know that command :(\n>about - learn more about me!\n>experience - see my experience!\n>projects - see stuff i've built!\n>website - learn how i made this!\n>contact - contact me!\n>Try the switches on the bottom right!\n>Hold left click to rotate, and right\n>click to pan. Scroll wheel to zoom."
      projectNum = 0
      codeNum = -1
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
    if (terminal.length<35){
      terminal += ch
    }
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

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}
setTimeout(() => {
  document.querySelector('#screen').style.display = "none"
  loading = false
}, 1500);
animate()