const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");
function list(req, res) {
  res.json({ data: orders });
}
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName] || data[propertyName] === 0) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include a ${propertyName}`,
    });
  };
}
function dishesHasQuantity(req, res, next) {
  const { data = {} } = req.body;
  let index = 0;
  for (const dish of data.dishes) {
    if (
      !dish.quantity ||
      typeof dish.quantity === "string" ||
      isNaN(dish.quantity) ||
      dish.quantity <= 0
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
    index++;
  }
  return next();
}
function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}.`,
  });
}
function read(req, res, next) {
  res.json({ data: res.locals.order });
}
function checkStatus(req, res, next) {
  const { data = {} } = req.body;
  if (!data.status) {
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  } else if (data.status === "delivered") {
    return next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  } else if (
    !["pending", "preparing", "out-for-delivery"].includes(data.status)
  ) {
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  }
  return next();
}
function matchId(req, res, next) {
  const { data = {} } = req.body;
  if (data.id) {
    const orderId = res.locals.order.id;
    const id = data.id;
    if (orderId !== id) {
      return next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
      });
    }
  }
  return next();
}
function update(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}
function checkDeleteStatus(req, res, next) {
  const order = res.locals.order;
  if (order.status !== "pending") {
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending. Returns a 400 status code`,
    });
  }
  return next();
}
function checkDishes(req, res, next) {
  const { data = {} } = req.body;
  if (!Array.isArray(data.dishes) || data.dishes.length <= 0) {
    return next({
      status: 400,
      message: `dish`,
    });
  }
  return next();
}
function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  // `splice()` returns an array of the deleted elements, even if it is one element
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}
module.exports = {
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    checkDishes,
    dishesHasQuantity,
    create,
  ],
  list,
  read: [orderExists, read],
  update: [
    orderExists,
    matchId,
    checkStatus,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("status"),
    bodyDataHas("dishes"),
    checkDishes,
    dishesHasQuantity,
    update,
  ],
  delete: [orderExists, checkDeleteStatus, destroy],
};
