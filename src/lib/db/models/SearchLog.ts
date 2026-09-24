import { model, models, Schema, type Model } from "mongoose";
import { SEARCH_MODES, type SearchMode } from "@/lib/db/enums";

export interface SearchLogDoc {
  query: string;
  areaId: string;
  constraints: unknown; // parsed Constraints object, or null for keyword searches
  resultIds: string[];
  mode: SearchMode;
  provider: string | null;
  latencyMs: number;
  fallbackUsed: boolean;
  createdAt: Date;
}

const searchLogSchema = new Schema<SearchLogDoc>(
  {
    query: { type: String, required: true },
    areaId: { type: String, required: true },
    constraints: { type: Schema.Types.Mixed, default: null },
    resultIds: { type: [String], default: [] },
    mode: { type: String, enum: SEARCH_MODES, required: true },
    provider: { type: String, default: null },
    latencyMs: { type: Number, required: true },
    fallbackUsed: { type: Boolean, default: false },
  },
  { versionKey: false, timestamps: { createdAt: true, updatedAt: false } },
);

searchLogSchema.index({ createdAt: -1 });

export const SearchLog: Model<SearchLogDoc> =
  (models.SearchLog as Model<SearchLogDoc>) ?? model("SearchLog", searchLogSchema);
