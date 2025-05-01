package com.stayswap.domains.swap.repository;

import com.stayswap.domains.swap.model.entity.Swap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
@Repository
public interface SwapRepository extends JpaRepository<Swap, Long> {
} 