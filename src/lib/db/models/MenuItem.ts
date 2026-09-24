import { model, models, Schema, type Model } from "mongoose";
import {
  CALORIES_SOURCES,
  COOKING_METHODS,
  type CaloriesSource,
  type CookingMethod,
} from "@/lib/db/enums";

export interface MenuItemDoc {
  _id: string; // e.g. "m0001"
  restaurantId: string;
  name: string;
  description: string;
  category: string;
  price: number; // PKR, integer
  ingredients: string[];
  cookingMethod: CookingMethod;
  calories: number;
  caloriesSource: CaloriesSource;
  proteinGrams: number | null;
  servesPeople: number;
  dietaryTags: string[];
  isAvailable: boolean;
}

const menuItemSchema = new Schema<MenuItemDoc>(
  {
    _id: { type: String, required: true },
    restaurantId: { type: String, required: true, ref: "Restaurant" },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    ingredients: { type: [String], default: [] },
    cookingMethod: { type: String, enum: COOKING_METHODS, required: true },
    calories: { type: Number, required: true, min: 0 },
    caloriesSource: { type: String, enum: CALORIES_SOURCES, required: true },
    proteinGrams: { type: Number, default: null },
    servesPeople: { type: Number, required: true, min: 1 },
    dietaryTags: { type: [String], default: [] },
    isAvailable: { type: Boolean, required: true },
  },
  { versionKey: false },
);

menuItemSchema.index({ restaurantId: 1, category: 1 });
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ price: 1 });
menuItemSchema.index({ calories: 1 });

export const MenuItem: Model<MenuItemDoc> =
  (models.MenuItem as Model<MenuItemDoc>) ?? model("MenuItem", menuItemSchema);
