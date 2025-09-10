import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const orderItemSchema = Schema({
    itemId: mongoose.Types.ObjectId,
    name: String,
    price: Number,
    qty: Number
})

export const orderSchema = Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    restrauntId: {type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant'},
    items: [orderItemSchema],
    total: Number,
    status: {type: String, default: 'placed'},
}, { timestamps: true})

export default model('Order', orderSchema);