type GestureLocator = {
    project_name: string,
    participant_id: string,
    trial_id: string,
    gesture_index: string
}

type Trial = {
    trial_id: string;
    trial_name: string;
    options?: {
        instructionDuration: number
    };
    instructions: string;
    gestures: Gesture[];
};

type Gesture = {
    options?: {
        instructionDuration: number,
    };
    gesture_id: string;
    gesture_name: string;
    instruction: string;
    duration: number;
    completed?: boolean;
};