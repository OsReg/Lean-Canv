% Load the first file (manual data)
filename1 = 'manuell.txt';
data1 = lasInData(filename1); % Uses helper function to read data from the file

% Load the second file (automatic data)
filename2 = 'auto.txt';
data2 = lasInData(filename2); % Uses the same helper function to read the second file

% Calculate the mean for each file
mean_data1 = mean(data1, 1); % Mean of manual data
mean_data2 = mean(data2, 1); % Mean of automatic data

% Compute the difference between the average values for each time step
mean_difference = mean_data2 - mean_data1;

% Create a new figure to plot the averages from both files
figure;

x_values = 0:6; % x-values (0 to 6 steps)

% Plot the average for the manual file
plot(x_values, mean_data1, 'o-', 'DisplayName', 'Average Manual', 'LineWidth', 1.5);
hold on;

% Plot the average for the automatic file
plot(x_values, mean_data2, 'o-', 'DisplayName', 'Average Automatic', 'LineWidth', 1.5);

% Format the graph
xlabel('TUG Steps');
ylabel('Time in Seconds');
title('Average for Manual and Automatic Time Up and Go');
grid on;
xlim([0, 6]);
ylim([0, max([mean_data1, mean_data2]) + 1]);

% Show the legend
legend('show');
hold off;

% Create a new figure to show the difference between the averages
figure;

% Plot the difference in seconds between the average values
plot(x_values, mean_difference, 'o-', 'DisplayName', 'Difference (Auto - Manual)', 'LineWidth', 1.5);

% Format the graph for the difference
xlabel('TUG Steps');
ylabel('Difference in Seconds (Auto - Manual)');
title('Time Difference between Automatic and Manual Time Up and Go');
grid on;
xlim([0, 6]);
ylim([min(mean_difference) - 0.5, max(mean_difference) + 0.5]); % Adjust y-axis

% Add text labels to the graph showing the difference values
for j = 1:length(x_values)
    text(x_values(j), mean_difference(j), sprintf('%.2f', mean_difference(j)), ...
        'VerticalAlignment', 'bottom', 'HorizontalAlignment', 'center', 'Color', 'k');
end

% Show the legend
legend('show');
hold off;

% Helper function to read data from a file
function data = lasInData(filename)
    fileID = fopen(filename, 'r');
    if fileID == -1
        error(['Could not open file: ' filename]);
    end
    % Read all lines from the file
    rawData = textscan(fileID, '%s %s %s %s %s %s %s', 'Delimiter', ' ');
    fclose(fileID);

    % Number of rows (graphs)
    nGraphs = length(rawData{1});

    % Convert time points to seconds
    data = zeros(nGraphs, 7); % 7 columns for 7 time points (0-6)
    for i = 1:nGraphs
        times = {rawData{1}{i}, rawData{2}{i}, rawData{3}{i}, rawData{4}{i}, rawData{5}{i}, rawData{6}{i}, rawData{7}{i}};
        time_values = duration(times, 'InputFormat', 'hh:mm:ss.SS');
        data(i, :) = seconds(time_values)';
    end
end

