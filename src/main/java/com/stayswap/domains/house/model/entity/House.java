package com.stayswap.domains.house.model.entity;

import com.stayswap.domains.common.entity.BaseEntity;
import com.stayswap.domains.user.model.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Builder
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class House extends BaseEntity {

    @Id
    @Column(name = "house_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String type;

    private Float size;

    private Integer bedrooms;

    private Integer bed;

    private Integer bathrooms;

    private Integer maxGuests;

    private String address;

    private String city;

    private String district;

    @Column(name = "pets_allowed")
    private Boolean petsAllowed;

    @Column(name = "is_active")
    private Boolean isActive;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToOne(cascade = CascadeType.ALL)
    private HouseOption houseOption;

    public static House newHouse(String title, String description, String type, Float size, Integer bedrooms, Integer bed, Integer bathrooms, Integer maxGuests, String address, String city, String district, Boolean petsAllowed) {
        return House.builder()
                .title(title)
                .description(description)
                .type(type)
                .size(size)
                .bedrooms(bedrooms)
                .bed(bed)
                .bathrooms(bathrooms)
                .maxGuests(maxGuests)
                .address(address)
                .city(city)
                .district(district)
                .petsAllowed(petsAllowed)
                .isActive(true)
                .build();

    }
}