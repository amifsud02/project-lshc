# WooCommerce onboarding / store-setup: source-grounded feature analysis

Source: `woocommerce/woocommerce` trunk, commit `c34f26862bd081826edad8f284c681fbb531408e` (2026-11-02), plugin header `Version: 11.4.0-dev`.
All paths below are relative to the repo root. `WC/` = `plugins/woocommerce/`. `CP/` = `WC/client/admin/client/core-profiler/`. `TL/` = `WC/client/admin/client/task-lists/`. `TASKS/` = `WC/src/Admin/Features/OnboardingTasks/Tasks/`.

Items marked **[memory]** come from prior knowledge rather than this checkout; treat them as unverified.

---

## (a) Architecture overview

WooCommerce onboarding is four loosely coupled layers:

| Layer | What it is | Main source |
|---|---|---|
| 1. Activation redirect | On first activation a `_wc_activation_redirect` transient sends the admin to WooCommerce Home. While the onboarding profile is neither `completed` nor `skipped`, Home redirects to `admin.php?page=wc-admin&path=/setup-wizard`. | `WC/src/Internal/Admin/Onboarding/OnboardingSetupWizard.php` (`do_admin_redirects`, `redirect_to_profiler`), `WC/src/Internal/Admin/Onboarding/OnboardingProfile.php` (`needs_completion`) |
| 2. Core Profiler | A full-screen React wizard (xstate machine, 4 steps) that collects business profile data and store country, sets currency and units from the country, offers free plugins, and turns on Coming Soon mode. | `CP/index.tsx`, `CP/pages/*` |
| 3. Task lists on WooCommerce Home | PHP-defined `TaskList`/`Task` objects exposed over REST at `/wc-admin/onboarding/tasks`. The React home screen renders them. Each task either links to an existing settings page (`get_action_url`) or opens a React "fill" (sub-wizard) at `admin.php?page=wc-admin&task=<id>`. | `WC/src/Admin/Features/OnboardingTasks/*`, `TL/*` |
| 4. Launch Your Store (LYS) / Coming Soon | New stores start hidden behind a "Coming soon" page. The final task opens a hub (`path=/launch-your-store`) that lists the remaining essential tasks, shows a live site preview, and offers a Launch button that sets `woocommerce_coming_soon=no`. Settings > Site visibility controls the mode afterwards. | `WC/src/Admin/Features/LaunchYourStore.php`, `WC/src/Admin/API/LaunchYourStore.php`, `WC/src/Internal/ComingSoon/*`, `WC/client/admin/client/launch-your-store/*` |

Both the profiler and the tasks finish by writing ordinary WooCommerce settings (`wp_options`). There is no separate "wizard config": the wizard is a guided front-end over the settings pages. The task list mostly deep-links to those same settings pages, with `&tutorial=true` or `from=` query flags.

The legacy PHP setup wizard (`WC/includes/admin/class-wc-admin-setup-wizard.php`) is still in the tree, but every method is `_deprecated_function(..., '4.6.0', 'Onboarding is maintained in WooCommerce Admin.')` and its save handlers are empty stubs. See section (b4).

### Persistence keys (wp_options unless noted)

| Key | Shape | Written by | Source |
|---|---|---|---|
| `woocommerce_onboarding_profile` | assoc array: `completed`, `skipped`, `industry[]`, `business_extensions[]`, `is_agree_marketing`, `store_email`, `is_store_country_set`, `is_plugins_page_skipped`, `business_choice`, `selling_online_answer`, `selling_platforms[]` (legacy keys such as `product_types` are still read) | `POST /wc-admin/onboarding/profile` | `WC/src/Admin/API/OnboardingProfile.php` (`get_profile_properties`), `WC/src/Internal/Admin/Onboarding/OnboardingProfile.php` (`DATA_OPTION`) |
| `woocommerce_onboarding_profile_progress` | `['core_profiler_completed_steps'][step] = ['completed_at' => ISO8601]` | `POST /wc-admin/onboarding/profile/progress/core-profiler/complete` with `step` ∈ `intro-opt-in, skip-guided-setup, user-profile, business-info, plugins, intro-builder` | `OnboardingProfile.php` API lines ~98-125, `core_profiler_step_complete()` |
| `woocommerce_allow_tracking` | `yes`/`no` | Profiler intro opt-in | `CP/index.tsx` `updateTrackingOption` |
| `woocommerce_default_country` | `CC` or `CC:STATE` | Profiler business-info / skip flow | `CP/index.tsx` `updateBusinessInfo`, `updateBusinessLocation` |
| `blogname` (site title) | string | Profiler business-info, via `saveEntityRecord('root','site',{title})` | `CP/index.tsx` |
| `woocommerce_currency`, `_currency_pos`, `_price_thousand_sep`, `_price_decimal_sep`, `_price_num_decimals`, `woocommerce_weight_unit`, `woocommerce_dimension_unit` | from `WC/i18n/locale-info.php[country]` | `POST /wc-admin/onboarding/profile/update-store-currency-and-measurement-units` (`country_code`) | `WC/src/Admin/API/OnboardingProfile.php` `update_store_currency_and_measurement_units()` |
| `woocommerce_coming_soon`, `woocommerce_store_pages_only`, `woocommerce_private_link`, `woocommerce_share_key`, `woocommerce_feature_site_visibility_badge_enabled` | `yes`/`no`, 32-char key | Install, profiler completion, Site visibility settings, LYS hub | `WC/includes/class-wc-install.php` `add_coming_soon_option()`, `WC/src/Admin/API/LaunchYourStore.php` `initialize_coming_soon()`, `WC/src/Admin/Features/LaunchYourStore.php` |
| `woocommerce_task_list_tracked_completed_tasks` | `string[]` task ids | `Task::possibly_track_completion` | `WC/src/Admin/Features/OnboardingTasks/Task.php` `COMPLETED_OPTION` |
| `woocommerce_task_list_tracked_completed_actions` | `string[]` | `Task::mark_actioned` (default `is_complete`) | `Task.php` `ACTIONED_OPTION` |
| `woocommerce_task_list_dismissed_tasks` | `string[]` | `Task::dismiss` | `Task.php` `DISMISSED_OPTION` |
| `woocommerce_task_list_remind_me_later_tasks` | `{id: ms_timestamp}` (snooze, deprecated 7.2.0) | `Task::snooze` | `Task.php` `SNOOZED_OPTION` |
| `woocommerce_task_list_hidden_lists` | `string[]` list ids | `TaskList::hide` | `WC/src/Admin/Features/OnboardingTasks/TaskList.php` `HIDDEN_OPTION` |
| `woocommerce_task_list_completed_lists` | `string[]` | `TaskList::possibly_track_completion` | `TaskList.php` `COMPLETED_OPTION` |
| `woocommerce_task_list_reminder_bar_hidden` | `yes`/`no` | (reminder bar removed, `possibly_remove_reminder_bar` deprecated 10.9.0) | `TaskList.php` |
| `woocommerce_task_list_keep_completed` | `yes`/`no`, default `no` | Keep the completed list on Home | `TaskList.php` `get_keep_completed_task_list()` |
| `woocommerce_default_homepage_layout` | `two_columns` set when a list is hidden or completed | `TaskList::maybe_set_default_layout` | `TaskList.php` |
| user data field `task_list_tracked_started_tasks` | JSON `{taskId: count}` | Task click tracking; drives `is_visited()` | `Task.php` `is_visited()` |
| `woocommerce_admin_customize_store_completed` | `yes` | Saving global styles/templates (block theme) or `customize_save_after` (classic) | `TASKS/CustomizeStore.php` |
| `woocommerce_admin_created_default_shipping_zones` / `woocommerce_admin_reviewed_default_shipping_zones` | `yes` | Home screen auto-creates a default free-shipping zone | `WC/src/Internal/Admin/Homescreen.php` |
| `woocommerce_no_sales_tax` | `true` | Tax task: "I don't charge sales tax" | `TL/fills/tax/index.tsx` `onDisable` |
| `wc_connect_taxes_enabled` | `yes`/`no` | Tax task: automated or manual | `TL/fills/tax/index.tsx` |

