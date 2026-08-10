/** Contrato de oro — identidad y relaciones del knowledge graph */

export const REL_TYPES = [
  "FAMILY_OF",
  "OWNS",
  "DIRECTOR_OF",
  "PARTNER_OF",
  "HOLDS_OFFICE",
  "RECEIVED_SUBSIDY",
] as const;

export type RelType = (typeof REL_TYPES)[number];

export const ENTITY_TYPES = ["person", "company", "subsidy", "office"] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export type Person = {
  id: string;
  dni: string | null;
  displayName: string;
  createdAt: string;
};

export type Company = {
  id: string;
  cuit: string | null;
  displayName: string;
  createdAt: string;
};

export type Subsidy = {
  id: string;
  companyId: string;
  amountArs: number;
  currency: "ARS";
  programName: string | null;
  grantedOn: string | null;
  sourceUrl: string | null;
};

export type Relationship = {
  id: string;
  srcType: EntityType;
  srcId: string;
  dstType: EntityType;
  dstId: string;
  relType: RelType;
  props?: Record<string, unknown>;
  validFrom: string | null;
  validTo: string | null;
  sourceUrl: string | null;
  confidence: number | null;
};

export type GraphNode = {
  id: string;
  type: EntityType;
  label: string;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  relType: RelType;
};

export type GraphPayload = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};
