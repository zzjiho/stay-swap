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

    // 다국어 지원 필드들
    @Column(name = "address_ko")
    private String addressKo;

    @Column(name = "city_ko")
    private String cityKo;

    @Column(name = "district_ko")
    private String districtKo;

    @Column(name = "country_ko")
    private String countryKo;

    @Column(name = "address_en")
    private String addressEn;

    @Column(name = "city_en")
    private String cityEn;

    @Column(name = "district_en")
    private String districtEn;

    @Column(name = "country_en")
    private String countryEn;

    @Column(columnDefinition = "DECIMAL(10,7)")
    private Double latitude;

    @Column(columnDefinition = "DECIMAL(10,7)")
    private Double longitude;

    @Column(columnDefinition = "DECIMAL(10,7)")
    private Double viewportNortheastLat;

    @Column(columnDefinition = "DECIMAL(10,7)")
    private Double viewportNortheastLng;

    @Column(columnDefinition = "DECIMAL(10,7)")
    private Double viewportSouthwestLat;

    @Column(columnDefinition = "DECIMAL(10,7)")
    private Double viewportSouthwestLng;

    private Boolean petsAllowed;

    private Boolean isActive;

    private Boolean isDelete;

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToOne(cascade = ALL, orphanRemoval = true)
    @JoinColumn(name = "house_option_id")
    private HouseOption houseOption;
    
    @OneToMany(mappedBy = "house", cascade = ALL, orphanRemoval = true)
    private List<HouseImage> houseImages = new ArrayList<>();

    @OneToMany(mappedBy = "house", cascade = ALL, orphanRemoval = true)
    private List<HouseLike> houseLikes = new ArrayList<>();

    public static House newHouse(String title, String description, String rule, HouseType type, Float size, Integer bedrooms, Integer bed, Integer bathrooms, Integer maxGuests, String addressKo, String cityKo, String districtKo, String countryKo, String addressEn, String cityEn, String districtEn, String countryEn, Double latitude, Double longitude, Double viewportNortheastLat, Double viewportNortheastLng, Double viewportSouthwestLat, Double viewportSouthwestLng, Boolean petsAllowed, User user, HouseOption houseOption) {
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
                .addressKo(addressKo)
                .cityKo(cityKo)
                .districtKo(districtKo)
                .countryKo(countryKo)
                .addressEn(addressEn)
                .cityEn(cityEn)
                .districtEn(districtEn)
                .countryEn(countryEn)
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
                      Integer bed, Integer bathrooms, Integer maxGuests, String addressKo, String cityKo, String districtKo, String countryKo,
                      String addressEn, String cityEn, String districtEn, String countryEn, Double latitude, Double longitude, 
                      Double viewportNortheastLat, Double viewportNortheastLng, Double viewportSouthwestLat, 
                      Double viewportSouthwestLng, Boolean petsAllowed, HouseOption houseOption) {
        this.title = title;
        this.description = description;
        this.rule = rule;
        this.houseType = type;
        this.size = size;
        this.bedrooms = bedrooms;
        this.bed = bed;
        this.bathrooms = bathrooms;
        this.maxGuests = maxGuests;
        this.addressKo = addressKo;
        this.cityKo = cityKo;
        this.districtKo = districtKo;
        this.countryKo = countryKo;
        this.addressEn = addressEn;
        this.cityEn = cityEn;
        this.districtEn = districtEn;
        this.countryEn = countryEn;
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