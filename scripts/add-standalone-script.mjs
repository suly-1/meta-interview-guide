import { readFileSync, writeFileSync } from "fs";
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
if (!pkg.scripts["build:standalone"]) {
  pkg.scripts["build:standalone"] = "node scripts/build-standalone.mjs";
  writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
  console.log("Added build:standalone script");
} else {
  console.log("Already exists:", pkg.scripts["build:standalone"]);
}
