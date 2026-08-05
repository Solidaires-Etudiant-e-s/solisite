import os
import subprocess
import sys

DB_HOST = os.environ.get("DB_HOST", "127.0.0.1")
DB_PORT = os.environ.get("DB_PORT", "3306")
DB_USER = os.environ.get("DB_USER", "root")
DB_NAME = os.environ.get("DB_NAME", "devsolisite")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
DB = ["mysql", "-h", DB_HOST, "-P", DB_PORT, "-u", DB_USER,
      f"-p{DB_PASSWORD}" if DB_PASSWORD else "-p", DB_NAME]

def db_query(sql, fetch=True):
    args = DB + ["-N", "-e", sql]
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"DB ERROR: {r.stderr.strip()}", file=sys.stderr)
        return []
    if fetch and r.stdout.strip():
        return [l.strip() for l in r.stdout.strip().split("\n") if l.strip()]
    return []

def db_exec(sql):
    args = DB + ["-e", sql]
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"DB ERROR: {r.stderr.strip()}", file=sys.stderr)
    return r.returncode == 0

def q(s):
    return "'" + s.replace("'", "''") + "'"

# ── The 10 target categories ──
# name -> (slug, icon)
TARGETS = {
    "Communiqués":              ("communiques",              "mingcute:announcement-line"),
    "Enseignement supérieur":   ("enseignement-superieur",   "mingcute:school-line"),
    "Mobilisation":             ("mobilisation",             "mingcute:flag-2-line"),
    "Précarité":                ("precarite",                "mingcute:wallet-3-line"),
    "Antiracisme":              ("antiracisme",              "lucide:hand-fist"),
    "Antifascisme":             ("antifascisme",             "mingcute:safe-shield-2-line"),
    "International":            ("international",            "mingcute:globe-line"),
    "Répression":               ("repression",               "mingcute:fingerprint-2-line"),
    "Syndicalisme":             ("syndicalisme",             "mingcute:group-2-line"),
    "Droits":                   ("droits",                   "mingcute:scale-line"),
}

# ── Map: old tag name (lowercase) -> target category name ──
# Tags NOT listed here will be DELETED (no category assigned)
TAG_MAP = {}

def add(tags, cat):
    for t in tags:
        TAG_MAP[t.lower()] = cat

# ── 1. Communiqués ──
add(["communiqués", "communique", "communiqués nationaux", "tracts"], "Communiqués")

# ── 2. Enseignement supérieur ──
add([
    "enseignement supérieur", "esr", "université", "universités", "crous",
    "plan étudiant", "fioraso", "lppr", "licence", "master", "parcoursup",
    "cneser", "recherche", "formation", "fioraso",
    "enseignement supérieur et recherche", "cnous",
    "loi vidal", "plan vidal", "vidal", "ens",
    "licence", "master", "bac", "admission post bac", "dut", "m1",
    "apb", "ore", "loi ore",
    "doctorant", "doctorant-es", "doctorat", "études doctorales",
    "étudiant", "étudiants", "étudiante", "étudiantes",
    "étudiant-e", "étudiant·e·s", "étudiant.e.s étranger.e.s",
    "étudiants étrangers", "étrangers", "étrangers",
    "lycée", "lycéen", "lycéenne", "lycéen-ne-s",
    "école", "stage", "stages",
    "examen", "partiel", "inscription",
    "processus de bologne", "mcc", "validation",
    "continuité pédagogique", "confinement",
    "crous", "résidences universitaires",
    "budget", "budgets", "financement", "financement de l'esr",
    "gratuité", "augmentation", "hausse",
    "académie", "rentrée", "comue",
    "alternance", "fermeture", "coronavirus", "covid-19",
    "état d'urgence",
], "Enseignement supérieur")

# ── 3. Mobilisation ──
add([
    "grève", "mobilisation", "manifestation", "blocage", "lutte",
    "mobilisation étudiante", "mobilisations",
    "loi travail", "loi el khomri", "el-khomri",
    "loi trav", "facs loi travail",
    "grève générale", "grève étudiante", "grève interprofessionnelle",
    "grève loi travail", "grève de la faim", "grève 1er mai",
    "grèves", "luttes", "luttes grève", "direct lutte",
    "interpro", "intersyndicale",
    "manifestations", "manifester",
    "blocages", "occupations",
    "macron", "gouvernement", "49.3",
    "assemblée nationale", "assemblée", "parlement",
    "projet de loi", "décret", "decret",
    "amendement", "réforme",
    "service public", "privatisation", "marchandisation",
    "autogestion", "auto-organisation",
    "anticapitalisme", "austérité",
    "exploitation", "salaire social", "salariat étudiant", "salariat contraint",
    "rapport de force", "mouvement social", "mouvement étudiant",
    "testet", "vinci",
    "retraites",
    "facs en luttes", "fac en lutte",
    "augmentation",
], "Mobilisation")

