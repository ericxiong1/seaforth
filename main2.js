import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

function createScene() {
	scene = new THREE.Scene()
	camera = new THREE.PerspectiveCamera(50, ui.width/ui.height, 0.1, 10000)
	audioManager.setCamera(camera)
	scene.fog = new THREE.Fog(0xf7d9aa, 100, 950)

	renderer = new THREE.WebGLRenderer({canvas: ui.canvas, alpha: true, antialias: true})
	renderer.setSize(ui.width, ui.height)
	renderer.setPixelRatio(window.devicePixelRatio? window.devicePixelRatio : 1)

	renderer.shadowMap.enabled = true


	function setupCamera() {
		renderer.setSize(ui.width, ui.height)
		camera.aspect = ui.width / ui.height
		camera.updateProjectionMatrix()
	}

	setupCamera()
	ui.onResize(setupCamera)

	// const controls = new THREE.OrbitControls(camera, renderer.domElement)
}