---

## (b) Core Profiler, step by step

Route: `admin.php?page=wc-admin&path=/setup-wizard`. The `?step=` query param tracks the current step (`updateQueryStep`). Browser back/forward is handled (`browserPopstateHandler`). Progress-bar percentages come from each state's `meta.progress` in `CP/index.tsx`: intro 0→20, user-profile 40, business-info 60, plugins 70→80, loader 80→100.

State machine top-level states (`CP/index.tsx` ~L866-1900): `navigate` → `introOptIn` → `userProfile` → `businessInfo` → `plugins` → `settingUpStore` / `redirectingToWooHome`. There is also an alternative branch `skipGuidedSetup`.

Before each step, a "pre" state fetches in parallel: tracking option, profile items, completed steps, countries, geolocation (**only if the user opted in to tracking**: `getGeolocation` returns `undefined` otherwise), the site title, and the current user's email. Each fetch has `onError → done`, so a failed prefetch never blocks the wizard.

### b1. Step 1: Intro / opt-in (`CP/pages/IntroOptIn.tsx`)
- Heading: "Welcome to Woo!" Subtitle: "It's great to have you here with us! We'll be guiding you through the setup process – first, answer a few questions to tailor your experience."
- Primary button "Set up my store" → `INTRO_COMPLETED {optInDataSharing}` → user-profile step.
- Tertiary button "Skip guided setup" → `INTRO_SKIPPED` → `skipGuidedSetup` branch (b5).
- Checkbox (data-sharing opt-in): "I agree to share my data to tailor my store setup experience, get more relevant content, and help make WooCommerce better for everyone…". It is **checked by default** on a first run. On a re-visit it shows the previous choice.
- Persists: `woocommerce_allow_tracking` = `yes`/`no` via settings store `advanced` group (`updateTrackingOption`). On opt-in it enables `wcTracks`, ExPlat, and remote logging.

### b2. Step 2: User profile (`CP/pages/UserProfile.tsx`)
- Title: "Which one of these best describes you?" Subtitle: "Let us know where you are in your commerce journey so that we can tailor your Woo experience for you."
- Radio "Choice" cards (`businessOptions`). The default is `im_just_starting_my_business`.

| value | label |
|---|---|
| `im_just_starting_my_business` | I'm just starting my business |
| `im_already_selling` | I'm already selling |
| `im_setting_up_a_store_for_a_client` | I'm setting up a store for a client |

- Sub-question, shown only under `im_already_selling`: "Are you selling online?" (single select, `sellingOnlineOptions`):

| value | label |
|---|---|
| `yes_im_selling_online` | Yes, I'm selling online |
| `no_im_selling_offline` | No, I'm selling offline |
| `im_selling_both_online_and_offline` | I'm selling both online and offline |

- Sub-sub-question, shown only when the answer is online or both: "Which platform(s) are you currently using?" (multi-select, `platformOptions`): `amazon` Amazon, `adobe_commerce` Adobe Commerce, `big_cartel` Big Cartel, `big_commerce` Big Commerce, `ebay` Ebay, `ecwid` Ecwid, `etsy` Etsy, `facebook_marketplace` Facebook Marketplace, `google_shopping` Google Shopping, `pinterest` Pinterest, `shopify` Shopify, `square` Square, `squarespace` Squarespace, `wix` Wix, `wordpress` WordPress.
- If the business choice is not `im_already_selling`, `selling_online_answer` and `selling_platforms` are sent as `null` (`onContinue`).
- Top-bar "Skip this step" → `USER_PROFILE_SKIPPED {userProfile:{skipped:true}}`.
- Persists into `woocommerce_onboarding_profile`: `business_choice`, `selling_online_answer`, `selling_platforms` (`updateOnboardingProfileOption`).
- Downstream effect: the Products task title becomes "Import your products" when `business_choice === 'im_already_selling'`, otherwise "Add your products" (`TASKS/Products.php::get_title`).

### b3. Step 3: Business info (`CP/pages/BusinessInfo.tsx`)
- Title: "Tell us a bit about your store". Subtitle: "We'll use this information to help you set up payments, shipping, and taxes, as well as recommending the best theme for your store."
- Fields:

| Field | Type | Required | Default / notes |
|---|---|---|---|
| "Give your store a name" | text | no | Prefilled from the site title, unless it is one of `POSSIBLY_DEFAULT_STORE_NAMES` = `[undefined, 'woocommerce', 'Site Title', '']`. Placeholder "Ex. My awesome store". Helper text "Don't worry — you can always change it later!" |
| Industry (label depends on business choice: "What type of products or services do you plan to sell?" / "Which industry is your business in?" / "Which industry is your client's business in?") | searchable single select | no | `industryChoices` below |
| "Where is your store located?" | country/state select with geolocation suggestion | **yes** (Continue is disabled without it) | `GeolocationCountrySelect`. Records `geolocationOverruled` when the user picks something other than the suggestion |
| "Your email address" | email | only if the marketing box is ticked (zod `.email()` validation on blur) | Prefilled from profile `store_email`, else the current user's email |
| Marketing opt-in checkbox: "Get tips, discounts, and recommendations from Woo…" | checkbox | no | default `false` |

- `industryChoices` (key / label): `clothing_and_accessories` Clothing and accessories; `food_and_drink` Food and drink; `electronics_and_computers` Electronics and computers; `health_and_beauty` Health and beauty; `education_and_learning` Education and learning; `home_furniture_and_garden` Home, furniture and garden; `arts_and_crafts` Arts and crafts; `sports_and_recreation` Sports and recreation; `other` Other.
- Error fallback: if the country list fails to load, a notice offers "Please try again" (reload) or "Skip this step" (`SKIP_BUSINESS_INFO_STEP` → plugins).
- On Continue (`updateBusinessInfo`), these run in parallel:
  1. `update-store-currency-and-measurement-units(country)` writes 7 options from `locale-info.php`. Example: `US` → USD, `left`, `,`, `.`, `2`, `lbs`, `in`. `MT` → EUR, `left`, `,`, `.`, `2`, `kg`, `cm`.
  2. Profile: `is_store_country_set:true`, `is_agree_marketing`, `industry:[key]`, `store_email` (only if changed).
  3. Site title := store name.
  4. `woocommerce_default_country` := `CC[:STATE]`.
- Both success and error transition to plugins (`postBusinessInfo` `onDone`/`onError → #plugins`). Saving is best effort and never blocks progress.

**Not asked by the current profiler:** revenue range, product count, product types, employee count, selling venues. Those were in the WC-Admin "OBW" profile wizard (≈ WC 4.x–7.x). **[memory]** Its revenue bands were `none, up-to-2500, 2500-10000, 10000-50000, 50000-250000, more-than-250000`, and product-count bands were `0, 1-10, 11-100, 101-1000, 1000+`. The PHP side still has the old lists: industries (`fashion-apparel-accessories, health-beauty, electronics-computers, food-drink, home-furniture-garden, cbd-other-hemp-derived-products, education-and-learning, sports-and-recreation, arts-and-crafts, other` in `WC/src/Internal/Admin/Onboarding/OnboardingIndustries.php`) and product types (`physical, downloads, subscriptions, memberships, bookings, product-bundles, product-add-ons` in `OnboardingProducts.php`). Tasks still read `profile.product_types` (Shipping, Products fill, Homescreen) and treat a missing value as `physical`.

