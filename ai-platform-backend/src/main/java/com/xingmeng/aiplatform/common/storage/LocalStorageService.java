package com.xingmeng.aiplatform.common.storage;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

@Service
public class LocalStorageService implements StorageService {
    private static final long MAX_ICON_SIZE = 2L * 1024 * 1024;
    private static final long MAX_SKILL_SIZE = 20L * 1024 * 1024;
    private static final long MAX_ARTICLE_ASSET_SIZE = 20L * 1024 * 1024;
    private static final Set<String> ICON_TYPES = Set.of("image/png", "image/jpeg", "image/webp", "image/svg+xml");
    private static final Set<String> ARTICLE_ASSET_SUFFIXES = Set.of(
            ".py", ".md", ".json", ".jsonl", ".yaml", ".yml", ".txt", ".png", ".jpg", ".jpeg", ".webp", ".zip"
    );

    private final Path root;

    public LocalStorageService(@Value("${app.storage.root:uploads}") String root) {
        this.root = Paths.get(root).toAbsolutePath().normalize();
    }

    @Override
    public StoredObject storeIcon(MultipartFile file) {
        ensureFile(file, MAX_ICON_SIZE);
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ICON_TYPES.contains(contentType)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "仅支持 PNG、JPG、WEBP 或 SVG 图标");
        }
        return store("icons", file, contentType);
    }

    @Override
    public StoredObject storeSkillArtifact(MultipartFile file) {
        ensureFile(file, MAX_SKILL_SIZE);
        String filename = cleanOriginalName(file);
        return storeSkillArtifactBytes(readBytes(file), filename, file.getContentType());
    }

    @Override
    public StoredObject storeSkillArtifact(byte[] bytes, String originalName, String contentType) {
        if (bytes == null || bytes.length == 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "文件不能为空");
        }
        if (bytes.length > MAX_SKILL_SIZE) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "文件超过大小限制");
        }
        return storeSkillArtifactBytes(bytes, originalName, contentType);
    }

    private StoredObject storeSkillArtifactBytes(byte[] bytes, String filename, String contentType) {
        String lowerName = filename.toLowerCase(Locale.ROOT);
        if (!lowerName.equals("skill.md") && !lowerName.endsWith(".zip")) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "仅支持上传 SKILL.md 或 zip 包");
        }
        if (lowerName.endsWith(".zip")) {
            validateZip(bytes);
        }
        return storeBytes("skills", bytes, filename, contentType);
    }

    @Override
    public StoredObject storeArticleAsset(MultipartFile file) {
        ensureFile(file, MAX_ARTICLE_ASSET_SIZE);
        String filename = cleanOriginalName(file);
        String lowerName = filename.toLowerCase(Locale.ROOT);
        boolean allowed = ARTICLE_ASSET_SUFFIXES.stream().anyMatch(lowerName::endsWith);
        if (!allowed) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "不支持的文章附件类型");
        }
        if (lowerName.endsWith(".zip")) {
            validateZipPaths(file);
        }
        return store("articles", file, file.getContentType());
    }

    @Override
    public StoredObject storeSkillDirectory(MultipartFile[] files, List<String> relativePaths, String packageName) {
        if (files == null || files.length == 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Skill 文件夹不能为空");
        }
        if (relativePaths == null || relativePaths.size() != files.length) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "文件夹路径信息不完整");
        }
        byte[] bytes = zipDirectory(files, relativePaths);
        if (bytes.length > MAX_SKILL_SIZE) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "文件超过大小限制");
        }
        return storeBytes("skills", bytes, safePackageName(packageName), "application/zip");
    }

    @Override
    public Resource load(String relativePath) {
        Path path = root.resolve(relativePath).normalize();
        if (!path.startsWith(root) || !Files.exists(path)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "文件不存在");
        }
        return new FileSystemResource(path);
    }

    private StoredObject store(String folder, MultipartFile file, String contentType) {
        try {
            Files.createDirectories(root.resolve(folder));
            String originalName = cleanOriginalName(file);
            String suffix = suffix(originalName);
            String storedName = UUID.randomUUID() + suffix;
            String relativePath = folder + "/" + storedName;
            Path target = root.resolve(relativePath).normalize();
            if (!target.startsWith(root)) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "非法文件路径");
            }
            try (InputStream input = file.getInputStream()) {
                Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return new StoredObject(relativePath, originalName, file.getSize(), contentType);
        } catch (IOException exception) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "文件保存失败");
        }
    }

    private StoredObject storeBytes(String folder, byte[] bytes, String originalName, String contentType) {
        try {
            Files.createDirectories(root.resolve(folder));
            String suffix = suffix(originalName);
            String storedName = UUID.randomUUID() + suffix;
            String relativePath = folder + "/" + storedName;
            Path target = root.resolve(relativePath).normalize();
            if (!target.startsWith(root)) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "非法文件路径");
            }
            try (InputStream input = new ByteArrayInputStream(bytes)) {
                Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return new StoredObject(relativePath, originalName, bytes.length, contentType);
        } catch (IOException exception) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "文件保存失败");
        }
    }

    private byte[] zipDirectory(MultipartFile[] files, List<String> relativePaths) {
        boolean hasSkill = false;
        long totalSize = 0;
        Set<String> seenPaths = new HashSet<>();
        try (ByteArrayOutputStream output = new ByteArrayOutputStream();
             ZipOutputStream zip = new ZipOutputStream(output)) {
            for (int i = 0; i < files.length; i++) {
                MultipartFile file = files[i];
                if (file == null) {
                    throw new BusinessException(HttpStatus.BAD_REQUEST, "文件不能为空");
                }
                totalSize += file.getSize();
                if (totalSize > MAX_SKILL_SIZE) {
                    throw new BusinessException(HttpStatus.BAD_REQUEST, "文件超过大小限制");
                }
                String entryName = cleanRelativePath(relativePaths.get(i), file);
                if (!seenPaths.add(entryName)) {
                    throw new BusinessException(HttpStatus.BAD_REQUEST, "文件夹包含重复路径");
                }
                hasSkill = hasSkill || "SKILL.md".equals(Paths.get(entryName).getFileName().toString());
                zip.putNextEntry(new ZipEntry(entryName));
                try (InputStream input = file.getInputStream()) {
                    input.transferTo(zip);
                }
                zip.closeEntry();
            }
            zip.finish();
            if (!hasSkill) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Skill 文件夹必须包含 SKILL.md");
            }
            return output.toByteArray();
        } catch (IOException exception) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "文件夹打包失败");
        }
    }

    private void validateZip(byte[] bytes) {
        boolean hasSkill = false;
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(bytes))) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                Path normalized = Paths.get(entry.getName()).normalize();
                if (normalized.isAbsolute() || normalized.startsWith("..")) {
                    throw new BusinessException(HttpStatus.BAD_REQUEST, "压缩包包含非法路径");
                }
                String entryName = normalized.getFileName() == null ? "" : normalized.getFileName().toString();
                hasSkill = hasSkill || "SKILL.md".equals(entryName);
            }
        } catch (IOException exception) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "压缩包读取失败");
        }
        if (!hasSkill) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Skill 包必须包含 SKILL.md");
        }
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException exception) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "文件读取失败");
        }
    }

    private void validateZipPaths(MultipartFile file) {
        try (ZipInputStream zip = new ZipInputStream(file.getInputStream())) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                Path normalized = Paths.get(entry.getName()).normalize();
                if (normalized.isAbsolute() || normalized.startsWith("..")) {
                    throw new BusinessException(HttpStatus.BAD_REQUEST, "压缩包包含非法路径");
                }
            }
        } catch (IOException exception) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "压缩包读取失败");
        }
    }

    private void ensureFile(MultipartFile file, long maxSize) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "文件不能为空");
        }
        if (file.getSize() > maxSize) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "文件超过大小限制");
        }
    }

    private String cleanOriginalName(MultipartFile file) {
        String name = file.getOriginalFilename();
        if (name == null || name.isBlank()) {
            return "upload.bin";
        }
        String normalized = Paths.get(name).getFileName().toString();
        return normalized.replaceAll("[\\\\/:*?\"<>|]", "_");
    }

    private String cleanRelativePath(String rawPath, MultipartFile file) {
        String raw = rawPath == null || rawPath.isBlank() ? cleanOriginalName(file) : rawPath.replace('\\', '/');
        Path normalized = Paths.get(raw).normalize();
        if (normalized.isAbsolute() || normalized.startsWith("..")) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "文件夹包含非法路径");
        }
        String entryName = normalized.toString().replace('\\', '/');
        if (entryName.isBlank() || entryName.startsWith("../") || entryName.contains("/../")) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "文件夹包含非法路径");
        }
        return entryName;
    }

    private String safePackageName(String packageName) {
        String name = packageName == null || packageName.isBlank() ? "skill-directory" : packageName;
        String sanitized = name.replaceAll("[\\\\/:*?\"<>|]", "_");
        return sanitized.toLowerCase(Locale.ROOT).endsWith(".zip") ? sanitized : sanitized + ".zip";
    }

    private String suffix(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : "";
    }
}
