const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

let adminInitialized = false;
try {
  const serviceAccount = require("./serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "laundromat-zat.appspot.com",
  });
  adminInitialized = true;
  console.log("Firebase Admin SDK initialized successfully.");
} catch (error) {
  console.error("Failed to initialize Firebase Admin SDK:", error.message);
  console.warn("Proceeding without Firebase Admin SDK. Firebase operations will fail.");
  // admin remains an uninitialized object or we could mock it if needed,
  // but for this test, letting it fail on bucket() is acceptable to show flow.
}

// Configuration for content types and their directories
const contentTypesConfig = {
  videos: {
    directory: "../content/videos",
  },
  images: {
    directory: "../content/images",
  },
  cinemagraphs: {
    directory: "../content/cinemagraphs",
  },
};

// Configuration for YAML output files
const yamlOutputConfig = {
  videos: {
    path: "../data/videos.yaml", // Output path relative to this script's directory
  },
  images: {
    path: "../data/images.yaml",
  },
  cinemagraphs: {
    path: "../data/cinemagraphs.yaml",
  },
};

// Function to read and parse Hugo markdown files
function parseHugoContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

    if (frontMatterMatch) {
      const frontMatter = yaml.load(frontMatterMatch[1]);
      return frontMatter;
    }
    console.warn(`No front matter found in ${filePath}`);
    return null;
  } catch (error) {
    console.error(`Error reading or parsing ${filePath}:`, error);
    return null;
  }
}

