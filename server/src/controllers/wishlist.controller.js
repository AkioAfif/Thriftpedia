const wishlistService = require('../services/wishlist.service');

async function add(req, res) {
  const wishlist = await wishlistService.addToWishlist({
    buyerId: req.user.id,
    productId: req.body.productId,
  });

  res.status(201).json({ message: 'Product added to wishlist', data: wishlist });
}

async function list(req, res) {
  const wishlist = await wishlistService.getBuyerWishlist(req.user.id);
  res.status(200).json({ message: 'Wishlist retrieved', data: wishlist });
}

async function remove(req, res) {
  await wishlistService.removeFromWishlist({
    buyerId: req.user.id,
    productId: req.params.productId,
  });

  res.status(200).json({ message: 'Product removed from wishlist' });
}

module.exports = { add, list, remove };
