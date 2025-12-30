import "dotenv/config";
import axios from "axios";
import fs from "fs";
import path from "path";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const ask = q => new Promise(r => rl.question(q, r));

async function run() {
  try {
    const folderInput = await ask(
      "\nFolder or files to analyze (comma separated, relative to src):\n> "
    );
    const prompt = await ask("\nInstruction / prompt (describe your task simply):\n> ");
    rl.close();

    if (!folderInput || !prompt) {
      console.log("❌ Folder/files and instruction are required");
      return;
    }

    const srcRoot = path.resolve(process.cwd(), "src");
    const entries = folderInput.split(",").map(f => f.trim());
    let fileContents = [];

    // Collect all files from folders
    for (const entry of entries) {
      const absPath = path.join(srcRoot, entry);
      if (fs.existsSync(absPath)) {
        const stats = fs.statSync(absPath);
        if (stats.isDirectory()) {
          const files = fs.readdirSync(absPath, { withFileTypes: true })
            .filter(f => f.isFile() && /\.(ts|tsx)$/.test(f.name))
            .map(f => path.join(absPath, f.name));
          for (const file of files) {
            fileContents.push({
              path: path.relative(srcRoot, file),
              content: fs.readFileSync(file, "utf-8")
            });
          }
        } else if (stats.isFile()) {
          fileContents.push({
            path: path.relative(srcRoot, absPath),
            content: fs.readFileSync(absPath, "utf-8")
          });
        }
      } else {
        console.log(`❌ Path does not exist: ${entry}`);
      }
    }

    // Construct prompt for Claude
    const systemPrompt = `
You are a senior React + TypeScript engineer.

TASK:
${prompt}

RULES:
- Analyze all dependencies between files
- Modify code according to instruction
- Keep imports, types, hooks, services correct
- Output full updated content for each file
- No explanations
- Format exactly:

--- FILE: relative/path ---
<full file content>
--- END FILE ---
`;

    const userPrompt = fileContents
      .map(f => `--- FILE: ${f.path} ---\n${f.content}\n--- END FILE ---`)
      .join("\n");

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 3500,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      },
      {
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        }
      }
    );

    const output = response.data.content[0].text;

    // Parse and write files
    const fileBlocks = output.match(/--- FILE: ([\s\S]*?) ---([\s\S]*?)--- END FILE ---/g);
    if (!fileBlocks) throw new Error("Invalid Claude output format");

    for (const block of fileBlocks) {
      const [, filePath, content] = block.match(/--- FILE: (.*?) ---([\s\S]*?)--- END FILE ---/);
      const absPath = path.join(srcRoot, filePath.trim());

      fs.mkdirSync(path.dirname(absPath), { recursive: true });

      if (fs.existsSync(absPath)) {
        fs.writeFileSync(absPath + ".bak", fs.readFileSync(absPath, "utf-8"));
      }

      fs.writeFileSync(absPath, content.trim());
      console.log(`✅ Updated: ${filePath}`);
    }

    console.log("\n🎉 All files updated successfully!");
  } catch (err) {
    console.error("❌ Claude error:", err.response?.data || err.message);
  }
}

run();
