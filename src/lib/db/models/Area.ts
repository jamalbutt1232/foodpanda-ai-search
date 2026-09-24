import { model, models, Schema, type Model } from "mongoose";

/** _id is the area slug, e.g. "gulberg". */
export interface AreaDoc {
  _id: string;
  name: string;
  slug: string;
  city: string;
}

const areaSchema = new Schema<AreaDoc>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    city: { type: String, required: true },
  },
  { versionKey: false },
);

export const Area: Model<AreaDoc> = (models.Area as Model<AreaDoc>) ?? model("Area", areaSchema);
