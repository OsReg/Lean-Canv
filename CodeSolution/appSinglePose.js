// Flag to control the state of pose detection
let isRunning = false;

// Array to store the positions of keypoints over time
let keypointPositions = [];

// Variable to hold the ID of the animation frame for cancellation
let animationFrameId;

// ####################################################
// Constants and variables for the Time Up and Go (TUG) test

// Distance (in meters) the subject needs to walk in the TUG test
const tugDistance = 0.8;

// Average distance (in meters) between the subject's hips (used for scaling)
const hipToHip = 0.35;

// Counter to track the steps in the TUG test
let tugCounter = 0;

// Variables to store initial velocity and starting position
let v_initial = null;
let startPosition = null;

// Object to store timestamps for different phases of the TUG test
let times = {
    standUpStart: null,
    standUpEnd: null,
    walkForwardStart: null,
    walkForwardEnd: null,
    turn1Start: null,
    turn1End: null,
    walkBackStart: null,
    walkBackEnd: null,
    turn2Start: null,
    turn2End: null,
    sitDownStart: null,
    sitDownEnd: null
};
// ####################################################

// ####################################################
// Constants and variables for the calculateSpeed function

// Variables to store previous time and position for speed calculation
let previousTime = null;
let previousPosition = null;

// Interval (in milliseconds) at which speed updates occur
const updateInterval = 200;

// Variables to track the last update time and last calculated speed
let lastUpdateTime = 0;
let lastSpeed = 0;
// ####################################################

/**
 * Sets up the webcam stream and returns a promise that resolves when metadata is loaded.
 * @returns {Promise<HTMLVideoElement>}
 */
async function setupWebcam() {
    const webcamElement = document.getElementById('webcam');
    // Request access to the webcam video stream
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    webcamElement.srcObject = stream;

    // Return a promise that resolves when the webcam metadata is loaded
    return new Promise((resolve) => {
        webcamElement.onloadedmetadata = () => {
            resolve(webcamElement);
        };
    });
}

/**
 * Main function that initializes the pose detection and handles the TUG test logic.
 */
async function main() {
    let net; // Variable to hold the loaded PoseNet model

    try {
        // Load the PoseNet model
        net = await posenet.load();
    } catch (error) {
        console.error("Posenet model could not load:", error);
        return;
    }

    // Set up the webcam and canvas elements
    const webcam = await setupWebcam();
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // Set the canvas dimensions to match the video dimensions
    canvas.width = webcam.videoWidth;
    canvas.height = webcam.videoHeight;

    /**
     * Continuously detects the user's pose and updates the canvas.
     */
    async function detectPose() {
        if (!isRunning) return;

        let pose;
        try {
            // Estimate the user's pose using the PoseNet model
            pose = await net.estimateSinglePose(webcam, {
                flipHorizontal: true
            });
        } catch (error) {
            console.error("Error estimating pose:", error);
            requestAnimationFrame(detectPose);
            return;
        }

        // Clear the canvas for the new frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // If the pose estimation is confident enough, draw keypoints and skeleton
        if (pose.score >= 0.5) {
            drawKeypoints(pose.keypoints, 0.8, ctx);
            drawSkeleton(pose.keypoints, 0.8, ctx);

            // Find the left shoulder keypoint
            const leftShoulder = pose.keypoints.find(k => k.part === 'leftShoulder');
            if (leftShoulder && leftShoulder.score >= 0.8) {
                // Save the position and timestamp for later analysis
                keypointPositions.push({ time: Date.now(), x: leftShoulder.position.x, y: leftShoulder.position.y });
            }
        }

        // Calculate speed and update the TUG test state
        calculateSpeed(pose);
        timeUpAndGo(pose);

        // Request the next animation frame
        animationFrameId = requestAnimationFrame(detectPose);
    }

    // Event listener to start pose detection when the "Start" button is clicked
    document.getElementById('startButton').addEventListener('click', () => {
        resetVariables();
        isRunning = true;
        detectPose();
    });

    // Event listener to stop pose detection when the "Stop" button is clicked
    document.getElementById('stopButton').addEventListener('click', () => {
        isRunning = false;
        resetVariables();
    });
}

/**
 * Draws keypoints on the canvas for the detected pose.
 * @param {Array} keypoints - Array of keypoints from PoseNet.
 * @param {number} minConfidence - Minimum confidence score to consider a keypoint.
 * @param {CanvasRenderingContext2D} ctx - The canvas drawing context.
 */
