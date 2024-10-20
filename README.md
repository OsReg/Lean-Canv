# Pose estimation

# Introduction 
This work focuses on an automated system for assessing fall risk in the elderly using the Timed Up-and-Go (TUG) test. It utilizes a standard camera and 2D pose estimation to track key body points, providing an objective, cost-effective alternative for clinical mobility evaluation.

# Demo 
Below is a demo of the pose estimation using tensorflow

https://github.com/user-attachments/assets/44d4eda9-b596-4bf6-a427-a90add855622




# Installation
This project implements real-time pose estimation using TensorFlow and a skeleton tracking model. The application can track human movements and identify key body joints in real-time.

To run the pose estimation code using TensorFlow.js, follow these steps:

1. Clone the Repository: 
   First, clone the code from your GitHub repository. Open your terminal and run the following command:
   ```bash
   git clone https://github.com/Annay02/pose-estimation.git
   ```
   Navigate to the cloned directory:
   ```bash
   cd pose-estimation/CodeSolution
   ```

2. Install Node.js:
   Ensure that you have Node.js installed on your system. You can download and install it from [Node.js official website](https://nodejs.org/).

3. Install Dependencies:
   Inside the `CodeSolution` directory, install the necessary dependencies by running:
   ```bash
   npm install
   ```

4. Run the Application:
   Start the local server with the following command:
   ```bash
   npm start
   ```
   This will host the application, typically accessible at `http://localhost:3000`.

5. Accessing the Pose Estimation:
   Open your web browser and go to the URL provided in your terminal (usually `http://localhost:3000`) to interact with your pose estimation application.

By following these steps, you will have the pose estimation code set up and ready to use with TensorFlow.js.

# Getting Started
When the web application is running:

1. Ensure your webcam is active and has the necessary permissions.
2. Press the "Start" button to initiate pose detection and begin the TUG test.
3. Follow the on-screen instructions to complete the test. The results will be displayed in real-time.
4. After completing the TUG test, all keypoint positions and timestamps for each activity will be saved. You can download the results in CSV format for further analysis.

# Graphs 
Below is information on graph generation: 
* The file "CodeTug.m" loads data from two files, calculates the mean values for each file, plots the means, and shows the differences at various time points. It provides a visual comparison of the differences between automatic and manual timing for a "Time Up and Go" test.

Graph 1 
![Alt text](https://github.com/Annay02/pose-estimation/blob/main/Graphs/Avrage%20for%20Manual%20and%20Automatic%20Time%20Up%20and%20Go.png)
* The graph titled "Average for Manual and Automatic Time Up and Go"displays the mean values of the times recorded manually and automatically. This graph highlights the average performance time recorded by each method, allowing for a straightforward comparison of their results across different test runs. 

Graph 2 
![Alt text](https://github.com/Annay02/pose-estimation/blob/main/Graphs/Standard%20Deviation%20.png)
* The graph titled "Difference and Standard Deviation between Automatic and Manual Time Up and Go" shows time differences between automatic and manual Time Up and Go (TUG) measurements for steps 1–6. Each point represents the average difference per step, with error bars showing standard deviation. Positive values mean the automatic method took longer; negative values mean it was faster.

Graph 3 

![Alt text](https://github.com/Annay02/pose-estimation/blob/main/Graphs/TUG.jpeg)
* This graph illustrates a potential execution of a TUG (Timed Up and Go) test. Once the test is completed, a file is generated. This file can be imported into software such as MATLAB, where a graph can be produced showing the measured time for each movement.



