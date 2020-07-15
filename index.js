const request = require("request");
const https = require("https");
const fs = require("fs");

const APP_SLUG = process.env.BITRISE_APP_SLUG;
const BUILD_SLUGS = process.env.buildslugs.split("\n");
const API_KEY = process.env.access_token;
const SAVE_PATH = process.env.save_path;

console.log("APP_SLUG:",APP_SLUG);
console.log("BUILD_SLUGS:",BUILD_SLUGS);
const BASE_URL = "https://api.bitrise.io/v0.1/apps/";
const BUILD_URL = BASE_URL + APP_SLUG + "/builds/";

for(let i=0; i<BUILD_SLUGS.length; i++){
  const url = BUILD_URL+BUILD_SLUGS[i];
  let options = {
    "method": "GET",
    "url": url,
    "headers": {
      "accept": "application/json",
      "Authorization": API_KEY
    }
  };

  request(options, function (error, response) { 
    if (error) throw new Error(error);
    const buildStatus = JSON.parse(response.body).data;
    if(buildStatus && buildStatus.status != 0){
      options.url = url + "/artifacts";

      // Get Build Artifacts
      request(options, function (error, response) { 
        if (error) throw new Error(error);
        const artifactsObj = JSON.parse(response.body).data;
        if(artifactsObj){
          artifactsObj.forEach((artifact) => {
            options.url = url + "/artifacts/" + artifact.slug;

            // Get Build Artifact
            request(options, (error, response) => { 
              if (error) throw new Error(error);
              const artifactObj = JSON.parse(response.body).data;
              if(artifactObj){
                console.log("Artifact URL:", artifactObj.expiring_download_url);
                const file = fs.createWriteStream(SAVE_PATH+artifactObj.title);
                https.get(artifactObj.expiring_download_url, (res) => {
                 res.pipe(file);
                });
              }
            })
          });
        }
      });
    } else {
      console.log("Error Bitrise API:", response.body);
    }
  });
}