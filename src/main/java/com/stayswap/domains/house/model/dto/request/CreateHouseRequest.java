package com.stayswap.domains.house.model.dto.request;

import com.stayswap.domains.house.model.entity.House;
import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PRIVATE)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class CreateHouseRequest {

    private String title;

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

    private Boolean petsAllowed;

    public House toEntity() {
        return House.newHouse(
                title,
                description,
                type,
                size,
                bedrooms,
                bed,
                bathrooms,
                maxGuests,
                address,
                city,
                district,
                petsAllowed
        );

    }
}
