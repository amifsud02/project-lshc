import { createImageUrlBuilder } from "@sanity/image-url";
import { clientV2 } from "./sanity.config";

const builder = createImageUrlBuilder(clientV2);

export function urlFor(source: any) {
  return builder.image(source);
}