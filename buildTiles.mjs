import fs from "fs";
import { spawn } from "child_process";

if (!fs.existsSync("dist")) {
  fs.mkdirSync("dist");
}

// Get latest version
const resp = await fetch("https://build-metadata.protomaps.dev/builds.json");
const builds = await resp.json();
const latestBuild = builds.slice(-1)[0];

// pmtiles extract
const child = spawn(
  "pmtiles",
  [
    "extract",
    `https://build.protomaps.com/${latestBuild.key}`,
    "dist/tiles.pmtiles",
    "--region=region.geojson",
  ],
  { stdio: "inherit" },
);
const exitCode = await new Promise((resolve, reject) => {
  child.on("close", resolve);
});
if (exitCode !== 0) {
  throw new Exception(`pmtiles extract failed with exit code: ${exitCode}`);
}
