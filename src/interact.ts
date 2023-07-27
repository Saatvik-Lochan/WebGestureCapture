import * as THREE from "three";
import { frameListeners, hands } from "./main";

const greenMaterial = new THREE.MeshBasicMaterial( {color: 0x00ff00,  opacity:0.4, transparent:true});
const redMaterial = new THREE.MeshBasicMaterial( {color: 0xff0000,  opacity:0.4, transparent:true});

function createInteractBox(scene: THREE.Scene) {
    return new Promise(resolve => {
        // Create the cube itself
        const cubeGeom = new THREE.BoxGeometry( 1, 0.2, 1 );
        const cube = new THREE.Mesh( cubeGeom, greenMaterial );
    
        // Also add a wireframe to the cube to better see the depth
        const _wireframe = new THREE.EdgesGeometry( cubeGeom ); 
        const wireframe = new THREE.LineSegments( _wireframe);
    
        // Rotate it a little for a better vantage point
        cube.position.set(0, 0.5, -0.1);
        wireframe.position.set(0, 0.5, -0.1);
    
        // add to scene
        scene.add( cube ) 
        scene.add( wireframe );
        
        const box = new THREE.Box3();
        box.setFromObject(cube);
    
        let wasInBox = false;
    
        frameListeners["button"] = () => {
            if (handsInBox(hands, box)) {
                cube.material = redMaterial;
                wasInBox = true;
            } else if (wasInBox) {
                deleteBox();
            }
        };

        function deleteBox() {
            scene.remove(cube);
            scene.remove(wireframe)
            resolve(undefined);
        }
    })


    
}

function handsInBox(hands: THREE.XRHandSpace[], box: THREE.Box3) {
    const jointSpaces = hands.flatMap((hand) => (Object.values(hand.joints)));
    return jointSpaces.every((jointSpace) => jointInBox(jointSpace));


    function jointInBox(joint: THREE.XRJointSpace): boolean {
        const radius = joint.jointRadius;
        const centre = joint.position;

        const jointSphere = new THREE.Sphere(centre, radius);
        const sphereBoundingBox = new THREE.Box3(); 
        jointSphere.getBoundingBox(sphereBoundingBox);

        return box.containsBox(sphereBoundingBox);
    }
}

export { createInteractBox }