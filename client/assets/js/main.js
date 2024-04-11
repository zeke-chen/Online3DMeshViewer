import * as THREE from "three";

import { TrackballControls } from "three/addons/controls/TrackballControls.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { VTKLoader } from "three/addons/loaders/VTKLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

let camera, controls, scene, renderer, mesh;
let axesHelper, hemiLight, dirLight, ambientLight, pointLight;
let fileObj, fileInput;
let isDark = true;
let fileName = "";
const loaderSTL = new STLLoader();
const loaderVTK = new VTKLoader();
const loaderOBJ = new OBJLoader();

init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.01,
    100
  );
  camera.position.z = 0.2;

  scene = new THREE.Scene();

  scene.add(camera);

  axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  // light
  pointLight = new THREE.PointLight(0xffffff);
  scene.add(pointLight);

  ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 3);
  scene.add(hemiLight);

  dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(2, 2, 2);
  dirLight.castShadow = false;
  scene.add( dirLight );

  // File chooser handler
  fileInput = document.getElementById("fileInput");
  fileInput.addEventListener("change", function () {
    fileObj = this.files[0];
    fileName = fileObj.name;

    loadModel(fileObj);
  });

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const button = document.getElementById("themeBtn");
  button.style.backgroundImage = "url('../../images/theme.png')";
  button.style.backgroundSize = "contain";
  button.addEventListener("click", function () {
    if (isDark) {
      renderer.setClearColor(0xfcfcfc);
    } else {
      renderer.setClearColor(0x333333);
    }
    isDark = !isDark;
  });

  // controls
  controls = new TrackballControls(camera, renderer.domElement);
  controls.minDistance = 0.1;
  controls.maxDistance = 0.5;
  controls.rotateSpeed = 5.0;

  window.addEventListener("resize", onWindowResize);

  document.getElementById("cut-button").addEventListener("click", function () {
    document.getElementById("cut-dialog").removeAttribute("hidden");
  });

  document
    .getElementById("confirm-button")
    .addEventListener("click", function () {
      const origin = new THREE.Vector3(
        parseFloat(document.getElementById("origin-x-input").value),
        parseFloat(document.getElementById("origin-y-input").value),
        parseFloat(document.getElementById("origin-z-input").value)
      );

      const normal = new THREE.Vector3(
        parseFloat(document.getElementById("normal-x-input").value),
        parseFloat(document.getElementById("normal-y-input").value),
        parseFloat(document.getElementById("normal-z-input").value)
      );

      const geometry = new THREE.PlaneGeometry(0.1, 0.1);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });

      const plane = new THREE.Mesh(geometry, material);
      plane.lookAt(normal);
      plane.position.set(origin.x, origin.y, origin.z);
      scene.add(plane);

      // 将数据打包成 JSON 格式
      const data = {
        pos: origin,
        normal: normal,
        file: fileName,
      };

      console.log(JSON.stringify(data));

      // 发送请求到后端
      fetch("http://localhost:5000/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("HTTP status " + response.status);
          }
          return response.json();
        })
        .then((newDataPath) => {
          console.log(newDataPath);
          // 其他处理逻辑
        })
        .catch((error) => {
          console.error("Error:", error);
        });

      document.getElementById("cut-dialog").setAttribute("hidden", "");
    });

  document.getElementById("exit-button").addEventListener("click", function () {
    document.getElementById("cut-dialog").setAttribute("hidden", "");
  });
}

function processGeometry(geometry) {
  geometry.center();
  geometry.computeVertexNormals();

  const material = new THREE.MeshLambertMaterial({
    color: 0x0000ee,
    side: THREE.DoubleSide,
  });

  mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, 0);
  mesh.scale.multiplyScalar(0.2);
  scene.add(mesh);

  // 重新渲染以显示新加載的模型
  renderer.render(scene, camera);
}

function loadModel(fileObj) {
  console.log("load model");
  const objectUrl = URL.createObjectURL(fileObj);
  console.log(objectUrl); // 打印对象URL以进行检查

  const fileExtension = fileName.slice(
    (Math.max(0, fileName.lastIndexOf(".")) || Infinity) + 1
  ); //獲取文件的擴展名
  switch (fileExtension) {
    case "stl":
      loaderSTL.load(objectUrl, function (geometry) {
        processGeometry(geometry);
      });
      break;
    case "obj":
      loaderOBJ.load(objectUrl, function (geometry) {
        processGeometry(geometry);
      });
      break;
    case "vtk":
      loaderVTK.load(objectUrl, function (geometry) {
        processGeometry(geometry);
      });
      break;
    default:
      console.error("Unsupported file format");
  }
}

function clearScene() {
  for (let i = scene.children.length - 1; i >= 0; i--) {
    let obj = scene.children[i];
    if (
      !(obj instanceof THREE.AxesHelper) &&
      !(obj instanceof THREE.PerspectiveCamera) &&
      !(obj instanceof THREE.HemisphereLight) &&
      !(obj instanceof THREE.DirectionalLight)
    ) {
      scene.remove(obj);
    }
  }
}

document.getElementById("colorBtn").addEventListener("click", function () {
  const colorPicker = document.getElementById("colorPicker");
  colorPicker.click();
});

document.getElementById("colorPicker").addEventListener("change", function () {
  mesh.material.color.set(this.value);
});

const canvas = renderer.domElement;
canvas.id = "drop-zone";

const dropZone = document.getElementById("drop-zone");

// 添加事件监听器处理文件拖放
dropZone.addEventListener("dragover", (event) => {
  event.stopPropagation();
  event.preventDefault();
  // 添加样式反馈
  event.dataTransfer.dropEffect = "copy";
});

dropZone.addEventListener("drop", (event) => {
  event.stopPropagation();
  event.preventDefault();
  // 获取拖放的文件列表
  const fileList = event.dataTransfer.files;
  // 调用 loadModel 函数处理拖放的文件
  if (fileList[0]) {
    const fileObj = fileList[0];
    const fileName = fileObj.name;
    loadModel(fileObj);
  }
});
openBtn.addEventListener("click", function () {
  fileInput.value = "";
});

document.getElementById("clearBtn").addEventListener("click", clearScene);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  controls.handleResize();
}

function updateLightPosition() {
  hemiLight.position.copy(camera.position);
  dirLight.position.copy(camera.position);
  ambientLight.position.copy(camera.position);
  pointLight.position.copy(camera.position);
}

function animate() {
  requestAnimationFrame(animate);

  updateLightPosition();

  controls.update();

  renderer.render(scene, camera);

  //stats.update();
}
