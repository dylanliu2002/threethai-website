import { ROLES } from "./constants.mjs";

const responsibilities = {
  ORCHESTRATOR: "authorization, scope, dependencies, shared files and integration gates",
  TECHNICAL_SEO: "crawl, index, metadata, canonical, hreflang and schema",
  SEO_CONTENT: "keyword intent, content gaps and internal-link planning",
  GEO_AI_SEARCH: "answer extractability, evidence and entity consistency",
  CRO: "journeys, conversion hierarchy, forms and measurement planning",
  BRAND_UX: "positioning, information architecture and experience consistency",
  QA_PERFORMANCE: "independent quality, regression, accessibility and performance review",
  BACKLINK: "authority research, opportunities and outreach governance",
};

export const ROLE_REGISTRY = Object.freeze(
  Object.fromEntries(ROLES.map((id) => [id, Object.freeze({
    id,
    responsibility: responsibilities[id],
  })])),
);

export function getRole(roleId) {
  const role = ROLE_REGISTRY[roleId];
  if (!role) throw new Error(`Unknown role: ${roleId}`);
  return role;
}

export function assertIndependentRoles(ownerRole, reviewerRole) {
  getRole(ownerRole);
  getRole(reviewerRole);
  if (ownerRole === reviewerRole) {
    throw new Error("Independent reviewer role must differ from owner role.");
  }
  return true;
}
