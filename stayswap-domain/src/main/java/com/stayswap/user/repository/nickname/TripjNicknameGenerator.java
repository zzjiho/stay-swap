package com.stayswap.user.repository.nickname;

import com.stayswap.user.constant.nickname.NicknameGenerationConstants;
import org.springframework.stereotype.Component;

import java.util.concurrent.ThreadLocalRandom;

@Component
public class TripjNicknameGenerator implements GenerateRandomNicknameRepository {

    @Override
    public String generate() {
        int animalIndex =
                ThreadLocalRandom.current()
                        .nextInt(NicknameGenerationConstants.ANIMAL_NAMES.length);
        int prefixIndex =
                ThreadLocalRandom.current()
                        .nextInt(NicknameGenerationConstants.PREFIX_NAMES.length);

        String animalName = NicknameGenerationConstants.ANIMAL_NAMES[animalIndex];
        String prefix = NicknameGenerationConstants.PREFIX_NAMES[prefixIndex];

        return prefix + animalName;
    }
}