async function processContent() {
  const allContent = {};

  for (const contentType in contentTypesConfig) {
    if (Object.hasOwnProperty.call(contentTypesConfig, contentType)) {
      const config = contentTypesConfig[contentType];
      const contentDir = path.join(__dirname, config.directory);
      allContent[contentType] = [];

      console.log(`Processing content type: ${contentType} from ${contentDir}`);

      try {
        const files = fs
          .readdirSync(contentDir)
          .filter((file) => file.endsWith(".md"));

        for (const file of files) {
          const filePath = path.join(contentDir, file);
          const hugoData = parseHugoContent(filePath);

          if (hugoData) {
            const itemId = file.replace(".md", "");
            const itemData = {
              id: itemId,
              type: hugoData.type || contentType, // Fallback to directory name if type is missing
              ...hugoData,
            };
            allContent[contentType].push(itemData);
          }
        }
      } catch (error) {
        console.error(
          `Error reading directory ${contentDir} for type ${contentType}:`,
          error
        );
      }
    }
  }

  // Initial Logging
  console.log("\n--- Content Processing Summary ---");
  for (const contentType in allContent) {
    if (Object.hasOwnProperty.call(allContent, contentType)) {
      console.log(
        `Found ${allContent[contentType].length} items for type: ${contentType}`
      );
      if (allContent[contentType].length > 0) {
        console.log(
          `First item of type ${contentType}:`,
          JSON.stringify(allContent[contentType][0], null, 2)
        );
      }
    }
  }
  // console.log("\nFull parsed data:", JSON.stringify(allContent, null, 2)); // Optional: for detailed view

  // --- Firebase Metadata Update Section ---
  console.log("\n--- Starting Firebase Metadata Updates ---");
  let attemptedUpdates = 0;
  let successfulUpdates = 0;
  let failedUpdates = 0;

  if (!adminInitialized) {
    console.warn("\nFirebase Admin SDK not initialized. Skipping all Firebase metadata updates.");
    attemptedUpdates = Object.values(allContent).reduce((acc, typeItems) => {
        const itemsToUpdate = typeItems.filter(item => item.id !== "_index" && item.id !== "_template");
        return acc + itemsToUpdate.length;
    }, 0);
    failedUpdates = attemptedUpdates; // All attempts will fail if SDK isn't initialized
  } else {
    const bucket = admin.storage().bucket();
    for (const contentType in allContent) {
      if (Object.hasOwnProperty.call(allContent, contentType)) {
        const items = allContent[contentType];
        console.log(`\nProcessing Firebase updates for type: ${contentType}`);

        const itemsToUpdate = items.filter(item => item.id !== "_index" && item.id !== "_template");

        if (itemsToUpdate.length === 0) {
          console.log(`No items to update for type: ${contentType} (after filtering _index/_template).`);
          continue;
        }

        for (const itemData of itemsToUpdate) {
          attemptedUpdates++;
          console.log(`Attempting to update metadata for: ${contentType}/${itemData.original_filename} (ID: ${itemData.id})`);

          if (!itemData.original_filename) {
            console.warn(
              `Skipping Firebase update for item ID ${itemData.id} (type: ${contentType}) due to missing 'original_filename'.`
            );
            failedUpdates++;
            continue;
          }
          if (!itemData.firebase_url) {
            console.warn(
              `Warning: 'firebase_url' is missing for item ID ${itemData.id} (type: ${contentType}, file: ${itemData.original_filename}). Proceeding with update if original_filename exists.`
            );
          }

          const firebasePath = `${contentType}/${itemData.original_filename}`;
          const firebaseMetadata = {
            metadata: {
              title: itemData.title || null,
              location: itemData.location || null,
              description: itemData.description || null,
              date: itemData.date || null,
              ...(contentType === "videos" && { feat: itemData.feat || null }),
              ...(contentType === "images" && { alt_text: itemData.alt_text || null }),
              ...(contentType === "images" && { width: itemData.width || null }),
              ...(contentType === "images" && { height: itemData.height || null }),
              original_filename: itemData.original_filename,
              hugo_id: itemData.id,
              content_type_from_script: itemData.type,
            },
          };

          try {
            const file = bucket.file(firebasePath);
            await file.setMetadata(firebaseMetadata);
            console.log(
              `Successfully updated metadata for ${firebasePath}`
            );
            successfulUpdates++;
          } catch (error) {
            console.error(
              `Error updating metadata for ${firebasePath}:`,
              error.message
            );
            failedUpdates++;
          }
        }
      }
    }
  }

  console.log("\n--- Firebase Metadata Update Summary ---");
  console.log(`Attempted items: ${attemptedUpdates}`);
  console.log(`Successful updates: ${successfulUpdates}`);
  console.log(`Failed updates: ${failedUpdates}`);

  // --- YAML File Generation Section ---
  console.log("\n--- Starting YAML File Generation ---");
  let generatedYamlFiles = 0;
  let failedYamlFiles = 0;

  for (const contentType in yamlOutputConfig) {
    if (Object.hasOwnProperty.call(yamlOutputConfig, contentType)) {
      const outputConfig = yamlOutputConfig[contentType];
      const itemsForType = allContent[contentType] || [];

      console.log(`\nGenerating YAML for type: ${contentType}`);

      const itemsToExport = itemsForType.filter(
        (item) => item.id !== "_index" && item.id !== "_template"
      );

      if (itemsToExport.length === 0) {
        console.log(`No items to export for YAML for type: ${contentType} (after filtering).`);
        // Optionally, still write an empty list to the YAML file
        // For now, we'll just skip if empty after filter to avoid empty files unless specified.
        // To write empty: fs.writeFileSync(outputPath, yaml.dump({ [contentType]: [] }));
        continue;
      }

      // Prepare data in the format { contentTypeKey: [itemsArray] }
      const yamlData = { [contentType]: itemsToExport };
      const yamlString = yaml.dump(yamlData);
      const outputPath = path.join(__dirname, outputConfig.path);

      try {
        // Ensure directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
          console.log(`Created directory: ${outputDir}`);
        }

        fs.writeFileSync(outputPath, yamlString, "utf8");
        console.log(`Successfully wrote YAML to ${outputPath}`);
        generatedYamlFiles++;
      } catch (error) {
        console.error(`Error writing YAML for ${contentType} to ${outputPath}:`, error);
        failedYamlFiles++;
      }
    }
  }

  console.log("\n--- YAML File Generation Summary ---");
  console.log(`Generated YAML files: ${generatedYamlFiles}`);
  console.log(`Failed YAML files: ${failedYamlFiles}`);
}

processContent()
  .then(() =>
    console.log(
      "\nContent processing, Firebase updates, and YAML generation complete."
    )
  )
  .catch((error) =>
    console.error(
      "Error in content processing, Firebase updates, or YAML generation:",
      error
    )
  );
