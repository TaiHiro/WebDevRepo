function STLLoad(box, model) {
    if (!WEBGL.isWebGLAvailable()) {
        box.appendChild(WEBGL.getWebGLErrorMessage());
        return;
    }

    /** this was something that i struggled with for a while because before i
     added this, there would be so many models loading and they would sort of
     just spawn on top of each other. i had to fix this in order to get my
     carousel working. basically it detects if there are already rendered
     elements and keeps it from doing it over and over again*/

    if (box.hasChildNodes()) return;

    //renderer from three.js
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(box.clientWidth, box.clientHeight);
    box.appendChild(renderer.domElement);

    //create a camera so we can see
    const camera = new THREE.PerspectiveCamera(70, box.clientWidth / box.clientHeight, 1, 1000);
    camera.position.z = 100;


    //controls that allow us to move the camera around and zoom. also keeps the model in rotation
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.75;
    controls.enableZoom = true;
    controls.enablePan = true;

    //creates a 3d scene where we can put our models and lights
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x080820, 1.25));

    //loader for stl files from three.js
    const loader = new THREE.STLLoader();
    loader.load(model, function (geometry) {
        //set color and material of the model
        const material = new THREE.MeshPhongMaterial({ color: 0x97C6C1, specular: 100, shininess: 50 });
        const mesh = new THREE.Mesh(geometry, material);
        //adds the actual model to the scene
        scene.add(mesh);

        //centers the model in the scene
        geometry.computeBoundingBox();
        const center = geometry.boundingBox.getCenter(new THREE.Vector3());
        mesh.position.sub(center);
        const size = geometry.boundingBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        camera.position.z = maxDim * 2;
    
        //creates a raycaster for mouse interactions :) 
        /** (apparently this means that it simulates
        basically shooting a laser with the mouse 
        forward into the screen until it
        hits something?) */
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let highlighted = false;

        //detects mouse movement
        box.addEventListener('mousemove', function (event) {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            //detects mouse and model intersection
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects([mesh]);

            //hover effect
            if (intersects.length > 0) {
                if (!highlighted) {
                    mesh.originalColor = mesh.material.color.clone();
                    mesh.material.color.set(0x659CA0);
                    highlighted = true;
                }
            } else {
                if (highlighted) {
                    mesh.material.color.copy(mesh.originalColor);
                    highlighted = false;
                }
            }
        });

        //starts an animaton loop so that the scene does the things
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }

        animate();
    });

// this makes the loader responsive
    window.addEventListener('resize', () => {
        renderer.setSize(box.clientWidth, box.clientHeight);
        camera.aspect = box.clientWidth / box.clientHeight;
        camera.updateProjectionMatrix();
    });
}

// this is my carousel code
document.addEventListener("DOMContentLoaded", function () {
    const track = document.querySelector(".carousel-track");
    const items = document.querySelectorAll(".carousel-item");
    const prevBtn = document.querySelector(".carousel-btn.prev");
    const nextBtn = document.querySelector(".carousel-btn.next");

    let currentIndex = 0;

    function updateCarousel() {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;

        // Load STL model only once per item
        const currentStlDiv = items[currentIndex].querySelector(".stlload");
        if (!currentStlDiv.dataset.loaded) {
            STLLoad(currentStlDiv, currentStlDiv.dataset.src);
            currentStlDiv.dataset.loaded = "true";
        }
    }

    prevBtn.addEventListener("click", () => {
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        updateCarousel();
    });

    nextBtn.addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % items.length;
        updateCarousel();
    });

    updateCarousel();
});