### b4. Step 4: Free extensions / plugins (`CP/pages/Plugins/Plugins.tsx`)
- Title: "Get a boost with our free features". Subtitle: "No commitment required – you can remove them at any time."
- The list comes from the remote "free extensions" spec, bundle key `obw/core-profiler`, with a bundled fallback in `WC/src/Internal/Admin/RemoteFreeExtensions/DefaultFreeExtensions.php`. Each plugin has `label`, `description`, `learn_more_link`, `install_priority`, `requires_jpc` (Jetpack connection), and `is_visible` rules (`base_location_country`, `plugins_activated`, option-range A/B segments such as Klaviyo 70% / MailPoet 30%). Default bundle members: `woocommerce-payments` (WooPayments, priority 5, requires_jpc), `woocommerce-shipping` (3), `woocommerce-shipstation-integration` (3), `packlink-pro-shipping` (3), `jetpack` (8, requires_jpc), `pinterest-for-woocommerce` (2), `mailpoet` (7), `klaviyo` (7), `google-listings-and-ads` (6), `woocommerce-services:tax` (4), `tiktok-for-business` (1), `snapchat-for-woocommerce` (1), `reddit-for-woocommerce` (1). `kliken-ads-pixel-for-meta` is also defined.
- Auto-skip: the page is skipped when 0 plugins are returned or all are already active (`prePlugins` guard). It is also skipped if the fetch fails.
- All not-yet-active plugins are **pre-selected**. Already-active plugins render checked and disabled. A terms-of-service line is shown for the selected plugins.
- "Continue" with a selection → `PLUGINS_INSTALLATION_REQUESTED {pluginsShown, pluginsSelected, pluginsUnselected}` → loader. Install runs with a 30 s `INSTALLATION_TIMEOUT`, after which the remaining installs are queued async (`CP/services/installAndActivatePlugins.ts`). On errors it returns to the page with `PluginErrorBanner` and a retry.
- "Continue" with nothing selected, or the top-bar skip → profile `is_plugins_page_skipped:true, skipped:false, completed:true`.
- If the user lacks `install_plugins`, a `NoPermissions` page is shown instead.
- Completion: profile `completed:true`. If any selected plugin `requires_jpc` and is now active, the user goes to the Jetpack auth URL. Otherwise they go to WooCommerce Home. Both exits first call `coreProfilerCompleted()` → `POST /wc-admin/launch-your-store/initialize-coming-soon` (see d-LYS).
- Loader copy (`CP/utils/get-loader-stage-meta.tsx`): stage titles "Turning on the lights", "Extending your store's capabilities", "Woo! Let's get your features ready", "Opening the doors", each with a "#FunWooFact".

### b5. Skip branch: "Skip guided setup" (`CP/pages/BusinessLocation.tsx`)
- One required question: "Where is your business located?" (country/state select with geolocation). Button "Go to my store".
- If the country list fails, "Skip this step" submits `storeLocation: 'US:CA'`.
- `skipFlowUpdateBusinessLocation` writes profile `skipped:true` (**required**) plus `woocommerce_default_country` and currency/units (best effort, via `Promise.allSettled`). If only location or currency fails, Home shows a "store location not saved" query flag. If the `skipped` write fails, it falls back to a non-REST `admin-post.php?action=woocommerce_skip_onboarding_setup` (`OnboardingSetupWizard::handle_admin_post_woocommerce_skip_onboarding_setup`) so Home stops redirecting to the profiler.

### b6. Legacy PHP setup wizard (deprecated 4.6.0, views still in source)
`WC/includes/admin/class-wc-admin-setup-wizard.php` steps (`setup_wizard()`): `new_onboarding`, `store_setup` "Store setup", `payment` "Payment", `shipping` "Shipping", `recommended` "Recommended", `activate` "Activate", `next_steps` "Ready!".
- Store setup: country (`store_country`), address 1/2, city, state, postcode, currency (`currency_code`), "What type of products do you plan to sell?" `product_type` ∈ `both | physical | virtual`, checkbox `sell_in_person`, tracker opt-in `wc_tracker_checkbox`.
- Payment: online gateways (Stripe/PayPal **[memory]**) plus "Offline Payments": BACS ("A simple offline gateway that lets you accept BACS payment."), Cheque, Cash on delivery (`get_wizard_manual_payment_gateways`).
- Shipping: domestic zone and "Locations not covered by your other zones" (`shipping_zones[domestic|intl][enabled]`), each with a method choice (live rates / flat rate / free shipping **[memory]**), weight/dimension unit selects **[memory]**, and a label-printing promo (WooCommerce Services / ShipStation).
- Recommended: Storefront theme, Automated Taxes, WooCommerce Admin, Mailchimp, Facebook.
- Activate: Jetpack connect (benefits: store stats, monitoring, security, product promotion).
- Ready: newsletter `subscribe`, "Create a product", "Import products", "Review Settings", "View & Customize".
- All `*_save` handlers are now empty deprecation stubs, so this wizard is reference material only.

---

## (c) Task lists

Defined in `WC/src/Admin/Features/OnboardingTasks/TaskLists.php::init_default_lists()`.

| List id | Title | Tasks (order) | Notes |
|---|---|---|---|
| `setup` | "Get ready to start selling" | `products`, `payments`, `customize-store`, `tax`, `shipping`, `launch-your-store` | `StoreDetails` is in the array but is explicitly `unset` because the profiler covers it. `display_progress_header:true`, `options.use_completed_title:true`, `event_prefix:'tasklist_'` |
| `extended` | "Things to do next" | `marketing`, `extend-store`, `payments` (AdditionalPayments, same id), `get-mobile-app`, `review-shipping` | `sort_by: is_complete asc, level asc` |
| `secret_tasklist` | (hidden) | `shipping-recommendation` | `visible:false`, `hidden_id:'setup'`. Reached only via a direct URL |

Lists can be replaced wholesale via the `woocommerce_admin_experimental_onboarding_tasklists` filter. Extensions can append tasks with `TaskLists::add_task($list_id, Task)` or the deprecated `woocommerce_get_registered_extended_tasks`.

**Task base class contract** (`Task.php`): `get_id, get_title, get_content, get_time` (abstract); optional `get_action_url` (null → opens a React fill at `?task=<id>`), `get_action_label` (default "Let's go"), `is_complete` (default `is_actioned()`), `can_view` (default true), `is_dismissable` (default false), `is_snoozeable` (deprecated), `is_disabled`, `is_in_progress` + `in_progress_label`, `is_always_accessible`, `get_level` (default 3), `get_additional_data` (payload for the fill), `get_badge`, `get_image_url`. Completion is sticky: once `possibly_track_completion` records the id in `woocommerce_task_list_tracked_completed_tasks`, `has_previously_completed()` returns true. Products is the exception and reverts if all products are deleted.

### Task table

