package com.stayswap.global.util;

import com.amazonaws.services.s3.AmazonS3Client;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.DeleteObjectRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.stayswap.domains.common.dto.response.FileUploadResponse;
import com.stayswap.global.code.ErrorCode;
import com.stayswap.global.error.exception.InvalidException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

import static com.stayswap.global.code.ErrorCode.*;

@Component
@RequiredArgsConstructor
public class FileUploadUtil {

    @Value("${spring.s3.bucket}")
    private String bucket;

    private final AmazonS3Client amazonS3Client;

    /**
     * S3에 파일 업로드
     */
    public FileUploadResponse uploadFile(String category, MultipartFile multipartFile) throws IOException {

        validateFileExtension(category, multipartFile.getContentType());

        String fileName = createFileName(category, multipartFile.getOriginalFilename());

        ObjectMetadata objectMetadata = new ObjectMetadata();
        objectMetadata.setContentType(multipartFile.getContentType());

        // S3에 업로드
        amazonS3Client.putObject(new PutObjectRequest(bucket, fileName, multipartFile.getInputStream(), objectMetadata)
                    .withCannedAcl(CannedAccessControlList.PublicRead));

        FileUploadResponse response = new FileUploadResponse(amazonS3Client.getUrl(bucket, fileName).toString(), fileName);

        return response;
    }

    /**
     * 확장자 확인
     */
    public static void validateFileExtension(String category, String fileContentType) {
        if (category.equals("image") && !fileContentType.startsWith("image")) {
            throw new InvalidException(INVALID_UPLOAD_FILE_EXTENSION);
        }
    }

    /**
     * 파일명 생성
     */
    private String createFileName(String category, String originalFileName) {
        int fileExtensionIndex = originalFileName.lastIndexOf(".");
        String fileExtension = originalFileName.substring(fileExtensionIndex);
        String fileName = originalFileName.substring(0, fileExtensionIndex);
        String random = String.valueOf(UUID.randomUUID());

        return category + "/" + fileName + "_" + random + fileExtension;
    }

    /**
     * 파일 삭제
     */
    public void deleteFile(String filePath) {
        amazonS3Client.deleteObject(new DeleteObjectRequest(bucket, filePath));
    }




}
