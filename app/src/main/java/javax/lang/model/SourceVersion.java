/*
 * Android compatibility surface for the bundled ECJ runtime.
 *
 * Android does not ship the java.compiler module. ECJ's batch FileSystem checks whether
 * SourceVersion.RELEASE_12 exists during static initialization even when annotation processing is
 * disabled. The production Java provider never exposes annotation processing.
 */
package javax.lang.model;

/** Minimal Java 21 SourceVersion API surface needed by ECJ 3.26.0 on ART. */
public enum SourceVersion {
    RELEASE_0,
    RELEASE_1,
    RELEASE_2,
    RELEASE_3,
    RELEASE_4,
    RELEASE_5,
    RELEASE_6,
    RELEASE_7,
    RELEASE_8,
    RELEASE_9,
    RELEASE_10,
    RELEASE_11,
    RELEASE_12,
    RELEASE_13,
    RELEASE_14,
    RELEASE_15,
    RELEASE_16,
    RELEASE_17,
    RELEASE_18,
    RELEASE_19,
    RELEASE_20,
    RELEASE_21;

    public static SourceVersion latest() {
        return RELEASE_21;
    }

    public static SourceVersion latestSupported() {
        return RELEASE_21;
    }
}
