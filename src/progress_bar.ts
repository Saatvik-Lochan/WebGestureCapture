import { BoxGeometry, Clock, EdgesGeometry, LineSegments, Mesh, MeshBasicMaterial } from "three";
import { InteractObject } from "./interact_box";
import { frameListeners, scene } from "./init";

const blueMaterial = new MeshBasicMaterial({ color: 0x0000ff, opacity: 0.8, transparent: true });

export function createProgressBar(name: string, timeS: number): InteractObject {

    const length = 5;
    const cubeGeom = new BoxGeometry(length, 0.2, 0.2);
    const bar = new Mesh(cubeGeom, blueMaterial);

    // add a wireframe to the cube to better see the depth
    const _outline = new EdgesGeometry(cubeGeom);
    const outline = new LineSegments(_outline);

    scene.add(bar);
    scene.add(outline);

    const setPosition = (x: number, y: number, z: number) => {
        bar.position.set(x, y, z);
        outline.position.set(x, y, z);
    }

    const setFractionalPosition = (f: number) => {

        // clamp f between 0 and 1
        f = Math.max(0, Math.min(1, f));

        bar.scale.x = f;
        bar.position.x = outline.position.x - length * (1 - f) / 2;  
    }

    setPosition(0, 3, -10);
    setFractionalPosition(0.8);
    
    const clock = new Clock();

    const removeObjects = () => {
        scene.remove(bar);
        scene.remove(outline);
    }
    
    const completion = new Promise<string>(resolve => {
       frameListeners[name] = {
            fcn: () => {
                const currentTime = clock.getElapsedTime();
                setFractionalPosition(1 - currentTime / timeS);

                if (currentTime > timeS) {
                    delete frameListeners[name];
                    removeObjects();
                    resolve(name);
                }
            },
            t: 2,
            offset: 1
       }
    });

    const deleteFunc = () => {
        removeObjects();
        delete frameListeners[name];
    }

    return {
        completion,
        delete: deleteFunc
    };
}