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
    const mode = (await ask("\nMode (analyze | plan | apply):\n> ")).trim();
    const filesInput = await ask("\nFiles (comma separated, relative to src):\n> ");
    const instruction = await ask("\nInstruction:\n> ");
    rl.close();

    const files = filesInput.split(",").map(f => f.trim());
    const fileContents = [];

    for (const file of files) {
      const abs = path.resolve(process.cwd(), "src", file);
      if (!fs.existsSync(abs)) {
        console.error(`❌ File not found: ${file}`);
        return;
      }
      fileContents.push({
        path: file,
        content: fs.readFileSync(abs, "utf-8")
      });
    }

    const systemPrompt = `
You are a senior React + TypeScript architect.

MODE:
${mode.toUpperCase()}

RULES:
- Understand dependencies between files
- Keep imports and types consistent
- Do NOT invent APIs
- NO explanations
- Use EXACT output format

OUTPUT FORMAT (MANDATORY):

--- FILE: path ---
<full file content>
--- END FILE ---
`;

    const userPrompt = `
TASK:
${instruction}

FILES:
${fileContents
  .map(f => `--- FILE: ${f.path} ---\n${f.content}\n--- END FILE ---`)
  .join("\n")}
`;

    const res = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 2500,
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

    const output = res.data.content[0].text;

    if (mode !== "apply") {
      console.log("\n📄 Claude Output (NO FILES MODIFIED):\n");
      console.log(output);
      return;
    }

    // APPLY MODE
    const fileBlocks = output.match(/--- FILE: ([\s\S]*?) ---([\s\S]*?)--- END FILE ---/g);

    if (!fileBlocks) {
      console.error("❌ Invalid Claude output format");
      return;
    }

    for (const block of fileBlocks) {
      const [, filePath, content] =
        block.match(/--- FILE: (.*?) ---([\s\S]*?)--- END FILE ---/);

      const absPath = path.resolve(process.cwd(), "src", filePath.trim());

      // backup
      fs.writeFileSync(absPath + ".bak", fs.readFileSync(absPath, "utf-8"));
      fs.writeFileSync(absPath, content.trim());
      console.log(`✅ Updated: ${filePath}`);
    }

    console.log("\n🎉 All files updated safely");
  } catch (err) {
    console.error("❌ Claude error:", err.response?.data || err.message);
  }
}

run();
