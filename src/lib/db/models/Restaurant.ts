import { model, models, Schema, type Model } from "mongoose";

export interface RestaurantDoc {
  _id: string; // e.g. "r01"
  name: string;
  slug: string;
  areaId: string; // Area._id (slug)
  cuisine: string;
  rating: number;
  deliveryTimeMin: number;
  deliveryFee: number;
  isOpen: boolean;
}

const restaurantSchema = new Schema<RestaurantDoc>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    areaId: { type: String, required: true, ref: "Area" },
    cuisine: { type: String, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    deliveryTimeMin: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    isOpen: { type: Boolean, required: true },
  },
  { versionKey: false },
);

restaurantSchema.index({ areaId: 1, isOpen: 1 });

export const Restaurant: Model<RestaurantDoc> =
  (models.Restaurant as Model<RestaurantDoc>) ?? model("Restaurant", restaurantSchema);
