import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const itemSchema = Schema({
    name: String,
    description: String,
    price: Number
})

export const restaurantSchema = Schema({
    name: String,
    description: String,
    imageUrl: String,
    menu: [itemSchema],
    rating: {type: Number, default: 0}
}, { timestamps: true })

export default model('Restaurant',restaurantSchema);