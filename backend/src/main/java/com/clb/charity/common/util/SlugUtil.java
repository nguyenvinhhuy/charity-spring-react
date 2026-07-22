package com.clb.charity.common.util;

import org.jspecify.annotations.Nullable;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Generates URL-friendly slugs from titles, handling Vietnamese diacritics.
 */
public final class SlugUtil {

    private static final Pattern COMBINING_MARKS = Pattern.compile("\\p{M}+");
    private static final Pattern NON_ALPHANUMERIC = Pattern.compile("[^a-z0-9]+");
    private static final Pattern EDGE_DASHES = Pattern.compile("(^-+)|(-+$)");

    private SlugUtil() {
    }

    public static String slugify(@Nullable String input) {
        if (input == null || input.isBlank()) {
            return "";
        }
        // Vietnamese "đ/Đ" has no combining form, so map it explicitly first.
        String normalized = input.replace('đ', 'd').replace('Đ', 'D');
        normalized = Normalizer.normalize(normalized, Normalizer.Form.NFD);
        normalized = COMBINING_MARKS.matcher(normalized).replaceAll("");
        normalized = normalized.toLowerCase(Locale.ROOT);
        normalized = NON_ALPHANUMERIC.matcher(normalized).replaceAll("-");
        normalized = EDGE_DASHES.matcher(normalized).replaceAll("");
        return normalized;
    }
}
