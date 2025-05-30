package com.stayswap.house.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Entity
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HouseOption {

    @Id
    @Column(name = "house_option_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private boolean hasFreeWifi;
    private boolean hasAirConditioner;
    private boolean hasTV;
    private boolean hasWashingMachine;
    private boolean hasKitchen;
    private boolean hasDryer;
    private boolean hasIron;
    private boolean hasRefrigerator;
    private boolean hasMicrowave;
    private String otherAmenities;

    private boolean hasFreeParking;
    private boolean hasBalconyTerrace;
    private boolean hasPetsAllowed;
    private boolean hasSmokingAllowed;
    private boolean hasElevator;
    private String otherFeatures;

//    @OneToOne(mappedBy = "houseOption")
//    private House house;
}
