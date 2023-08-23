import { Mesh, MeshBasicMaterial, Object3D, Scene, Vector3 } from 'three';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry, TextGeometryParameters } from 'three/examples/jsm/geometries/TextGeometry.js';

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
    durationMs: number;
}

type TextSequence = TextInstance[];

// useful shortcuts
function displayString(str: string, durationMs: number, scene: Scene, 
    style: Style={size: 0.5, xpos: 0, ypos: 0}) {

    return displayTextSequence([{textGroup: [{text: str, style: style}], durationMs }], scene);
}

function displayStringIndefinitely(text: string, scene: Scene, 
    style: Style={size: 0.5, xpos: 0, ypos: 0}) {

    return displayIndefinitely([{text, style}], scene);
}

function displayForReadableTime(str: string, scene: Scene,
    style: Style={size: 0.5, xpos: 0, ypos: 0}) {

    return displayString(str, getReadTime(), scene);

    function getReadTime(timePerWord = 1000) {
        const wordNum = str.split(/[ \n\t]/).length;
        return wordNum * timePerWord + 2000;
    }
}

// promise definitions
function loadFont() {
    if (font) return;

    return new Promise((resolve) => {
        const fontLoader = new FontLoader();
        const currentFont = 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json';


        fontLoader.load(currentFont, (loadedFont) => {
            font = loadedFont;
            resolve(font);
        });
    });
}

function displayIndefinitely(textGroup: TextGroup, scene: Scene) {
    return loadTextGroup(textGroup, scene);
}

function clearDisplayIndefinitely(object: Object3D[], scene: Scene) {
    clearTextGroup(object, scene);
}

async function displayTextSequence(textSequence: TextSequence, scene: Scene) {
    let currentTextGroup = [];
    function updateTextTo(textGroup: TextGroup) {
        clearTextGroup(currentTextGroup, scene);
        currentTextGroup = loadTextGroup(textGroup, scene);
    }

    for (let textInstance of textSequence) {
        let durationPromise = new Promise((resolve) => setTimeout(resolve, textInstance.durationMs));
        updateTextTo(textInstance.textGroup);
        await durationPromise;
    }

    // remove final text
    clearTextGroup(currentTextGroup, scene);
}

async function countDown(
    countFromS: number,
    countToS: number,
    stepS: number,
    scene: Scene,
    decimals: number = 1,
    style: Style={size: 0.5, xpos: 0, ypos: 1} 
    ) {

    if (countToS >= countFromS) {
        return;
    }

    const seq: TextSequence = [];
    let currentVal: number;
    
    for (currentVal = countFromS; currentVal > stepS + countToS; currentVal -= stepS) {
        const inst: TextInstance = {
            textGroup: [{ text: currentVal.toFixed(decimals), style }], 
            durationMs: stepS * 1000
        };

        seq.push(inst);
    }

    seq.push({ 
        textGroup: [{ text: (stepS + countToS).toFixed(decimals), style }], 
        durationMs: ( currentVal - countToS ) * 1000 // we know currentVal > countToS
    });
 
    await displayTextSequence(seq, scene);
}

// utility function
function clearTextGroup(textObjectGroup: Object3D[], scene: Scene) {
    if (textObjectGroup) {
        textObjectGroup.forEach(element => scene.remove(element));
    }
}

function loadTextGroup(textGroup: TextGroup, scene: Scene): Object3D[] {
    function loadText(text: Text, font: Font, scene: Scene): Object3D {
        const textProperties: TextGeometryParameters = {
            font: font,
            size: text.style.size,
            height: 0.1,
            curveSegments: 4,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.05,
            bevelSegments: 3
        }

        const textMesh = getCenteredText(text.text, textProperties);
        textMesh.position.add(new Vector3(text.style.xpos, text.style.ypos, -10));
        scene.add(textMesh);
        return textMesh;
    }

    return textGroup.map((text) => loadText(text, font, scene));
}

function getCenteredText(text: string, textProperties: TextGeometryParameters) {
    const geometry = new TextGeometry(text, textProperties);

    const materialFront = new MeshBasicMaterial( { color: 0xffffff } );
    const materialSide = new MeshBasicMaterial( { color: 0x333333 } );
    const materialArray = [ materialFront, materialSide ];

    const textMesh = new Mesh(geometry, materialArray );

    geometry.computeBoundingBox();
    const textWidth = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
    const textHeight = geometry.boundingBox.max.y - geometry.boundingBox.min.y
    
    textMesh.position.set( -0.5 * textWidth, 0.5*textHeight, 0);
    return textMesh
}

export { loadFont, displayTextSequence, countDown, Style, displayString, displayForReadableTime, displayIndefinitely, clearDisplayIndefinitely, displayStringIndefinitely, getCenteredText, font };