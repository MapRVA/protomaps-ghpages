// derived from from https://github.com/protomaps/basemaps/blob/main/styles/src/generate_styles.ts
import fs from "fs";
import { writeFile } from "fs/promises";
import protomapsLayers from "protomaps-themes-base";
import { language_script_pairs } from "protomaps-themes-base";
import { viewport } from "@mapbox/geo-viewport";
import { bbox } from "@turf/bbox";

const region = JSON.parse(fs.readFileSync("region.geojson"));

// Determine tile URL
let tileJson;
if (process.env.TILE_JSON) {
  tileJson = process.env.TILE_JSON;
} else if (process.env.GITHUB_REPOSITORY) {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/", 2);
  tileJson = `pmtiles://https://${owner}.github.io/${repo}/tiles.pmtiles`;
} else {
  throw new Exception("No TILE_JSON or GITHUB_REPOSITORY env var set");
}

for (const theme of ["light", "dark", "white", "grayscale", "black"]) {
  for (const { lang, full_name, script } of language_script_pairs) {
    const layers = protomapsLayers("protomaps", theme, lang, script);

    const style = {
      version: 8,
      sources: {
        protomaps: {
          type: "vector",
          attribution:
            '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
          url: tileJson,
        },
      },
      layers: layers,
      sprite: `https://protomaps.github.io/basemaps-assets/sprites/v4/${theme}`,
      glyphs:
        "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
      ...viewport(bbox(region), [600, 600]),
    };

    const directory = `dist/styles/${theme}`;
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
      console.log(`Directory ${directory} created successfully!`);
    }

    try {
      await writeFile(
        `${directory}/${lang}.json`,
        JSON.stringify(style, null, 2),
      );
    } catch (err) {
      console.error("An error occurred while writing to the file:", err);
    }
  }
}
