import { Sequelize } from "sequelize";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {

  constructor(private readonly sequelize: Sequelize) {}

  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    const transaction = await this.sequelize.transaction();
    try {
      const orderModel = await OrderModel.findOne({
        where: {
          id: entity.id,
        },
        transaction,
        include: ["items"],
      });

      const existingItems = orderModel.items;
      for (const [index, orderItem] of entity.items.entries()) {
          const item = existingItems[index];
          if (item) {
              await item.update(item);
          } else {
              await OrderItemModel.create({
                  id: orderItem.id,
                  name: orderItem.name,
                  price: orderItem.price,
                  product_id: orderItem.productId,
                  quantity: orderItem.quantity,
                  order_id: entity.id,
              }, { transaction });
          }
      }

      await OrderModel.update(
        {
          total: entity.total(),
        },
        {
          where: {
            id: entity.id,
          },
          transaction,
        }
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    } 
  }

  async find(id: string): Promise<Order> {
    let orderModel;
    try {
      orderModel = await OrderModel.findOne({
        where: {
          id,
        },
        include: ["items"],
        rejectOnEmpty: true,
      });
    } catch (error) {
      throw new Error("Order not found");
    }
    
    const orderItems = orderModel.items.map((item) =>
      new OrderItem(
        item.id,
        item.name,
        item.price,
        item.product_id,
        item.quantity
      )
    );
    const order = new Order(
      orderModel.id,
      orderModel.customer_id,
      orderItems
    );
    return order;
  }

  async findAll(): Promise<Order[]> {
    const orderModels = await OrderModel.findAll({
      include: ["items"],
    });
    return orderModels.map((orderModel) => {
      const orderItems = orderModel.items.map((item) =>
        new OrderItem(
          item.id,
          item.name,
          item.price,
          item.product_id,
          item.quantity
        )
      );
      const order = new Order(
        orderModel.id,
        orderModel.customer_id,
        orderItems
      );
      return order;
    });
  }
}
