import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import "./styles.css";

let scene,
  camera,
  renderer,
  controller,
  mixer,
  clock,
  actions = [];

init();

function init() {
  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#canvas"),
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 15;
  camera.position.y = 3;
  scene.add(camera);

  function setPerspective() {
    const { innerWidth, innerHeight } = window;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", setPerspective);
  setPerspective();

  controller = new OrbitControls(camera, renderer.domElement);
  controller.enableDamping = true;

  const ambientLight = new THREE.AmbientLight(0xffbbaa, 0.8);
  scene.add(ambientLight);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100, 100, 100),
    new THREE.MeshStandardMaterial({ color: 0xaaddaa })
  );
  floor.receiveShadow = true;
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  clock = new THREE.Clock();
  clock.start();

  const gltfLoader = new GLTFLoader();
  gltfLoader.load(
    "/models/Fox.gltf",
    (gltf) => {
      gltf.scene.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);
      gltf.scene.scale.set(0.025, 0.025, 0.025);
      gltf.scene.traverse(function (node) {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      scene.add(gltf.scene);
      mixer = new THREE.AnimationMixer(gltf.scene);
      actions.push(mixer.clipAction(gltf.animations[0]));
      actions.push(mixer.clipAction(gltf.animations[1]));
      actions.push(mixer.clipAction(gltf.animations[2]));
      actions[0].play();
      actions[1].play();
      actions[2].play();
      actions[1].fadeOut(0);
      actions[2].fadeOut(0);
    },
    (progress) => console.log(progress),
    (error) => console.log(error)
  );

  const light = new THREE.DirectionalLight(0xffffaa, 0.8);
  light.position.set(1, 1, 1);
  light.castShadow = true;
  scene.add(light);

  animate();
}

let state = "idle";
function handleKeyPress(e) {
  if (state === "idle") {
    actions[1].enabled = true;
    actions[0].crossFadeTo(actions[1], 0.75);
    state = "walking";
  }
  // if shift key is pressed
  if (e.shiftKey && state === "walking") {
    actions[2].enabled = true;
    actions[1].crossFadeTo(actions[2], 1);
    state = "running";
  }
  // if shift key is released
  if (!e.shiftKey && state === "running") {
    actions[1].enabled = true;
    actions[2].crossFadeTo(actions[1], 1);
    state = "running";
  }
}
window.addEventListener("keypress", handleKeyPress);

function handleKeyRelease(e) {
  if (state !== "idle") {
    actions[0].enabled = true;
    actions[1].fadeOut(0.5);
    actions[2].fadeOut(0.5);
    actions[0].fadeIn(0.5);
    state = "idle";
  }
}
window.addEventListener("keyup", handleKeyRelease);

function animate() {
  mixer?.update(clock.getDelta());
  controller.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
