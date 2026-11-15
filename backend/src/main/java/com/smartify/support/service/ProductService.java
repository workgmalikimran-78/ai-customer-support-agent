package com.smartify.support.service;

import com.smartify.support.exception.ResourceNotFoundException;
import com.smartify.support.model.Product;
import com.smartify.support.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    public List<Product> listActive() {
        return productRepository.findByIsActiveTrue();
    }

    public Product getById(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No product with id " + id));
    }
}