| id | Title | Completion rule (`is_complete`) | Visibility (`can_view`) | Opens / sub-flow | Source |
|---|---|---|---|---|---|
| `store_details` | "Store details" / "Add store details" / "You added store details" | `woocommerce_store_address` and `woocommerce_store_city` non-empty, plus `woocommerce_store_postcode` unless the country locale hides postcode | default | `wc-settings&tab=general&tutorial=true` (after completion: without `tutorial`). Time "4 minutes". **Removed from `setup` by default** | `TASKS/StoreDetails.php` |
| `products` | "Add your products" or "Import your products" (if `business_choice=im_already_selling`) | `has_previously_completed()` OR at least 1 published product (cached in transient `woocommerce_product_task_has_product_transient`). Reverts on trash/delete if no products remain | always; `is_always_accessible:true` | React fill `TL/fills/products`: "What product do you want to add?" Product-type cards (see below), "View more product types", "Load sample products" (imports 9 via `POST /wc-admin/onboarding/tasks/import_sample_products`), "Are you already selling somewhere else? Import your products from a CSV file" → `edit.php?post_type=product&page=product_importer&wc_onboarding_active_task=products`. Picking a type creates a **draft** product and opens `post.php?...&tutorial=true&tutorial_type=<type>`. An empty Products list redirects to `path=/add-product&task=products`. A return notice appears after import or sample load | `TASKS/Products.php`, `TL/fills/products/*`, `TL/fills/import-products/*` |
| `payments` | "Set up payments" | If WooPayments is active: onboarded AND not a test account. Else: any gateway with `enabled==='yes'` (`has_gateways`) | always | `wc-settings&tab=checkout&from=<FROM_PAYMENTS_TASK>` (React Payments settings: PSP suggestions plus an "Offline payment methods" group of BACS/Cheque/COD). `is_in_progress` + label "Action needed" / "Test account" | `TASKS/Payments.php` |
| `woocommerce-payments` | "Get paid with WooPayments" | another non-offline gateway enabled, OR WooPayments connected and not partially onboarded | only if a WooPayments suggestion exists for the country. Not in default lists | `wcpay-connect` link / welcome page / install suggestion | `TASKS/WooCommercePayments.php` |
| `payments` (extended, AdditionalPayments) | "Set up additional payment options" | an enabled provider in category `bnpl`, `express_checkout` or `crypto` | only once any gateway is enabled; dismissable | `wc-settings&tab=checkout&other_pes_section=expanded` | `TASKS/AdditionalPayments.php` |
| `customize-store` | "Customize your store" | option `woocommerce_admin_customize_store_completed === 'yes'`, set on saving customised global styles, a template or template part (block theme), or `customize_save_after` (classic) | always | `path=/customize-store` intro page: "Design your own" → Site Editor (block theme) or `customize.php` (classic); "Pick your perfect theme" → Marketplace themes | `TASKS/CustomizeStore.php`, `WC/client/admin/client/customize-store/index.tsx` |
| `appearance` (legacy) | "Choose your theme" | `is_actioned` (marked when `theme-install.php` loads) | default; not in default lists | — | `TASKS/Appearance.php` |
| `tax` | "Collect sales tax" | `wc_connect_taxes_enabled=yes` OR filter `woocommerce_admin_third_party_tax_setup_complete` OR option `woocommerce_no_sales_tax` exists OR any row in `{prefix}woocommerce_tax_rates` | default | React fill `TL/fills/tax`: partner cards (WooCommerce Tax if country ∈ US, CA, AU, GB + EU; Stripe Tax for its country list) / manual / "I don't charge sales tax". **Manual**: sets `woocommerce_calc_taxes=yes`, `wc_connect_taxes_enabled=no`, then goes to `wc-settings&tab=tax&section=standard`. **Automate**: sets `wc_connect_taxes_enabled=yes` and `woocommerce_calc_taxes=yes`. **No tax**: `woocommerce_no_sales_tax=true`, `woocommerce_calc_taxes=no`. Content and label switch to "Good news! WooCommerce Tax can automate…" / "Yes please" when automation is available | `TASKS/Tax.php`, `TL/fills/tax/index.tsx` |
| `shipping` | "Select your shipping options" | ≥1 shipping zone (transient `woocommerce_shipping_task_zone_count_transient`) | hidden if default zones were auto-created, if `product_types === ['downloads']`, or if the store country is not in `US, CA, AU, NZ, SG, HK, GB, ES, IT, DE, FR, MX, CO, CL, AR, PE, BR, UY, GT, NL, AT, BE, IE, PT`. Shown if the country is unknown | `action_url` is null until zones exist, so the React fill `TL/fills/shipping` runs as a stepper: (1) "Set store location" (address/country/postcode → `woocommerce_store_address`, `woocommerce_default_country`, `woocommerce_store_postcode`); (2) "Set shipping costs": auto-creates a zone for the store country, plus "Rest of the world" (toggleable). Per-zone "Shipping cost". A cost of 0 creates `free_shipping`, otherwise `flat_rate` with `settings.cost`; other methods in the zone are disabled; (3) "Enable shipping label printing" (plugin install, skipped if `woocommerce_ship_to_countries==='disabled'`); (4) "Connect your store" (Jetpack) | `TASKS/Shipping.php`, `TL/fills/shipping/index.js`, `rates.js` |
| `review-shipping` | "Review shipping options" | `woocommerce_admin_reviewed_default_shipping_zones === 'yes'` | only if `woocommerce_admin_created_default_shipping_zones === 'yes'`; dismissable | `wc-settings&tab=shipping` | `TASKS/ReviewShippingOptions.php` |
| (auto) default zone | — | On Home load, if there are no zones, `is_store_country_set`, and physical products are assumed (also assumed when the profiler was skipped or the address is empty), creates a zone named after the country with a `free_shipping` method titled "Free shipping". It does this only for countries outside the partner list, or US without Jetpack/WCS | — | — | `WC/src/Internal/Admin/Homescreen.php` (~L75-160) |
| `shipping-recommendation` | "Get your products shipped" | `woocommerce-shipping` active AND Jetpack connected with an owner | secret list | fill `TL/fills/shipping-recommendation` | `TASKS/ExperimentalShippingRecommendation.php` |
| `launch-your-store` | "Launch your store" | `woocommerce_coming_soon !== 'yes'` | always | `path=/launch-your-store` hub (see d-LYS). Hides the WP admin bar in `?site-preview=1` | `TASKS/LaunchYourStore.php` |
| `marketing` | "Grow your business" | `is_actioned` | always; dismissable | fill `TL/fills/Marketing` (recommended marketing plugins) | `TASKS/Marketing.php` |
| `extend-store` | "Enhance your store with extensions" | `is_visited()` (clicked at least once) | dismissable | `path=/extensions` | `TASKS/ExtendStore.php` |
| `get-mobile-app` | "Get the free WooCommerce mobile app" | `woocommerce_admin_dismissed_mobile_app_modal === 'yes'` | user can install plugins and Jetpack is not connected, OR the current user is the connection owner; dismissable | `?mobileAppModal=true` | `TASKS/GetMobileApp.php` |
| `tour-in-app-marketplace` | "Discover ways of extending your store with a tour of the Woo Marketplace" | `woocommerce_admin_dismissed_in_app_marketplace_tour === 'yes'` | not in default lists | `path=/extensions&tutorial=true` | `TASKS/TourInAppMarketplace.php` |
| `store_creation` | "You created {site}" | always true; `is_disabled:true` | not in default lists | a celebratory "done" row | `TASKS/StoreCreation.php` |

**Product-type cards** (`TL/fills/products/constants.tsx`): `physical` "Physical product"; `digital` "Digital product"; `variable` "Variable product"; `grouped` "Grouped product"; `external` "External product"; plus `load-sample-product`, a sponsored `printful-advert`, and `import-csv`. Surfaced by profile product types: `physical → [physical, variable, grouped]`, `downloads → [digital]`, `downloads,physical → [physical, digital]`. The default is the physical set. Extensible via the filter `experimental_woocommerce_tasklist_product_types`.

**Payments fill (legacy task UI still in tree)** `TL/fills/PaymentGatewaySuggestions/`: sections for recommended gateways, additional gateways, and "Offline payment methods". BACS setup form (`plugins/Bacs.js`): `account_name`, `account_number`, `bank_name`, `sort_code`, `iban`, `bic`. Validation: account number **or** IBAN is required. Save sets `woocommerce_bacs_settings.enabled='yes'` and `woocommerce_bacs_accounts=[values]`.

