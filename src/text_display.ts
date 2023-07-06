import { Mesh, MeshBasicMaterial, Object3D, Scene } from 'three';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

// object type definitions

// conceptual text objects
type StyleObject = {
    size: number;
    xpos: number;
    ypos: number;
}

type Text = {
    text: string;
    style: StyleObject; 
}

type TextGroup = Text[];

type TextInstance = {
    textGroup: TextGroup;
    duration: number;
}

type TextSequence = TextInstance[];

// promise definitions
function loadFont() {
    const fontLoader = new FontLoader();
    const currentFont = 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json';

    return new Promise((resolve) => {
        fontLoader.load(currentFont, (font) => {
            resolve(font);
        });
    });
}

async function displayTextSequence(textSequence: TextSequence, font:Font, scene: Scene) {
    let currentTextGroup = [];
    function updateTextTo(textGroup: TextGroup) {
        clearTextGroup(currentTextGroup, scene);
        currentTextGroup = loadTextGroup(textGroup, font, scene);
    }

    for (let textInstance of textSequence) {
        let durationPromise = new Promise((resolve) => setTimeout(resolve, textInstance.duration));
        updateTextTo(textInstance.textGroup);
        await durationPromise;
    } 
    
    // remove final text
    clearTextGroup(currentTextGroup, scene);
}


// utility function
function clearTextGroup(textObjectGroup: Object3D[], scene: Scene) {
    if (textObjectGroup) {
        textObjectGroup.forEach(element => scene.remove(element));
    }
}



function loadTextGroup(textGroup: TextGroup, font:Font, scene: Scene): Object3D[] {
    function loadText(text: Text, font: Font, scene: Scene): Object3D {
        var geometry = new TextGeometry(text.text, {
            font: font,
            size: text.style.size,
            height: 0.01,
            curveSegments: 4,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.05,
            bevelSegments: 3
          });
        
          // position text
          geometry.center();
          geometry.translate(text.style.xpos, text.style.ypos, -10);
    
          // add material and mesh
          var material = new MeshBasicMaterial({ color: 0xffffff });
          var mesh = new Mesh(geometry, material);
          mesh.name = 'text';
    
          // add to scene and return
          scene.add(mesh);
          return mesh;
    }

    return textGroup.map((text) => loadText(text, font, scene));
}
