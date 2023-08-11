/**
 * Used to uniquely identify a gesture instance within a project
 */
type GestureLocator = {
    project_name: string,
    participant_id: string,
    trial_id: string,
    gesture_index: string
}

/**
 * An instance of a Trial and most of the information required to perform it.
 * 
 * @remarks {@link GestureLocator} is needed for the location to send the data
 */
type Trial = {
    trial_id: string;
    trial_name: string;
    instructions: string;
    gestures: Gesture[];
};

/**
 * An instance of a gesture
 */
type Gesture = {
    gesture_id: string;
    gesture_name: string;
    instruction: string;
    duration: number;
};