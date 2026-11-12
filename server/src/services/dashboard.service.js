const Product = require('../models/Product');
const Order = require('../models/Order');
const { PRODUCT_STATUS } = require('../constants/product');
const { ORDER_STATUS } = require('../constants/order');

async function getSummary() {
  const [available, sold, pending, completed, cancelled] = await Promise.all([
    Product.countDocuments({ status: PRODUCT_STATUS.AVAILABLE }),
    Product.countDocuments({ status: PRODUCT_STATUS.SOLD }),
    Order.countDocuments({ status: ORDER_STATUS.PENDING }),
    Order.countDocuments({ status: ORDER_STATUS.COMPLETED }),
    Order.countDocuments({ status: ORDER_STATUS.CANCELLED }),
  ]);

  return {
    products: { total: available + sold, available, sold },
    orders: { pending, completed, cancelled },
  };
}

module.exports = { getSummary };