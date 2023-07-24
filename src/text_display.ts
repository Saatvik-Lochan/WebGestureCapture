import { Mesh, MeshBasicMaterial, Object3D, Scene } from 'three';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

// object type definitions
let font: Font;

// conceptual text objects
class Style {
    size: number;
    xpos: number;
    ypos: number;

    constructor (size = 1, xpos = 0, ypos = 0) {
        this.size = size;
        this.xpos = xpos;
        this.ypos = ypos;
    }
}

type Text = {
    text: string;
    style: Style;
}

type TextGroup = Text[];

type TextInstance = {
    textGroup: TextGroup;
    duration: number;
}

type TextSequence = TextInstance[];

// useful shortcuts
function displayString(str: string, duration: number, scene: Scene, 
    style: Style={size: 1, xpos: 0, ypos: 0}) {

    return displayTextSequence([{textGroup: [{text: str, style: style}], duration }], scene);
}

function displayForReadableTime(str: string, scene: Scene,
    style: Style={size: 1, xpos: 0, ypos: 0}) {

    return displayString(str, getReadTime(), scene);

    function getReadTime(timePerWord = 1500) {
        const wordNum = str.split(/[ \n\t]/).length;
        return wordNum * timePerWord;
    }
}

// promise definitions
function loadFont() {
    if (font != null) return;

    return new Promise((resolve) => {
        const fontLoader = new FontLoader();
        const currentFont = 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json';


        fontLoader.load(currentFont, (loadedFont) => {
            font = loadedFont;
            resolve(font);
        });
    });
}

async function displayTextSequence(textSequence: TextSequence, scene: Scene) {
    let currentTextGroup = [];
    function updateTextTo(textGroup: TextGroup) {
        clearTextGroup(currentTextGroup, scene);
        currentTextGroup = loadTextGroup(textGroup, scene);
    }

    for (let textInstance of textSequence) {
        let durationPromise = new Promise((resolve) => setTimeout(resolve, textInstance.duration));
        updateTextTo(textInstance.textGroup);
        await durationPromise;
    }

    // remove final text
    clearTextGroup(currentTextGroup, scene);
}

async function countDown(
    countFrom: number, 
    scene: Scene,
    style: Style={size: 1.5, xpos: 0, ypos: 0}) {

    const textSequence = Array.from({ length: countFrom }, (_, i) => {
        let num = countFrom - i;
        return {textGroup: [{text: num.toString(), style: style}], duration: 1000};
    });

    await displayTextSequence(textSequence, scene);
}

// utility function
function clearTextGroup(textObjectGroup: Object3D[], scene: Scene) {
    if (textObjectGroup) {
        textObjectGroup.forEach(element => scene.remove(element));
    }
}

function loadTextGroup(textGroup: TextGroup, scene: Scene): Object3D[] {
    function loadText(text: Text, font: Font, scene: Scene): Object3D {
        const geometry = new TextGeometry(text.text, {
            font: font,
            size: text.style.size,
            height: 0.1,
            curveSegments: 4,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.05,
            bevelSegments: 3
        });

        const materialFront = new MeshBasicMaterial( { color: 0xffffff } );
	    const materialSide = new MeshBasicMaterial( { color: 0x333333 } );
	    const materialArray = [ materialFront, materialSide ];

	    var textMesh = new Mesh(geometry, materialArray );
        console.log(textMesh.position)

        geometry.computeBoundingBox();
        var textWidth = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
        
        textMesh.position.set( -0.5 * textWidth, 0, -10);
        geometry.translate(text.style.xpos, text.style.ypos, -10);
        scene.add(textMesh);
        return textMesh;

        // // position text
        // geometry.center();
        // geometry.translate(text.style.xpos, text.style.ypos, -10);

        // // add material and mesh
        // const material = new MeshBasicMaterial({ color: 0xffffff });
        // const mesh = new Mesh(geometry, material);
        // mesh.name = 'text';

        // // add to scene and return
        // scene.add(mesh);
        // return mesh;
    }

    return textGroup.map((text) => loadText(text, font, scene));
}

export { loadFont, displayTextSequence, countDown, Style, displayString, displayForReadableTime };