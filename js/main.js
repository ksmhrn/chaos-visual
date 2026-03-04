// --- SCENE & CAMERA ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000010);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 2000);
camera.position.set(0, 0, 150);

// --- RENDERER ---
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- CONTROLS ---
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// --- TEXTURES ---
const loader = new THREE.TextureLoader();
const textures = [];
for(let i=0;i<20;i++){
    textures.push(loader.load(`https://picsum.photos/32?random=${i+1}`));
}

// --- FRACTAL PARTICLE POSITIONS ---
const positions = [];
const sizes = [];
const textureIndices = [];
const maxDepth = 5;

function createBranchPoints(pos, dir, depth){
    if(depth > maxDepth) return;

    const branchCount = Math.floor(Math.random()*3) + 2; // 2〜4分岐
    for(let i=0;i<branchCount;i++){
        const angleOffset = new THREE.Vector3(
            (Math.random()-0.5)*0.5,
            (Math.random()-0.5)*0.5,
            (Math.random()-0.5)*0.5
        );
        const newDir = dir.clone().add(angleOffset).normalize();
        const distance = Math.random()*6 + 3;

        const newPos = new THREE.Vector3(
            pos.x + newDir.x*distance,
            pos.y + newDir.y*distance,
            pos.z + newDir.z*distance
        );

        positions.push(newPos.x, newPos.y, newPos.z);
        sizes.push(Math.random()*0.5 + 0.5);
        textureIndices.push(Math.floor(Math.random()*textures.length));

        createBranchPoints(newPos, newDir, depth+1);
    }
}

// ルート粒子
const rootCount = 15;
for(let i=0;i<rootCount;i++){
    const rootPos = new THREE.Vector3(
        (Math.random()-0.5)*20,
        (Math.random()-0.5)*20,
        (Math.random()-0.5)*20
    );
    const rootDir = new THREE.Vector3(0,1,0).applyAxisAngle(new THREE.Vector3(0,0,1), Math.random()*Math.PI*2);
    createBranchPoints(rootPos, rootDir, 0);
}

// --- PARTICLE MESHES ---
const planeGeo = new THREE.PlaneGeometry(1,1);
const meshes = [];
for(let i=0;i<positions.length/3;i++){
    const mat = new THREE.MeshBasicMaterial({
        map: textures[textureIndices[i]],
        transparent: false
    });
    const mesh = new THREE.Mesh(planeGeo, mat);
    mesh.position.set(positions[i*3], positions[i*3+1], positions[i*3+2]);
    mesh.scale.multiplyScalar(sizes[i]);
    scene.add(mesh);
    meshes.push(mesh);
}

// --- STARFIELD ---
const starGeo = new THREE.BufferGeometry();
const starCount = 1000;
const starPositions = [];
for(let i=0;i<starCount;i++){
    starPositions.push(
        (Math.random()-0.5)*400,
        (Math.random()-0.5)*400,
        (Math.random()-0.5)*400
    );
}
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions,3));
const starMaterial = new THREE.PointsMaterial({ color:0xffffff, size:0.3, transparent:true, opacity:0.8 });
const stars = new THREE.Points(starGeo, starMaterial);
scene.add(stars);

// --- MOUSE CHAOS ---
let targetChaos = 0.2;
window.addEventListener('mousemove',(e)=>{
    targetChaos = (e.clientX/window.innerWidth)*1.5;
});

// --- RESIZE ---
window.addEventListener('resize',()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- ANIMATION LOOP ---
function animate(){
    requestAnimationFrame(animate);
    const time = Date.now()*0.001;

    meshes.forEach(mesh=>{
        mesh.position.x += (Math.random()-0.5)*0.02*targetChaos + Math.sin(mesh.position.y*0.1 + time)*0.02;
        mesh.position.y += (Math.random()-0.5)*0.02*targetChaos + Math.sin(mesh.position.z*0.1 + time*0.7)*0.02;
        mesh.position.z += (Math.random()-0.5)*0.02*targetChaos + Math.sin(mesh.position.x*0.1 + time*1.2)*0.02;

        mesh.rotation.y += 0.001;
        mesh.rotation.x += 0.001;

        mesh.lookAt(camera.position);
    });

    // 星の微揺れ
    const starPos = starGeo.attributes.position.array;
    for(let i=0;i<starPos.length;i+=3){
        starPos[i] += (Math.random()-0.5)*0.01;
        starPos[i+1] += (Math.random()-0.5)*0.01;
        starPos[i+2] += (Math.random()-0.5)*0.01;
    }
    starGeo.attributes.position.needsUpdate = true;

    controls.update();
    renderer.render(scene, camera);
}

animate();
