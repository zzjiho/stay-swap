package com.stayswap.swap.repository;

import com.stayswap.swap.model.entity.Swap;
import com.stayswap.swap.repository.custom.SwapRepositoryCustom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SwapRepository extends JpaRepository<Swap, Long>, SwapRepositoryCustom {

}