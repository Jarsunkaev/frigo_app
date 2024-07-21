# Frigo (WIP)

**Recipe Recommender Web App**

This is a web application that recommends recipes based on the ingredients available in the user's fridge or pantry. Users can take a picture of their fridge/pantry and upload it to the app. The app uses image recognition to identify the ingredients and then generates recipe suggestions using the Spoonacular API.

**Technologies Used**
- React: JavaScript library for building user interfaces
- Next.js: React framework for server-side rendering and routing
- Node.js: JavaScript runtime environment
- Express.js: Web application framework for Node.js
- PostgreSQL: Relational database for storing recipe and user data
- Spoonacular API: API for retrieving recipes and ingredient information
- Features
- Image recognition: Utilizes image recognition technology to identify ingredients from user-uploaded images.
- Recipe generation: Uses the identified ingredients to generate recipe suggestions using the Spoonacular API.
- User authentication: Allows users to create accounts, log in, and save their favorite recipes.
- Database storage: Stores user data, including saved recipes, in a PostgreSQL database.


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