**REST endpoints** (`WC/src/Admin/API/OnboardingTasks.php`, base `/wc-admin/onboarding/tasks`): `GET` lists; `/{id}/action` (mark actioned); `/{id}/dismiss`, `/{id}/undo_dismiss`; `/{id}/snooze`, `/{id}/undo_snooze`; `/{id}/hide`, `/{id}/unhide` (list ids); `/import_sample_products`; `/create_product_from_template`; `/create_homepage`.

---

## (d) Settings catalogue

Type names are WC settings-API field types. Checkbox values are `'yes'`/`'no'`. Each table cites the file its rows come from.

### d1. General (`WC/includes/admin/settings/class-wc-settings-general.php`)
| id | label | type | default | choices |
|---|---|---|---|---|
| `woocommerce_store_address` | Address line 1 | text | `''` | |
| `woocommerce_store_address_2` | Address line 2 | text | `''` | |
| `woocommerce_store_city` | City | text | `''` | |
| `woocommerce_default_country` | Country / State | single_select_country | `US:CA` | `CC` or `CC:STATE` |
| `woocommerce_store_postcode` | Postcode / ZIP | text | `''` | |
| `woocommerce_address_autocomplete_enabled` | Address autocomplete | checkbox | `no` | (+ `woocommerce_address_autocomplete_provider` select when providers exist) |
| `woocommerce_allowed_countries` | Selling location(s) | select | `all` | `all` Sell to all countries · `all_except` Sell to all countries, except for… · `specific` Sell to specific countries |
| `woocommerce_all_except_countries` | (shown for all_except) | multi_select_countries | `''` | |
| `woocommerce_specific_allowed_countries` | (shown for specific) | multi_select_countries | `''` | |
| `woocommerce_ship_to_countries` | Shipping location(s) | select | `''` | `''` Ship to all countries you sell to · `all` Ship to all countries · `specific` Ship to specific countries only · `disabled` Disable shipping & shipping calculations |
| `woocommerce_specific_ship_to_countries` | Ship to specific countries | multi_select_countries | `''` | |
| `woocommerce_default_customer_address` | Default customer location | select | `base` | `''` No location by default · `base` Shop country/region · `geolocation` Geolocate · `geolocation_ajax` Geolocate (with page caching support) (`WC/src/Enums/DefaultCustomerAddress.php`) |
| `woocommerce_calc_taxes` | Enable taxes | checkbox | `no` | |
| `woocommerce_enable_coupons` | Enable coupons | checkbox | `yes` | |
| `woocommerce_calc_discounts_sequentially` | Calculate coupon discounts sequentially | checkbox (shown if coupons on) | `no` | |
| `woocommerce_currency` | Currency | select | `USD` | all `get_woocommerce_currencies()` |
| `woocommerce_currency_pos` | Currency position | select | `left` | `left`, `right`, `left_space`, `right_space` |
| `woocommerce_price_thousand_sep` | Thousand separator | text | `,` | |
| `woocommerce_price_decimal_sep` | Decimal separator | text | `.` | |
| `woocommerce_price_num_decimals` | Number of decimals | number (min 0, step 1) | `2` | |

### d2. Products (`class-wc-settings-products.php`; sections `''` General, `inventory`, `downloadable`)
General:
| id | label | type | default | choices |
|---|---|---|---|---|
| `woocommerce_shop_page_id` | Shop page | single_select_page_with_search | `''` | |
| `woocommerce_cart_redirect_after_add` | Redirect to the cart page after successful addition | checkbox | `no` | |
| `woocommerce_enable_ajax_add_to_cart` | Enable AJAX add to cart buttons on archives | checkbox | `yes` | |
| `woocommerce_placeholder_image` | Placeholder image | text (attachment ID/URL) | `''` | |
| `woocommerce_weight_unit` | Weight unit | select | `lbs` (locale-info `US`) | `kg`, `g`, `lbs`, `oz` |
| `woocommerce_dimension_unit` | Dimensions unit | select | `in` (locale-info `US`) | `m`, `cm`, `mm`, `in`, `yd` |
| `woocommerce_enable_reviews` | Enable product reviews | checkbox | `yes` | |
| `woocommerce_review_rating_verification_label` | Show "verified owner" label | checkbox | `yes` | |
| `woocommerce_review_rating_verification_required` | Reviews only by verified owners | checkbox | `no` | |
| `woocommerce_enable_review_rating` | Enable star rating on reviews | checkbox | `yes` | |
| `woocommerce_review_rating_required` | Star ratings required | checkbox | `yes` | |

Inventory:
| id | label | type | default | choices |
|---|---|---|---|---|
| `woocommerce_manage_stock` | Enable stock management | checkbox | `yes` | |
| `woocommerce_hold_stock_minutes` | Hold stock (minutes) | number (min 0) | `60` | blank = disabled; pending orders cancelled after limit |
| `woocommerce_notify_low_stock` | Enable low stock notifications | checkbox | `yes` | |
| `woocommerce_notify_no_stock` | Enable out of stock notifications | checkbox | `yes` | |
| `woocommerce_notify_backorder` | Enable backorder notifications | checkbox | `yes` | |
| `woocommerce_stock_email_recipient` | Notification recipient(s) | text | `admin_email` | comma separated |
| `woocommerce_notify_low_stock_amount` | Low stock threshold | number (min 0) | `2` | |
| `woocommerce_notify_no_stock_amount` | Out of stock threshold | number (min 0) | `0` | |
| `woocommerce_hide_out_of_stock_items` | Hide out of stock items from the catalog | checkbox | `no` | |
| `woocommerce_stock_format` | Stock display format | select | `''` | `''` Always show ("12 in stock") · `low_amount` Only when low · `no_amount` Never |

Downloadable:
| id | label | type | default | choices |
|---|---|---|---|---|
| `woocommerce_file_download_method` | File download method | select | `force` | `force`, `xsendfile`, `redirect` |
| `woocommerce_downloads_redirect_fallback_allowed` | Allow redirect mode as last resort | checkbox | `no` | |
| `woocommerce_downloads_require_login` | Downloads require login | checkbox | `no` | |
| `woocommerce_downloads_grant_access_after_payment` | Grant access after payment | checkbox | `yes` | |
| `woocommerce_downloads_deliver_inline` | Open in browser | checkbox | `false` | |
| `woocommerce_downloads_add_hash_to_filename` | Append unique string to filename | checkbox | `yes` | |
| `woocommerce_downloads_count_partial` | Count partial downloads | checkbox | `yes` | |

### d3. Tax (`WC/includes/admin/settings/views/settings-tax.php`; sections `''` Tax options, `standard` Standard rates, plus one per tax class; `class-wc-settings-tax.php`)
| id | label | type | default | choices |
|---|---|---|---|---|
| `woocommerce_prices_include_tax` | Prices entered with tax | radio | `no` | `yes` inclusive · `no` exclusive |
| `woocommerce_tax_based_on` | Calculate tax based on | select | `shipping` | `shipping` Customer shipping address · `billing` Customer billing address · `base` Shop base address (`WC/src/Enums/TaxBasedOn.php`) |
| `woocommerce_shipping_tax_class` | Shipping tax class | select | `inherit` | `inherit` (based on cart items) + each tax class |
| `woocommerce_tax_round_at_subtotal` | Round tax at subtotal level | checkbox | `no` | |
| `woocommerce_tax_classes` | Additional tax classes | textarea (one per line, not a real option; stored as tax-class rows) | install seeds "Reduced rate", "Zero rate" (`class-wc-install.php` ~L1299) | |
| `woocommerce_tax_display_shop` | Display prices in the shop | select | `excl` | `incl`, `excl` (`TaxDisplayMode`) |
| `woocommerce_tax_display_cart` | Display prices during cart and checkout | select | `excl` | `incl`, `excl` |
| `woocommerce_price_display_suffix` | Price display suffix | text | `''` | supports `{price_including_tax}`, `{price_excluding_tax}` |
| `woocommerce_tax_total_display` | Display tax totals | select | `itemized` | `single`, `itemized` |

