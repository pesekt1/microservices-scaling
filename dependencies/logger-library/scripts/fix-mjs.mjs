import { promises as fs } from "fs";
import path from "path";

// Path to the folder containing the files
const esmFolder = path.resolve("dist/esm");

async function renameAndUpdateFiles() {
  try {
    // Read all files in the directory
    const files = await fs.readdir(esmFolder);

    // Loop through each file in the directory
    for (const file of files) {
      if (file.endsWith(".js")) {
        const filePath = path.join(esmFolder, file);
        const newFilePath = path.join(esmFolder, file.replace(".js", ".mjs"));

        // Update the content of the file (replace .js' with .mjs')
        let fileContent = await fs.readFile(filePath, "utf8");
        fileContent = fileContent.replace(/\.js'/g, ".mjs");

        // Write the updated content back to the file
        await fs.writeFile(filePath, fileContent, "utf8");
        console.log(`Updated contents of ${file}`);

        // Rename the file from .js to .mjs
        await fs.rename(filePath, newFilePath);
        console.log(`Renamed ${file} to ${file.replace(".js", ".mjs")}`);
      }
    }
  } catch (err) {
    console.error("Error during file operations:", err);
  }
}

renameAndUpdateFiles();
