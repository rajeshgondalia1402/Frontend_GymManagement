
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
    const feature = (await ask("\nFeature name:\n> ")).trim();
    const instruction = await ask("\nInstruction:\n> ");
    rl.close();

    if (!feature) throw new Error("Feature name required");

    const srcRoot = path.resolve(process.cwd(), "src");
    const featureRoot = path.join(srcRoot, "features", feature);

    const architecturePrompt = `
You are a senior React + TypeScript architect.

GOAL:
Generate a complete feature module.

RULES:
- Use React + TypeScript
- Prefer feature-based architecture
- Use existing best practices
- Keep code clean and typed
- NO explanations
- Output ONLY files in format below

OUTPUT FORMAT (MANDATORY):

--- FILE: relative/path ---
<full content>
--- END FILE ---
`;

    const userPrompt = `
FEATURE: ${feature}

INSTRUCTION:
${instruction}

PROJECT CONTEXT:
- React + TypeScript
- Vite or CRA compatible
- src/features based structure
- API layer via services
`;

    const res = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 3005,
        messages: [
          { role: "system", content: architecturePrompt },
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

    const fileBlocks = output.match(/--- FILE: ([\s\S]*?) ---([\s\S]*?)--- END FILE ---/g);
    if (!fileBlocks) throw new Error("Invalid output format");

    for (const block of fileBlocks) {
      const [, filePath, content] =
        block.match(/--- FILE: (.*?) ---([\s\S]*?)--- END FILE ---/);

      const absPath = path.join(srcRoot, filePath.trim());

      fs.mkdirSync(path.dirname(absPath), { recursive: true });

      if (fs.existsSync(absPath)) {
        fs.writeFileSync(absPath + ".bak", fs.readFileSync(absPath, "utf-8"));
      }

      fs.writeFileSync(absPath, content.trim());
      console.log(`✅ Generated: ${filePath}`);
    }

    console.log("\n🎉 Feature generated successfully");
  } catch (err) {
    console.error("❌ Claude error:", err.response?.data || err.message);
  }
}

run();

// npm run claude:feature