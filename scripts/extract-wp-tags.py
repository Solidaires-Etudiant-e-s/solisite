import os
import re
import json
import sys
import subprocess

WP_SQL = sys.argv[1] if len(sys.argv) > 1 else "/home/eban/Downloads/wordpress.sql"
DRY_RUN = "--dry-run" in sys.argv

DB_PASSWORD = os.environ.get("DB_PASSWORD", "")


def mysql(*args, input=None, capture_output=True):
    cmd = ["mysql", "-h", "127.0.0.1", "-P", "3306", "-u", "root",
           f"-p{DB_PASSWORD}" if DB_PASSWORD else "-p", "devsolisite"]
    cmd.extend(args)
    return subprocess.run(cmd, input=input, capture_output=capture_output, text=True)

print(f"Reading {WP_SQL}...")
with open(WP_SQL, "r", encoding="utf-8") as f:
    content = f.read()

def q(s):
    return "'" + s.replace("'", "''") + "'"

# Step 1: Get post_tag taxonomies
taxonomy_map = {}
for m in re.finditer(r"\((\d+),\s*(\d+),\s*'post_tag'", content):
    tt_id, term_id = m.group(1), m.group(2)
    taxonomy_map[tt_id] = term_id
print(f"Step 1: Found {len(taxonomy_map)} post_tag taxonomies")

# Step 2: Get term slugs and names (only from wp_terms INSERT block)
term_slugs = {}
term_names = {}
wp_terms_insert = re.search(
    r"INSERT INTO `wp_terms` \(`term_id`.*?VALUES\s*\n(.*?);",
    content, re.DOTALL
)
if wp_terms_insert:
    rows_text = wp_terms_insert.group(1)
    for m in re.finditer(r"\((\d+),\s*'((?:[^'\\]|'')*)',\s*'([^']*)',\s*\d+\)", rows_text):
        tid, name, slug = m.group(1), m.group(2), m.group(3)
        term_slugs[tid] = slug
        term_names[tid] = name
print(f"Step 2: Found {len(term_slugs)} terms")

# Step 3: Build tag slug -> name mapping for post_tag terms
tag_slugs = {}
for tt_id, term_id in taxonomy_map.items():
    slug = term_slugs.get(str(term_id))
    name = term_names.get(str(term_id))
    if slug and name:
        tag_slugs[slug] = name
print(f"Step 3: Found {len(tag_slugs)} post_tag terms")

# Step 4: Parse wp_term_relationships to get post_id -> [term_taxonomy_ids]
tt_ids_set = set(taxonomy_map.keys())
rel_map = {}
for m in re.finditer(r"\((\d+),\s*(\d+),\s*\d+\)", content):
    post_id, tt_id = m.group(1), m.group(2)
    if tt_id in tt_ids_set:
        if post_id not in rel_map:
            rel_map[post_id] = []
        rel_map[post_id].append(tt_id)
print(f"Step 4: Found relationships for {len(rel_map)} posts")

# Step 5: Parse wp_posts to get post_name -> post_id for post_type='post'
wp_posts_start = content.find("INSERT INTO `wp_posts`")
if wp_posts_start == -1:
    print("ERROR: Could not find wp_posts INSERT")
    sys.exit(1)

end_marker = "\n-- "
wp_posts_end = content.find(end_marker, wp_posts_start)
if wp_posts_end == -1:
    wp_posts_end = len(content)
wp_posts_data = content[wp_posts_start:wp_posts_end]
print(f"Step 5: wp_posts data region: {len(wp_posts_data)} chars")

post_name_to_id = {}
for line in wp_posts_data.split("\n"):
    line = line.strip()
    if not line.startswith("("):
        continue

    row = line.rstrip(",").rstrip(";")
    if not row.startswith("(") or not row.endswith(")"):
        continue

    inner = row[1:-1]
    fields = []
    fbuf = ""
    finstr = False
    fesc = False
    for ch in inner:
        if fesc:
            fbuf += ch
            fesc = False
            continue
        if ch == "\\":
            fesc = True
            fbuf += ch
            continue
        if ch == "'":
            finstr = not finstr
            fbuf += ch
            continue
        if ch == "," and not finstr:
            fields.append(fbuf.strip())
            fbuf = ""
            continue
        fbuf += ch
    fields.append(fbuf.strip())

    if len(fields) < 22:
        continue

    post_id = fields[0].strip().strip("'")
    post_name = fields[11].strip().strip("'")
    post_type = fields[20].strip().strip("'")

    if post_type == "post" and post_name and post_id:
        post_name_to_id[post_name] = post_id

print(f"Step 5b: Found {len(post_name_to_id)} posts with post_type='post'")

# Step 6: Get CMS article slugs
result = mysql("-N", "-e", "SELECT slug FROM articles;")
cms_slugs = set()
if result.returncode == 0 and result.stdout.strip():
    cms_slugs = set(l.strip() for l in result.stdout.strip().split("\n") if l.strip())
print(f"Step 6: Found {len(cms_slugs)} CMS article slugs")

# Step 7: Match and tag
matched = {}
for wp_slug, wp_post_id in post_name_to_id.items():
    if wp_slug not in cms_slugs:
        continue
    tt_ids = rel_map.get(wp_post_id, [])
    matched_tags = []
    for tt_id in tt_ids:
        term_id = taxonomy_map.get(tt_id)
        slug = term_slugs.get(str(term_id)) if term_id else None
        if slug and slug in tag_slugs:
            matched_tags.append({"name": tag_slugs[slug], "slug": slug})
    if matched_tags:
        matched[wp_slug] = matched_tags

print(f"Step 7: {len(matched)} CMS articles matched with tags")

if DRY_RUN:
    count = 0
    for slug, tags in sorted(matched.items()):
        tag_names = [t["name"] for t in tags]
        print(f"  {slug} -> {', '.join(tag_names[:5])}{'...' if len(tag_names) > 5 else ''}")
        count += 1
        if count >= 20:
            break
    print(f"\nTotal matched: {len(matched)} articles with tags")
else:
    for slug, tags in matched.items():
        # Delete existing article_tags for this article
        mysql("-e", f"DELETE FROM article_tags WHERE article_id = (SELECT id FROM articles WHERE slug = {q(slug)});")

        for tag in tags:
            tag_name_escaped = tag["name"].replace("'", "''")
            # Ensure tag exists
            mysql("-e", f"INSERT IGNORE INTO tags (name, slug) VALUES ({q(tag_name_escaped)}, {q(tag['slug'])});")

            # Get tag id
            r = mysql("-N", "-e", f"SELECT id FROM tags WHERE slug = {q(tag['slug'])};")
            tag_id = r.stdout.strip()
            if tag_id:
                mysql("-e", f"INSERT IGNORE INTO article_tags (article_id, tag_id) SELECT id, {tag_id} FROM articles WHERE slug = {q(slug)};")

    print(f"Done. Tagged {len(matched)} articles.")
