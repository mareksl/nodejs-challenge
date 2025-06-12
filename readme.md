# External API mapping to Iconik

Your task is to parse all the data contained in examples folder. The folder is simplified dump of external API with some movie data that needs to become asset structure in the Iconik system.

## Simplified explanation

Examples in folder mimic the API responses that are sent to you on production system, but there is a frequent need in our systems to have manual update capability. That's why we need system to get `.json` data and map it to Iconik as a way of doing manual synchronisation or update.

## Requirements:

  * Finish endpoint for uploading files (make sure about some validation)
  * Map the data from JSON files to iconik [metadata](https://app.iconik.io/docs/apidocs.html?url=/docs/metadata/spec/) format (if no mapping is found, and one related / similar in iconik exists. Use that).
  * Create cache mechanism storing some data in order to update collection in iconik if someone changed the requirements.
  * Create or update collection in iconik with proper structure. Be sure to check if user not messed up structure in iconik (deleting some child folder)
  
## The structure

All provided `json` files are somewhat connected. The idea is to parse them and create tree structure of folders (assets) in iconik.

Your task is to provide following structure in iconik from given files:

Peaky Blinders (serial name)
|_
  Season (series title)
  |_
    Episodes (EPISODENO)
  
### Bonus points:

  * Iconik has rate limiter, implement solution for that.
  * Docker image for the app
  * Iconik doesn't have any built in way to validate requests. Implement some anti tempering techinques.
  * Everything is a bonus point if done for good cause ;)

Endpoints:

  * `POST /upload` Uploads the data and parses it + stores into database with unique ID
  * `POST /create/:TICODE/:EPISODENO` Creates new collection in iconik based from database ID. If collection exists then throw bad request error
  * `POST /update/:TICODE/:EPISODENO` Updates collection in iconik from previously defined database ID. If does not exist throw bad request error
  * `GET /:TICODE/:EPISODENO` Gets all data from the DB about inserted colletion. If can be done, include data from iconik (call the api) 
  * `/validate` Validates any given uploaded file and discovers its properties / throws error when not valid. (part of upload endpoint also)

## Given tools

In repository there is `docker-compose` file. Use services defined in it, or / and add your own :)
By running `npm run test` you can test your connection to iconik and database as well.
