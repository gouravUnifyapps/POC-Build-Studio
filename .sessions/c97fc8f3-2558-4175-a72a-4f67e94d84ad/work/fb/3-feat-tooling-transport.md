Feature: publish_code_app (or get_code_app) answers the published app's address, the URL people open, next to `deployed`.
Evidence: Plan task t7 asked to quote the published address. publish_code_app on app-79ea7266eab9 answered version v2, commitHash and routes but no URL, and get_code_app and list_code_app_versions answer none either.
Benefit: Every code-publish task and the router's hand-over to the person need the live link; today it cannot be read back.
Scope: code-builder MCP publish_code_app / get_code_app replies; not changing how publishing works.
Acceptance: After a publish, the reply carries the published URL and a signed-in load of it serves the deployed commit.