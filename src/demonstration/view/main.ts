import { Vector3, XRHandSpace } from "three";
import { getDemonstration } from "../../http_handler";
import { animate, camera, initScene, renderer, updateBackendUrl } from "../../init";
import { GestureDemonstration } from "../demonstrate_gesture";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

main();

async function main() {
    updateBackendUrl();
    await initScene();
    animate();
    await initViewer();
}

async function initViewer() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectName = urlParams.get('project');
    const gid = urlParams.get('gid');

    if (!(projectName && gid)) {
        document.getElementById("instruction-text").innerText = "project and gid must be provided";
        return;
    }

    const demonstration = new GestureDemonstration("preview");
    const data = await getDemonstration(projectName, gid);

    if (!data) {
        document.getElementById("instruction-text").innerText = "This demonstration does not yet exist";
        return;
    }

    demonstration.load(data);
    demonstration.startPlaybackLoop();

    await new Promise(resolve => setTimeout(resolve, 50));

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.target = findCentre(Object.values(demonstration.hands));
    console.log(controls.target);

    controls.enableDamping = true; 
    controls.dampingFactor = 0.05;

    controls.screenSpacePanning = false;

    controls.minDistance = 0;
    controls.maxDistance = 1;
    
    camera.position.set(0, 5, 0);
    controls.update();
}

function findCentre(hands: XRHandSpace[]) {
    const accumulatingVector = new Vector3();
    let totalJoints = 0;

    hands.forEach(hand => 
        Object.values(hand.joints).forEach(joint => {
            accumulatingVector.add(joint.localToWorld(joint.position));
            console.log(joint.localToWorld(joint.position));
            totalJoints++;
        })
    ); 


    const finalVector =  accumulatingVector.divideScalar(totalJoints);
    console.log(finalVector);
    return finalVector;
}
