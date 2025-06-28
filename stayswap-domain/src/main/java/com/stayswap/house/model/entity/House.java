package com.stayswap.house.model.entity;

import com.stayswap.common.entity.BaseTimeEntity;
import com.stayswap.house.constant.HouseType;
import com.stayswap.user.model.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

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

    @Column(columnDefinition = "DECIMAL(10,7)")
    private Double latitude;

    @Column(columnDefinition = "DECIMAL(10,7)")
    private Double longitude;

    // viewport 영역 정보 (빨간색 영역 표시용)
    @Column(name = "viewport_northeast_lat", columnDefinition = "DECIMAL(10,7)")
    private Double viewportNortheastLat;

    @Column(name = "viewport_northeast_lng", columnDefinition = "DECIMAL(10,7)")
    private Double viewportNortheastLng;

    @Column(name = "viewport_southwest_lat", columnDefinition = "DECIMAL(10,7)")
    private Double viewportSouthwestLat;

    @Column(name = "viewport_southwest_lng", columnDefinition = "DECIMAL(10,7)")
    private Double viewportSouthwestLng;

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
    
    @OneToMany(mappedBy = "house", cascade = CascadeType.ALL)
    @Builder.Default
    private List<HouseLike> houseLikes = new ArrayList<>();

    public static House newHouse(String title, String description, String rule, HouseType type, Float size, Integer bedrooms, Integer bed, Integer bathrooms, Integer maxGuests, String address, String city, String district, Double latitude, Double longitude, Double viewportNortheastLat, Double viewportNortheastLng, Double viewportSouthwestLat, Double viewportSouthwestLng, Boolean petsAllowed, User user, HouseOption houseOption) {
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
                .latitude(latitude)
                .longitude(longitude)
                .viewportNortheastLat(viewportNortheastLat)
                .viewportNortheastLng(viewportNortheastLng)
                .viewportSouthwestLat(viewportSouthwestLat)
                .viewportSouthwestLng(viewportSouthwestLng)
                .petsAllowed(petsAllowed)
                .isActive(true)
                .isDelete(false)
                .user(user)
                .houseOption(houseOption)
                .build();
    }
    
    public void update(String title, String description, String rule, HouseType type, Float size, Integer bedrooms, 
                      Integer bed, Integer bathrooms, Integer maxGuests, String address, String city, 
                      String district, Double latitude, Double longitude, Double viewportNortheastLat, Double viewportNortheastLng, Double viewportSouthwestLat, Double viewportSouthwestLng, Boolean petsAllowed, HouseOption houseOption) {
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
        this.latitude = latitude;
        this.longitude = longitude;
        this.viewportNortheastLat = viewportNortheastLat;
        this.viewportNortheastLng = viewportNortheastLng;
        this.viewportSouthwestLat = viewportSouthwestLat;
        this.viewportSouthwestLng = viewportSouthwestLng;
        this.petsAllowed = petsAllowed;
        
        if (houseOption != null) {
            this.houseOption = houseOption;
        }
    }
    
    public void delete() {
        this.isDelete = true;
    }
    
    public void updateActiveStatus(Boolean isActive) {
        this.isActive = isActive;
    }
}