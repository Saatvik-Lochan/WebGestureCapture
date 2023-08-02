import { initScene, animate, renderer } from "../main";

async function main() {
    await initScene();
    animate();
}

function initDemonstration() {
    const urlParams = new URLSearchParams(window.location.search);
    const shortCode = urlParams.get('code');

    
}