function drawKeypoints(keypoints, minConfidence, ctx) {
    // Parts of the face to exclude from drawing
    const faceParts = ['nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar'];

    keypoints.forEach((keypoint) => {
        if (keypoint.score > minConfidence && !faceParts.includes(keypoint.part)) {
            const { y, x } = keypoint.position;
            // Draw a circle at each keypoint
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();

            // Optionally, draw the coordinates next to each keypoint
            ctx.font = '14px Arial';
            ctx.fillStyle = 'white';
            ctx.fillText(`(${Math.round(x)}, ${Math.round(y)})`, x + 10, y - 10);
        }
    });
}

/**
 * Draws the skeleton by connecting adjacent keypoints.
 * @param {Array} keypoints - Array of keypoints from PoseNet.
 * @param {number} minConfidence - Minimum confidence score to consider a keypoint.
 * @param {CanvasRenderingContext2D} ctx - The canvas drawing context.
 */
function drawSkeleton(keypoints, minConfidence, ctx) {
    // Get pairs of keypoints that should be connected
    const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, minConfidence);

    adjacentKeyPoints.forEach((keypoints) => {
        const [from, to] = keypoints;
        // Draw a line between each pair of keypoints
        ctx.beginPath();
        ctx.moveTo(from.position.x, from.position.y);
        ctx.lineTo(to.position.x, to.position.y);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'white';
        ctx.stroke();
    });
}

/**
 * Calculates the speed of the left shoulder movement.
 * @param {Object} pose - The pose estimation result from PoseNet.
 */
function calculateSpeed(pose) {
    let leftShoulder = pose.keypoints.find(k => k.part === 'leftShoulder');
    let rightHip = pose.keypoints.find(k => k.part === 'rightHip');
    let leftHip = pose.keypoints.find(k => k.part === 'leftHip');
    const hipToHip = 0.35; // 0.35 meters between hips

    if (leftShoulder) {
        let currentPosition = { x: leftShoulder.position.x, y: leftShoulder.position.y };
        const currentTime = Date.now();

        // Update speed calculation at specified intervals
        if (currentTime - lastUpdateTime >= updateInterval) {
            if (previousPosition && previousTime) {
                // Convert pixel distance to meters using hip distance as a reference
                let pixelToMeter = Math.abs(rightHip.position.x - leftHip.position.x) / hipToHip;
                let dX = currentPosition.x - previousPosition.x;
                let dY = currentPosition.y - previousPosition.y;
                let distance = Math.sqrt(Math.pow(dX, 2) + Math.pow(dY, 2)) / pixelToMeter;
                let dTime = (currentTime - previousTime) / 1000; // Convert milliseconds to seconds

                let speed = distance / dTime; // Calculate speed in m/s

                // Update the speed display if the change is significant
                if (Math.abs(speed - lastSpeed) > 0.1) {
                    // Uncomment the following line to display the speed
                    // document.getElementById('speedDisplay').textContent = `Speed: ${speed.toFixed(2)} m/s`;
                    lastSpeed = speed;
                }
                lastUpdateTime = currentTime;
            }
        }
        // Update previous position and time for the next calculation
        previousPosition = currentPosition;
        previousTime = currentTime;
    } else {
        console.log("Left shoulder not detected");
    }
}

/**
 * Calculates the angle at the left hip using the positions of the left shoulder, hip, and knee.
 * @param {Object} pose - The pose estimation result from PoseNet.
 * @returns {number} - The calculated angle in degrees.
 */
function calculateAngle(pose) {
    let leftShoulder = pose.keypoints.find(k => k.part === 'leftShoulder');
    let leftHip = pose.keypoints.find(k => k.part === 'leftHip');
    let leftKnee = pose.keypoints.find(k => k.part === 'leftKnee');

    // Ensure all keypoints are detected
    if (!leftShoulder || !leftHip || !leftKnee) {
        console.warn('Keypoints missing for angle calculation.');
        return null;
    }

    // Calculate the distances between the keypoints
    const AB = Math.hypot(leftHip.position.x - leftShoulder.position.x, leftHip.position.y - leftShoulder.position.y);
    const BC = Math.hypot(leftKnee.position.x - leftHip.position.x, leftKnee.position.y - leftHip.position.y);
    const AC = Math.hypot(leftKnee.position.x - leftShoulder.position.x, leftKnee.position.y - leftShoulder.position.y);

    // Apply the Law of Cosines to find the angle at the hip
    let cosAngle = (Math.pow(AB, 2) + Math.pow(BC, 2) - Math.pow(AC, 2)) / (2 * AB * BC);

    // Clamp the cosine value to the valid range to prevent errors due to floating-point inaccuracies
    cosAngle = Math.max(-1, Math.min(1, cosAngle));

    const angle = Math.acos(cosAngle); // Angle in radians

    // Convert the angle to degrees and return
    return angle * (180 / Math.PI);
}

