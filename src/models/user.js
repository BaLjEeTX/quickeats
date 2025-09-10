import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const addressSchema = Schema({
    lable: String,
    addressLine: String,
    city: String,
    pinCode: String
})

export const userSchema = Schema({
    name: {type: String, required: true},
    email: {required: true, unique: true, type: String},
    passwordHash: {type: String, required: true},
    role: { type: String, enum: ['user','restaurant','admin'], default: 'user' },
    address: [addressSchema]
}, { timestamps: true })

export default model('User',userSchema);