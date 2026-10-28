import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { s3Storage } from '@payloadcms/storage-s3'

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
import { Videos } from "./collections/Videos";
import { Header } from "./globals/Header";
import { Footer } from "./globals/Footer";
import { General } from "./globals/General";
import { GalleryCategories } from "./collections/GalleryCategories";
import { NewsCategories } from "./collections/NewsCategories";
import { Products } from "./collections/Products";
import { Orders } from "./collections/Orders";
import { Memberships } from "./collections/Memberships";
import { Advertisements } from "./collections/Advertisements";
import { Promotions } from "./collections/Promotions";
import { Venues } from "./collections/Venues";
import { NurserySeasons } from "./collections/NurserySeasons";
import { NurseryCategories } from "./collections/NurseryCategories";
import { NurseryRegistrations } from "./collections/NurseryRegistrations";
import { MagicLinkTokens } from "./collections/MagicLinkTokens";
import { revalidateContentPlugin } from "./collections/hooks/revalidateContent";
import { seo } from "./lib/seo/plugin";
import { isStaff } from "./lib/auth/roles";
import { MEDIA_PREFIX, mediaBucket, mediaS3Config } from "./lib/media/storage";
import { MATCH_SUMMARIES_QUEUE, matchSummariesTask } from "./lib/news/matchSummariesTask";
import { RESULT_CHECKS_QUEUE, resultChecksTask } from "./lib/mha/resultCheckTask";

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
    Videos,
    Products,
    Orders,
    Memberships,
    Advertisements,
    Promotions,
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
  jobs: {
    tasks: [matchSummariesTask, resultChecksTask],
    // Runs scheduled tasks on the long-running Railway server. Crons start when Payload
    // boots with `cron: true` (instrumentation.ts). Off outside production unless
    // PAYLOAD_JOBS_AUTORUN=true, so local dev never writes posts on its own.
    autoRun: [
      { cron: '*/5 * * * *', queue: MATCH_SUMMARIES_QUEUE },
      { cron: '* * * * *', queue: RESULT_CHECKS_QUEUE },
    ],
    shouldAutoRun: () =>
      process.env.PAYLOAD_JOBS_AUTORUN === 'true' ||
      (process.env.NODE_ENV === 'production' && process.env.PAYLOAD_JOBS_AUTORUN !== 'false'),
    access: {
      queue: ({ req }) => isStaff(req.user),
      run: ({ req }) => isStaff(req.user),
      cancel: ({ req }) => isStaff(req.user),
    },
  },
  plugins: [
    seo,
    revalidateContentPlugin,
    s3Storage({
      collections: {
        // Served through /api/media/file — Railway buckets can't be made public.
        media: { prefix: MEDIA_PREFIX },
      },
      bucket: mediaBucket,
      config: mediaS3Config,
    }),
  ],
});