Standard-rates table columns (`views/html-settings-tax.php`): Country code (2-letter, blank = all), State code, Postcode/ZIP (`;`-separated, wildcards `*`, numeric ranges `12345...12350`), City (`;`-separated), Rate % (4 dp), Tax name, Priority (one matching rate per priority), Compound (bool), Shipping (bool, applies to shipping). Rates are stored in `{prefix}woocommerce_tax_rates` (+ `_locations`).

### d4. Shipping (`class-wc-settings-shipping.php`; sections `''` Shipping zones, `options` Shipping settings, `classes` Classes, optional `fulfillment-providers`, plus one per method with global settings)
Shipping settings:
| id | label | type | default | choices |
|---|---|---|---|---|
| `woocommerce_enable_shipping_calc` | Enable the shipping calculator on the cart page | checkbox | `yes` | |
| `woocommerce_shipping_cost_requires_address` | Hide shipping costs until an address is entered | checkbox | `no` | |
| `woocommerce_shipping_hide_rates_when_free` | Hide shipping rates when free shipping is available | checkbox | `no` | |
| `woocommerce_ship_to_destination` | Shipping destination | radio | `billing` | `shipping` · `billing` · `billing_only` (force billing address) |
| `woocommerce_shipping_debug_mode` | Enable debug mode | checkbox | `no` | |

Zones: name, regions (countries/states/continents/postcodes), ordered methods. "Locations not covered by your other zones" is zone id 0. Shipping classes: name, slug, description.

Method instance settings:
- **Flat rate** (`WC/includes/shipping/flat-rate/includes/settings-flat-rate.php`): `title` text, default "Flat rate"; `tax_status` select `taxable` (default) / `none`; `cost` text, default `0`, formula placeholders `[qty]`, `[cost]`, `[weight min max]`, `[fee percent min_fee max_fee]`. Per shipping class: `class_cost_<id>` text and `no_class_cost` text. `type` "Calculation type" select `class` (default, per class) / `order` (most expensive class).
- **Free shipping** (`WC/includes/shipping/free-shipping/class-wc-shipping-free-shipping.php`): `title`, default "Free shipping"; `requires` select `''` No requirement (default) / `coupon` A valid free shipping coupon / `min_amount` A minimum order amount / `either` min amount OR coupon / `both` min amount AND coupon; `min_amount` text, default `0`; `ignore_discounts` checkbox "Apply minimum order rule before coupon discount", default `no`.
- **Local pickup** (method `local_pickup`, `WC/includes/shipping/local-pickup/class-wc-shipping-local-pickup.php`): `title`, default "Local pickup"; `tax_status`, default `taxable`; `cost` text, default `''`. Store base taxes apply regardless of customer address. (The Blocks "pickup_location" method with multiple locations lives elsewhere and was not inspected.)

### d5. Payments (offline gateways; `WC/includes/gateways/*`, shared trait `WC/src/Gateways/ShippingMethodRestrictionsTrait.php`)
All three offline gateways share `enabled` (checkbox, default `no`), `title` (safe_text), `description` (textarea), `instructions` (textarea), and, via the trait, **`enable_for_methods`** (multiselect of shipping methods, default `''` = all) and **`enable_for_virtual`** ("Accept … if the order is virtual", checkbox, default `yes`).
| Gateway (id) | title default | description default | instructions default | order status on checkout | extra |
|---|---|---|---|---|---|
| Direct bank transfer (`bacs`) | "Direct bank transfer" | "Make your payment directly into our bank account. Please use your Order ID as the payment reference. Your order will not be shipped until the funds have cleared in our account." | `''` | `on-hold` (filter `woocommerce_bacs_process_payment_order_status`) | `account_details` repeater → option `woocommerce_bacs_accounts` = list of `{account_name, account_number, bank_name, sort_code, iban, bic}`. The sort-code label is localised per country |
| Check payments (`cheque`) | "Check payments" | "Please send a check to Store Name, Store Street, Store Town, Store State / County, Store Postcode." | `''` | on-hold | |
| Cash on delivery (`cod`) | "Cash on delivery" | "Pay with cash upon delivery." | "Pay with cash upon delivery." | `processing`, or `on-hold` if the order has downloadable items (filter `woocommerce_cod_process_payment_order_status`) | |

The React Payments settings group these as `offline_pms_group` (`WC/src/Internal/Admin/Settings/PaymentsProviders.php`: `OFFLINE_METHODS = [bacs, cheque, cod]`; suggestion categories `express_checkout`, `bnpl`, `crypto`, `psp`).

### d6. Accounts & Privacy (`class-wc-settings-accounts.php`)
| id | label | type | default |
|---|---|---|---|
| `woocommerce_enable_guest_checkout` | Enable guest checkout (recommended) | checkbox | `yes` |
| `woocommerce_enable_checkout_login_reminder` | Enable log-in during checkout | checkbox | `no` |
| `woocommerce_enable_delayed_account_creation` | Account creation: After checkout (recommended); needs guest checkout | checkbox | `no` |
| `woocommerce_enable_signup_and_login_from_checkout` | Account creation: During checkout | checkbox | `no` |
| `woocommerce_enable_myaccount_registration` | Account creation: On "My account" page | checkbox | `no` |
| `woocommerce_registration_generate_password` | Send password setup link (recommended) | checkbox | `yes` |
| `woocommerce_registration_generate_username` | Generate account login (recommended) | checkbox | `yes` |
| `woocommerce_erasure_request_removes_order_data` | Remove personal data from orders on request | checkbox | `no` |
| `woocommerce_erasure_request_removes_download_data` | Remove access to downloads on request | checkbox | `no` |
| `woocommerce_allow_bulk_remove_personal_data` | Allow personal data to be removed in bulk from orders | checkbox | `no` |
| `woocommerce_registration_privacy_policy_text` | Registration privacy policy | textarea | "Your personal data will be used to support your experience… described in our [privacy_policy]." |
| `woocommerce_checkout_privacy_policy_text` | Checkout privacy policy | textarea | "Your personal data will be used to process your order… [privacy_policy]." |
| `woocommerce_delete_inactive_accounts` | Retain inactive accounts | relative_date_selector `{number, unit}` | `{number:'', unit:'months'}` |
| `woocommerce_trash_pending_orders` | Retain pending orders | relative_date_selector | `''` |
| `woocommerce_trash_failed_orders` | Retain failed orders | relative_date_selector | `''` |
| `woocommerce_trash_cancelled_orders` | Retain cancelled orders | relative_date_selector | `''` |
| `woocommerce_anonymize_refunded_orders` | Retain refunded orders | relative_date_selector | `{number:'', unit:'months'}` |
| `woocommerce_anonymize_completed_orders` | Retain completed orders | relative_date_selector | `{number:'', unit:'months'}` |
(Blank = retain indefinitely. Units days/weeks/months/years **[memory]**.)

