# WizardsOfWaverlyHacks
Team Members: Diego Parra, Adam Shavkin, Anthony Padilla, and Chaston Chaston
Purpose: Allow users to enter scan barcodes,, we’ll analyze the recyclable information (i.e., material classification, recycling instructions, etc.), use user location to find county recycling rules (e.g., no plastic bags, no styrofoam) along with other recycling resources (ex. Autozone will recycle car batteries/motor oil). Based on this, provide the user with recycling options.
Tools: Github Copilot, ChatGPT
Problems and Solutions: 
a. Trying to find a way to scan barcodes
   - We found an api that scans barcodes
b. API provided only barcode and no information
   - We found another API that can tell you information based on barcodes	
c. Whether or not to include a database for accounts.
   - We decided to start with no database, but we may develop it at the end.
d. Trying to figure out how to get the location of recycling centers and presenting that to users. 
   - We utilized the Google API to implement the different locations. 
e. Implementing AI to assist users with any questions.
   - Running a locally hosted AI and leveraging APIs to make requests for 
Credits:
Barcode scanner - https://docs.scanbot.io/react-native/barcode-scanner-sdk/introduction/
Municipal rules for recycling - https://serpapi.com/
Barcode lookup - https://www.upcitemdb.com/api/explorer#!/lookup/get_trial_lookup/
Recycling locations - https://developers.google.com/maps
