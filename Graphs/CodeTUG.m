% Read the first file (manual)
filename1 = 'manuell.txt';
data1 = lasInData(filename1); % Uses helper function to read data

% Read the second file (automatic)
filename2 = 'auto.txt';
data2 = lasInData(filename2); % Uses the same helper function for the second file

% Calculate the mean for each file
mean_data1 = mean(data1, 1); % Mean of manual data
mean_data2 = mean(data2, 1); % Mean of automatic data

% Create a figure to plot the averages for both files
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

% Show legend
legend('show');
hold off;

% Calculate differences between each TUG step for both manual and automatic data
diff_data1 = diff(data1, 1, 2); % Differences between TUG steps for manual data
diff_data2 = diff(data2, 1, 2); % Differences between TUG steps for automatic data

% Calculate mean differences for each TUG step
mean_diff_data1 = mean(diff_data1, 1); % Mean differences for manual data
mean_diff_data2 = mean(diff_data2, 1); % Mean differences for automatic data

% Calculate the difference between the average differences
difference_from_manual = mean_diff_data2 - mean_diff_data1;

% Calculate standard deviation for the differences
std_diff_data2 = std(diff_data2, 0, 1); % Standard deviation for automatic data

% Create a new figure to show difference with standard deviation
figure;

x_values_diff = 1:6; % TUG steps from 1 to 6 (since diff eliminates the first column)

% Plot mean value of differences with standard deviation without connecting lines
hold on;
errorbar(x_values_diff, difference_from_manual, std_diff_data2, 'o', 'DisplayName', 'Difference with Std. Deviation', 'LineWidth', 1.5);

% Format the graph for standard deviation
xlabel('TUG Steps');
ylabel('Time in Seconds');
title('Difference and Standard Deviation between Automatic and Manual Time Up and Go');
grid on;
xlim([1, 6]);
ylim([min(difference_from_manual) - 2, max(difference_from_manual) + 2]); % Adjust y-axis

% Add Y-values to the graph for each TUG step with red color
for j = 1:length(x_values_diff)
    % Print the Y-value in the graph
    y_value = difference_from_manual(j);
    text(x_values_diff(j), y_value, sprintf('%.2f', y_value), ...
        'VerticalAlignment', 'bottom', 'HorizontalAlignment', 'center', ...
        'Color', 'r'); % Change to your desired color
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
        data(i, :) = seconds(time_values)'; % Convert to seconds
    end
end
