# Frigo

**Recipe Recommender Web App**

Visit the app at https://frigo-app.fly.dev/

This is a web application that recommends recipes based on the ingredients available in the user's fridge or pantry. Users can take a picture of their fridge/pantry and upload it to the app. The app uses image recognition to identify the ingredients and then generates recipe suggestions using the Spoonacular API.

**Technologies Used**
- Next.js
- Node.js
- Firebase and Firestore
- Spoonacular API: API for retrieving recipes and ingredient information
- AWS Rekognition: Ingredient recognition


# Getting Started
## Installation
Clone the repository:

```bash
git clone https://github.com/Jarsunkaev/frigo.git
```
Install the dependencies:

```bash
cd frigo_app
yarn
```

## Usage
Start the development server:


```bash
yarn dev
```
Open your web browser and navigate to http://localhost:3000 to access the web application.

Upload an image of your fridge/pantry to get recipe recommendations based on the available ingredients.

## Contributing
Contributions to the project are welcome! If you find any issues or have suggestions for improvements, feel free to open an issue or submit a pull request.

## License
This project is licensed under the MIT License.
