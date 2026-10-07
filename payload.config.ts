import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Pages } from "./collections/Pages";
import { CompetitionTypes } from "./collections/CompetitionTypes";
import { Competitions } from "./collections/Competitions";
import { Teams } from "./collections/Teams";
import { Fixtures } from "./collections/Fixtures";
import { Standings } from "./collections/Standings";
import { Players } from "./collections/Players";
import { News } from "./collections/News";
import { Galleries } from "./collections/Galleries";
import { Header } from "./globals/Header";
import { Footer } from "./globals/Footer";
import { General } from "./globals/General";
import { cloudinaryAdapter } from "./packages/cloudinary/adapter";
import { cloudinary } from "./packages/cloudinary/config";
import { GalleryCategories } from "./collections/GalleryCategories";
import { NewsCategories } from "./collections/NewsCategories";
import { Products } from "./collections/Products";
import { Orders } from "./collections/Orders";
import { Venues } from "./collections/Venues";
import { NurserySeasons } from "./collections/NurserySeasons";
import { NurseryCategories } from "./collections/NurseryCategories";
import { NurseryRegistrations } from "./collections/NurseryRegistrations";
import { MagicLinkTokens } from "./collections/MagicLinkTokens";
import { revalidateContentPlugin } from "./collections/hooks/revalidateContent";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    components: {
      beforeLogin: ['@/components/admin/GoogleSignInButton#GoogleSignInButton'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Pages,
    CompetitionTypes,
    Competitions,
    Teams,
    Fixtures,
    Standings,
    Players,
    News,
    NewsCategories,
    Galleries,
    GalleryCategories,
    Products,
    Orders,
    Venues,
    NurserySeasons,
    NurseryCategories,
    NurseryRegistrations,
    MagicLinkTokens,
  ],
  globals: [Header, Footer, General],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || "",
  }),
  sharp,
  plugins: [
    revalidateContentPlugin,
    cloudStoragePlugin({
      collections: {
        media: {
          adapter: cloudinaryAdapter,

          disableLocalStorage: true, // Prevent Payload from saving files to disk

          generateFileURL: ({ filename }) => {
            return cloudinary.url(`media/${filename}`, { secure: true })
          },
        },
      },
    }),
  ],
});
