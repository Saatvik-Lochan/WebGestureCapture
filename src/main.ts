import { initScene, initProject, animate } from "./init";

main();

/**
 * The main function which is run when a participant is to perform 
 * a trial
 */
async function main() {
    await initScene();
    await initProject();
    animate();
}