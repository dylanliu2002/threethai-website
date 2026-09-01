#!/usr/bin/env python3
"""Patch view components: index content Records with contentLocaleOf(locale)."""
import re, pathlib

BASE = pathlib.Path("/home/z/my-project/src/components")
FILES = [
    "sections/home-applications.tsx",
    "sections/home-products.tsx",
    "sections/about-view.tsx",
    "sections/home-manufacturing.tsx",
    "product/product-card.tsx",
    "product/product-view.tsx",
    "forms/inquiry-form.tsx",
    "forms/product-finder.tsx",
    "quality/quality-view.tsx",
    "manufacturing/manufacturing-view.tsx",
    "application/application-view.tsx",
]

for rel in FILES:
    p = BASE / rel
    src = p.read_text()

    # 1. ensure contentLocaleOf is imported from @/content/company
    m = re.search(r'import \{([^}]*)\} from "@/content/company";', src)
    if m:
        names = [n.strip() for n in m.group(1).split(",") if n.strip()]
        if "contentLocaleOf" not in names:
            names.append("contentLocaleOf")
            fns = sorted(n for n in names if not n.startswith("type "))
            tys = [n for n in names if n.startswith("type ")]
            src = src.replace(m.group(0), 'import { ' + ", ".join(fns + tys) + ' } from "@/content/company";')
    else:
        m2 = re.search(r'import type \{ ([^}]*) \} from "@/content/company";', src)
        if m2:
            tys = [t.strip() for t in m2.group(1).split(",")]
            if "Locale" not in tys:
                tys.append("Locale")
            src = src.replace(
                m2.group(0),
                'import { contentLocaleOf, type '
                + ", type ".join(sorted(set(tys)))
                + ' } from "@/content/company";',
            )
        else:
            lines = src.split("\n")
            last_import = max(i for i, l in enumerate(lines) if l.startswith("import "))
            lines.insert(last_import + 1, 'import { contentLocaleOf, type Locale } from "@/content/company";')
            src = "\n".join(lines)

    # 2. replace [locale] indexing with [cl] (all 57 verified content-record indexes)
    src = src.replace("[locale]", "[cl]")

    # 3. insert `const cl = contentLocaleOf(locale);` as first statement of the
    #    first component function whose signature mentions `locale`.
    lines = src.split("\n")
    out = []
    done = False
    for i, line in enumerate(lines):
        out.append(line)
        if done:
            continue
        stripped = line.rstrip()
        if "function" in line and "locale" in line and "=" not in line.split("function")[0]:
            # find body-open brace: same line ends with ") {" or a later ") {"
            if stripped.endswith(") {"):
                out.append("  const cl = contentLocaleOf(locale);")
                done = True
            else:
                j = i + 1
                while j < len(lines):
                    if lines[j].rstrip().endswith(") {"):
                        out.append(lines[j])
                        out.append("  const cl = contentLocaleOf(locale);")
                        done = True
                        i_skip = j
                        break
                    j += 1
                else:
                    continue
                # skip the lines we already consumed
                i = i_skip
    src = "\n".join(out)
    p.write_text(src)
    print("patched", rel, "(cl inserted)" if done else "(cl NOT inserted!)")