### d7. Emails (`class-wc-settings-emails.php`, `WC/src/Internal/Email/EmailColors.php`, `WC/includes/emails/*`)
| id | label | type | default |
|---|---|---|---|
| `woocommerce_email_from_name` | "From" name | text | site name |
| `woocommerce_email_from_address` | "From" address | email | `admin_email` |
| `woocommerce_email_reply_to_enabled` | Add "Reply-to" email | checkbox | `no` |
| `woocommerce_email_reply_to_name` / `_address` | "Reply-to" name / address | text / email | `''` |
| `woocommerce_email_header_image` | Logo | email_image_url | `''` (site title used if empty) |
| `woocommerce_email_header_image_width` | Logo width (px) | number | `120` |
| `woocommerce_email_header_alignment` | Header alignment | select | `left` (`left`/`center`/`right`) |
| `woocommerce_email_font_family` | Font family | email_font_family | `Helvetica` |
| `woocommerce_email_footer_text` | Footer text | textarea | `{site_title}<br />{store_address}` |
| `woocommerce_email_base_color` | Accent | color | `#720eec` (legacy) / `#8526ff` (email improvements on, or theme global styles) |
| `woocommerce_email_background_color` | Email background | color | `#f7f7f7` / `#ffffff` |
| `woocommerce_email_body_background_color` | Content background | color | `#ffffff` |
| `woocommerce_email_text_color` | Heading & text | color | `#3c3c3c` / `#1e1e1e` |
| `woocommerce_email_footer_text_color` | Secondary text | color | `#3c3c3c` / `#787c82` |
| `woocommerce_email_auto_sync_with_theme` | Auto-sync with theme | hidden | `no` |

New installs turn on `email_improvements` (`class-wc-install.php` `enable_email_improvements_for_newly_installed`). Per-email settings (e.g. `class-wc-email-new-order.php`): `enabled`, `recipient` (admin emails; default `admin_email`), `subject`, `heading`, `additional_content`, `email_type` (plain/html/multipart), optional `cc`/`bcc`. Email classes in core include: new order, cancelled, failed, customer on-hold/processing/completed/refunded/partially-refunded/invoice/note/new-account/reset-password/failed/cancelled, review request, POS completed/refunded, fulfillment created/updated/deleted, order-withdrawal requested (admin and customer), admin payment-gateway-enabled.

### d8. Advanced (`class-wc-settings-advanced.php`; sections `''` Page setup, `keys` REST API keys, plus others via filters)
| id | label | type | default |
|---|---|---|---|
| `woocommerce_cart_page_id` | Cart page | single_select_page_with_search | `''` |
| `woocommerce_checkout_page_id` | Checkout page | single_select_page_with_search | current checkout page id |
| `woocommerce_myaccount_page_id` | My account page | single_select_page_with_search | `''` |
| `woocommerce_terms_page_id` | Terms and conditions | single_select_page_with_search | `''` |
| `woocommerce_refund_returns_page_id` | Refund and returns policy | single_select_page_with_search | `''` |
| `woocommerce_force_ssl_checkout` / `woocommerce_unforce_ssl_checkout` | Secure checkout | checkbox | `no` / `no` |
| Checkout endpoints | `woocommerce_checkout_pay_endpoint` `order-pay`; `woocommerce_checkout_order_received_endpoint` `order-received`; `woocommerce_myaccount_add_payment_method_endpoint` `add-payment-method`; `..._delete_payment_method_endpoint` `delete-payment-method`; `..._set_default_payment_method_endpoint` `set-default-payment-method` | text | as listed |
| Account endpoints | `woocommerce_myaccount_orders_endpoint` `orders`; `_view_order_endpoint` `view-order`; `_downloads_endpoint` `downloads`; `_edit_account_endpoint` `edit-account`; `_edit_address_endpoint` `edit-address`; `_payment_methods_endpoint` `payment-methods`; `_lost_password_endpoint` `lost-password`; `woocommerce_logout_endpoint` `customer-logout` | text | as listed |

### d9. Site visibility / Coming soon (LYS)
Settings tab `site-visibility` (`class-wc-settings-site-visibility.php`) is a React slotfill (`WC/client/admin/client/launch-your-store/settings/slotfill.js`). Options are saved through `LaunchYourStore::save_site_visibility_options`, which accepts only `yes`/`no`.
| Option | UI | Default (install) | Effect |
|---|---|---|---|
| `woocommerce_coming_soon` | Radio **Coming soon** (`yes`): "Your site is hidden from visitors behind a 'Coming soon' landing page until it's ready for viewing." / **Live** (`no`): "Your entire site is visible to everyone." | `yes` (`add_coming_soon_option`) | |
| `woocommerce_store_pages_only` | Checkbox "Apply to store pages only" ("the rest of your site will remain visible") | `yes` at install. On profiler completion `initialize_coming_soon` sets it to `no` if `WCAdminHelper::is_site_fresh()` (WP `fresh_site=1` and the user registered < 1 month ago), else `yes` | |
| `woocommerce_private_link` | Checkbox "Share your site with a private link" with a copy-link box | `no` | Visitors with `?woo-share=<woocommerce_share_key>` bypass; a cookie lasts 90 days |
| `woocommerce_share_key` | — | random 32 chars | |
| `woocommerce_feature_site_visibility_badge_enabled` | Checkbox "Display site visibility badge in admin bar" | `yes` | |

Switching Live → Coming soon asks for confirmation: "Are you sure you want to switch from live to coming soon mode? Your site will not be visible, and customers won't be able to make purchases during this time." (`settings/components/confirmation-modal.jsx`).

Request handling (`WC/src/Internal/ComingSoon/ComingSoonRequestHandler.php::decide_show_coming_soon`): users with `manage_woocommerce` always see the real site. Store-only mode does not apply on 404s. Filter `woocommerce_coming_soon_exclude`. Private-link bypass. Block themes get the `coming-soon` block template; classic themes get `coming-soon/coming-soon-store-only.php` or `coming-soon-entire-site.php`. Admins see a dismissible front-end footer banner ("This page is in 'Coming soon' mode and is only visible to you…"; dismissal is reset on each login) and an admin-bar badge (`ComingSoonAdminBarBadge.php`). Caches are invalidated on option change (`ComingSoonCacheInvalidator.php`).

LYS hub (`path=/launch-your-store`, `WC/client/admin/client/launch-your-store/hub/*`):
- Sidebar: "Ready to start selling? Before you launch your store, make sure you've completed these essential tasks…". It shows incomplete tasks from the `setup` list filtered by the whitelist `['products','customize-store','payments','shipping','tax']` (filter `woocommerce_launch_your_store_tasklist_whitelist`), and keeps recently actioned ones visible. Main pane: live site preview iframe.
- Launch button: `woocommerce_coming_soon='no'`. If WooPayments test orders exist, it offers "Remove %d test orders" (`/wc-admin/launch-your-store/woopayments/test-orders`). Errors show "Oops! … Please try again".
- Success page: "Congratulations! Your store is now live" (or "…will launch soon" plus a server-cache hint) and a survey ("How was the experience of launching your store?"). "What's next" cards: Promote your products, Provide more ways to pay, Build customer relationships (Mailchimp), Power up your store, Manage your store on the go, Help is on hand.

---

## (e) UX patterns worth copying

