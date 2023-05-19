const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");
function list(req, res) {
  res.json({ data: dishes });
}
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName] || data[propertyName] === 0) {
      return next();
    }
    next({
      status: 400,
      message: `Must include a ${propertyName}`,
    });
  };
}

function validPrice(req, res, next) {
  const { data = {} } = req.body;
  if (typeof data.price === "string" || isNaN(data.price) || data.price <= 0) {
    return next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  }
  return next();
}
function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}
function read(req, res, next) {
  res.json({ data: res.locals.dish });
}
function matchDishIdIfExists(req, res, next) {
  const { data = {} } = req.body;
  if (!data.id || (data.id && res.locals.dish.id === data.id)) {
    next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${data.id}, Route: ${res.locals.dish.id}`,
  });
}
function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}
module.exports = {
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    validPrice,
    create,
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    matchDishIdIfExists,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    validPrice,
    update,
  ],
};
