package com.nicodiamond.aims.repository;

import com.nicodiamond.aims.model.Repairer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RepairerRepository extends JpaRepository<Repairer, Long> {
}