1. **Wizard as a guided front-end over normal settings.** The profiler and tasks write the same options the settings screens use. Nothing is wizard-only, so re-running or editing in Settings stays consistent. Payload equivalent: wizard steps write to existing Globals/Collections.
2. **Few questions, smart defaults.** One required field (country). Country derives currency, position, separators, decimals, and weight/dimension units from a locale table (`i18n/locale-info.php`). Store name is prefilled from the site title, ignoring known placeholder values.
3. **Branching questions.** Sub-options appear only under the relevant choice (already selling → online? → platforms). Question labels adapt to earlier answers (the industry question wording).
4. **Skip at three levels.** Skip the whole guided setup (still asks the one essential: location). Skip an individual step ("Skip this step" in the nav bar). Auto-skip a step when it has nothing to show (plugins). A skip still records `skipped:true` so redirects stop.
5. **Best-effort persistence that never blocks progress.** Profile/settings writes use `onError → next step`. In the skip flow only the critical flag must succeed, and there is a non-REST fallback if REST is broken. A failure banner offers retry or skip plus a Site Health link.
6. **Resumable progress.** Per-step completion timestamps (`woocommerce_onboarding_profile_progress`). The `?step=` URL is synced and back/forward works. Previous answers are restored on revisit.
7. **Privacy-first defaults.** Geolocation runs only if the user opted in. The marketing email is required only when the marketing box is ticked.
8. **Task list as a checklist on the dashboard.** Each task has a title, content, time estimate ("4 minutes", "1 minute per product"), illustration, CTA label, and an `in progress` badge ("Action needed", "Test account"). The progress header reads "Follow these steps to start selling quickly. %1$d out of %2$d complete.". The adaptive title goes "Welcome to {site}" → "Let's get you started 🚀" (≤3 done) → "You're on the right track" (4-5) → "You're almost there".
9. **Derived completion, not checkboxes.** Each task's `is_complete` inspects real state: products exist, gateway enabled, zones exist, tax rates exist, store is live. Users finish tasks by doing the work anywhere in the admin. Completion is sticky (tracked list) except where it should revert (products deleted).
10. **Contextual deep links with tutorial flags.** Tasks open the real settings page with `&tutorial=true` / `from=…` / `wc_onboarding_active_task=…`, and that page shows a "return to task list" notice when done (`onboarding-tax-notice`, `onboarding-product-import-notice`, `onboarding-load-sample-products-notice`). The active-task transient `wc_onboarding_active_task` tracks where the user came from.
11. **Dismiss / hide / undo.** Optional (extended) tasks are dismissable, with an "Undo" action in a snackbar. The whole list can be hidden ("Hide setup list"), with confirmation for required tasks: "Are you sure? These tasks are required for all stores.". Snooze ("remind me later") existed but is deprecated (7.2). The persistent reminder bar was removed (10.9). Lesson: keep it lightweight.
12. **Two-tier lists.** "Get ready to start selling" (essential, ordered) vs "Things to do next" (growth, sorted incomplete-first). A completion state ("You've completed store setup", "Congratulations! Take a moment to celebrate…") with a 2-question CES survey. The menu badge counts remaining setup tasks next to "Home".
13. **Remaining-tasks count in nav.** `TaskLists::menu_task_count` appends a count bubble to the WooCommerce > Home menu item.
14. **Coming-soon by default + launch ceremony.** New stores are hidden, while admins and private-link holders see the real site. A front-end banner and admin-bar badge remind the admin. "Store pages only" lets an existing site stay up. The final "Launch your store" task is a hub that re-lists blocking tasks, previews the site, cleans up test data, then celebrates and shows contextual next steps.
15. **Sample data and import as first-class options** in the Products task (load 9 sample products, CSV import, product-type templates that create a draft and open a guided editor).
16. **Partner/recommendation slots driven by remote specs with local fallback** (free extensions, payment suggestions), gated by country and A/B segments. The equivalent for a Payload plugin: a pluggable "recommendations" registry.
17. **Opinionated auto-setup with a review task.** WooCommerce auto-creates a default free-shipping zone for the store country, then adds a dismissable "Review shipping options" task instead of asking up front.
18. **Extensibility.** Third parties can register tasks/lists (PHP `Task` subclass and React `WooOnboardingTask` slot-fill per task id), filter LYS whitelists and product types, and mark tax setup complete via a filter.

---

## (f) Source file index (repo-relative)

Core Profiler
- `plugins/woocommerce/client/admin/client/core-profiler/index.tsx`: state machine, persistence actions, skip/fallback, plugin flow, Jetpack redirect
- `.../core-profiler/pages/IntroOptIn.tsx`, `UserProfile.tsx`, `BusinessInfo.tsx`, `BusinessLocation.tsx`, `Plugins/Plugins.tsx`, `Plugins/NoPermissions.tsx`
- `.../core-profiler/components/navigation/navigation.tsx` (default skip text "Skip this step"), `geolocation-country-select/`, `plugin-card/`
- `.../core-profiler/services/installAndActivatePlugins.ts` (30 s timeout), `utils/get-loader-stage-meta.tsx`
- `plugins/woocommerce/src/Admin/API/OnboardingProfile.php`: REST `/wc-admin/onboarding/profile`, progress, currency/units endpoint, schema
- `plugins/woocommerce/src/Internal/Admin/Onboarding/OnboardingProfile.php`, `OnboardingSetupWizard.php`, `OnboardingIndustries.php`, `OnboardingProducts.php`
- `plugins/woocommerce/src/Internal/Admin/RemoteFreeExtensions/DefaultFreeExtensions.php`
- `plugins/woocommerce/i18n/locale-info.php`
- `packages/js/data/src/onboarding/actions.ts` (`coreProfilerCompleted` → `initialize-coming-soon`)

Task lists
- `plugins/woocommerce/src/Admin/Features/OnboardingTasks/TaskLists.php`, `TaskList.php`, `Task.php`
- `plugins/woocommerce/src/Admin/Features/OnboardingTasks/Tasks/*.php` (17 task classes)
- `plugins/woocommerce/src/Admin/API/OnboardingTasks.php`
- `plugins/woocommerce/src/Internal/Admin/Homescreen.php` (default shipping zone)
- `plugins/woocommerce/client/admin/client/task-lists/fills/{products,import-products,tax,shipping,PaymentGatewaySuggestions,Marketing,shipping-recommendation}/*`
- `.../task-lists/progress-title/default-progress-title.tsx`, `components/progress-header/default-progress-header.tsx`, `setup-task-list/components/{dismiss-modal,task-list-item,task-list-completed,task-list-completed-header}.tsx`, `components/task-list-menu.tsx`
- `plugins/woocommerce/client/admin/client/customize-store/index.tsx`

Launch Your Store / Coming soon
- `plugins/woocommerce/src/Admin/Features/LaunchYourStore.php`, `plugins/woocommerce/src/Admin/API/LaunchYourStore.php`
- `plugins/woocommerce/src/Internal/ComingSoon/{ComingSoonHelper,ComingSoonRequestHandler,ComingSoonAdminBarBadge,ComingSoonCacheInvalidator}.php`
- `plugins/woocommerce/includes/class-wc-install.php` (`add_coming_soon_option`, `is_new_install`, default tax classes)
- `plugins/woocommerce/includes/admin/settings/class-wc-settings-site-visibility.php`
- `plugins/woocommerce/client/admin/client/launch-your-store/{settings/slotfill.js,settings/components/confirmation-modal.jsx,hub/**}`

Settings and gateways
- `plugins/woocommerce/includes/admin/settings/class-wc-settings-{general,products,tax,shipping,accounts,emails,advanced}.php`, `views/settings-tax.php`, `views/html-settings-tax.php`
- `plugins/woocommerce/includes/shipping/{flat-rate/includes/settings-flat-rate.php,free-shipping/class-wc-shipping-free-shipping.php,local-pickup/class-wc-shipping-local-pickup.php}`
- `plugins/woocommerce/includes/gateways/{bacs,cheque,cod}/class-wc-gateway-*.php`, `plugins/woocommerce/src/Gateways/ShippingMethodRestrictionsTrait.php`
- `plugins/woocommerce/src/Internal/Admin/Settings/PaymentsProviders.php`
- `plugins/woocommerce/src/Enums/{DefaultCustomerAddress,TaxBasedOn,TaxDisplayMode}.php`, `plugins/woocommerce/src/Internal/Email/EmailColors.php`
- Legacy: `plugins/woocommerce/includes/admin/class-wc-admin-setup-wizard.php` (deprecated 4.6.0)
