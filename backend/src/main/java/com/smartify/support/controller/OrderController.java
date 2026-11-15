package com.smartify.support.controller;

import com.smartify.support.dto.request.PlaceOrderRequest;
import com.smartify.support.dto.response.OrderDto;
import com.smartify.support.model.CustomerOrder;
import com.smartify.support.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Behind CustomerJwtAuthFilter (not permitAll -- see SecurityConfig) -- customerId always comes
 * from the authenticated principal, never from a request param/body, so one customer can never
 * list or act on another's orders.
 */
@RestController
@RequestMapping("/api/shop/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final CustomerPrincipalResolver customerPrincipalResolver;

    @PostMapping
    public ResponseEntity<OrderDto> placeOrder(@Valid @RequestBody PlaceOrderRequest request) {
        var customerId = customerPrincipalResolver.currentCustomer().customerId();
        CustomerOrder order = orderService.placeOrder(customerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.toOrderDto(order));
    }

    @GetMapping
    public ResponseEntity<List<OrderDto>> listMyOrders() {
        var customerId = customerPrincipalResolver.currentCustomer().customerId();
        return ResponseEntity.ok(orderService.listOrdersForCustomer(customerId));
    }
}
