# WizardsOfWaverlyHacks

## Team Members
- Diego Parra
- Adam Shavkin
- Anthony Padilla
- Chaston Chaston

## Purpose
WizardsOfWaverlyHacks is an arcane-themed recycling assistant that empowers users to make sustainable choices. Users can scan barcodes to analyze recyclable materials, receive location-based county recycling rules (such as no plastic bags or styrofoam restrictions), and discover nearby recycling resources (like AutoZone for car batteries and motor oil). The application features a fully designed front-end with interactive React components including authentication views, an about page, a floating AI chat assistant (Igris), and a barcode scanner interface—all seamlessly integrated with backend APIs to deliver personalized recycling guidance.

## Tools
- GitHub Copilot
- ChatGPT
- React & TypeScript
- Framer Motion
- Tailwind CSS
- Node.js & Express

## Team Contributions
- **Diego Parra**: Designed and developed the working front-end, creating essential React components (HomeView, AboutView, AuthView, RecycleView, FloatingChat) that integrate with backend services. Served as record holder and documentation lead.
- **Team**: Backend API development, recycling data services, and system integration.

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
