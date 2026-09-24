import { model, models, Schema, type Model } from "mongoose";

export interface DealLine {
  menuItemId: string;
  quantity: number;
}

export interface DealDoc {
  _id: string; // e.g. "d001"
  restaurantId: string;
  name: string;
  description: string;
  price: number; // PKR, integer
  servesPeople: number;
  isAvailable: boolean;
  /** Replaces the relational DealItem table: lines are embedded in the deal. */
  items: DealLine[];
}

const dealLineSchema = new Schema<DealLine>(
  {
    menuItemId: { type: String, required: true, ref: "MenuItem" },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const dealSchema = new Schema<DealDoc>(
  {
    _id: { type: String, required: true },
    restaurantId: { type: String, required: true, ref: "Restaurant" },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    servesPeople: { type: Number, required: true, min: 1 },
    isAvailable: { type: Boolean, required: true },
    items: { type: [dealLineSchema], default: [] },
  },
  { versionKey: false },
);

dealSchema.index({ restaurantId: 1 });

export const Deal: Model<DealDoc> = (models.Deal as Model<DealDoc>) ?? model("Deal", dealSchema);
