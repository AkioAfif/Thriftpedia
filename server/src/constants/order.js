const ORDER_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

// Allowed next states for each current state. COMPLETED and CANCELLED are terminal.
const ORDER_TRANSITIONS = Object.freeze({
  [ORDER_STATUS.PENDING]: Object.freeze([ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED]),
  [ORDER_STATUS.PROCESSING]: Object.freeze([ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED]),
  [ORDER_STATUS.SHIPPED]: Object.freeze([ORDER_STATUS.COMPLETED]),
  [ORDER_STATUS.COMPLETED]: Object.freeze([]),
  [ORDER_STATUS.CANCELLED]: Object.freeze([]),
});

// Statuses an admin may request via PATCH (PENDING is only ever set by checkout).
const ADMIN_SETTABLE_STATUSES = Object.freeze([
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.CANCELLED,
]);

// An order in one of these statuses still holds the product (single stock).
const ACTIVE_ORDER_STATUSES = Object.freeze([
  ORDER_STATUS.PENDING,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
]);

module.exports = { ORDER_STATUS, ORDER_TRANSITIONS, ADMIN_SETTABLE_STATUSES, ACTIVE_ORDER_STATUSES };
