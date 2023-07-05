import { Clock } from "three";

export function getHandDataAsString(renderer: THREE.WebGLRenderer, clock: Clock) {
    const hand0 = renderer.xr.getHand(0);
    const hand1 = renderer.xr.getHand(1);
  
    const indexToName = [
      'wrist',
      'thumb-metacarpal',
      'thumb-phalanx-proximal',
      'thumb-phalanx-distal',
      'thumb-tip',
      'index-finger-metacarpal',
      'index-finger-phalanx-proximal',
      'index-finger-phalanx-intermediate',
      'index-finger-phalanx-distal',
      'index-finger-tip',
      'middle-finger-metacarpal',
      'middle-finger-phalanx-proximal',
      'middle-finger-phalanx-intermediate',	
      'middle-finger-phalanx-distal',
      'middle-finger-tip',
      'ring-finger-metacarpal',
      'ring-finger-phalanx-proximal',
      'ring-finger-phalanx-intermediate',
      'ring-finger-phalanx-distal',
      'ring-finger-tip',
      'pinky-finger-metacarpal',
      'pinky-finger-phalanx-proximal',
      'pinky-finger-phalanx-intermediate',
      'pinky-finger-phalanx-distal',
      'pinky-finger-tip'
    ];
  
    function getJointAsString(handObj, jointName){
      const posArray = handObj.joints[jointName].position.toArray();
      const poseArray = posArray.concat(handObj.joints[jointName].quaternion.toArray());
  
      poseArray.forEach((ele: number, index: number) => poseArray[index] = ele.toFixed(7));
  
      return `${poseArray.join(',')},`;
    }
  
    function getHandAsString(handObj) {
      let out_str = '';
      for (let i = 0; i <= 24; i++) {
        out_str += getJointAsString(handObj, indexToName[i]);
      }
      return out_str
    }
  
    const captureStartTime = clock.getElapsedTime();
    const capturedData = getHandAsString(hand0) + getHandAsString(hand1);
    const captureEndTime = clock.getElapsedTime();
  
    const finalData = `${capturedData}${captureStartTime},${captureEndTime}\n`
  
    return finalData;

}