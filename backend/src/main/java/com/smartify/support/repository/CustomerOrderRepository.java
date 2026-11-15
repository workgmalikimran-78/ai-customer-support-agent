package com.smartify.support.repository;

import com.smartify.support.model.CustomerOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, UUID> {

    List<CustomerOrder> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
}
