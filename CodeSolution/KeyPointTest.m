% Open a file dialog to select the CSV file
[filename, pathname] = uigetfile('*.csv', 'Select CSV file');
if isequal(filename, 0)
   disp('User chose to cancel');
else
   % Build the full path to the file
   fullpath = fullfile(pathname, filename);
   
   % Read the entire file as text
   fileContent = fileread(fullpath);
   
   % Split the content at line breaks
   lines = strsplit(fileContent, {'\n', '\r'});
   
   % Find the index where "TUG Times" starts
   tugIndex = find(contains(lines, 'TUG Times'), 1);
   
   % If "TUG Times" is found
   if ~isempty(tugIndex)
       % Read position data up to "TUG Times"
       positionDataLines = lines(1:tugIndex-1);
       % Read TUG times
       tugTimesLines = lines(tugIndex+1:end);
   else
       % If "TUG Times" is not found, assume the entire file is position data
       positionDataLines = lines;
       tugTimesLines = {};
       disp('TUG Times was not found in the file.');
   end
   
   % Create a temporary CSV file with position data
   tempPositionFile = 'temp_positions.csv';
   fid = fopen(tempPositionFile, 'w');
   fprintf(fid, '%s\n', positionDataLines{:});
   fclose(fid);
   
   % Read position data from the temporary file
   data = readtable(tempPositionFile);
   
   % Delete the temporary file
   delete(tempPositionFile);
   
   % Extract time, x, and y coordinates from position data
   time = data.time / 1000; % Convert time to seconds from milliseconds
   time = time - min(time); % Start time from 0 seconds
   x = data.x;              % X-coordinates
   y = data.y;              % Y-coordinates
   
   % Process TUG times
   tugTimes = struct();
   for i = 1:length(tugTimesLines)
       line = tugTimesLines{i};
       if isempty(line)
           continue;
       end
       tokens = strsplit(line, ',');
       if length(tokens) == 2
           key = strtrim(tokens{1});
           value = str2double(tokens{2});
           if ~isnan(value)
               % Use makeValidName to create a valid field name
               key = matlab.lang.makeValidName(key);
               tugTimes.(key) = value; % Save the time in the structure
           end
       end
   end
   
   % Check if we have correctly read the TUG times
   if isempty(fieldnames(tugTimes))
       disp('No TUG times could be read.');
   else
       disp('TUG times have been read correctly.');
       disp('Field names in tugTimes:');
       disp(fieldnames(tugTimes));
       disp('Values in tugTimes:');
       disp(struct2table(tugTimes));
       
       % Calculate cumulative times for each step
       cumulativeTimes = [];
       timeLabels = {};
       
       % List of steps in order with updated field names
       steps = {'StandUp', 'WalkForward', 'Turn1', 'WalkBack', 'Turn2', 'SitDown'};
       
       cumTime = 0;
       for i = 1:length(steps)
           step = steps{i};
           if isfield(tugTimes, step)
               cumTime = cumTime + tugTimes.(step);
               cumulativeTimes(end+1) = cumTime;
               timeLabels{end+1} = step;
           else
               disp(['The field ' step ' does not exist in tugTimes.']);
           end
       end
   end
   
   % Plot X and Y values over time
   figure;
   
   % Plot X-position
   subplot(2,1,1)
   plot(time, x, '-r', 'DisplayName', 'X Position', 'LineWidth', 1.5);
   xlabel('Time (seconds)', 'FontSize', 15);
   ylabel('Position', 'FontSize', 15);
   title('Keypoint Movement (X over time)', 'FontSize', 18);
   legend('Location', 'southeast');
   grid on;
   hold on;
   
   % Add vertical lines for TUG times
   if exist('cumulativeTimes', 'var') && ~isempty(cumulativeTimes)
       yLimits = ylim;
       for i = 1:length(cumulativeTimes)
           xline(cumulativeTimes(i), '--k', timeLabels{i}, 'LabelOrientation', 'horizontal', 'LineWidth', 1.5);
       end
   else
       disp('No cumulativeTimes variable available to draw vertical lines.');
   end
   
   % Plot Y-position
   subplot(2,1,2)
   plot(time, y, '-b', 'DisplayName', 'Y Position', 'LineWidth', 1.5);
   xlabel('Time (seconds)', 'FontSize', 15);
   ylabel('Position', 'FontSize', 15);
   title('Keypoint Movement (Y over time)', 'FontSize', 18);
   legend('Location', 'southeast');
   grid on;
   hold on;
   
   % Add vertical lines for TUG times
   if exist('cumulativeTimes', 'var') && ~isempty(cumulativeTimes)
       yLimits = ylim;
       for i = 1:length(cumulativeTimes)
           xline(cumulativeTimes(i), '--k', timeLabels{i}, 'LabelOrientation', 'horizontal', 'LineWidth', 1.5);
       end
   else
       disp('No cumulativeTimes variable available to draw vertical lines.');
   end
   
   % Adjust x-axis to display the entire time interval
   maxTime = max(time);
   if exist('cumulativeTimes', 'var') && ~isempty(cumulativeTimes)
       maxTime = max(maxTime, cumulativeTimes(end));
   end
   subplot(2,1,1)
   xlim([0, maxTime]);
   subplot(2,1,2)
   xlim([0, maxTime]);
   
   % Set x-ticks
   xticks(0:1:ceil(maxTime)); % x-axis, 1 second per step
end

