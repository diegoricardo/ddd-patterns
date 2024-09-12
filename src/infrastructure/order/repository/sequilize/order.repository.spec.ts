import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;
  jest.setTimeout(600000000);

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: true,
      sync: { force: true },
    });

    sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    let order : Order = await createOrder("123", "123", "123", "123");

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: order.items[0].id,
          name: order.items[0].name,
          price: order.items[0].price,
          quantity: order.items[0].quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  async function createCustomer(id: string, name: string, street: string, number: number, zip: string, city: string): Promise<Customer> {
    const customerRepository = new CustomerRepository();
    const customer = new Customer(id, name);
    const address = new Address(street, number, zip, city);
    customer.changeAddress(address);
    await customerRepository.create(customer);
    return customer;
  }

  async function createProduct(id: string, name: string, price: number): Promise<Product> {
    const productRepository = new ProductRepository();
    const product = new Product(id, name, price);
    await productRepository.create(product);
    return product;
  }

  function createOrderItem(id: string, product: Product, quantity: number): OrderItem {
    return new OrderItem(id, product.name, product.price, product.id, quantity);
  }
  
  async function createOrder(id: string, customerId: string, productId: string, orderItemId: string): Promise<Order> {
    const customer : Customer = await createCustomer(customerId, "Customer 1", "Street 1", 1, "Zipcode 1", "City 1");
    const product : Product = await createProduct(productId, "Product 1", 10);
    const orderItem : OrderItem = createOrderItem(orderItemId, product, 2);

    const order = new Order(id, customerId, [orderItem]);

    const orderRepository = new OrderRepository(sequelize);
    await orderRepository.create(order);

    return order;
  }

  it("should update a order", async () => {
    const orderRepository = new OrderRepository(sequelize);
    const order : Order = await createOrder("123", "123", "123", "1");
    const product : Product = await createProduct("456", "Product 2", 20);
    const orderItem : OrderItem = createOrderItem("2", product, 3);

    order.addItem(orderItem);

    await orderRepository.update(order);
    
    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: order.items[0].id,
          name: order.items[0].name,
          price: order.items[0].price,
          quantity: order.items[0].quantity,
          order_id: "123",
          product_id: "123",
        },
        {
          id: order.items[1].id,
          name: order.items[1].name,
          price: order.items[1].price,
          quantity: order.items[1].quantity,
          order_id: "123",
          product_id: "456",
        },
      ],
    });
  });

  it("should find a order", async () => {
    const orderRepository = new OrderRepository(sequelize);
    const order : Order = await createOrder("123", "123", "123", "123");

    const orderFound = await orderRepository.find(order.id);

    expect(orderFound).toStrictEqual(order);
  });

  it("should throw an error when order not found", async () => {
    const orderRepository = new OrderRepository(sequelize);

    expect(async () => {
      await orderRepository.find("123");
    }).rejects.toThrow("Order not found");
  });

  it("should find all orders", async () => {
    const orderRepository = new OrderRepository(sequelize);
    const order : Order = await createOrder("1", "1", "1", "1");
    const order2 : Order = await createOrder("2", "2", "2", "2");

    const orders = await orderRepository.findAll();

    expect(orders).toHaveLength(2);
    expect(orders).toContainEqual(order);
    expect(orders).toContainEqual(order2);
  });
});