# ── 4. Précarité ──
add([
    "précarité", "précarité étudiante", "précarisation",
    "bourses", "augmentation des bourses",
    "logement", "logement étudiant",
    "mutuelle", "mutuelles", "mutuelles étudiantes",
    "santé", "santé étudiante", "santé publique",
    "sécurité sociale",
    "complémentaire", "complémentaires santé", "complémentaires",
    "lmde",
    "droits sociaux", "aides sociales", "aides",
    "conditions de vie",
    "loyer", "loyers", "gel des loyers",
    "expulsion", "locataire",
    "handicap",
    "pauvreté",
    "cotisations sociales",
    "régime général",
    "trêve hivernale",
    "assurance maladie",
    "restauration",
    "cagnotte",
    "compensation",
    "social",
    "LaPrécaritéTue",
    "alimentation",
], "Précarité")

# ── 5. Antiracisme ──
add([
    "antiracisme", "racisme", "islamophobie",
    "voile", "port du voile", "interdiction du voile",
    "laïcité", "laicité",
    "sans papiers",
    "frontières", "immigration",
    "discrimination", "discriminations",
    "sexisme", "féminisme", "feminisme",
    "femmes", "8 mars",
    "apartheid", "israël", "israel",
    "israeli apartheid week",
    "loi immigration", "loi égalité et citoyenneté",
    "déchéance de nationalité", "déchéance de nationalité",
    "oqtf", "régularisation",
    "xénophobie",
    "quartiers populaires",
    "nationalisme",
    "citoyenneté",
    "égalité",
    "antisémitisme",
    "inégalités sociales",
], "Antiracisme")

# ── 6. Antifascisme ──
add([
    "antifascisme", "fascisme", "fascistes", "fachos",
    "extrême droite", "fn",
    "antifascisme",
], "Antifascisme")

# ── 7. International ──
add([
    "international", "solidarité", "solidarité internationale",
    "solidarité international",
    "palestine", "gaza",
    "kurde", "kurdes", "kurdistan", "kurdistan de l'ouest",
    "rojava", "syrie", "kobane", "djezireh",
    "turquie", "ypg", "ypj", "pyd", "pkk",
    "confédéralisme démocratique", "autonomie démocratique",
    "daesh",
    "venezuela", "mexique",
    "apartheid",
    "boycott",
    "paix", "guerre",
    "ue", "europe",
    "internationale",
    "des livres pour rojava",
    "solidarité internationale",
], "International")

# ── 8. Répression ──
add([
    "répression", "repression",
    "violences policières", "violence", "violences",
    "état policier", "police",
    "sécuritaire", "lois sécuritaires",
    "harcèlement",
    "censure",
    "criminalisation",
    "arrestation",
    "garde à vue",
    "agression",
    "prison",
    "procès",
    "grenade",
    "télésurveillance",
    "contrôle d'identité",
], "Répression")

# ── 9. Syndicalisme ──
add([
    "syndicalisme", "syndicalisme étudiant",
    "syndicat", "syndicats",
    "solidaires", "solidaires étudiant-e-s",
    "union syndicale solidaires",
    "sud education", "sud solidaires",
    "cgt",
    "intersyndical",
    "assemblée générale", "ag",
    "coordination", "coordination nationale", "coordination nationale étudiante",
    "action syndicale",
    "unitaire",
    "libertés syndicales",
], "Syndicalisme")

# ── 10. Droits ──
add([
    "droits", "droits étudiants",
    "lgbti", "transphobie",
    "qpc", "conseil constitutionnel",
    "avortement",
    "démocratie",
    "droit", "droit de manifester",
    "illégalité",
], "Droits")

# ── Also map some related tags that overlap categories ──
add(["charlie hebdo"], "Antiracisme")
add(["cop21", "cop 21"], "Communiqués")  # specific events = communiqués
add(["sivens", "rémi fraisse"], "Communiqués")
add(["clement", "clement meric"], "Communiqués")
add(["manuel valls"], "Mobilisation")
add(["najat vallaud-belkacem"], "Enseignement supérieur")
add(["climat", "écologie"], "Enseignement supérieur")
add(["jeunes", "jeunesse"], "Enseignement supérieur")
add(["unef"], "Syndicalisme")
add(["fage"], "Syndicalisme")
add(["hdp"], "Répression")
add(["dbp"], "Répression")
add(["ppp"], "Mobilisation")
add(["lpr"], "Répression")

print("=== Tag merge script ===")
print(f"Target categories: {len(TARGETS)}")
print(f"Tag mappings defined: {len(TAG_MAP)}")

# ── Step 1: Get all existing tags ──
rows = db_query("SELECT id, name, slug FROM tags;")
print(f"\nExisting tags in DB: {len(rows)}")

