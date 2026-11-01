# Proposed country-directory crawler

Status: requirements only. No crawler or hosted refresh endpoint is included in this Site import.

## Intended flow

1. The user selects study countries, subjects, subject roles, degree level and intake year, then requests a refresh.
2. A server-side job obtains institution homepages from an attributable university directory, recording its coverage and refresh time.
3. It discovers programme and admissions pages through official websites, sitemaps and links, within bounded per-domain crawl budgets.
4. It retains matching candidate pages and their source passages, separating discoveries from confirmed offerings and verified combinations.
5. Results appear inside the Site with source links, crawl times, failures and uncertainty. Previously collected results remain available when refresh fails.

## Evidence requirements

- A subject appearing somewhere on a university website is not proof that the institution offers the requested degree or subject role.
- Do not combine separate catalogues to assert a major/minor combination. Confirmation requires evidence of the complete permissible combination.
- Distinguish study country, awarding country, branch campus and teaching partner. Home-campus availability does not prove branch-campus availability.
- A directory may omit branch campuses and partner-delivered degrees. Show that gap and allow reviewed directory additions.
- Preserve published intake, applicant category and raw date wording. Do not infer a 2027 deadline from an earlier year.
- Keep candidate, source-confirmed, changed, blocked and review-needed states separate. An empty or interrupted crawl is not proof of no programmes.

## Operation

- Use a hosted backend or a separately run collector; browser-only static hosting cannot reliably crawl arbitrary university sites because of cross-origin restrictions.
- Respect site access rules and robots directives, use an identifiable user agent, rate limits, timeouts, bounded response sizes and cache lifetimes.
- Validate and restrict outbound targets, recheck redirects and block private-network destinations. Avoid exposing an arbitrary URL proxy.
- Track job progress, cancel/retry states and partial failures. Test redirects, blocked sites, duplicate pages, directory omissions and changed evidence.
- No paid search API is proposed. Hosting and crawl capacity still have platform limits; there is no promise of unlimited free crawling.

## Reuse to assess before implementation

The root tracker already has local discovery and deadline collection tools under `scripts/`, described in `docs/DISCOVERY.md`. Assess those tools first rather than creating a second incompatible data pipeline. They currently run separately from this Site.

ChatGPT research can add institutions and evidence that the bounded crawler misses. Such researched updates must retain provenance rather than being labelled as crawler results.

This project-specific plan does not require a new reusable ChatGPT skill at this stage.
