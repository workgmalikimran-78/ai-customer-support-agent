package com.smartify.support.service;

import com.smartify.support.dto.request.PlaceOrderRequest;
import com.smartify.support.dto.response.OrderDto;
import com.smartify.support.dto.response.OrderItemDto;
import com.smartify.support.model.CustomerOrder;
import com.smartify.support.model.OrderItem;
import com.smartify.support.model.Product;
import com.smartify.support.model.enums.OrderStatus;
import com.smartify.support.repository.CustomerOrderRepository;
import com.smartify.support.repository.OrderItemRepository;
import com.smartify.support.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final int RECENT_ORDERS_FOR_CONTEXT = 5;
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd")
            .withZone(ZoneOffset.UTC);

    private final CustomerOrderRepository customerOrderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;

    @Transactional
    public CustomerOrder placeOrder(UUID customerId, PlaceOrderRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("No product with id " + request.getProductId()));

        if (!product.isActive()) {
            throw new IllegalArgumentException("Product '" + product.getName() + "' is no longer available");
        }
        if (product.getStockQuantity() < request.getQuantity()) {
            throw new IllegalArgumentException(
                    "Only " + product.getStockQuantity() + " of '" + product.getName() + "' left in stock");
        }

        // @Version on Product guards this read-then-write against concurrent orders for the
        // same product; a lost race surfaces as an optimistic-lock failure on save rather than
        // silently overselling.
        product.setStockQuantity(product.getStockQuantity() - request.getQuantity());
        productRepository.save(product);

        int totalCents = product.getPriceCents() * request.getQuantity();
        CustomerOrder order = customerOrderRepository.save(CustomerOrder.builder()
                .customerId(customerId)
                .status(OrderStatus.PLACED)
                .totalCents(totalCents)
                .build());

        orderItemRepository.save(OrderItem.builder()
                .orderId(order.getId())
                .productId(product.getId())
                .productNameSnapshot(product.getName())
                .unitPriceCents(product.getPriceCents())
                .quantity(request.getQuantity())
                .build());

        return order;
    }

    public List<OrderDto> listOrdersForCustomer(UUID customerId) {
        List<CustomerOrder> orders = customerOrderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        return toDtos(orders);
    }

    public OrderDto toOrderDto(CustomerOrder order) {
        return toDtos(List.of(order)).get(0);
    }

    /** Short plain-text summary of a customer's recent orders, fed into the AI chat prompt so
     * the support agent can answer "what's my order status" grounded in real data. Mirrors the
     * empty-string-on-miss convention already used for RAG context (see ai_response.py). */
    public String buildOrderContextSummary(UUID customerId) {
        List<CustomerOrder> orders = customerOrderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        if (orders.isEmpty()) {
            return "";
        }
        List<CustomerOrder> recent = orders.size() > RECENT_ORDERS_FOR_CONTEXT
                ? orders.subList(0, RECENT_ORDERS_FOR_CONTEXT)
                : orders;

        Map<UUID, List<OrderItem>> itemsByOrderId = orderItemRepository
                .findByOrderIdIn(recent.stream().map(CustomerOrder::getId).collect(Collectors.toList()))
                .stream()
                .collect(Collectors.groupingBy(OrderItem::getOrderId));

        StringBuilder summary = new StringBuilder("Customer's recent orders:\n");
        for (CustomerOrder order : recent) {
            String shortId = order.getId().toString().substring(0, 4);
            String date = DATE_FORMAT.format(order.getCreatedAt());
            String items = itemsByOrderId.getOrDefault(order.getId(), List.of()).stream()
                    .map(item -> item.getQuantity() + "x " + item.getProductNameSnapshot())
                    .collect(Collectors.joining(", "));
            summary.append(String.format("- Order #%s (%s, %s): %s ($%.2f)%n",
                    shortId, order.getStatus(), date, items, order.getTotalCents() / 100.0));
        }
        return summary.toString();
    }

    private List<OrderDto> toDtos(List<CustomerOrder> orders) {
        if (orders.isEmpty()) {
            return List.of();
        }
        Map<UUID, List<OrderItem>> itemsByOrderId = orderItemRepository
                .findByOrderIdIn(orders.stream().map(CustomerOrder::getId).collect(Collectors.toList()))
                .stream()
                .collect(Collectors.groupingBy(OrderItem::getOrderId));

        return orders.stream()
                .map(order -> OrderDto.builder()
                        .id(order.getId())
                        .status(order.getStatus().name())
                        .totalCents(order.getTotalCents())
                        .createdAt(order.getCreatedAt())
                        .items(itemsByOrderId.getOrDefault(order.getId(), List.of()).stream()
                                .map(item -> OrderItemDto.builder()
                                        .id(item.getId())
                                        .productId(item.getProductId())
                                        .productName(item.getProductNameSnapshot())
                                        .unitPriceCents(item.getUnitPriceCents())
                                        .quantity(item.getQuantity())
                                        .build())
                                .collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());
    }
}
