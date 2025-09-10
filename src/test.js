const userSchema = await import('./models/user.js');
const restaurantSchema = await import('./models/restaurant.js');
const orderSchema = await import('./models/order.js');

if(!userSchema){
console.log('Not Found');
}
if(!restaurantSchema){
console.log('Not Found');
}
if(!orderSchema){
console.log('Not Found');
}

console.log('Found Every Thing');
