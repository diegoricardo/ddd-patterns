import SendEmailWhenProductIsCreatedHandler from "../../product/event/handler/send-email-when-product-is-created.handler";
import ProductCreatedEvent from "../../product/event/product-created.event";
import CustomerCreatedEvent from "../../customer/event/customer-created.event";
import CustomerChangedAddressEvent from "../../customer/event/customer-changed-address.event";
import EnviaConsoleLogHandler from "../../customer/event/handler/envia-console-log.handler";
import EnviaConsoleLog1Handler from "../../customer/event/handler/envia-console-log1.handler";
import EnviaConsoleLog2Handler from "../../customer/event/handler/envia-console-log2.handler";
import EventDispatcher from "./event-dispatcher";
import Address from "../../customer/value-object/address";

describe("Domain events tests", () => {
  it("should register an event handler", () => {
    const eventDispatcher = new EventDispatcher();
    const eventHandler = new SendEmailWhenProductIsCreatedHandler();

    eventDispatcher.register("ProductCreatedEvent", eventHandler);

    expect(
      eventDispatcher.getEventHandlers["ProductCreatedEvent"]
    ).toBeDefined();
    expect(eventDispatcher.getEventHandlers["ProductCreatedEvent"].length).toBe(
      1
    );
    expect(
      eventDispatcher.getEventHandlers["ProductCreatedEvent"][0]
    ).toMatchObject(eventHandler);
  });

  it("should unregister an event handler", () => {
    const eventDispatcher = new EventDispatcher();
    const eventHandler = new SendEmailWhenProductIsCreatedHandler();

    eventDispatcher.register("ProductCreatedEvent", eventHandler);

    expect(
      eventDispatcher.getEventHandlers["ProductCreatedEvent"][0]
    ).toMatchObject(eventHandler);

    eventDispatcher.unregister("ProductCreatedEvent", eventHandler);

    expect(
      eventDispatcher.getEventHandlers["ProductCreatedEvent"]
    ).toBeDefined();
    expect(eventDispatcher.getEventHandlers["ProductCreatedEvent"].length).toBe(
      0
    );
  });

  it("should unregister all event handlers", () => {
    const eventDispatcher = new EventDispatcher();
    const eventHandler = new SendEmailWhenProductIsCreatedHandler();

    eventDispatcher.register("ProductCreatedEvent", eventHandler);

    expect(
      eventDispatcher.getEventHandlers["ProductCreatedEvent"][0]
    ).toMatchObject(eventHandler);

    eventDispatcher.unregisterAll();

    expect(
      eventDispatcher.getEventHandlers["ProductCreatedEvent"]
    ).toBeUndefined();
  });

  it("should notify all event handlers", () => {
    const eventDispatcher = new EventDispatcher();
    const eventHandler = new SendEmailWhenProductIsCreatedHandler();
    const spyEventHandler = jest.spyOn(eventHandler, "handle");

    eventDispatcher.register("ProductCreatedEvent", eventHandler);

    expect(
      eventDispatcher.getEventHandlers["ProductCreatedEvent"][0]
    ).toMatchObject(eventHandler);

    const productCreatedEvent = new ProductCreatedEvent({
      name: "Product 1",
      description: "Product 1 description",
      price: 10.0,
    });

    // Quando o notify for executado o SendEmailWhenProductIsCreatedHandler.handle() deve ser chamado
    eventDispatcher.notify(productCreatedEvent);

    expect(spyEventHandler).toHaveBeenCalled();
  });

  it("should register and notify CustomerCreatedEvent", () => {
    const eventDispatcher = new EventDispatcher();
    const enviaConsoleLog1Handler = new EnviaConsoleLog1Handler();
    const enviaConsoleLog2Handler = new EnviaConsoleLog2Handler();
    const spyConsoleLog1 = jest.spyOn(enviaConsoleLog1Handler, "handle");
    const spyConsoleLog2 = jest.spyOn(enviaConsoleLog2Handler, "handle");

    eventDispatcher.register("CustomerCreatedEvent", enviaConsoleLog1Handler);
    eventDispatcher.register("CustomerCreatedEvent", enviaConsoleLog2Handler);

    const customerCreatedEvent = new CustomerCreatedEvent({
      id: "123",
      name: "John Doe",
    });

    eventDispatcher.notify(customerCreatedEvent);

    expect(spyConsoleLog1).toHaveBeenCalled();
    expect(spyConsoleLog2).toHaveBeenCalled();
  });

  it("should register and notify CustomerChangedAddressEvent", () => {
    const eventDispatcher = new EventDispatcher();
    const enviaConsoleLogHandler = new EnviaConsoleLogHandler();
    const spyConsoleLog = jest.spyOn(enviaConsoleLogHandler, "handle");

    eventDispatcher.register(
      "CustomerChangedAddressEvent",
      enviaConsoleLogHandler
    );

    const customerChangedAddressEvent = new CustomerChangedAddressEvent({
      id: "123",
      name: "John Doe",
      address: new Address("Street 1", 1, "12345-678", "São Paulo"),
    });

    eventDispatcher.notify(customerChangedAddressEvent);

    expect(spyConsoleLog).toHaveBeenCalled();
  });

  it("should register multiple handlers for different events", () => {
    const eventDispatcher = new EventDispatcher();
    const enviaConsoleLogHandler = new EnviaConsoleLogHandler();
    const enviaConsoleLog1Handler = new EnviaConsoleLog1Handler();
    const enviaConsoleLog2Handler = new EnviaConsoleLog2Handler();

    eventDispatcher.register("CustomerCreatedEvent", enviaConsoleLog1Handler);
    eventDispatcher.register("CustomerCreatedEvent", enviaConsoleLog2Handler);
    eventDispatcher.register(
      "CustomerChangedAddressEvent",
      enviaConsoleLogHandler
    );

    expect(
      eventDispatcher.getEventHandlers["CustomerCreatedEvent"].length
    ).toBe(2);
    expect(
      eventDispatcher.getEventHandlers["CustomerChangedAddressEvent"].length
    ).toBe(1);
  });
});
