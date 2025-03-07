const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "laundromat-zat.appspot.com",
});

// Function to read and parse Hugo markdown files
function parseHugoContent(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (frontMatterMatch) {
    const frontMatter = yaml.load(frontMatterMatch[1]);
    return frontMatter;
  }
  return null;
}

async function updateMetadataFromHugo() {
  const contentDir = path.join(__dirname, "../content/videos");
  const bucket = admin.storage().bucket();

  // Read all markdown files in the videos content directory
  const files = fs
    .readdirSync(contentDir)
    .filter((file) => file.endsWith(".md"));

  for (const file of files) {
    const filePath = path.join(contentDir, file);
    const hugoData = parseHugoContent(filePath);

    if (hugoData) {
      const videoId = file.replace(".md", "");
      const metadata = {
        metadata: {
          title: hugoData.title,
          location: hugoData.location,
          thumbnail: hugoData.thumbnail,
          description: hugoData.description,
        },
      };

      try {
        const storageFile = bucket.file(`videos/${videoId}.m4v`);
        await storageFile.setMetadata(metadata);
        console.log(`Updated metadata for ${videoId}`);
      } catch (error) {
        console.error(`Error updating metadata for ${videoId}:`, error);
      }
    }
  }
}

updateMetadataFromHugo()
  .then(() => console.log("All metadata updates complete"))
  .catch((error) => console.error("Error in update process:", error));