tag_by_id = {}
tag_by_name_lower = {}
for r in rows:
    parts = r.split("\t")
    if len(parts) >= 3:
        tid, name, slug = parts[0], parts[1], parts[2]
        tag_by_id[tid] = (name, slug)
        tag_by_name_lower[name.lower()] = tid

# ── Step 2: Create target tags if they don't exist ──
target_ids = {}
for cat_name, (cat_slug, cat_icon) in TARGETS.items():
    existing = tag_by_name_lower.get(cat_name.lower())
    if existing:
        target_ids[cat_name] = existing
        old_name, old_slug = tag_by_id.get(existing, ("", ""))
        if old_name != cat_name:
            db_exec(f"UPDATE tags SET name={q(cat_name)} WHERE id={existing};")
            print(f"  Target '{cat_name}' normalized name (id={existing})")
        if old_slug != cat_slug:
            db_exec(f"UPDATE tags SET slug={q(cat_slug)} WHERE id={existing};")
            print(f"  Target '{cat_name}' normalized slug {old_slug} -> {cat_slug} (id={existing})")
        db_exec(f"UPDATE tags SET icon={q(cat_icon)} WHERE id={existing};")
        print(f"  Target '{cat_name}' already exists (id={existing})")
    else:
        db_exec(f"INSERT INTO tags (name, slug, icon) VALUES ({q(cat_name)}, {q(cat_slug)}, {q(cat_icon)});")
        rows2 = db_query(f"SELECT id FROM tags WHERE slug = {q(cat_slug)};")
        if rows2:
            target_ids[cat_name] = rows2[0]
            print(f"  Created target '{cat_name}' (id={rows2[0]})")
        else:
            print(f"  FAILED to create target '{cat_name}'")

print(f"\nTarget tag IDs: {target_ids}")

# ── Step 3: For each article, determine new tags ──
article_rows = db_query("SELECT id, slug FROM articles;")
print(f"\nArticles: {len(article_rows)}")

articles = {}
for r in article_rows:
    parts = r.split("\t")
    if len(parts) >= 2:
        articles[parts[0]] = parts[1]

# Get all current article_tags
at_rows = db_query("SELECT article_id, tag_id FROM article_tags;")
print(f"Current article_tag links: {len(at_rows)}")

# Build article -> set of tag_ids
article_tags = {}
for r in at_rows:
    parts = r.split("\t")
    if len(parts) >= 2:
        aid, tid = parts[0], parts[1]
        if aid not in article_tags:
            article_tags[aid] = set()
        article_tags[aid].add(tid)

# Map each article's old tags to new target categories
changes = {}  # article_id -> set of target tag_ids to add
for aid, old_tag_ids in article_tags.items():
    new_cats = set()
    for tid in old_tag_ids:
        tname = tag_by_id.get(tid, ("", ""))[0].lower()
        cat = TAG_MAP.get(tname)
        if cat and cat in target_ids:
            new_cats.add(target_ids[cat])
    changes[aid] = new_cats

# ── Step 4: Delete ALL existing article_tags ──
print("\nClearing all article_tags...")
db_exec("DELETE FROM article_tags;")

# ── Step 5: Insert new article_tags ──
inserted = 0
for aid, target_tag_ids in changes.items():
    for tid in target_tag_ids:
        db_exec(f"INSERT IGNORE INTO article_tags (article_id, tag_id) VALUES ({aid}, {tid});")
        inserted += 1

print(f"Inserted {inserted} article_tag links")

# ── Step 6: Delete all non-target tags ──
target_id_set = set(target_ids.values())
delete_ids = [tid for tid in tag_by_id if tid not in target_id_set]

print(f"\nDeleting {len(delete_ids)} old tags...")
for tid in delete_ids:
    db_exec(f"DELETE FROM article_tags WHERE tag_id = {tid};")
    db_exec(f"DELETE FROM tags WHERE id = {tid};")

# ── Step 7: Verify ──
print("\n=== Final state ===")
final_tags = db_query("SELECT t.name, t.slug, COUNT(at.article_id) as count FROM tags t LEFT JOIN article_tags at ON t.id = at.tag_id GROUP BY t.id ORDER BY count DESC;")
for line in final_tags:
    parts = line.split("\t")
    name, slug, count = parts[0], parts[1], parts[2] if len(parts) >= 3 else "0"
    print(f"  {name:30s} ({slug:30s}) -> {count} articles")

total_links = db_query("SELECT COUNT(*) FROM article_tags;")
print(f"\nTotal article_tag links: {total_links[0] if total_links else 0}")
total_tags = db_query("SELECT COUNT(*) FROM tags;")
print(f"Total tags: {total_tags[0] if total_tags else 0}")
