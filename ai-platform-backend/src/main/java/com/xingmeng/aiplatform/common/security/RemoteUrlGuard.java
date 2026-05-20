package com.xingmeng.aiplatform.common.security;

import com.xingmeng.aiplatform.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.net.IDN;
import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.Locale;

@Component
public class RemoteUrlGuard {

    public URI requireSafeHttps(String url) {
        try {
            return requireSafeHttps(URI.create(url));
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "远程 Skill 地址格式不正确");
        }
    }

    public URI requireSafeHttps(URI uri) {
        if (!"https".equalsIgnoreCase(uri.getScheme())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "仅允许导入HTTPS地址");
        }
        if (uri.getUserInfo() != null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "远程 Skill 地址不允许包含用户信息");
        }
        String host = normalizedHost(uri);
        if (isUnsafeHostName(host) || resolvesToUnsafeAddress(host)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "不允许导入内网或本机地址");
        }
        return uri;
    }

    private String normalizedHost(URI uri) {
        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "远程 Skill 地址缺少主机名");
        }
        return IDN.toASCII(host).toLowerCase(Locale.ROOT);
    }

    private boolean isUnsafeHostName(String host) {
        return host.equals("localhost")
                || host.endsWith(".localhost")
                || host.equals("0.0.0.0")
                || host.equals("::1");
    }

    private boolean resolvesToUnsafeAddress(String host) {
        try {
            return Arrays.stream(InetAddress.getAllByName(host)).anyMatch(this::isUnsafeAddress);
        } catch (UnknownHostException exception) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "远程 Skill 地址无法解析");
        }
    }

    private boolean isUnsafeAddress(InetAddress address) {
        return address.isAnyLocalAddress()
                || address.isLoopbackAddress()
                || address.isLinkLocalAddress()
                || address.isSiteLocalAddress()
                || address.isMulticastAddress()
                || isUniqueLocalIpv6(address);
    }

    private boolean isUniqueLocalIpv6(InetAddress address) {
        byte[] bytes = address.getAddress();
        return bytes.length == 16 && (bytes[0] & 0xfe) == 0xfc;
    }
}
