import { CartItems } from '../../models/productModel/cartModel.js';
import { PaymentAttempt } from '../../models/productModel/paymentAttemptModel.js';
import { Order } from '../../models/productModel/orderModel.js';
import { User } from '../../models/authModel/userModel.js';

// GET /api/products/:sellProductId/purchase-attempts
const getPurchaseAttemptsForSellingProduct = async (req, res) => {
  try {
    const { sellProductId } = req.params;

    // 1. Find all carts containing this selling product
    const carts = await CartItems.find({ sellingProductId: sellProductId });
    const cartIds = carts.map(cart => cart._id);

    // 2. Find all payment attempts for these carts, populate buyer details
    let paymentAttempts = [];
    if (cartIds.length > 0) {
      paymentAttempts = await PaymentAttempt.find({ cartId: { $in: cartIds } })
        .populate('buyerId', 'fullName email avatar');
    }

    // 3. Find all orders for this selling product, populate buyer details
    const orders = await Order.find({ sellProductId })
      .populate('userId', 'fullName email avatar');

    res.json({
      attempts: paymentAttempts,
      orders: orders,
      numberOfAttempts: paymentAttempts.length,
      numberOfOrders: orders.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 

export { getPurchaseAttemptsForSellingProduct };