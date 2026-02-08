# WizardsOfWaverlyHacks

## Team Members
- Diego Parra
- Adam Shavkin
- Anthony Padilla
- Chaston Cao

## Purpose
Allow users to scan barcodes, analyze recyclable information (material classification, recycling instructions, etc.), and use location to find county recycling rules (for example: no plastic bags, no styrofoam) along with other recycling resources (for example: AutoZone will recycle car batteries and motor oil). Based on this, provide the user with recycling options.

## Tools
- GitHub Copilot
- ChatGPT

## Problems and Solutions
- Trying to find a way to scan barcodes
	- We found an API that scans barcodes.
- API provided only barcode and no information
	- We found another API that can tell you information based on barcodes.
- Whether or not to include a database for accounts
	- We decided to start with no database, but we may develop it at the end.
- Trying to figure out how to get the location of recycling centers and presenting that to users
	- We utilized the Google API to implement the different locations.
- Implementing AI to assist users with any questions
	- Running a locally hosted AI and leveraging APIs to make requests for assistance.

## Credits
- Barcode scanner: https://docs.scanbot.io/react-native/barcode-scanner-sdk/introduction/
- Municipal rules for recycling: https://serpapi.com/
- Barcode lookup: https://www.upcitemdb.com/api/explorer#!/lookup/get_trial_lookup/
- Recycling locations: https://developers.google.com/maps
