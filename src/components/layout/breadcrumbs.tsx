import Link from "next/link";
import type { Locale } from "@/content/company";
import { serverLabels } from "@/content/site-copy";

export type Crumb = { name: string; path: string };

export default function Breadcrumbs({ trail, locale }: { trail: Crumb[]; locale?: Locale }) {
  return (
    <nav aria-label={serverLabels[locale ?? "en"].breadcrumbNav} className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {trail.map((crumb, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-2">
              {index > 0 && (
                <span aria-hidden="true" className="text-border">
                  /
                </span>
              )}
              {last ? (
                <span aria-current="page" className="font-medium text-foreground">
                  {crumb.name}
                </span>
              ) : (
                <Link href={crumb.path} className="transition-colors hover:text-primary">
                  {crumb.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