/**
 * Controls the logic for the Time Up and Go (TUG) test, updating the UI and tracking times.
 * @param {Object} pose - The pose estimation result from PoseNet.
 */
function timeUpAndGo(pose) {
    let rightHip = pose.keypoints.find(k => k.part === 'rightHip');
    let leftHip = pose.keypoints.find(k => k.part === 'leftHip');
    const tugElement = document.getElementById('tug');

    // Ensure hip keypoints are detected
    if (!leftHip || !rightHip) {
        console.warn('Hip keypoints missing.');
        return;
    }

    // Get the positions of the hips
    let x_lh = leftHip.position.x;
    let y_lh = leftHip.position.y;
    let x_rh = rightHip.position.x;
    let y_rh = rightHip.position.y;

    // Calculate the center point between the hips
    let x_center = (x_lh + x_rh) / 2;
    let y_center = (y_lh + y_rh) / 2;

    // Calculate the distance between hips in pixels and determine the scaling factor
    let hipDistancePixels = Math.hypot(x_rh - x_lh, y_rh - y_lh);
    let scale = hipToHip / hipDistancePixels;

    // Calculate the angle at the hip
    let hipAngle = calculateAngle(pose);
    console.log(hipAngle);

    // Use a switch-case to manage the TUG test phases based on the tugCounter
    switch (tugCounter) {
        case 0:
            // Initial state: instruct the user to sit down
            tugElement.textContent = 'Sit down';
            tugCounter++;
            break;

        case 1:
            // Wait for the user to begin standing up
            if (hipAngle <= 160) {
                tugElement.textContent = 'Stand up';
                times.standUpStart = Date.now();
                tugCounter++;
            }
            break;

        case 2:
            // Detect when the user has stood up
            if (hipAngle > 175) {
                times.standUpEnd = Date.now();

                tugElement.textContent = 'Walk forward';
                times.walkForwardStart = Date.now();

                // Record the starting position and initial direction vector
                startPosition = { x: x_center, y: y_center };
                v_initial = { x: x_rh - x_lh, y: y_rh - y_lh };
                tugCounter++;
            }
            break;

        case 3:
        {
            // Monitor the user's forward movement
            let currentPosition = { x: x_center, y: y_center };
            let deltaY = (currentPosition.y - startPosition.y) * scale;

            // Check if the user has walked the required distance
            if (Math.abs(deltaY) >= tugDistance) {
                times.walkForwardEnd = Date.now();

                tugElement.textContent = 'Turn';
                times.turn1Start = Date.now();

                v_initial = { x: x_rh - x_lh, y: y_rh - y_lh };
                tugCounter++;
            }
        }
            break;

        case 4:
        {
            // Detect when the user has turned around
            let v_current = { x: x_rh - x_lh, y: y_rh - y_lh };
            let dot_product = v_initial.x * v_current.x + v_initial.y * v_current.y;
            let norm_initial = Math.hypot(v_initial.x, v_initial.y);
            let norm_current = Math.hypot(v_current.x, v_current.y);
            let cos_theta = dot_product / (norm_initial * norm_current);
            let angle = Math.acos(cos_theta) * (180 / Math.PI);

            // If the user has turned more than 120 degrees, proceed to the next phase
            if (angle > 120) {
                times.turn1End = Date.now();

                tugElement.textContent = 'Walk back';
                times.walkBackStart = Date.now();

                startPosition = { x: x_center, y: y_center };
                v_initial = v_current;
                tugCounter++;
            }
        }
            break;

        case 5:
        {
            // Monitor the user's backward movement
            let currentPosition = { x: x_center, y: y_center };
            let deltaY = (startPosition.y - currentPosition.y) * scale;

            // Check if the user has walked back the required distance
            if (Math.abs(deltaY) >= tugDistance) {
                times.walkBackEnd = Date.now();

                tugElement.textContent = 'Turn';
                times.turn2Start = Date.now();

                v_initial = { x: x_rh - x_lh, y: y_rh - y_lh };
                tugCounter++;
            }
        }
            break;

        case 6:
        {
            // Detect when the user has completed the second turn
            let v_current = { x: x_rh - x_lh, y: y_rh - y_lh };
            let dot_product = v_initial.x * v_current.x + v_initial.y * v_current.y;
            let norm_initial = Math.hypot(v_initial.x, v_initial.y);
            let norm_current = Math.hypot(v_current.x, v_current.y);
            let cos_theta = dot_product / (norm_initial * norm_current);
            let angle = Math.acos(cos_theta) * (180 / Math.PI);

            // If the user has turned more than 120 degrees, proceed to the next phase
            if (angle > 120) {
                times.turn2End = Date.now();

                tugElement.textContent = 'Sit down';
                times.sitDownStart = Date.now();
                tugCounter++;
            }
        }
            break;

        case 7:
            // Wait for the user to sit down
            if (hipAngle <= 155) {
                times.sitDownEnd = Date.now();

                // Calculate the durations of each phase
                let standUpTime = (times.standUpEnd - times.standUpStart) / 1000;
                let walkForwardTime = (times.walkForwardEnd - times.walkForwardStart) / 1000;
                let turn1Time = (times.turn1End - times.turn1Start) / 1000;
                let walkBackTime = (times.walkBackEnd - times.walkBackStart) / 1000;
                let turn2Time = (times.turn2End - times.turn2Start) / 1000;
                let sitDownTime = (times.sitDownEnd - times.sitDownStart) / 1000;

                // Total time for the TUG test
                let totalTime = (times.sitDownEnd - times.standUpStart) / 1000;

                // Display the results to the user
                tugElement.textContent = `Done!
Total Time: ${totalTime.toFixed(2)} s
Stand Up: ${standUpTime.toFixed(2)} s
Walk Forward: ${walkForwardTime.toFixed(2)} s
Turn 1: ${turn1Time.toFixed(2)} s
Walk Back: ${walkBackTime.toFixed(2)} s
Turn 2: ${turn2Time.toFixed(2)} s
Sit Down: ${sitDownTime.toFixed(2)} s`;

                // Save the collected data
                saveData();

                // Stop pose detection and clear the canvas
                isRunning = false;
                cancelAnimationFrame(animationFrameId);

                const canvas = document.getElementById('canvas');
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            break;

        default:
            // Reset the counter if something unexpected happens
            tugCounter = 0;
            break;
    }
}

/**
 * Saves the collected data and TUG test times to a CSV file.
 */
function saveData() {
    // Calculate the durations of each TUG test phase
    let standUpTime = (times.standUpEnd - times.standUpStart) / 1000;
    let walkForwardTime = (times.walkForwardEnd - times.walkForwardStart) / 1000;
    let turn1Time = (times.turn1End - times.turn1Start) / 1000;
    let walkBackTime = (times.walkBackEnd - times.walkBackStart) / 1000;
    let turn2Time = (times.turn2End - times.turn2Start) / 1000;
    let sitDownTime = (times.sitDownEnd - times.sitDownStart) / 1000;
    let totalTime = standUpTime + walkForwardTime + turn1Time + walkBackTime + turn2Time + sitDownTime;

    // Create CSV content from the keypoint positions
    let csvContent = "data:text/csv;charset=utf-8,time,x,y\n" +
        keypointPositions.map(e => `${e.time},${e.x},${e.y}`).join("\n");

    // Append the TUG test times to the CSV content
    csvContent += `\nTUG Times\n`;
    csvContent += `Total Time,${totalTime.toFixed(2)}\n`;
    csvContent += `Stand Up,${standUpTime.toFixed(2)}\n`;
    csvContent += `Walk Forward,${walkForwardTime.toFixed(2)}\n`;
    csvContent += `Turn 1,${turn1Time.toFixed(2)}\n`;
    csvContent += `Walk Back,${walkBackTime.toFixed(2)}\n`;
    csvContent += `Turn 2,${turn2Time.toFixed(2)}\n`;
    csvContent += `Sit Down,${sitDownTime.toFixed(2)}\n`;

    // Encode the CSV content and create a download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);

    // Set the filename and initiate the download
    link.setAttribute("download", "tug_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clear the keypoint positions array for the next session
    keypointPositions = [];
}

/**
 * Resets all variables and counters to their initial states.
 */
function resetVariables() {
    keypointPositions = [];
    tugCounter = 0;
    v_initial = null;
    startPosition = null;
    times = {
        standUpStart: null,
        standUpEnd: null,
        walkForwardStart: null,
        walkForwardEnd: null,
        turn1Start: null,
        turn1End: null,
        walkBackStart: null,
        walkBackEnd: null,
        turn2Start: null,
        turn2End: null,
        sitDownStart: null,
        sitDownEnd: null
    };
}

// Call the main function to start the application
main();

