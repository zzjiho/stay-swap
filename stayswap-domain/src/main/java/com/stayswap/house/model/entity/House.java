package com.stayswap.house.model.entity;

import com.stayswap.common.entity.BaseTimeEntity;
import com.stayswap.house.constant.HouseType;
import com.stayswap.user.model.entity.User;
import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.CascadeType.ALL;
import static jakarta.persistence.FetchType.LAZY;

@Entity
@Builder
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class House extends BaseTimeEntity {

    @Id
    @Column(name = "house_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String rule;

    @Enumerated(EnumType.STRING)
    private HouseType houseType;

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

    @Column(name = "is_delete")
    private Boolean isDelete;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToOne(fetch = LAZY, cascade = ALL)
    @JoinColumn(name = "house_option_id")
    private HouseOption houseOption;

    public static House newHouse(String title, String description, String rule, HouseType type, Float size, Integer bedrooms, Integer bed, Integer bathrooms, Integer maxGuests, String address, String city, String district, Boolean petsAllowed, User user, HouseOption houseOption) {
        return House.builder()
                .title(title)
                .description(description)
                .rule(rule)
                .houseType(type)
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
                .isDelete(false)
                .user(user)
                .houseOption(houseOption)
                .build();
    }
    
    public void update(String title, String description, String rule, HouseType type, Float size, Integer bedrooms, 
                      Integer bed, Integer bathrooms, Integer maxGuests, String address, String city, 
                      String district, Boolean petsAllowed, HouseOption houseOption) {
        this.title = title;
        this.description = description;
        this.rule = rule;
        this.houseType = type;
        this.size = size;
        this.bedrooms = bedrooms;
        this.bed = bed;
        this.bathrooms = bathrooms;
        this.maxGuests = maxGuests;
        this.address = address;
        this.city = city;
        this.district = district;
        this.petsAllowed = petsAllowed;
        
        if (houseOption != null) {
            this.houseOption = houseOption;
        }
    }
    
    public void delete() {
        this.isDelete = true;
    }
}