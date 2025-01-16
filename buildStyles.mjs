// derived from from https://github.com/protomaps/basemaps/blob/main/styles/src/generate_styles.ts
import fs from "fs";
import { writeFile } from "fs/promises";
import protomapsLayers from "protomaps-themes-base";
import { language_script_pairs } from "protomaps-themes-base";
import { viewport } from "@mapbox/geo-viewport";
import { bbox } from "@turf/bbox";
import { mask } from "@turf/mask";
import { simplify } from "@turf/simplify";

const region = JSON.parse(fs.readFileSync("region.geojson"));
const simplifiedRegion = simplify(region, { tolerance: 0.01 }).features[0].geometry;

fs.writeFileSync("dist/region-mask.geojson", JSON.stringify(mask(region)));

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
    const bgIdx = layers.findIndex(({ id }) => id === "places_subplace");
    const bgColor = layers.find(({ id }) => id === "background").paint[
      "background-color"
    ];
    layers.splice(bgIdx, 0, {
      id: "mask-fill",
      type: "fill",
      source: "mask",
      paint: { "fill-color": bgColor },
    });
    layers.forEach((l) => {
      if (l.id.startsWith("place") || l.id === "pois") {
        if (l.filter[0] === "==" && typeof l.filter[0] === "string") {
          l.filter = [l.filter[0], ["get", l.filter[1]], l.filter[2]];
        }
        l.filter = ["all", l.filter, ["within", simplifiedRegion]];
      }
    });

    const style = {
      version: 8,
      sources: {
        protomaps: {
          type: "vector",
          attribution:
            '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
          url: tileJson,
        },
        mask: {
          type: "geojson",
          data: new URL(
            "./region-mask.geojson",
            tileJson.replace(/^pmtiles:\/\//, ""),
          ),
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
